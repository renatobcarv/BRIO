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
  /** Estilo: moderno (máquinas e variedade) ou old school (barra, básicos pesados, poucos exercícios). */
  style?: "moderno" | "oldschool";
  /** Híbrido: corridas por semana e objetivo da corrida. */
  runs?: number; runGoal?: "saude" | "5k" | "10k" | "21k";
  /** Números de força para avaliar o nível com sinceridade ("80x5"). */
  bench?: string; squat?: string;
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
  superset: "Zhang et al. (2025), Sports Med (meta-análise, 19 estudos): superset agonista-antagonista mantém o volume e o resultado em bem menos tempo; superset do mesmo músculo reduz o volume.",
  dropset: "Sødal et al. (2023), Sports Med Open (meta-análise): drop set dá hipertrofia igual ao tradicional em metade a um terço do tempo, com mais desgaste.",
  advanced: "Krzysztofik et al. (2019), IJERPH (revisão sistemática): técnicas avançadas não superam o tradicional com volume igualado; servem a treinados para romper platô e monotonia.",
  restpause: "Prestes et al. (2019), J Strength Cond Res: rest-pause deu força igual ao tradicional, com ganho extra só no leg press (amostra pequena).",
  concurrent: "Schumann et al. (2022), Sports Med (43 estudos): treino concorrente não atrapalha hipertrofia nem força máxima; prejudica a potência explosiva, mais ainda na mesma sessão.",
  running: "Lundberg et al. (2022), Sports Med: a pequena interferência aparece mais com corrida do que com bike, nas fibras tipo I. Separe corrida e pernas.",
  polarized: "Stöggl & Sperlich (2014), Front Physiol: distribuição polarizada (maioria leve, pouco muito forte) foi a que mais melhorou o desempenho de endurance.",
  oldschool: "Paoli et al. (2017), Front Physiol: com o mesmo volume, multiarticulares deram ganhos iguais ou maiores que isolados em força e composição corporal.",
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
/** Pares agonista-antagonista (supersets que mantêm o volume, Zhang 2025). Nunca o mesmo músculo. */
const ANTAGONISTS: [Muscle, Muscle][] = [["biceps", "triceps"], ["peito", "costas"], ["quadriceps", "posteriores"]];
/** Máximo de exercícios por sessão pelo tempo (bons treinadores raramente passam de 7–8). */
export const exerciseCap = (minutes: number) => (minutes <= 35 ? 4 : minutes <= 45 ? 5 : minutes <= 60 ? 6 : minutes <= 75 ? 7 : 8);

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
  const natural = out.length, naturalSets = out.reduce((x, e) => x + e.sets, 0);
  const needsTime = natural > exerciseCap(a.minutes) || naturalSets > maxSets;
  const cap = exerciseCap(a.minutes), protectedN = new Set(out.slice(0, lifts.length).map((e) => e.name));
  const total = () => out.reduce((x, e) => x + e.sets, 0);
  const secondOf = () => out.findLastIndex((e, i) => !protectedN.has(e.name) && !a.priority.includes(e.muscle) && out.findIndex((x) => x.muscle === e.muscle) !== i);
  const dropIdx = () => { for (const m of DROP_ORDER) { if (a.priority.includes(m)) continue; const i = out.findLastIndex((e) => e.muscle === m && !protectedN.has(e.name)); if (i >= 0) return i; } return -1; };
  const setCap = needsTime ? Math.round(maxSets * 1.25) : maxSets; // superset economiza ~20–30% do tempo
  while (out.length > cap || total() > setCap) {
    if (total() > setCap) { const big = out.reduce((k, e, i) => (!protectedN.has(e.name) && e.sets > 3 && (k < 0 || e.sets > out[k].sets) ? i : k), -1); if (big >= 0) { out[big].sets--; continue; } }
    const i = secondOf() >= 0 ? secondOf() : dropIdx(); if (i < 0) break; out.splice(i, 1);
  }
  // 4. Estratégia SÓ se necessária: pouco tempo → superset agonista-antagonista (mantém volume, poupa tempo).
  if (needsTime) for (const [x, y] of ANTAGONISTS) {
    const i = out.findIndex((e) => e.muscle === x && !protectedN.has(e.name) && !e.notes), j = out.findIndex((e) => e.muscle === y && !protectedN.has(e.name) && !e.notes);
    if (i < 0 || j < 0) continue;
    const [p, q] = i < j ? [i, j] : [j, i], second = out.splice(q, 1)[0];
    out.splice(p + 1, 0, second);
    const n = Math.max(out[p].sets, second.sets); out[p].sets = n; out[p + 1].sets = n;
    out[p] = { ...out[p], rest: 15, notes: `Superset com ${second.name} (antagonistas): uma série de cada, descanse depois do par. Motivo: o treino precisa caber em ${a.minutes} min.` };
    out[p + 1] = { ...out[p + 1], notes: `Superset com ${out[p].name}: descanse só depois deste.` };
  }
  // 5. Força avançada na intensificação: cluster no levantamento pesado (mantém a qualidade das reps pesadas).
  if (a.level === "avancado" && strength && b.kind === "intensificacao") {
    const k = out.findIndex((e) => e.notes === "Dia pesado");
    if (k >= 0) out[k] = { ...out[k], notes: "Dia pesado · cluster: blocos de 2 reps com 15–20 s de pausa dentro da série, para manter a velocidade da barra." };
  }
  const injured = a.injuries.trim();
  return injured ? out.map((e) => ({ ...e, notes: [e.notes, "Atenção à lesão informada: pare se doer e troque o exercício."].filter(Boolean).join(" ") })) : out;
}

