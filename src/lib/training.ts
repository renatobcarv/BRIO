// Núcleo de periodização: sem dependências, para poder ser testado isoladamente.

export const MUSCLES = {
  peito: "Peitoral", costas: "Costas", ombro_anterior: "Ombro anterior", ombro_lateral: "Ombro lateral",
  ombro_posterior: "Ombro posterior", biceps: "Bíceps", triceps: "Tríceps", quadriceps: "Quadríceps",
  posteriores: "Posteriores de coxa", gluteos: "Glúteos", panturrilhas: "Panturrilhas", abdomen: "Abdômen",
  cardio: "Cardio", outro: "Outro",
} as const;
export type Muscle = keyof typeof MUSCLES;

export const PHASE_KINDS = {
  acumulacao: { label: "Acumulação", color: "#f5f5f7", hint: "Mais volume, cargas moderadas (RPE 6–8)." },
  intensificacao: { label: "Intensificação", color: "#ff4d8a", hint: "Menos repetições, cargas mais altas (RPE 7–9)." },
  realizacao: { label: "Realização", color: "#ff453a", hint: "Consolidar força, volume baixo, intensidade alta." },
  deload: { label: "Deload", color: "#30d158", hint: "Reduzir volume e intensidade para recuperar." },
  outro: { label: "Outra", color: "#d12b65", hint: "Fase personalizada." },
} as const;
export type PhaseKind = keyof typeof PHASE_KINDS;

export const GOALS = {
  powerbuilding: "Powerbuilding", forca: "Força", hipertrofia: "Hipertrofia",
  recomposicao: "Recomposição corporal", emagrecimento: "Emagrecimento", condicionamento: "Condicionamento",
} as const;
export type Goal = keyof typeof GOALS;

export type PlannedEx = {
  name: string; muscle: Muscle; sets: number; reps: string;
  kg: number | null; rpe: number | null; rir: number | null; rest: number; notes: string;
};
export type Phase = { id: string; name: string; kind: PhaseKind; weeks: number; notes: string; days: Record<string, PlannedEx[]>; dayNames?: Record<string, string> };

/** Nome do dia: o definido na fase ou, sem nome, os dois grupos musculares com mais séries. */
export function dayTitle(phase: Pick<Phase, "days" | "dayNames">, d: string) {
  const own = phase.dayNames?.[d]?.trim();
  if (own) return own;
  const l = phase.days[d] ?? [];
  if (!l.length) return "Descanso";
  if (l.every((e) => e.muscle === "cardio")) return "Cardio";
  const c: Record<string, number> = {};
  for (const e of l) if (e.muscle !== "cardio" && e.muscle !== "outro") c[MUSCLES[e.muscle]] = (c[MUSCLES[e.muscle]] ?? 0) + e.sets;
  return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([m]) => m).join(" · ") || "Treino";
}
/** Abreviação curta para a faixa da semana. */
export const dayShort = (title: string) => title === "Descanso" ? "–" : title.split(/[\s·/]+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 3).toUpperCase();
export type Program = {
  id: string; created_at?: string; name: string; goal: Goal; start_date: string; phases: Phase[];
  notes: string | null; active: boolean; archived: boolean;
};

// ── Datas (UTC, strings YYYY-MM-DD) ──
const D = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
export const daysBetween = (a: string, b: string) => Math.round((D(a) - D(b)) / 86_400_000);
export const plusDays = (iso: string, n: number) => new Date(D(iso) + n * 86_400_000).toISOString().slice(0, 10);

export const totalWeeks = (p: Pick<Program, "phases">) => p.phases.reduce((a, f) => a + Math.max(0, f.weeks), 0);

/** Semana atual (1-based) e fase correspondente. Antes do início: week 0; depois do fim: done. */
export function programPosition(p: Pick<Program, "phases" | "start_date">, today: string) {
  const total = totalWeeks(p);
  const diff = daysBetween(today, p.start_date);
  if (diff < 0) return { week: 0, total, phaseIndex: -1, weekInPhase: 0, status: "futuro" as const, startsIn: -diff };
  const week = Math.floor(diff / 7) + 1;
  if (week > total) return { week: total, total, phaseIndex: p.phases.length - 1, weekInPhase: 0, status: "concluido" as const, startsIn: 0 };
  let acc = 0;
  for (let i = 0; i < p.phases.length; i++) {
    const w = Math.max(0, p.phases[i].weeks);
    if (week <= acc + w) return { week, total, phaseIndex: i, weekInPhase: week - acc, status: "andamento" as const, startsIn: 0 };
    acc += w;
  }
  return { week, total, phaseIndex: -1, weekInPhase: 0, status: "concluido" as const, startsIn: 0 };
}

/** Data de início/fim de cada fase. */
export function phaseRanges(p: Pick<Program, "phases" | "start_date">) {
  let acc = 0;
  return p.phases.map((f) => { const start = plusDays(p.start_date, acc * 7); acc += Math.max(0, f.weeks); return { start, end: plusDays(p.start_date, acc * 7 - 1) }; });
}

