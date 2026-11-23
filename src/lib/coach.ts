// Consulta com especialistas: periodização do treino baseada em evidências + marcos da campanha que dão XP.
// Puro e testável. As decisões citam a literatura em REFS (o usuário vê o porquê de cada escolha).
import type { Goal, Muscle, PlannedEx, Phase, PhaseKind } from "./training.ts";

export type Level = "iniciante" | "intermediario" | "avancado";
export type Equip = "academia" | "halteres" | "casa";
export type TrainAnswers = {
  goal: Goal; level: Level; days: number; minutes: number; equipment: Equip; weeks: number;
  priority: Muscle[]; injuries: string; sleep: number; stress: "baixo" | "medio" | "alto"; start: string;
  /** Especialização nos básicos: geral, os 3 (powerlifting) ou foco num levantamento. */
  focus?: Focus;
};
export type Focus = "geral" | "big3" | "agachamento" | "supino" | "terra";
export const FOCUS: Record<Focus, { label: string; hint: string }> = {
  geral: { label: "Equilibrado", hint: "Todos os grupos com volume parecido" },
  big3: { label: "Os 3 básicos (powerlifting)", hint: "Supino, agachamento e terra 2–3× por semana cada, cada um no dia certo" },
  agachamento: { label: "Foco no agachamento", hint: "Agachamento até 3× (pesado, volume, pausado), sempre em dia de pernas; supino e terra em manutenção" },
  supino: { label: "Foco no supino", hint: "Supino até 3× (pesado, volume, com pausa), sempre em dia de superior; agachamento e terra em manutenção" },
  terra: { label: "Foco no terra", hint: "Terra até 3× (pesado, Stiff de volume, com pausa), sempre em dia de pernas; os outros em manutenção" },
};
type Lift = "agachamento" | "supino" | "terra";
const LIFT: Record<Lift, { muscle: Muscle; names: [string, string, string] }> = {
  agachamento: { muscle: "quadriceps", names: ["Agachamento livre", "Agachamento livre", "Agachamento pausado"] },
  supino: { muscle: "peito", names: ["Supino reto com barra", "Supino reto com barra", "Supino com pausa"] },
  terra: { muscle: "posteriores", names: ["Levantamento terra", "Stiff com barra", "Levantamento terra com pausa"] },
};
type Slot = { lift: Lift; kind: 0 | 1 | 2 }; // 0 pesado, 1 volume, 2 técnica/variação
/**
 * Distribui as exposições dos básicos na semana (especificidade + frequência para força:
 * Grgic et al. 2018, Sports Med — mais frequência com volume igualado ajuda a força nos levantamentos treinados).
 * Manutenção: 1×/semana pesado preserva a força com ~1/3 do volume (Rønnestad et al. 2011).
 */
export function liftSchedule(focus: Focus, days: number, fits: (l: Lift, day: number) => boolean = () => true): Slot[][] {
  const out: Slot[][] = Array.from({ length: days }, () => []);
  if (focus === "geral") return out;
  const want: [Lift, number][] = focus === "big3" ? [["supino", Math.min(3, days)], ["agachamento", 2], ["terra", days >= 4 ? 2 : 1]]
    : (["agachamento", "supino", "terra"] as Lift[]).map((l) => [l, l === focus ? Math.min(3, days) : 1]);
  for (const [lift, n] of want) for (let k = 0; k < n; k++) {
    const pref = Math.round((k * days) / n) % days;
    let best = -1;
    for (let j = 0; j < days; j++) {
      const d = (pref + j) % days, here = out[d];
      if (here.some((x) => x.lift === lift) || !fits(lift, d)) continue;
      // Agachamento e terra pesados no mesmo dia somam fadiga demais.
      if (k === 0 && here.some((x) => x.kind === 0 && (x.lift === "terra" || x.lift === "agachamento") && lift !== "supino")) continue;
      if (best < 0 || here.length < out[best].length) best = d;
      if (here.length === 0) break;
    }
    if (best >= 0) out[best].push({ lift, kind: (Math.min(k, 2)) as 0 | 1 | 2 });
  }
  return out;
}

