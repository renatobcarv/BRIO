// Dias limpos: a partir do primeiro registro, todo dia sem recaída conta (esquecer de marcar não zera). Só a recaída quebra a sequência; o recorde fica. Sem dependências.
export type Mark = { date: string; kind: "limpo" | "recaida" };
const prev = (iso: string) => new Date(Date.parse(iso + "T12:00:00Z") - 864e5).toISOString().slice(0, 10);
export const MILESTONES = [1, 3, 7, 14, 30, 60, 90, 180, 365];

/** Dias limpos implícitos: a partir do primeiro registro, todo dia sem recaída conta como limpo
 * (não precisa marcar todo dia; esquecer de marcar não zera). Recaída é o único evento que quebra. */
const next = (d: string) => { const x = new Date(d + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + 1); return x.toISOString().slice(0, 10); };

export function cleanDays(marks: Mark[], today: string): string[] {
  if (!marks.length) return [];
  const relapse = new Set(marks.filter((m) => m.kind === "recaida").map((m) => m.date));
  const start = marks.map((m) => m.date).sort()[0];
  const out: string[] = [];
  for (let d = start; d <= today; d = next(d)) if (!relapse.has(d)) out.push(d);
  return out;
}

export function cleanStats(marks: Mark[], today: string) {
  const days = cleanDays(marks, today), clean = new Set(days);
  const relapse = new Set(marks.filter((m) => m.kind === "recaida").map((m) => m.date));
  // Sequência atual: termina hoje (o dia conta até você marcar recaída).
  let count = 0;
  for (let d = today; clean.has(d); d = prev(d)) count++;
  let best = 0, run = 0, last = "";
  for (const d of days) { run = last && prev(d) === last ? run + 1 : 1; best = Math.max(best, run); last = d; }
  const nextM = MILESTONES.find((m) => m > count) ?? count + 30;
  return { count, best: Math.max(best, count), todayDone: clean.has(today), relapsedToday: relapse.has(today), total: clean.size, next: nextM, started: days.length > 0 || relapse.size > 0 };
}

/** XP de um dia limpo pelo tamanho da sequência: começa em 10, cresce rápido e estabiliza em 30. */
export const cleanXp = (day: number) => Math.round(10 + 20 * (1 - Math.exp(-(Math.max(1, day) - 1) / 7)));

/** XP de cada dia limpo, contando a posição dele na sequência (lacuna ou recaída reiniciam). */
export function cleanXpByDay(days: string[], relapses: string[] = []) {
  const rel = new Set(relapses), out: { date: string; xp: number; day: number }[] = [];
  let run = 0, last = "";
  for (const d of [...new Set(days)].sort()) {
    run = last && prev(d) === last && !rel.has(d) ? run + 1 : 1;
    out.push({ date: d, xp: cleanXp(run), day: run }); last = d;
  }
  return out;
}

export type FireTier = { name: string; from: number; color: string; core: string; scale: number; flames: number; embers: number };
/** Força do fogo pela sequência. */
export const FIRE: FireTier[] = [
  { name: "Apagado", from: 0, color: "#2c2c2e", core: "#3a3a3c", scale: 0.8, flames: 0, embers: 0 },
  { name: "Brasa", from: 1, color: "#ff7a5c", core: "#ffe1ec", scale: 0.85, flames: 0, embers: 2 },
  { name: "Chama", from: 3, color: "#ff2800", core: "#ffd1e0", scale: 1, flames: 1, embers: 4 },
  { name: "Fogueira", from: 7, color: "#dc0000", core: "#ffb3cb", scale: 1.12, flames: 2, embers: 7 },
  { name: "Inferno", from: 14, color: "#a30000", core: "#ff7a5c", scale: 1.24, flames: 3, embers: 11 },
  { name: "Fogo branco", from: 30, color: "#ff2d55", core: "#ffffff", scale: 1.34, flames: 3, embers: 14 },
  { name: "Rubi", from: 90, color: "#e11d48", core: "#ffffff", scale: 1.44, flames: 4, embers: 18 },
];
export const fireTier = (n: number) => [...FIRE].reverse().find((t) => n >= t.from) ?? FIRE[0];
export const nextFire = (n: number) => FIRE.find((t) => t.from > n) ?? null;
