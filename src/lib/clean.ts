// Dias limpos: cada dia marcado conta; uma recaída zera a sequência e o recorde fica. Sem dependências.
export type Mark = { date: string; kind: "limpo" | "recaida" };
const prev = (iso: string) => new Date(Date.parse(iso + "T12:00:00Z") - 864e5).toISOString().slice(0, 10);
export const MILESTONES = [1, 3, 7, 14, 30, 60, 90, 180, 365];

export function cleanStats(marks: Mark[], today: string) {
  const clean = new Set(marks.filter((m) => m.kind === "limpo").map((m) => m.date));
  const relapse = new Set(marks.filter((m) => m.kind === "recaida").map((m) => m.date));
  // Sequência atual: termina hoje (se já marcado) ou ontem.
  let count = 0;
  for (let d = clean.has(today) ? today : prev(today); clean.has(d) && !relapse.has(d); d = prev(d)) count++;
  // Recorde: maior sequência de dias limpos consecutivos.
  let best = 0, run = 0, last = "";
  for (const d of [...clean].sort()) { run = last && prev(d) === last && !relapse.has(d) ? run + 1 : 1; best = Math.max(best, run); last = d; }
  const next = MILESTONES.find((m) => m > count) ?? count + 30;
  return { count, best: Math.max(best, count), todayDone: clean.has(today), relapsedToday: relapse.has(today), total: clean.size, next };
}