export const REFS = {
  volume: "Schoenfeld, Ogborn & Krieger (2017), J Sports Sci: mais séries semanais por músculo → mais hipertrofia (10+ séries/semana superam menos de 5).",
  freq: "Schoenfeld, Grgic & Krieger (2019), J Sports Sci: treinar cada músculo ao menos 2×/semana, com o volume igualado, é a recomendação prática.",
  period: "Rhea & Alderman (2004), Res Q Exerc Sport: programas periodizados geram mais força do que programas sem periodização.",
  rpe: "Helms et al. (2016), Strength Cond J: autorregular a carga por RPE/RIR ajusta o treino ao dia e à fadiga.",
  deload: "Bell et al. (2023), PeerJ (consenso de especialistas): deloads periódicos a cada 4–6 semanas para gerenciar fadiga.",
  sleep: "Dattilo et al. (2011), Med Hypotheses; Knowles et al. (2018): pouco sono prejudica recuperação e síntese de músculo, então o volume começa menor.",
  protein: "Morton et al. (2018), Br J Sports Med: proteína até ~1,6 g/kg/dia maximiza ganhos com treino de força (faixa útil até ~2,2 g/kg).",
  deficit: "Helms, Aragon & Fitschen (2014), JISSN: déficit moderado com proteína alta (2,3–3,1 g/kg de massa magra) preserva músculo ao perder gordura.",
  surplus: "Iraki et al. (2019), Sports: superávit pequeno (~5–10%) para ganhar massa com pouco ganho de gordura.",
  bmr: "Mifflin et al. (1990), Am J Clin Nutr: equação de Mifflin–St Jeor para estimar o gasto em repouso.",
  dup: "Rhea et al. (2002), J Strength Cond Res: variar o estímulo (ondulatório) gerou mais força do que manter tudo linear, com o mesmo volume.",
  variation: "Kassiano et al. (2022), J Strength Cond Res (revisão): variar exercícios com moderação ajuda; trocar tudo o tempo todo atrapalha.",
  overload: "Plotkin et al. (2022), PeerJ: progredir por carga ou por repetições traz ganhos parecidos, o que importa é progredir.",
  rate: "Helms et al. (2014) e Iraki et al. (2019): perder ~0,5–1% do peso por semana preserva músculo; ganhar ~0,25–0,5% limita a gordura.",
  carbs: "Kerksick et al. (2017), JISSN (timing de nutrientes): carboidrato em volta do treino ajuda o desempenho em sessões de alto volume.",
  spec: "Grgic et al. (2018), Sports Med: treinar o levantamento mais vezes por semana (com volume igualado) melhora a força nele; Rønnestad et al. (2011): 1×/semana mantém a força.",
  diets: "Aragon et al. (2017), JISSN (position stand): o déficit calórico manda; a melhor dieta é a que você consegue manter.",
} as const;
export type RefKey = keyof typeof REFS;

