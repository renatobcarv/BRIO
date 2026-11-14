import { diffDays } from "./date";

export const AREAS = {
  espiritual: { label: "Espiritual", color: "#ff4d8a" },
  financeira: { label: "Financeira", color: "#f5f5f7" },
  fisica: { label: "Física", color: "#30d158" },
  carreira: { label: "Carreira", color: "#f5f5f7" },
  pessoal: { label: "Pessoal", color: "#d12b65" },
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
