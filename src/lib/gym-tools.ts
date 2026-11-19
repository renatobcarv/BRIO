// Ferramentas de academia: 1RM estimado, anilhas por lado e séries de aquecimento. Sem dependências.
export const epley = (kg: number, reps: number) => (reps <= 1 ? kg : Math.round(kg * (1 + reps / 30) * 10) / 10);
export const brzycki = (kg: number, reps: number) => (reps <= 1 ? kg : reps >= 37 ? kg : Math.round((kg * 36) / (37 - reps) * 10) / 10);
/** Tabela de % do 1RM para reps (aprox.). */
export const PCT_TABLE: [number, number][] = [[1, 100], [2, 95], [3, 93], [4, 90], [5, 87], [6, 85], [8, 80], [10, 75], [12, 70], [15, 65]];
export const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
/** Anilhas por lado para chegar ao peso total com a barra dada. */
export function platesFor(total: number, bar = 20, available = PLATES): { perSide: number[]; achieved: number } {
  let side = Math.max(0, (total - bar) / 2);
  const perSide: number[] = [];
  for (const p of available) while (side + 1e-9 >= p) { perSide.push(p); side = Math.round((side - p) * 100) / 100; }
  return { perSide, achieved: bar + perSide.reduce((a, b) => a + b, 0) * 2 };
}
const round = (v: number, step = 2.5) => Math.round(v / step) * step;
/** Aquecimento progressivo até a carga de trabalho. */
export function warmup(work: number, bar = 20): { kg: number; reps: number }[] {
  if (work <= bar) return [{ kg: bar, reps: 10 }];
  return [{ kg: bar, reps: 10 }, { kg: Math.max(bar, round(work * 0.4)), reps: 6 }, { kg: Math.max(bar, round(work * 0.6)), reps: 4 }, { kg: Math.max(bar, round(work * 0.8)), reps: 2 }, { kg: Math.max(bar, round(work * 0.9)), reps: 1 }]
    .filter((x, i, a) => i === 0 || x.kg > a[i - 1].kg);
}
