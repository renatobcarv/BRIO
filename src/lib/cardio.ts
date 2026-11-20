// Cardio e corrida: ritmo, velocidade, calorias (MET) e resumo. Sem dependências.
export type CardioKind = "corrida" | "caminhada" | "bike" | "esteira" | "eliptico" | "remo" | "outro";
export const CARDIO: Record<CardioKind, { label: string; met: number; pace: boolean }> = {
  corrida: { label: "Corrida", met: 9.8, pace: true }, caminhada: { label: "Caminhada", met: 3.8, pace: true }, esteira: { label: "Esteira", met: 8.3, pace: true },
  bike: { label: "Bike", met: 7.5, pace: false }, eliptico: { label: "Elíptico", met: 5, pace: false }, remo: { label: "Remo", met: 7, pace: false }, outro: { label: "Outro", met: 5, pace: false },
};
export function kindOf(name: string): CardioKind {
  return /corrid|run|trote/i.test(name) ? "corrida" : /esteira|treadmill/i.test(name) ? "esteira" : /caminhad|walk/i.test(name) ? "caminhada" : /bike|bicicleta|ciclismo|cycling/i.test(name) ? "bike" : /el[ií]ptico/i.test(name) ? "eliptico" : /remo/i.test(name) ? "remo" : "outro";
}
/** Ritmo em min/km como "5:30". */
export function pace(km: number, min: number) {
  if (!(km > 0) || !(min > 0)) return null;
  const s = Math.round((min * 60) / km);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
export const speed = (km: number, min: number) => (km > 0 && min > 0 ? Math.round((km / (min / 60)) * 10) / 10 : null);
export const kcalOf = (kind: CardioKind, min: number, kg: number) => Math.round(CARDIO[kind].met * kg * (min / 60));

export type Run = { date: string; name: string; km: number; min: number };
export function cardioSummary(runs: Run[], today: string) {
  const week = new Date(Date.parse(today + "T12:00:00Z") - 6 * 864e5).toISOString().slice(0, 10);
  const wk = runs.filter((r) => r.date >= week);
  const paced = runs.filter((r) => r.km >= 1 && r.min > 0 && CARDIO[kindOf(r.name)].pace);
  const best = paced.reduce<Run | null>((a, r) => (!a || r.min / r.km < a.min / a.km ? r : a), null);
  const longest = runs.reduce<Run | null>((a, r) => (!a || r.km > a.km ? r : a), null);
  return { weekKm: Math.round(wk.reduce((a, r) => a + r.km, 0) * 10) / 10, weekMin: wk.reduce((a, r) => a + r.min, 0), sessions: runs.length,
    totalKm: Math.round(runs.reduce((a, r) => a + r.km, 0) * 10) / 10, best, longest, recent: [...runs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6) };
}