// ── Old school: barra, básicos pesados, poucos exercícios, séries retas (sem superset/drop) ──
const OLD: Pool = {
  peito: ["Supino reto com barra", "Supino inclinado com barra", "Paralelas"],
  costas: ["Remada curvada com barra", "Barra fixa", "Levantamento terra"],
  quadriceps: ["Agachamento livre", "Agachamento frontal", "Leg press"],
  posteriores: ["Stiff com barra", "Good morning", "Mesa flexora"],
  gluteos: ["Elevação pélvica com barra", "Passada com halteres"],
  ombro_lateral: ["Desenvolvimento com barra", "Elevação lateral com halteres"],
  ombro_anterior: ["Desenvolvimento com barra"], ombro_posterior: ["Remada alta", "Crucifixo inverso com halteres"],
  biceps: ["Rosca direta com barra", "Rosca martelo"], triceps: ["Tríceps testa com barra", "Paralelas"],
  panturrilhas: ["Panturrilha em pé na máquina"], abdomen: ["Elevação de pernas", "Abdominal na polia"],
};
function oldSchool(l: PlannedEx[], b: Block, cap: number): PlannedEx[] {
  const out = l.map((e) => {
    const iso = ISOLATION.test(e.name), notes = e.notes.startsWith("Superset") ? "" : e.notes;
    if (b.kind === "deload" || b.kind === "realizacao") return { ...e, notes, rest: iso ? 90 : 180 };
    return { ...e, notes, reps: iso ? "8-12" : b.kind === "intensificacao" ? "5-6" : "6-8", sets: iso ? e.sets : Math.max(e.sets, 4), rest: iso ? 90 : 180 };
  });
  // Poucos exercícios: sai primeiro o 2º do mesmo músculo, depois os isolados.
  while (out.length > cap) {
    const seen = new Set<string>(); let i = -1;
    out.forEach((e, k) => { if (seen.has(e.muscle) && k > 0) i = k; seen.add(e.muscle); });
    if (i < 0) i = out.findLastIndex((e, k) => k > 0 && ISOLATION.test(e.name));
    if (i < 0) break; out.splice(i, 1);
  }
  return out;
}

