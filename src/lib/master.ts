// O Mestre: toda semana lê seus registros e monta uma semana diferente.
// Onda de estímulo, troca moderada de acessórios, volume que sobe e correção por RPE/conclusão. Puro e testável.
import { ISOLATION, POOL, type RefKey } from "./coach.ts";
import { isMainLift, type Muscle, type PlannedEx, type PhaseKind } from "./training.ts";

export type MWorkout = { date: string; week_no?: number | null; program_id?: string | null; sets: { exercise: string; kg: number; reps: number; rpe?: number | null }[] };
export type Change = { text: string; ref: RefKey };
type Ctx = { programId: string; kind: PhaseKind | string; week: number; weekInPhase: number; today?: string };

const WAVES = [
  { key: "volume", name: "Semana de volume", shift: 0, rpe: -0.5, rest: 1 },
  { key: "forca", name: "Semana de força", shift: -2, rpe: 0.5, rest: 1.25 },
  { key: "metabolica", name: "Semana metabólica", shift: 4, rpe: 0, rest: 0.7 },
] as const;
export const waveOf = (week: number) => WAVES[(Math.max(1, week) - 1) % WAVES.length];

/** Desloca uma faixa "8-12" mantendo um piso de 3 repetições. */
export function shiftReps(r: string, by: number) {
  const m = r.match(/^(\d+)\s*-\s*(\d+)$/), one = r.match(/^(\d+)$/);
  if (m) { const a = Math.max(3, +m[1] + by), b = Math.max(a + 1, +m[2] + by); return `${a}-${b}`; }
  if (one) return String(Math.max(3, +one[1] + by));
  return r;
}
const altFor = (name: string, m: Muscle, turn: number, used: Set<string>) => {
  for (const pool of Object.values(POOL)) {
    const l = pool[m]; if (!l || !l.includes(name)) continue;
    const opts = l.filter((x) => !used.has(x.toLowerCase()) && !isMainLift(x));
    return opts.length ? opts[turn % opts.length] : name;
  }
  return name;
};

/** Leitura da semana anterior por músculo: séries feitas / planejadas e RPE médio. */
export function lastWeekFeedback(base: Record<string, PlannedEx[]>, hist: MWorkout[], ctx: Ctx) {
  const prev = hist.filter((w) => w.program_id === ctx.programId && w.week_no === ctx.week - 1);
  const planned = new Map<Muscle, { sets: number; rpe: number; names: Set<string> }>();
  for (const l of Object.values(base)) for (const e of l) {
    const x = planned.get(e.muscle) ?? { sets: 0, rpe: 0, names: new Set<string>() };
    x.sets += e.sets; x.rpe = e.rpe ?? 8; x.names.add(e.name); planned.set(e.muscle, x);
  }
  const out = new Map<Muscle, { done: number; planned: number; rpe: number | null; target: number }>();
  for (const [m, p] of planned) {
    const sets = prev.flatMap((w) => w.sets).filter((s) => p.names.has(s.exercise) && s.reps > 0);
    const rp = sets.map((s) => s.rpe).filter((x): x is number => x != null && x > 0);
    out.set(m, { done: sets.length, planned: p.sets, rpe: rp.length ? rp.reduce((a, b) => a + b, 0) / rp.length : null, target: p.rpe });
  }
  return { trained: prev.length > 0, sessions: new Set(prev.map((w) => w.date)).size, muscles: out };
}

