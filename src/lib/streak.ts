import { addDays } from "./date";

/**
 * Sequência de dias 100% cumpridos.
 * - Dia justificado: não soma nem quebra.
 * - resetDate (Recomeço honesto): dias até essa data não contam.
 * - Hoje incompleto não quebra (o dia ainda está em andamento).
 */
export function computeStreak(opts: {
  today: string; completeDays: Set<string>; excused: Set<string>; resetDate: string | null;
}) {
  const { today, completeDays, excused, resetDate } = opts;
  let count = 0;
  let d = completeDays.has(today) ? today : addDays(today, -1);
  for (let i = 0; i < 2000; i++) {
    if (resetDate && d <= resetDate) break;
    if (completeDays.has(d)) count++;
    else if (!excused.has(d)) break;
    d = addDays(d, -1);
  }
  return count;
}