// ── Exercícios por músculo e equipamento (compostos primeiro) ──
type Pool = Partial<Record<Muscle, string[]>>;
const GYM: Pool = {
  peito: ["Supino reto com barra", "Supino inclinado com halteres", "Crucifixo na máquina (peck deck)", "Crossover na polia"],
  costas: ["Puxada frontal na polia", "Remada curvada com barra", "Remada baixa na polia", "Barra fixa"],
  quadriceps: ["Agachamento livre", "Leg press", "Cadeira extensora", "Hack squat"],
  posteriores: ["Stiff com barra", "Mesa flexora", "Cadeira flexora"],
  gluteos: ["Elevação pélvica com barra", "Búlgaro com halteres", "Abdução na máquina"],
  ombro_lateral: ["Elevação lateral com halteres", "Elevação lateral na polia"],
  ombro_anterior: ["Desenvolvimento com halteres", "Desenvolvimento com barra"],
  ombro_posterior: ["Face pull", "Crucifixo inverso na máquina"],
  biceps: ["Rosca direta com barra", "Rosca martelo", "Rosca na polia"],
  triceps: ["Tríceps na polia (corda)", "Tríceps francês com halter", "Paralelas"],
  panturrilhas: ["Panturrilha em pé na máquina", "Panturrilha sentado"],
  abdomen: ["Abdominal na polia", "Elevação de pernas", "Prancha"],
};
const DB: Pool = {
  peito: ["Supino reto com halteres", "Supino inclinado com halteres", "Flexão de braço"],
  costas: ["Remada unilateral com halter", "Barra fixa", "Remada curvada com barra"],
  quadriceps: ["Agachamento goblet", "Búlgaro com halteres", "Afundo"],
  posteriores: ["Stiff com halteres", "Good morning"],
  gluteos: ["Passada com halteres", "Ponte de glúteo"],
  ombro_lateral: ["Elevação lateral com halteres"], ombro_anterior: ["Desenvolvimento com halteres"], ombro_posterior: ["Crucifixo inverso com halteres"],
  biceps: ["Rosca alternada com halteres", "Rosca martelo"], triceps: ["Tríceps francês com halter", "Mergulho no banco"],
  panturrilhas: ["Panturrilha unilateral com halter"], abdomen: ["Prancha", "Elevação de pernas"],
};
const HOME: Pool = {
  peito: ["Flexão de braço", "Paralelas (foco peito)"], costas: ["Barra fixa", "Barra fixa supinada"],
  quadriceps: ["Agachamento goblet", "Afundo", "Búlgaro com halteres"], posteriores: ["Nordic curl", "Good morning"],
  gluteos: ["Ponte de glúteo"], ombro_lateral: ["Elevação lateral com halteres"], ombro_anterior: ["Flexão pike"],
  ombro_posterior: ["Crucifixo inverso com halteres"], biceps: ["Barra fixa supinada", "Rosca martelo"], triceps: ["Mergulho no banco", "Paralelas"],
  panturrilhas: ["Panturrilha no degrau"], abdomen: ["Prancha", "Roda abdominal", "Elevação de pernas"],
};
export const POOL: Record<Equip, Pool> = { academia: GYM, halteres: DB, casa: HOME };
export const BIG3: Partial<Record<Muscle, string>> = { quadriceps: "Agachamento livre", peito: "Supino reto com barra", posteriores: "Levantamento terra" };

// ── Divisão semanal: cada músculo ao menos 2×/semana (REFS.freq) ──
const UPPER: Muscle[] = ["peito", "costas", "ombro_lateral", "ombro_anterior", "ombro_posterior", "biceps", "triceps"];
const LOWER: Muscle[] = ["quadriceps", "posteriores", "gluteos", "panturrilhas", "abdomen"];
const PUSH: Muscle[] = ["peito", "ombro_anterior", "ombro_lateral", "triceps"];
const PULL: Muscle[] = ["costas", "ombro_posterior", "biceps", "abdomen"];
const LEGS: Muscle[] = ["quadriceps", "posteriores", "gluteos", "panturrilhas"];
const FULL: Muscle[] = ["quadriceps", "peito", "costas", "posteriores", "ombro_lateral", "biceps", "triceps", "abdomen"];
export const DAY_KEYS: Record<number, string[]> = { 2: ["1", "4"], 3: ["1", "3", "5"], 4: ["1", "2", "4", "5"], 5: ["1", "2", "3", "4", "5"], 6: ["1", "2", "3", "4", "5", "6"] };
export function split(days: number): { name: string; muscles: Muscle[] }[] {
  const d = Math.max(2, Math.min(6, Math.round(days)));
  if (d <= 3) return Array.from({ length: d }, (_, i) => ({ name: `Corpo inteiro ${"ABC"[i]}`, muscles: FULL }));
  if (d === 4) return [{ name: "Superior A", muscles: UPPER }, { name: "Inferior A", muscles: LOWER }, { name: "Superior B", muscles: UPPER }, { name: "Inferior B", muscles: LOWER }];
  if (d === 5) return [{ name: "Superior", muscles: UPPER }, { name: "Inferior", muscles: LOWER }, { name: "Empurrar", muscles: PUSH }, { name: "Puxar", muscles: PULL }, { name: "Pernas", muscles: LEGS }];
  return [{ name: "Empurrar A", muscles: PUSH }, { name: "Puxar A", muscles: PULL }, { name: "Pernas A", muscles: LEGS }, { name: "Empurrar B", muscles: PUSH }, { name: "Puxar B", muscles: PULL }, { name: "Pernas B", muscles: LEGS }];
}

