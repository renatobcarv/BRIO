import { diffDays } from "./date.ts";

export const AREAS = {
  espiritual: { label: "Espiritual", color: "#ffb21e" },
  financeira: { label: "Financeira", color: "#f5f5f7" },
  fisica: { label: "Física", color: "#30d158" },
  carreira: { label: "Carreira", color: "#f5f5f7" },
  pessoal: { label: "Pessoal", color: "#ff9f0a" },
} as const;
export type AreaKey = keyof typeof AREAS;
export const AUTO = {
  pioneer_month: { label: "Horas de pioneiro do mês", unit: "h" },
  weight: { label: "Peso atual", unit: "kg" },
  savings_box: { label: "Valor de uma caixinha", unit: "R$" },
  bible_chapters: { label: "Capítulos da Bíblia lidos", unit: "capítulos" },
  books_year: { label: "Livros lidos no ano", unit: "livros" },
} as const;

export type GoalRow = {
  id: string; objective_id: string | null; title: string; area: AreaKey; unit: string;
  target: number; current: number; start_value: number; deadline: string | null; featured: boolean;
  auto_source: keyof typeof AUTO | null; auto_ref: string | null; created_at: string;
};

/** Progresso, ritmo necessário e alerta de atraso. Funciona para metas que sobem ou descem (ex.: peso). */
export function goalStats(g: GoalRow, today: string) {
  const span = g.target - g.start_value;
  const pct = span ? Math.max(0, Math.min(1, (g.current - g.start_value) / span)) : g.current === g.target ? 1 : 0;
  const left = Math.abs(g.target - g.current) * (pct >= 1 ? 0 : 1);
  const daysLeft = g.deadline ? diffDays(g.deadline, today) : null;
  const perWeek = daysLeft && daysLeft > 0 ? left / (daysLeft / 7) : null;
  const perMonth = daysLeft && daysLeft > 0 ? left / (daysLeft / 30.44) : null;
  let late = false;
  if (g.deadline && pct < 1) {
    const total = diffDays(g.deadline, g.created_at.slice(0, 10));
    const elapsed = diffDays(today, g.created_at.slice(0, 10));
    const expected = total > 0 ? Math.min(1, elapsed / total) : 1;
    late = daysLeft! < 0 || pct + 0.05 < expected;
  }
  const horizon = daysLeft == null ? "longo" : daysLeft <= 90 ? "curto" : daysLeft <= 365 ? "medio" : "longo";
  return { pct, left, daysLeft, perWeek, perMonth, late, horizon };
}

// ── Gamificação das metas ──
export const MILESTONES = [0.25, 0.5, 0.75, 1] as const;
export const MILESTONE_NAME = ["Primeiro passo", "Meio caminho", "Reta final", "Conquistada"] as const;
/** XP de metas: 100 por marco atingido + 300 por meta concluída (não depende de tempo, só de progresso real). */
export function goalsXp(goals: GoalRow[], today: string) {
  let xp = 0, marks = 0, done = 0, late = 0;
  for (const g of goals) {
    const s = goalStats(g, today);
    const m = MILESTONES.filter((t) => s.pct >= t).length;
    marks += m; xp += m * 100 + (s.pct >= 1 ? 300 : 0); if (s.pct >= 1) done++; if (s.late) late++;
  }
  const level = Math.floor(Math.sqrt(xp / 120)) + 1, base = (level - 1) ** 2 * 120, next = level ** 2 * 120;
  const title = level >= 10 ? "Lenda das conquistas" : level >= 7 ? "Mestre de metas" : level >= 5 ? "Estrategista" : level >= 3 ? "Executor" : "Aprendiz";
  return { xp, level, title, marks, done, late, progress: (xp - base) / (next - base), toNext: next - xp };
}
