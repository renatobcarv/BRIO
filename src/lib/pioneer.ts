export const CATEGORIES = {
  campo: { label: "Campo comum", color: "#f5f5f7" },
  publico: { label: "Testemunho público", color: "#9fd0f5" },
  assembleia: { label: "Assembleia", color: "#f2dfae" },
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

// ── Como completar as horas do mês ──
export type HourPlan = { id: string; title: string; how: string; block: string; perSession: number; sessions: number; when: string };
const WD = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
/** Formas concretas de fechar as horas que faltam, com quantas saídas cabem nos dias restantes. */
export function hourPlans(remainingMin: number, today: string, monthEndISO: string): { plans: HourPlan[]; daysLeft: number; perDay: number } {
  const days: number[] = [];
  for (let d = new Date(today + "T12:00:00Z"); d.toISOString().slice(0, 10) <= monthEndISO; d.setUTCDate(d.getUTCDate() + 1)) days.push(d.getUTCDay());
  const daysLeft = days.length, weekdays = days.filter((x) => x >= 1 && x <= 5).length, sats = days.filter((x) => x === 6).length, suns = days.filter((x) => x === 0).length;
  const need = (per: number) => Math.ceil(Math.max(0, remainingMin) / per);
  const cap = (n: number, avail: number) => (n <= avail ? `${n} de ${avail} disponíveis` : `precisa de ${n}, só há ${avail}: combine com outra forma`);
  const plans: HourPlan[] = [
    { id: "manha", title: "Manhã completa", how: "Cartas + campo de casa em casa + revisitas", block: "7h às 11h", perSession: 240, sessions: need(240), when: cap(need(240), daysLeft) },
    { id: "meia-manha", title: "Meia manhã", how: "Campo + uma revisita no caminho", block: "8h30 às 10h30", perSession: 120, sessions: need(120), when: cap(need(120), daysLeft) },
    { id: "tarde", title: "Tarde de testemunho público", how: "Carrinho/mostruário + revisitas no fim da tarde", block: "14h às 17h", perSession: 180, sessions: need(180), when: cap(need(180), weekdays) + " (dias úteis)" },
    { id: "fim-semana", title: "Fim de semana reforçado", how: "Sábado manhã longa + domingo depois da reunião", block: "Sáb 8h–12h · Dom 2h", perSession: 180, sessions: need(180), when: cap(need(180), sats + suns) + " (sáb e dom)" },
    { id: "noite", title: "Noite de cartas e estudos", how: "Cartas, telefone, estudo bíblico marcado", block: "19h às 21h", perSession: 120, sessions: need(120), when: cap(need(120), weekdays) + " (dias úteis)" },
    { id: "diario", title: "Um pouco todo dia", how: "Revisitas, cartas e testemunho informal", block: "todo dia", perSession: Math.ceil(Math.max(0, remainingMin) / Math.max(1, daysLeft)), sessions: daysLeft, when: `${Math.ceil(Math.max(0, remainingMin) / Math.max(1, daysLeft))} min por dia` },
  ];
  return { plans, daysLeft, perDay: daysLeft ? Math.ceil(Math.max(0, remainingMin) / daysLeft) : remainingMin };
}
/** Ritmo: compara o feito com o esperado até hoje no mês. */
export function pace(doneMin: number, goalMin: number, dayN: number, dim: number) {
  const expected = Math.round((goalMin * dayN) / dim), diff = doneMin - expected;
  return { expected, diff, state: diff >= 0 ? "adiantado" : diff > -120 ? "no limite" : "atrasado" } as const;
}
export const weekdayName = (i: number) => WD[i];