/** Séries semanais por músculo (REFS.volume), ajustadas por prioridade e recuperação (REFS.sleep). */
export function weeklySets(a: Pick<TrainAnswers, "level" | "priority" | "sleep" | "stress">, m: Muscle) {
  const base = { iniciante: 10, intermediario: 14, avancado: 18 }[a.level];
  const small = ["panturrilhas", "abdomen", "ombro_anterior", "ombro_posterior"].includes(m) ? 0.6 : 1;
  let v = base * small + (a.priority.includes(m) ? 4 : 0);
  if (a.sleep < 6.5 || a.stress === "alto") v *= 0.8;
  return Math.max(4, Math.round(v));
}

type Block = { kind: PhaseKind; name: string; weeks: number; reps: string; rpe: number; mult: number; notes: string };
/** Blocos de periodização (REFS.period, REFS.deload): acumulação → intensificação → deload, e pico no fim para força. */
export function blocks(goal: Goal, totalWeeks: number, level: Level): Block[] {
  const strength = goal === "forca" || goal === "powerbuilding";
  const W = Math.max(4, Math.min(24, Math.round(totalWeeks))), out: Block[] = [];
  const acc = (w: number): Block => ({ kind: "acumulacao", name: "Acumulação", weeks: w, reps: strength ? "6-10" : "8-12", rpe: 7, mult: 1, notes: "Mais volume, cargas moderadas. Deixe 2–3 repetições na reserva." });
  const int = (w: number): Block => ({ kind: "intensificacao", name: "Intensificação", weeks: w, reps: strength ? "3-6" : "6-10", rpe: 8.5, mult: 0.85, notes: "Menos séries, mais carga. Deixe 1–2 repetições na reserva." });
  const del: Block = { kind: "deload", name: "Deload", weeks: 1, reps: "8-10", rpe: 6, mult: 0.5, notes: "Metade das séries, carga leve. Recuperar para crescer." };
  const peak: Block = { kind: "realizacao", name: "Pico", weeks: 1, reps: "1-3", rpe: 9, mult: 0.5, notes: "Poucas séries pesadas nos levantamentos principais. Teste seus recordes." };
  const cycle = level === "iniciante" ? 6 : 5; // semanas de trabalho entre deloads
  let left = W - (strength ? 1 : 0);
  while (left > 0) {
    const work = Math.min(cycle, left - (left > cycle ? 1 : 0));
    if (work <= 0) break;
    const a = Math.max(1, Math.round(work * 0.55)), i = work - a;
    out.push(acc(a)); if (i > 0) out.push(int(i));
    left -= work;
    if (left > 0) { out.push(del); left -= 1; }
  }
  if (strength) out.push(peak);
  return out;
}

/** Isolados ficam sempre em 8+ repetições: carga máxima em isolado rende pouco e machuca. */
export const ISOLATION = /elevação lateral|elevação frontal|crossover|crucifixo|peck deck|rosca|tríceps|face pull|panturrilha|extensora|flexora|abdução|abdominal|prancha|elevação de pernas|glúteo na polia|pallof/i;
const pick = (pool: Pool, m: Muscle, i: number) => { const l = pool[m] ?? []; return l.length ? l[i % l.length] : null; };
let seq = 0;
const pid = () => `c${Date.now().toString(36)}${(seq++).toString(36)}`;

const BIGM: Muscle[] = ["peito", "costas", "quadriceps", "posteriores", "gluteos"];
/** Quem sai primeiro quando a sessão estoura (o desenvolvimento já trabalha o ombro anterior). */
const DROP_ORDER: Muscle[] = ["ombro_anterior", "abdomen", "panturrilhas", "gluteos", "ombro_posterior", "biceps", "triceps", "ombro_lateral"];
const PAIRS: [Muscle, Muscle][] = [["biceps", "triceps"], ["ombro_lateral", "ombro_posterior"], ["panturrilhas", "abdomen"]];
/** Máximo de exercícios por sessão pelo tempo (bons treinadores raramente passam de 7–8). */
export const exerciseCap = (minutes: number) => (minutes <= 45 ? 5 : minutes <= 60 ? 6 : minutes <= 75 ? 7 : 8);