/** Semana do Mestre: parte do plano da fase e devolve a versão desta semana + o porquê de cada mudança. */
export function masterWeek(base: Record<string, PlannedEx[]>, hist: MWorkout[], ctx: Ctx) {
  const changes: Change[] = [];
  const days: Record<string, PlannedEx[]> = {};
  const special = ctx.kind === "deload" || ctx.kind === "realizacao";
  const wave = waveOf(ctx.week);
  const fb = ctx.week > 1 ? lastWeekFeedback(base, hist, ctx) : null;
  const rotate = !special && ctx.week >= 3 && Math.floor((ctx.week - 1) / 2) % 2 === 1; // troca a cada 2 semanas, com moderação
  const turn = Math.floor((ctx.week - 1) / 2);
  const delta = new Map<Muscle, number>();
  if (fb?.trained) for (const [m, f] of fb.muscles) {
    const rate = f.planned ? f.done / f.planned : 0;
    if (f.rpe != null && f.rpe >= f.target + 1) delta.set(m, -1);
    else if (rate >= 0.9 && f.rpe != null && f.rpe <= f.target - 1.5) delta.set(m, +1);
    else if (rate >= 0.9 && ctx.kind === "acumulacao" && ctx.weekInPhase > 1) delta.set(m, +1);
  }
  let rotated = 0;
  for (const [d, list] of Object.entries(base)) {
    const used = new Set(list.map((e) => e.name.toLowerCase()));
    const seen = new Set<Muscle>();
    days[d] = list.map((e) => {
      const first = !seen.has(e.muscle); seen.add(e.muscle);
      let x: PlannedEx = { ...e };
      if (!special) {
        const isBig = isMainLift(e.name);
        const iso = ISOLATION.test(x.name);
        // Isolados nunca descem abaixo de 8 repetições (onda de força vale para os compostos).
        x.reps = iso ? shiftReps(e.reps, Math.max(0, wave.shift)) : shiftReps(e.reps, isBig && wave.key === "metabolica" ? 2 : wave.shift);
        if (iso) { const lo = Number(x.reps.split("-")[0]); if (lo < 8) x.reps = "8-12"; }
        if (x.rpe != null) x.rpe = Math.min(10, Math.max(5, x.rpe + wave.rpe));
        x.rest = Math.round(e.rest * wave.rest);
        const needsRecovery = (delta.get(e.muscle) ?? 0) < 0;
        if (rotate && !needsRecovery && !first && !isBig && e.kg == null) {
          const next = altFor(e.name, e.muscle, turn, used);
          if (next !== e.name) {
            x = { ...x, name: next, notes: "" };
            used.add(next.toLowerCase());
            rotated++;
          }
        }
      }
      // Depois de qualquer troca: isolado nunca abaixo de 8 repetições.
      if (!special && ISOLATION.test(x.name) && Number(x.reps.split("-")[0]) < 8) x = { ...x, reps: "8-12" };
      const dv = delta.get(e.muscle) ?? 0;
      if (first && dv) x = { ...x, sets: Math.max(1, Math.min(6, x.sets + dv)) };
      return x;
    });
  }
  if (special) changes.push({ text: ctx.kind === "deload" ? "Semana de deload: o Mestre não mexe, é hora de recuperar." : "Semana de pico: foco nos levantamentos principais, sem variações.", ref: "deload" });
  else {
    changes.push({ text: `${wave.name}: ${wave.key === "forca" ? "menos repetições, mais carga e descanso maior" : wave.key === "metabolica" ? "mais repetições e descanso curto" : "faixa de repetições do plano, ritmo constante"}.`, ref: "dup" });
    if (rotated) changes.push({ text: "Os acessórios variam para renovar o estímulo. Levantamentos principais, cargas fixas e grupos com fadiga mantêm a referência.", ref: "variation" });
  }
  if (fb && !fb.trained && ctx.week > 1) changes.push({ text: "Semana passada sem registro: o Mestre repete o volume em vez de subir.", ref: "overload" });
  const up = [...delta].filter(([, v]) => v > 0).map(([m]) => m), down = [...delta].filter(([, v]) => v < 0).map(([m]) => m);
  if (up.length) changes.push({ text: `+1 série em ${up.length} grupo(s) que você completou com folga: ${up.join(", ").replace(/_/g, " ")}.`, ref: "volume" });
  if (down.length) changes.push({ text: `−1 série em ${down.join(", ").replace(/_/g, " ")}: RPE acima do alvo na semana passada (fadiga).`, ref: "rpe" });
  changes.push({ text: "Carga de cada exercício sugerida pelo seu histórico (e1RM) e pelo RPE alvo.", ref: "overload" });
  if (!special && ctx.today) {
    const pt = plateauTechniques(days, plateaus(hist, ctx.today));
    if (pt.used.length) { Object.assign(days, pt.days); changes.push({ text: `Platô detectado em ${pt.used.join(" e ")} (sem progresso há 3 semanas): técnica avançada só na última série.`, ref: "advanced" }); }
  }
  return { days, changes, wave: special ? null : wave.name, feedback: fb };
}

