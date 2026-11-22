// Dias limpos: a partir do primeiro registro, todo dia sem recaída conta (esquecer de marcar não zera). Só a recaída quebra a sequência; o recorde fica. Sem dependências.
export type Mark = { date: string; kind: "limpo" | "recaida"; at?: string | null };
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

/** Início da sequência atual em ms: momento exato da última recaída; sem recaída, 00:00 (Brasília) do 1º registro. */
export function streakStart(marks: Mark[]): number | null {
  if (!marks.length) return null;
  const rel = marks.filter((m) => m.kind === "recaida").sort((a, b) => a.date.localeCompare(b.date)).at(-1);
  const relAt = rel ? (rel.at ? Date.parse(rel.at) : Date.parse(rel.date + "T23:59:59-03:00")) : -Infinity;
  const startDay = marks.filter((m) => m.kind === "limpo" && (!rel || m.date > rel.date)).map((m) => m.date).sort()[0];
  return Math.max(relAt, startDay ? Date.parse(startDay + "T00:00:00-03:00") : -Infinity);
}

export function cleanStats(marks: Mark[], today: string, now = Date.now()) {
  const days = cleanDays(marks, today), clean = new Set(days);
  const relapse = new Set(marks.filter((m) => m.kind === "recaida").map((m) => m.date));
  // Sequência atual: só conta 24 horas completas desde o recomeço (ou o início).
  const st = streakStart(marks);
  const count = st == null ? 0 : Math.max(0, Math.floor((now - st) / 864e5));
  const nextAt = st == null ? null : st + (count + 1) * 864e5;
  let best = 0, run = 0, last = "";
  const lastRel = [...relapse].sort().at(-1) ?? "";
  // Recorde: sequências já encerradas por recaída; a atual é medida em 24h completas (count).
  for (const d of days.filter((x) => x < lastRel)) { run = last && prev(d) === last ? run + 1 : 1; best = Math.max(best, run); last = d; }
  const nextM = MILESTONES.find((m) => m > count) ?? count + 30;
  return { count, best: Math.max(best, count), todayDone: clean.has(today), relapsedToday: relapse.has(today), total: clean.size, next: nextM, started: days.length > 0 || relapse.size > 0, nextAt };
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
  { name: "Brasa", from: 1, color: "#ffd28a", core: "#ffe1ec", scale: 0.85, flames: 0, embers: 2 },
  { name: "Chama", from: 3, color: "#ffb21e", core: "#ffd1e0", scale: 1, flames: 1, embers: 4 },
  { name: "Fogueira", from: 7, color: "#ff9f0a", core: "#ffb3cb", scale: 1.12, flames: 2, embers: 7 },
  { name: "Inferno", from: 14, color: "#b7791f", core: "#ffd28a", scale: 1.24, flames: 3, embers: 11 },
  { name: "Fogo branco", from: 30, color: "#ffffff", core: "#ffffff", scale: 1.34, flames: 3, embers: 14 },
  { name: "Rubi", from: 90, color: "#ffd60a", core: "#ffffff", scale: 1.44, flames: 4, embers: 18 },
];
export const fireTier = (n: number) => [...FIRE].reverse().find((t) => n >= t.from) ?? FIRE[0];
export const nextFire = (n: number) => FIRE.find((t) => t.from > n) ?? null;