/**
 * Uma sessão como um treinador montaria: compostos primeiro, 2–4 séries duras por exercício (nunca 1 série solta),
 * no máximo 5–8 exercícios, corta EXERCÍCIO (não série) quando não cabe, biset nos pequenos antagonistas
 * e drop set só na última série do último isolado.
 */
function buildSession(a: TrainAnswers, b: Block, d: { name: string; muscles: Muscle[] }, di: number, sp: { muscles: Muscle[] }[], pool: Pool, focus: Focus, lifts: Slot[], strength: boolean, maxSets: number): PlannedEx[] {
  const hits = (m: Muscle) => sp.filter((x) => x.muscles.includes(m)).length;
  const occ = (m: Muscle) => sp.slice(0, di).filter((x) => x.muscles.includes(m)).length;
  const iso = (n: string) => ISOLATION.test(n);
  const isoReps = b.kind === "realizacao" ? "10-12" : b.kind === "intensificacao" ? "8-12" : "10-15";
  const mkEx = (name: string, m: Muscle, sets: number, reps: string, rest: number, notes = ""): PlannedEx =>
    ({ name, muscle: m, sets, reps, kg: null, rpe: b.rpe, rir: Math.max(0, Math.round(10 - b.rpe)), rest, notes });
  const out: PlannedEx[] = [];
  // 1. Básicos do dia (especialização) ou o composto principal de cada grupo grande.
  const covered = new Set<Muscle>();
  if (focus !== "geral") for (const sl of lifts) {
    const L = LIFT[sl.lift], spec = focus === "big3" || focus === sl.lift, strong = b.kind === "realizacao";
    const reps = strong ? (sl.kind === 0 ? "1-3" : "3") : sl.kind === 0 ? (b.kind === "intensificacao" ? "3-5" : "4-6") : sl.kind === 1 ? (b.kind === "intensificacao" ? "5-6" : "6-8") : "3-5";
    const rpe = Math.min(9.5, Math.max(6, b.rpe + (sl.kind === 0 ? 0.5 : sl.kind === 1 ? -0.5 : -1.5)));
    out.push({ ...mkEx(L.names[sl.kind], L.muscle, Math.max(2, Math.round((sl.kind === 2 ? 3 : 4) * b.mult * (spec ? 1 : 0.75))), reps, sl.kind === 2 ? 150 : 180,
      sl.kind === 0 ? "Dia pesado" : sl.kind === 1 ? "Dia de volume" : "Técnica: pausa de 2 s, controle total"), rpe, rir: Math.max(0, Math.round(10 - rpe)) });
    covered.add(L.muscle);
  }
  // 2. Cada grupo do dia: grande = 1–2 exercícios; pequeno = 1 exercício de 2–4 séries.
  for (const m of d.muscles) {
    const t = Math.round((weeklySets(a, m) / Math.max(1, hits(m))) * b.mult) - (covered.has(m) ? 4 : 0);
    if (t < 2 && covered.has(m)) continue;
    const big = BIGM.includes(m), o = occ(m);
    const lead = !covered.has(m) && strength && a.equipment === "academia" && BIG3[m] && o === 0 && focus === "geral" ? BIG3[m]! : pick(pool, m, o);
    if (!lead) continue;
    const used = new Set(out.map((e) => e.name));
    const first = used.has(lead) ? pick(pool, m, o + 1) ?? lead : lead;
    if (big && t >= 6) {
      const second = [pick(pool, m, o + 1), pick(pool, m, o + 2)].find((n) => n && n !== first && !used.has(n));
      out.push(mkEx(first, m, Math.min(4, Math.ceil(t / 2)), iso(first) ? isoReps : b.reps, iso(first) ? 75 : 150));
      if (second) out.push(mkEx(second, m, Math.max(2, Math.min(4, Math.floor(t / 2))), iso(second) ? isoReps : b.reps, iso(second) ? 75 : 120));
    } else out.push(mkEx(first, m, Math.max(2, Math.min(big ? 5 : 4, t)), iso(first) ? isoReps : b.reps, iso(first) ? 75 : big ? 150 : 90));
  }
  // 3. Cabe no tempo: primeiro tira o 2º exercício dos grupos grandes, depois grupos de menor prioridade; nunca 1 série.
  const cap = exerciseCap(a.minutes), protectedN = new Set(out.slice(0, lifts.length).map((e) => e.name));
  const total = () => out.reduce((x, e) => x + e.sets, 0);
  const secondOf = () => out.findLastIndex((e, i) => !protectedN.has(e.name) && !a.priority.includes(e.muscle) && out.findIndex((x) => x.muscle === e.muscle) !== i);
  const dropIdx = () => { for (const m of DROP_ORDER) { if (a.priority.includes(m)) continue; const i = out.findLastIndex((e) => e.muscle === m && !protectedN.has(e.name)); if (i >= 0) return i; } return -1; };
  while (out.length > cap || total() > maxSets) {
    if (total() > maxSets) { const big = out.reduce((k, e, i) => (!protectedN.has(e.name) && e.sets > 3 && (k < 0 || e.sets > out[k].sets) ? i : k), -1); if (big >= 0) { out[big].sets--; continue; } }
    const i = secondOf() >= 0 ? secondOf() : dropIdx(); if (i < 0) break; out.splice(i, 1);
  }
  // 4. Biset nos pequenos antagonistas (economiza tempo sem perder estímulo).
  for (const [x, y] of PAIRS) {
    const i = out.findIndex((e) => e.muscle === x && iso(e.name)), j = out.findIndex((e) => e.muscle === y && iso(e.name));
    if (i < 0 || j < 0) continue;
    const [p, q] = i < j ? [i, j] : [j, i], second = out.splice(q, 1)[0];
    out.splice(p + 1, 0, second);
    const n = Math.max(out[p].sets, second.sets); out[p].sets = n; out[p + 1].sets = n;
    out[p] = { ...out[p], rest: 10, notes: `Biset com ${second.name}: uma série de cada, sem descanso entre elas.` };
    out[p + 1] = { ...out[p + 1], notes: `Biset com ${out[p].name}: descanse só depois deste.` };
  }
  // 5. Técnica de intensidade: drop set só no último isolado (não em iniciante, deload ou pico).
  if (a.level !== "iniciante" && (b.kind === "acumulacao" || b.kind === "intensificacao")) {
    const k = out.findLastIndex((e) => iso(e.name) && !e.notes.startsWith("Biset"));
    if (k >= 0) out[k] = { ...out[k], notes: "Última série: drop set (tire ~20% da carga e continue até perto da falha)." };
  }
  const injured = a.injuries.trim();
  return injured ? out.map((e) => ({ ...e, notes: [e.notes, "Atenção à lesão informada: pare se doer e troque o exercício."].filter(Boolean).join(" ") })) : out;
}