// ── Nutrição da semana: fase do treino + tendência real do peso ──
export type DietGoal = "perder" | "manter" | "ganhar" | "recomp";
/** Ritmo semanal (% do peso) pelas médias das duas últimas semanas. Média semanal suaviza água e sal. */
export function weightRate(weights: { date: string; kg: number }[], today: string) {
  const day = (iso: string) => Date.parse(iso + "T12:00:00Z") / 864e5, t = day(today);
  const avg = (from: number, to: number) => { const l = weights.filter((w) => { const d = t - day(w.date); return d >= from && d < to && w.kg > 0; }); return l.length >= 2 ? l.reduce((a, w) => a + w.kg, 0) / l.length : null; };
  const now = avg(0, 7), before = avg(7, 14);
  return now && before ? ((now - before) / before) * 100 : null;
}
const BAND: Record<DietGoal, [number, number]> = { perder: [-1, -0.5], ganhar: [0.25, 0.5], recomp: [-0.5, 0.1], manter: [-0.3, 0.3] };
/** Ajuste de calorias da semana (em kcal/dia) e orientações, com o porquê. */
export function weekNutrition(goal: DietGoal, kind: string, waveName: string | null, rate: number | null, kcal: number) {
  const tips: Change[] = [];
  let adj = 0;
  const [lo, hi] = BAND[goal];
  if (rate == null) tips.push({ text: "Pese-se 3+ vezes por semana (mesma hora, em jejum) para o Mestre ajustar as calorias pela média.", ref: "rate" });
  else if (rate < lo) { adj = goal === "perder" && rate < -1.2 ? 200 : 150; tips.push({ text: `Peso caindo ${rate.toFixed(2).replace(".", ",")}%/sem, mais rápido que o ideal: +${adj} kcal/dia para proteger o músculo.`, ref: "rate" }); }
  else if (rate > hi) { adj = -150; tips.push({ text: `Peso subindo ${rate.toFixed(2).replace(".", ",")}%/sem, acima do ideal: −150 kcal/dia para limitar gordura.`, ref: "rate" }); }
  else tips.push({ text: `Ritmo do peso ${rate.toFixed(2).replace(".", ",")}%/sem: dentro da faixa ideal, calorias mantidas.`, ref: "rate" });
  if (kind === "deload") tips.push({ text: "Deload: menos treino, um pouco menos de carboidrato; proteína igual.", ref: "deficit" });
  else if (kind === "acumulacao" || waveName === "Semana de volume" || waveName === "Semana metabólica") tips.push({ text: "Semana de alto volume: concentre carboidrato antes e depois do treino.", ref: "carbs" });
  tips.push({ text: "Proteína todo dia na meta, dividida em 3–5 refeições.", ref: "protein" });
  return { adj, kcal: Math.max(1200, kcal + adj), tips };
}

// ── Ajustes rápidos da semana (atalhos) ──
export type Preset = "corrida" | "destruido" | "voando";
export const PRESETS: Record<Preset, { label: string; hint: string }> = {
  corrida: { label: "Semana corrida", hint: "−30% de séries, mantém os principais" },
  destruido: { label: "Estou destruído", hint: "Deload antecipado: metade das séries, RPE 6" },
  voando: { label: "Estou voando", hint: "+1 série no 1º exercício de cada músculo" },
};
export function applyPreset(days: Record<string, PlannedEx[]>, p: Preset): Record<string, PlannedEx[]> {
  const out: Record<string, PlannedEx[]> = {};
  for (const [d, l] of Object.entries(days)) {
    const seen = new Set<string>();
    out[d] = l.map((e) => {
      const first = !seen.has(e.muscle); seen.add(e.muscle);
      if (p === "corrida") return { ...e, sets: Math.max(1, first ? e.sets - (e.sets >= 4 ? 1 : 0) : Math.round(e.sets * 0.6)) };
      if (p === "destruido") return { ...e, sets: Math.max(1, Math.round(e.sets / 2)), rpe: 6, rir: 4 };
      return first ? { ...e, sets: Math.min(6, e.sets + 1) } : e;
    });
  }
  return out;
}
/** Move o treino de um dia para outro (troca se o destino já tiver treino). */
export function moveDay(days: Record<string, PlannedEx[]>, from: string, to: string) {
  if (from === to) return days;
  const out = { ...days }, a = out[from] ?? [], b = out[to] ?? [];
  out[to] = a; if (b.length) out[from] = b; else delete out[from];
  return out;
}
export const totalSets = (days: Record<string, PlannedEx[]>) => Object.values(days).flat().reduce((a, e) => a + e.sets, 0);

// ── Sugestões automáticas de ajuste (o Mestre propõe, você aceita) ──
export type Suggestion = { id: string; title: string; why: string; ref: RefKey; apply: (d: Record<string, PlannedEx[]>) => Record<string, PlannedEx[]> };
const dowOf = (iso: string) => String(new Date(iso + "T12:00:00Z").getUTCDay());
const WDN = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

