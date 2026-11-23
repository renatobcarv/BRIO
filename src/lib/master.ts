// O Mestre: toda semana lê seus registros e monta uma semana diferente.
// Onda de estímulo, troca moderada de acessórios, volume que sobe e correção por RPE/conclusão. Puro e testável.
import { BIG3, POOL, type RefKey } from "./coach.ts";
import type { Muscle, PlannedEx, PhaseKind } from "./training.ts";

export type MWorkout = { date: string; week_no?: number | null; program_id?: string | null; sets: { exercise: string; kg: number; reps: number; rpe?: number | null }[] };
export type Change = { text: string; ref: RefKey };
type Ctx = { programId: string; kind: PhaseKind | string; week: number; weekInPhase: number };

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
const altFor = (name: string, m: Muscle, turn: number) => {
  for (const pool of Object.values(POOL)) {
    const l = pool[m]; if (!l || !l.includes(name)) continue;
    const opts = l.filter((x) => x !== name && !Object.values(BIG3).includes(x));
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
  for (const [d, list] of Object.entries(base)) {
    const seen = new Set<Muscle>();
    days[d] = list.map((e) => {
      const first = !seen.has(e.muscle); seen.add(e.muscle);
      let x: PlannedEx = { ...e };
      if (!special) {
        const isBig = Object.values(BIG3).includes(e.name);
        x.reps = shiftReps(e.reps, isBig && wave.key === "metabolica" ? 2 : wave.shift);
        if (x.rpe != null) x.rpe = Math.min(10, Math.max(5, x.rpe + wave.rpe));
        x.rest = Math.round(e.rest * wave.rest);
        if (rotate && !first && !isBig) x.name = altFor(e.name, e.muscle, turn);
      }
      const dv = delta.get(e.muscle) ?? 0;
      if (first && dv) x = { ...x, sets: Math.max(1, Math.min(6, x.sets + dv)) };
      return x;
    });
  }
  if (special) changes.push({ text: ctx.kind === "deload" ? "Semana de deload: o Mestre não mexe, é hora de recuperar." : "Semana de pico: foco nos levantamentos principais, sem variações.", ref: "deload" });
  else {
    changes.push({ text: `${wave.name}: ${wave.key === "forca" ? "menos repetições, mais carga e descanso maior" : wave.key === "metabolica" ? "mais repetições e descanso curto" : "faixa de repetições do plano, ritmo constante"}.`, ref: "dup" });
    if (rotate) changes.push({ text: "Acessórios trocados nesta semana (os principais ficam): estímulo novo sem perder a referência de progresso.", ref: "variation" });
  }
  if (fb && !fb.trained && ctx.week > 1) changes.push({ text: "Semana passada sem registro: o Mestre repete o volume em vez de subir.", ref: "overload" });
  const up = [...delta].filter(([, v]) => v > 0).map(([m]) => m), down = [...delta].filter(([, v]) => v < 0).map(([m]) => m);
  if (up.length) changes.push({ text: `+1 série em ${up.length} grupo(s) que você completou com folga: ${up.join(", ").replace(/_/g, " ")}.`, ref: "volume" });
  if (down.length) changes.push({ text: `−1 série em ${down.join(", ").replace(/_/g, " ")}: RPE acima do alvo na semana passada (fadiga).`, ref: "rpe" });
  changes.push({ text: "Carga de cada exercício sugerida pelo seu histórico (e1RM) e pelo RPE alvo.", ref: "overload" });
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