/** Monta o programa completo a partir das respostas. */
export function buildProgram(a: TrainAnswers) {
  const sp = split(a.days), keys = DAY_KEYS[sp.length], pool = POOL[a.equipment];
  const maxSets = Math.max(10, Math.floor(a.minutes / 3.2)); // ~3 min por série com descanso
  const strength = a.goal === "forca" || a.goal === "powerbuilding" || (a.focus ?? "geral") !== "geral";
  const bl = blocks((a.focus ?? "geral") !== "geral" ? "forca" : a.goal, a.weeks, a.level);
  const focus: Focus = a.focus ?? "geral";
  const fits = (l: Lift, di: number) => sp[di].muscles.includes(LIFT[l].muscle) || (l === "agachamento" && sp[di].muscles.includes("quadriceps"));
  const sched = liftSchedule(focus, sp.length, fits);
  const phases: Phase[] = bl.map((b) => {
    const days: Record<string, PlannedEx[]> = {}, dayNames: Record<string, string> = {};
    sp.forEach((d, di) => {
      days[keys[di]] = buildSession(a, b, d, di, sp, pool, focus, sched[di] ?? [], strength, maxSets);
      dayNames[keys[di]] = d.name;
    });
    return { id: pid(), name: b.name, kind: b.kind, weeks: b.weeks, notes: b.notes, days, dayNames };
  });
  const totalWeeks = bl.reduce((s, b) => s + b.weeks, 0);
  const why: { text: string; ref: RefKey }[] = [
    { text: `${sp.length} treinos/semana em "${sp.map((d) => d.name).join(" · ")}": cada músculo trabalha ${sp.length <= 3 ? sp.length : 2}× por semana.`, ref: "freq" },
    { text: `Volume inicial de ~${weeklySets(a, "peito")} séries/semana para músculos grandes${a.priority.length ? `, +4 nos prioritários` : ""}.`, ref: "volume" },
    { text: `${totalWeeks} semanas em blocos: ${bl.map((b) => `${b.name} (${b.weeks})`).join(" → ")}.`, ref: "period" },
    { text: "Carga guiada por RPE/RIR: o peso se ajusta ao seu dia, sem chute.", ref: "rpe" },
    { text: "Deload a cada 4–6 semanas para recuperar e continuar progredindo.", ref: "deload" },
  ];
  if (focus !== "geral") why.push({ text: `${FOCUS[focus].label}: ${FOCUS[focus].hint}. Pesado, volume e técnica em dias diferentes.`, ref: "spec" });
  if (a.sleep < 6.5 || a.stress === "alto") why.push({ text: "Sono curto ou estresse alto: o volume começa 20% menor e sobe conforme você recupera.", ref: "sleep" });
  const GOAL_NAME: Record<Goal, string> = { powerbuilding: "Powerbuilding", forca: "Força", hipertrofia: "Hipertrofia", recomposicao: "Recomposição", emagrecimento: "Emagrecimento", condicionamento: "Condicionamento" };
  return { program: { name: `${GOAL_NAME[a.goal]} · ${totalWeeks} semanas`, goal: a.goal, start_date: a.start, phases, notes: why.map((w) => `• ${w.text}`).join("\n") }, why, totalWeeks };
}

