// Sugestão de carga por RPE (autorregulação). Sem dependências.
// Regra: repetições em reserva (RIR) = 10 − RPE; 1RM estimado por Epley com reps + RIR.

export type HistSet = { date: string; kg: number; reps: number; rpe?: number | null };
export const roundPlate = (kg: number, step = 2.5) => Math.round(kg / step) * step;
const epley = (kg: number, totalReps: number) => (totalReps <= 1 ? kg : kg * (1 + totalReps / 30));
/** 1RM estimado de uma série, usando o RPE quando registrado (reps + RIR). */
export const setE1rm = (s: { kg: number; reps: number; rpe?: number | null }) =>
  epley(s.kg, s.reps + (s.rpe && s.rpe >= 6 ? Math.max(0, 10 - s.rpe) : 0));
/** Carga para fazer `reps` repetições no RPE alvo, dado um 1RM estimado. */
export const loadFor = (e1rm: number, reps: number, rpe: number) => e1rm / (1 + (reps + Math.max(0, 10 - rpe)) / 30);
const firstNum = (s: string) => Number((s.match(/\d+(?:[.,]\d+)?/) ?? ["0"])[0].replace(",", "."));

export type Suggestion = { kg: number; e1rm: number; lastTop: number; reason: string; capped: boolean };

/**
 * Sugere a carga da próxima sessão:
 * - 1RM estimado = melhor das últimas 3 sessões (séries de 1–12 reps);
 * - carga = 1RM ÷ (1 + (reps alvo + RIR)/30), arredondada a 2,5 kg;
 * - nunca mais de 5% acima da última carga de trabalho; no deload, 85% da sugestão normal.
 */
export function suggestLoad(history: HistSet[], target: { reps: string; rpe: number | null }, opts: { deload?: boolean } = {}): Suggestion | null {
  const valid = history.filter((s) => s.kg > 0 && s.reps >= 1 && s.reps <= 12);
  if (!valid.length) return null;
  const dates = [...new Set(valid.map((s) => s.date))].sort().slice(-3);
  const recent = valid.filter((s) => dates.includes(s.date));
  const e1rm = Math.max(...recent.map(setE1rm));
  const lastDate = dates.at(-1)!;
  const lastTop = Math.max(...valid.filter((s) => s.date === lastDate).map((s) => s.kg));
  const reps = Math.max(1, Math.round(firstNum(target.reps) || 5));
  const rpe = target.rpe ?? 8;
  let kg = loadFor(e1rm, reps, rpe);
  let capped = false;
  if (kg > lastTop * 1.05) { kg = lastTop * 1.05; capped = true; }
  if (opts.deload) kg *= 0.85;
  kg = Math.max(0, roundPlate(kg));
  const reason = `${reps} reps @RPE ${String(rpe).replace(".", ",")} com 1RM estimado de ${Math.round(e1rm)} kg${capped ? " · limitado a +5% da última carga" : ""}${opts.deload ? " · semana de deload (−15%)" : ""}`;
  return { kg, e1rm: Math.round(e1rm), lastTop, reason, capped };
}