// ── Híbrido: corrida polarizada (maioria leve, pouco forte), separada das pernas ──
type RunGoal = "saude" | "5k" | "10k" | "21k";
const LONG: Record<RunGoal, [number, number]> = { saude: [40, 50], "5k": [40, 55], "10k": [55, 75], "21k": [70, 110] };
const run = (name: string, reps: string, notes: string): PlannedEx => ({ name, muscle: "cardio", sets: 1, reps, kg: null, rpe: null, rir: null, rest: 0, notes });
export function runSessions(n: number, goal: RunGoal, kind: string): PlannedEx[] {
  const k = Math.max(1, Math.min(5, Math.round(n))), [lo, hi] = LONG[goal];
  if (kind === "deload") return Array.from({ length: Math.min(2, k) }, () => run("Corrida leve (Z2)", "25-30 min", "Conversando sem esforço. Semana de recuperação."));
  const hard = kind === "intensificacao"
    ? run("Intervalado", goal === "21k" ? "5×5 min" : "6×3 min", "Forte (RPE 8–9), recuperação trotando igual ao tempo do tiro. Aquecimento 10 min.")
    : run("Intervalado", goal === "5k" ? "8×400 m" : "5×1 km", "Ritmo de prova ou um pouco mais rápido. Aquecimento 10 min.");
  const list: PlannedEx[] = [run("Corrida leve (Z2)", "30-40 min", "Ritmo em que dá para conversar. A base de tudo.")];
  if (k >= 2) list.push(hard);
  if (k >= 3) list.push(run("Corrida longa", `${lo}-${hi} min`, "Leve e constante. Leve água se passar de 60 min."));
  if (k >= 4) list.push(run("Tempo run (limiar)", "20-25 min", "Confortavelmente difícil: frases curtas, não conversa."));
  if (k >= 5) list.push(run("Corrida leve (Z2)", "25-35 min", "Recuperativa, bem leve."));
  if (kind === "realizacao") return list.map((r) => (r.name === "Corrida longa" ? { ...r, reps: `${Math.round(lo * 0.7)}-${lo} min`, notes: "Semana de pico: mais curta, pernas descansadas." } : r));
  return list;
}
const LOWER_DAY = (m: Muscle[]) => m.includes("quadriceps") || m.includes("posteriores");
/** Encaixa as corridas: longa no fim de semana; forte longe das pernas (nunca na véspera); leves nos dias livres ou depois do treino de superior. */
function addRuns(days: Record<string, PlannedEx[]>, names: Record<string, string>, keys: string[], sp: { muscles: Muscle[] }[], b: Block, n: number, goal: RunGoal) {
  const runs = runSessions(n, goal, b.kind), lower = new Set(keys.filter((_, i) => LOWER_DAY(sp[i].muscles)));
  const order = ["1", "2", "3", "4", "5", "6", "0"], nextOf = (d: string) => order[(order.indexOf(d) + 1) % 7];
  const free = order.filter((d) => !days[d]?.length), used = new Set<string>();
  const place = (r: PlannedEx, pref: string[]) => {
    const d = pref.find((x) => !used.has(x)) ?? order.find((x) => !used.has(x) && !lower.has(x)) ?? order.find((x) => !used.has(x)) ?? "0";
    used.add(d);
    if (days[d]?.length) days[d] = [...days[d], { ...r, notes: `${r.notes} Depois da força (ou 6 h depois, se der).` }];
    else { days[d] = [r]; names[d] = r.name; }
  };
  for (const r of runs) {
    if (r.name === "Corrida longa") place(r, ["0", "6", ...free].filter((d) => free.includes(d)));
    else if (r.name === "Intervalado" || r.name.startsWith("Tempo")) place(r, free.filter((d) => !lower.has(nextOf(d)) && !lower.has(d)));
    else place(r, [...free, ...keys.filter((d) => !lower.has(d))]);
  }
}

