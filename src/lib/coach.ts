// Consulta com especialistas: periodização do treino baseada em evidências + marcos da campanha que dão XP.
// Puro e testável. As decisões citam a literatura em REFS (o usuário vê o porquê de cada escolha).
import type { Goal, Muscle, PlannedEx, Phase, PhaseKind } from "./training.ts";

export type Level = "iniciante" | "intermediario" | "avancado";
export type Equip = "academia" | "halteres" | "casa";
export type TrainAnswers = {
  goal: Goal; level: Level; days: number; minutes: number; equipment: Equip; weeks: number;
  priority: Muscle[]; injuries: string; sleep: number; stress: "baixo" | "medio" | "alto"; start: string;
};

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

const pick = (pool: Pool, m: Muscle, i: number) => { const l = pool[m] ?? []; return l.length ? l[i % l.length] : null; };
let seq = 0;
const pid = () => `c${Date.now().toString(36)}${(seq++).toString(36)}`;

/** Monta o programa completo a partir das respostas. */
export function buildProgram(a: TrainAnswers) {
  const sp = split(a.days), keys = DAY_KEYS[sp.length], pool = POOL[a.equipment];
  const hits = (m: Muscle) => sp.filter((d) => d.muscles.includes(m)).length;
  const maxSets = Math.max(10, Math.floor(a.minutes / 3)); // ~3 min por série com descanso
  const strength = a.goal === "forca" || a.goal === "powerbuilding";
  const bl = blocks(a.goal, a.weeks, a.level);
  const phases: Phase[] = bl.map((b) => {
    const days: Record<string, PlannedEx[]> = {}, dayNames: Record<string, string> = {};
    sp.forEach((d, di) => {
      let list: PlannedEx[] = [];
      d.muscles.forEach((m, mi) => {
        const per = Math.max(1, Math.round((weeklySets(a, m) / Math.max(1, hits(m))) * b.mult));
        const occ = sp.slice(0, di).filter((x) => x.muscles.includes(m)).length;
        const main = strength && BIG3[m] && occ === 0 && a.equipment === "academia" ? BIG3[m]! : pick(pool, m, occ + mi);
        if (!main) return;
        const compound = mi < 3 || !!BIG3[m];
        const reps = b.kind === "realizacao" && !BIG3[m] ? "8-10" : main === BIG3[m] ? b.reps : compound ? b.reps : "10-15";
        const chunks = per > 4 ? [Math.ceil(per / 2), Math.floor(per / 2)] : [per];
        chunks.forEach((n, ci) => {
          const name = ci === 0 ? main : pick(pool, m, occ + mi + 1) ?? main;
          list.push({ name, muscle: m, sets: Math.max(1, Math.min(6, n)), reps, kg: null, rpe: b.rpe, rir: Math.max(0, Math.round(10 - b.rpe)), rest: compound && ci === 0 ? 150 : 75, notes: "" });
        });
      });
      // Respeita o tempo da sessão: corta séries dos músculos sem prioridade, do fim para o começo.
      let total = list.reduce((s, e) => s + e.sets, 0);
      for (let i = list.length - 1; total > maxSets && i >= 0; i--) {
        if (a.priority.includes(list[i].muscle)) continue;
        while (list[i].sets > 1 && total > maxSets) { list[i].sets--; total--; }
      }
      list = list.filter((e, i, arr) => arr.findIndex((x) => x.name === e.name) === i);
      if (a.injuries.trim()) list = list.map((e) => ({ ...e, notes: "Atenção à lesão informada: pare se doer e troque o exercício." }));
      days[keys[di]] = list; dayNames[keys[di]] = d.name;
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