/** Lê as últimas semanas e propõe ajustes concretos para a semana atual. */
export function suggestAdjustments(days: Record<string, PlannedEx[]>, hist: MWorkout[], ctx: Ctx & { today: string }): Suggestion[] {
  const out: Suggestion[] = [];
  const day = (iso: string) => Date.parse(iso + "T12:00:00Z") / 864e5, t = day(ctx.today);
  const recent = hist.filter((w) => t - day(w.date) <= 21 && t - day(w.date) >= 0);
  const last = hist.map((w) => w.date).sort().at(-1), away = last ? t - day(last) : 99;
  const plannedDays = Object.keys(days).filter((d) => days[d].length);
  const fb = ctx.week > 1 ? lastWeekFeedback(days, hist, ctx) : null;
  const all = fb ? [...fb.muscles.values()] : [];
  const done = all.reduce((a, x) => a + x.done, 0), planned = all.reduce((a, x) => a + x.planned, 0);
  const rpes = all.map((x) => x.rpe).filter((x): x is number => x != null), avgRpe = rpes.length ? rpes.reduce((a, b) => a + b, 0) / rpes.length : null;
  const target = days[plannedDays[0]]?.[0]?.rpe ?? 8;

  // 1. Fadiga ou volta depois de muito tempo → deload antecipado.
  if (away >= 10 || (avgRpe != null && avgRpe >= target + 1)) out.push({ id: "deload", title: "Semana mais leve (deload antecipado)", why: away >= 10 ? `${Math.round(away)} dias sem treinar: volte com metade das séries para o corpo readaptar.` : `RPE médio de ${avgRpe!.toFixed(1).replace(".", ",")} na semana passada, acima do alvo: sinal de fadiga acumulada.`, ref: "deload", apply: (d) => applyPreset(d, "destruido") });
  // 2. Semana passada incompleta → cortar volume para caber na vida real.
  else if (fb?.trained && planned && done / planned < 0.6) out.push({ id: "corrida", title: "Reduzir 30% das séries", why: `Você fez ${Math.round((done / planned) * 100)}% das séries planejadas${fb.sessions < plannedDays.length ? ` (foi a ${fb.sessions} de ${plannedDays.length} treinos)` : ""}. Melhor um plano menor cumprido do que um grande abandonado.`, ref: "overload", apply: (d) => applyPreset(d, "corrida") });
  // 3. Folga sobrando → subir volume.
  else if (fb?.trained && planned && done / planned >= 0.95 && avgRpe != null && avgRpe <= target - 1) out.push({ id: "voando", title: "+1 série no principal de cada músculo", why: `Tudo cumprido com RPE médio ${avgRpe.toFixed(1).replace(".", ",")}: há espaço para mais estímulo.`, ref: "volume", apply: (d) => applyPreset(d, "voando") });

  // 4. Dia planejado que você nunca faz, mas treina em outro dia → mover.
  const trainedDows = new Map<string, number>(); for (const w of recent) trainedDows.set(dowOf(w.date), (trainedDows.get(dowOf(w.date)) ?? 0) + 1);
  for (const d of plannedDays) {
    if (recent.length < 3 || trainedDows.get(d)) continue;
    const alt = [...trainedDows].filter(([k]) => !days[k]?.length).sort((a, b) => b[1] - a[1])[0];
    if (alt) out.push({ id: `mover-${d}-${alt[0]}`, title: `Mover o treino de ${WDN[+d]} para ${WDN[+alt[0]]}`, why: `Nas últimas semanas você não treinou ${WDN[+d]}, mas treinou ${alt[1]}× às ${WDN[+alt[0]]}s.`, ref: "freq", apply: (x) => moveDay(x, d, alt[0]) });
  }

  const plannedNames = new Set(Object.values(days).flat().map((e) => e.name));
  // 5. Exercício que você sempre troca por outro do mesmo músculo → assumir a troca.
  // Só conta sessões em que o DIA foi treinado (outro exercício daquele dia foi feito): faltar ao treino não é trocar.
  // Levantamentos principais nunca são trocados, e cada substituto é usado uma vez só.
  const MAIN = /agachamento|supino|terra|deadlift|squat|bench/i, used = new Set<string>();
  for (const [d, list] of Object.entries(days)) for (const e of list) {
    if (MAIN.test(e.name) || hist.some((w) => w.sets.some((x) => x.exercise === e.name) && t - day(w.date) <= 21)) continue;
    const others = new Set(list.filter((y) => y.name !== e.name).map((y) => y.name));
    const dayDone = recent.filter((w) => w.sets.some((x) => others.has(x.exercise)));
    if (dayDone.length < 2) continue;
    const counts = new Map<string, number>();
    for (const w of dayDone) for (const n of new Set(w.sets.map((x) => x.exercise)))
      if (!plannedNames.has(n) && !used.has(n) && Object.values(POOL).some((p) => (p[e.muscle] ?? []).includes(n))) counts.set(n, (counts.get(n) ?? 0) + 1);
    const best = [...counts].sort((a, b) => b[1] - a[1])[0];
    if (!best || best[1] < 2) continue;
    used.add(best[0]);
    const sub = best[0];
    out.push({ id: `troca-${e.name}`, title: `Trocar ${e.name} por ${sub}`, why: `Nas ${best[1]} vezes que você treinou esse dia (${WDN[+d]}), fez ${sub} no lugar de ${e.name}.`, ref: "variation", apply: (x) => Object.fromEntries(Object.entries(x).map(([k, l]) => [k, l.map((y) => (y.name === e.name ? { ...y, name: sub } : y))])) });
  }

  // 6. Músculo que ficou para trás MESMO com todos os dias treinados → trazer para o começo do treino.
  if (fb?.trained && fb.sessions >= plannedDays.length) for (const [m, f] of fb.muscles) {
    if (!f.planned || f.done / f.planned >= 0.5) continue;
    out.push({ id: `prior-${m}`, title: `Começar pelos exercícios de ${m.replace(/_/g, " ")}`, why: `Você foi a todos os treinos, mas fez só ${f.done} de ${f.planned} séries desse grupo: no fim do treino a energia acaba. No começo, ele recebe o melhor de você.`, ref: "volume",
      apply: (x) => Object.fromEntries(Object.entries(x).map(([k, l]) => [k, [...l.filter((y) => y.muscle === m), ...l.filter((y) => y.muscle !== m)]])) });
  }
  // Semana incompleta: deixa claro que o problema foi faltar, não o plano.
  if (fb?.trained && fb.sessions < plannedDays.length && !out.some((x) => x.id === "corrida"))
    out.push({ id: "corrida", title: "Reduzir 30% das séries", why: `Você foi a ${fb.sessions} de ${plannedDays.length} treinos. Um plano mais curto ajuda a não faltar.`, ref: "overload", apply: (d) => applyPreset(d, "corrida") });
  return out.slice(0, 5);
}