/** Monta o programa completo a partir das respostas. */
export function buildProgram(a: TrainAnswers) {
  const old = a.style === "oldschool" && a.equipment !== "casa";
  const sp = split(a.days), keys = DAY_KEYS[sp.length], pool = old ? OLD : POOL[a.equipment];
  const maxSets = Math.max(10, Math.floor(a.minutes / 3.2)); // ~3 min por série com descanso
  const strength = a.goal === "forca" || a.goal === "powerbuilding" || (a.focus ?? "geral") !== "geral";
  const bl = blocks((a.focus ?? "geral") !== "geral" ? "forca" : a.goal, a.weeks, a.level);
  const focus: Focus = a.focus ?? "geral";
  const fits = (l: Lift, di: number) => sp[di].muscles.includes(LIFT[l].muscle) || (l === "agachamento" && sp[di].muscles.includes("quadriceps"));
  const sched = liftSchedule(focus, sp.length, fits);
  const phases: Phase[] = bl.map((b) => {
    const days: Record<string, PlannedEx[]> = {}, dayNames: Record<string, string> = {};
    const bb = a.goal === "hibrido" ? { ...b, mult: b.mult * 0.85 } : b; // híbrido: um pouco menos de volume de força para caber a corrida
    sp.forEach((d, di) => {
      let l = buildSession(a, bb, d, di, sp, pool, focus, sched[di] ?? [], strength, maxSets);
      if (old) l = oldSchool(l, b, exerciseCap(a.minutes) - 1);
      days[keys[di]] = l;
      dayNames[keys[di]] = d.name;
    });
    if (a.goal === "hibrido") addRuns(days, dayNames, keys, sp, b, a.runs ?? 3, a.runGoal ?? "saude");
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
  if (a.goal === "hibrido") why.push({ text: `${a.runs ?? 3} corridas por semana, maioria leve e uma forte: força e corrida convivem bem.`, ref: "concurrent" }, { text: "Corrida separada dos dias de perna; intervalado nunca na véspera de perna.", ref: "running" }, { text: "Distribuição polarizada: muita corrida leve, pouca e boa corrida forte.", ref: "polarized" });
  if (old) why.push({ text: "Old school: barra, básicos pesados, poucos exercícios e séries retas.", ref: "oldschool" });
  if (focus !== "geral") why.push({ text: `${FOCUS[focus].label}: ${FOCUS[focus].hint}. Pesado, volume e técnica em dias diferentes.`, ref: "spec" });
  if (a.sleep < 6.5 || a.stress === "alto") why.push({ text: "Sono curto ou estresse alto: o volume começa 20% menor e sobe conforme você recupera.", ref: "sleep" });
  const GOAL_NAME: Record<Goal, string> = { powerbuilding: "Powerbuilding", forca: "Força", hipertrofia: "Hipertrofia", recomposicao: "Recomposição", emagrecimento: "Emagrecimento", condicionamento: "Condicionamento", hibrido: "Híbrido" };
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

// ── Avaliação honesta do nível (números > autodeclaração) ──
/** "80x5", "80 x 5", "80kg 5" → { kg, reps }. */
export function parseLift(t: string): { kg: number; reps: number } | null {
  const m = String(t ?? "").replace(",", ".").match(/(\d+(?:\.\d+)?)\s*(?:kg)?\s*[x×*\s]\s*(\d{1,2})/i);
  if (!m) { const k = Number(String(t).replace(",", ".").match(/\d+(?:\.\d+)?/)?.[0]); return k > 0 ? { kg: k, reps: 1 } : null; }
  return { kg: Number(m[1]), reps: Number(m[2]) };
}
const e1 = (x: { kg: number; reps: number }) => (x.reps <= 1 ? x.kg : x.kg * (1 + Math.min(12, x.reps) / 30));
/** Padrões aproximados de força relativa (1RM ÷ peso corporal) para treino natural. */
const STD = { m: { supino: [0.75, 1.25], agachamento: [1.0, 1.6] }, f: { supino: [0.45, 0.8], agachamento: [0.75, 1.25] } } as const;
export function assessLevel(o: { self: Level; sex?: "m" | "f"; bodyweight?: number; bench?: string; squat?: string }) {
  const bw = o.bodyweight && o.bodyweight > 30 ? o.bodyweight : null, sx = o.sex ?? "m";
  const scores: Level[] = [], notes: string[] = [];
  for (const [k, raw] of [["supino", o.bench], ["agachamento", o.squat]] as const) {
    const p = raw ? parseLift(raw) : null; if (!p || !bw) continue;
    const rel = e1(p) / bw, [mid, high] = STD[sx][k];
    scores.push(rel >= high ? "avancado" : rel >= mid ? "intermediario" : "iniciante");
    notes.push(`${k} ≈ ${rel.toFixed(2).replace(".", ",")}× o seu peso`);
  }
  if (!scores.length) return { level: o.self, changed: false, msg: "Sem números de força: montei pelo que você declarou. Registre os treinos e eu reavalio." };
  const rank = { iniciante: 0, intermediario: 1, avancado: 2 } as const, avg = scores.reduce((a, l) => a + rank[l], 0) / scores.length;
  const measured: Level = avg >= 1.5 ? "avancado" : avg >= 0.5 ? "intermediario" : "iniciante";
  // Honesto, mas sem punir: se a autodeclaração for maior, vale o medido; se for menor, sobe um nível no máximo.
  const level: Level = rank[measured] < rank[o.self] ? measured : rank[measured] > rank[o.self] + 1 ? (["iniciante", "intermediario", "avancado"] as Level[])[rank[o.self] + 1] : measured;
  const L = { iniciante: "iniciante", intermediario: "intermediário", avancado: "avançado" };
  const msg = level === o.self ? `Seus números confirmam: ${L[level]} (${notes.join("; ")}).`
    : rank[level] < rank[o.self] ? `Sendo sincero: você se colocou como ${L[o.self]}, mas pelos números (${notes.join("; ")}) seu treino rende melhor como ${L[level]}. Montei assim: é o que vai te fazer evoluir mais rápido.`
    : `Você se subestimou: pelos números (${notes.join("; ")}) você está em ${L[level]}. Subi o volume.`;
  return { level, changed: level !== o.self, msg };
}
