export const CATEGORIES = {
  campo: { label: "Campo comum", color: "#0a84ff" },
  publico: { label: "Testemunho público", color: "#ffb340" },
  assembleia: { label: "Assembleia", color: "#bf5af2" },
  obra: { label: "Obra", color: "#30d158" },
} as const;
export type Category = keyof typeof CATEGORIES;

/** Pesos por dia da semana (Dom..Sáb). */
export const PRESETS: { name: string; weights: number[] }[] = [
  { name: "Manhãs 7 dias", weights: [1, 1, 1, 1, 1, 1, 1] },
  { name: "Dois dias inteiros", weights: [1, 0, 0, 0, 0, 0, 1] },
  { name: "Noitinhas + fim de semana", weights: [2, 1, 1, 1, 1, 1, 2] },
  { name: "Tardes + domingo", weights: [2, 1, 1, 1, 1, 1, 0] },
  { name: "Concentrado", weights: [2, 0, 0, 1, 0, 0, 2] },
];

/** Escala um preset para cobrir a meta mensal (arredonda em 15 min). */
export function scalePreset(weights: number[], goalMin: number, daysInMonth: number) {
  const weekly = (goalMin * 7) / daysInMonth;
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  return weights.map((w) => Math.ceil(((weekly * w) / total) / 15) * 15);
}
