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
  { name: "Brasa", from: 1, color: "#ff8fb5", core: "#ffe1ec", scale: 0.85, flames: 0, embers: 2 },
  { name: "Chama", from: 3, color: "#ff4d8a", core: "#ffd1e0", scale: 1, flames: 1, embers: 4 },
  { name: "Fogueira", from: 7, color: "#d12b65", core: "#ffb3cb", scale: 1.12, flames: 2, embers: 7 },
  { name: "Inferno", from: 14, color: "#b51224", core: "#ff8fb5", scale: 1.24, flames: 3, embers: 11 },
  { name: "Fogo branco", from: 30, color: "#ff2d55", core: "#ffffff", scale: 1.34, flames: 3, embers: 14 },
  { name: "Rubi", from: 90, color: "#e11d48", core: "#ffffff", scale: 1.44, flames: 4, embers: 18 },
];
export const fireTier = (n: number) => [...FIRE].reverse().find((t) => n >= t.from) ?? FIRE[0];
export const nextFire = (n: number) => FIRE.find((t) => t.from > n) ?? null;