// ── Grupos musculares por nome do exercício ──
const RULES: [RegExp, Muscle][] = [
  [/cardio|corrida|esteira|bike|bicicleta|el[ií]ptico|caminhada/i, "cardio"],
  [/agach|squat|leg ?press|hack|b[uú]lgaro|afundo|passada|extensora/i, "quadriceps"],
  [/terra|deadlift|stiff|rdl|flexora|good ?morning|n[oó]rdico/i, "posteriores"],
  [/gl[uú]te|hip ?thrust|eleva[cç][aã]o p[eé]lvica|abdu/i, "gluteos"],
  [/panturrilha|g[eê]meos|s[oó]leo|calf/i, "panturrilhas"],
  [/supino|bench|crucifixo|fly|peck|flex[aã]o de bra|chest|peito/i, "peito"],
  [/elevação lateral|eleva[cç][aã]o lateral|lateral raise/i, "ombro_lateral"],
  [/face ?pull|crucifixo invertido|posterior|reverse fly/i, "ombro_posterior"],
  [/desenvolvimento|militar|overhead|arnold|eleva[cç][aã]o frontal|ombro/i, "ombro_anterior"],
  [/puxada|remada|barra fixa|pull|lat|pulldown|serrote|costas/i, "costas"],
  [/tr[ií]ceps|testa|franc[eê]s|corda|mergulho|dips|pushdown/i, "triceps"],
  [/b[ií]ceps|rosca|curl/i, "biceps"],
  [/abdom|prancha|plank|crunch|infra|obl[ií]quo|core/i, "abdomen"],
];
export function guessMuscle(name: string, overrides: Record<string, Muscle> = {}): Muscle {
  const o = overrides[name.trim().toLowerCase()];
  if (o) return o;
  for (const [re, m] of RULES) if (re.test(name)) return m;
  return "outro";
}
export const MAIN_LIFTS = [
  { key: "agachamento", label: "Agachamento", re: /agach|squat/i },
  { key: "supino", label: "Supino", re: /^supino(?! inclinado| declinado)|bench/i },
  { key: "terra", label: "Levantamento terra", re: /terra|deadlift/i },
] as const;
export const isMainLift = (name: string) => MAIN_LIFTS.some((l) => l.re.test(name)) && !/stiff|romeno|inclinado|halter/i.test(name);

/** Séries semanais planejadas por grupo muscular (somente séries diretas). */
export function plannedSetsByMuscle(phase: Pick<Phase, "days">) {
  const out: Partial<Record<Muscle, number>> = {};
  for (const list of Object.values(phase.days)) for (const e of list) if (e.muscle !== "cardio") out[e.muscle] = (out[e.muscle] ?? 0) + Math.max(0, e.sets);
  return out;
}

// ── Modelo a partir do plano semanal atual ──
type BaseEx = { name: string; sets: number; reps: string; rest: number };
const uid = () => Math.random().toString(36).slice(2, 10);

function adapt(e: BaseEx, kind: PhaseKind, overrides: Record<string, Muscle>): PlannedEx {
  const muscle = guessMuscle(e.name, overrides), main = isMainLift(e.name);
  const base: PlannedEx = { name: e.name, muscle, sets: e.sets, reps: e.reps, kg: null, rpe: null, rir: null, rest: e.rest, notes: "" };
  if (muscle === "cardio") return base;
  if (kind === "acumulacao") return { ...base, reps: main ? "5-6" : "8-12", rpe: main ? 7 : 7, rir: main ? 3 : 2 };
  if (kind === "intensificacao") return { ...base, reps: main ? "3-5" : "6-10", rpe: 8, rir: main ? 2 : 1 };
  if (kind === "realizacao") return { ...base, sets: main ? Math.max(3, e.sets) : Math.max(2, e.sets - 1), reps: main ? "1-3" : "6-8", rpe: main ? 8.5 : 8, rir: 1 };
  if (kind === "deload") return { ...base, sets: Math.max(1, Math.ceil(e.sets / 2)), rpe: 6, rir: 4 };
  return base;
}

export function templateFromPlan(planDays: Record<string, BaseEx[]>, overrides: Record<string, Muscle> = {}): Phase[] {
  const mk = (name: string, kind: PhaseKind, weeks: number): Phase => ({
    id: uid(), name, kind, weeks, notes: PHASE_KINDS[kind].hint,
    days: Object.fromEntries(Object.entries(planDays).map(([d, l]) => [d, l.map((e) => adapt(e, kind, overrides))])),
  });
  return [mk("Acumulação", "acumulacao", 4), mk("Intensificação", "intensificacao", 4), mk("Realização", "realizacao", 3), mk("Deload", "deload", 1)];
}
export const newPhaseId = uid;