// ── Técnicas avançadas SÓ quando há platô (Krzysztofik 2019: servem para romper platô em treinados) ──
const MACHINE = /máquina|polia|leg press|hack|smith|cadeira|mesa|crossover|peck deck|puxada/i;
/** Exercícios sem progresso de 1RM estimado nas últimas 3 semanas, com histórico suficiente. */
export function plateaus(hist: MWorkout[], today: string) {
  const t = Date.parse(today + "T12:00:00Z") / 864e5, e1 = (kg: number, r: number, rpe?: number | null) => kg * (1 + (r + (rpe && rpe >= 6 ? 10 - rpe : 0)) / 30);
  const by = new Map<string, { recent: number; before: number; sessions: number }>();
  for (const w of hist) {
    const age = t - Date.parse(w.date + "T12:00:00Z") / 864e5; if (age < 0 || age > 56) continue;
    for (const x of w.sets) { if (!(x.kg > 0) || !(x.reps > 0)) continue;
      const v = by.get(x.exercise) ?? { recent: 0, before: 0, sessions: 0 }, val = e1(x.kg, x.reps, x.rpe);
      if (age <= 21) v.recent = Math.max(v.recent, val); else v.before = Math.max(v.before, val); by.set(x.exercise, v); }
  }
  for (const w of hist) for (const n of new Set(w.sets.map((x) => x.exercise))) { const v = by.get(n); if (v) v.sessions++; }
  return new Set([...by].filter(([, v]) => v.sessions >= 4 && v.before > 0 && v.recent > 0 && v.recent <= v.before * 1.005).map(([n]) => n));
}
/** Aplica técnica no exercício travado: isolado → drop set; máquina → rest-pause; barra livre pesada → nada (troca de faixa/variação é mais segura). */
export function plateauTechniques(days: Record<string, PlannedEx[]>, stuck: Set<string>, max = 2) {
  let n = 0; const used: string[] = [];
  const out = Object.fromEntries(Object.entries(days).map(([d, l]) => [d, l.map((e) => {
    if (n >= max || !stuck.has(e.name) || e.notes) return e;
    const iso = ISOLATION.test(e.name), mach = MACHINE.test(e.name);
    if (!iso && !mach) return e;
    n++; used.push(e.name);
    return { ...e, notes: iso ? "Platô: na última série, drop set (tire ~20% e continue até perto da falha)." : "Platô: na última série, rest-pause (15 s de pausa e mais 2–4 reps, 2 vezes)." };
  })]));
  return { days: out, used };
}