/** Objetivo do treino → objetivo da dieta. */
export const dietGoalFor = (g: Goal): "perder" | "manter" | "ganhar" | "recomp" =>
  g === "emagrecimento" ? "perder" : g === "recomposicao" ? "recomp" : g === "hipertrofia" || g === "powerbuilding" ? "ganhar" : "manter";
/** Frequência de treino → nível de atividade (Mifflin × fator). */
export const activityFor = (days: number) => (days <= 2 ? "leve" : days <= 4 ? "moderado" : "alto") as "leve" | "moderado" | "alto";

// ── Marcos da campanha que dão XP ──
type Prog = { id: string; start_date: string; phases: { kind: string; weeks: number; days: Record<string, unknown[]> }[] };
export type Milestone = { date: string; xp: number; label: string };
/** Semana cumprida (+120), fase concluída (+400), campanha concluída (+1000). Só conta o que foi treinado de verdade. */
export function campaignMilestones(programs: Prog[], sessions: { program_id: string | null; week_no: number | null; date: string }[]): Milestone[] {
  const out: Milestone[] = [];
  for (const p of programs) {
    const byWeek = new Map<number, Set<string>>();
    for (const s of sessions) if (s.program_id === p.id && s.week_no != null) { if (!byWeek.has(s.week_no)) byWeek.set(s.week_no, new Set()); byWeek.get(s.week_no)!.add(s.date); }
    let w = 0, allDone = true, last = "";
    for (const f of p.phases ?? []) {
      const planned = Object.values(f.days ?? {}).filter((l) => Array.isArray(l) && l.length > 0).length;
      let phaseDone = planned > 0, phaseLast = "";
      for (let k = 0; k < Math.max(0, f.weeks); k++) {
        w++;
        const days = byWeek.get(w), done = !!days && planned > 0 && days.size >= planned;
        if (done) { const d = [...days!].sort().at(-1)!; phaseLast = d; last = d; out.push({ date: d, xp: 120, label: `Semana ${w} da campanha cumprida` }); }
        else phaseDone = false;
      }
      if (phaseDone && phaseLast) out.push({ date: phaseLast, xp: 400, label: `Fase concluída: ${f.kind}` });
      else allDone = false;
    }
    if (allDone && last && (p.phases ?? []).length) out.push({ date: last, xp: 1000, label: "Campanha concluída" });
  }
  return out;
}
