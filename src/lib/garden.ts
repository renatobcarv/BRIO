// Plantação das metas: cada meta é uma planta que cresce com o progresso; a grama cresce com estudo e constância. Puro e testável.
export const STAGES = ["Semente", "Broto", "Muda", "Planta", "Em flor", "Árvore com frutos"] as const;
/** Fase da planta pelo progresso (0–1). */
export const plantStage = (pct: number) => (pct >= 1 ? 5 : pct >= 0.75 ? 4 : pct >= 0.5 ? 3 : pct >= 0.25 ? 2 : pct >= 0.05 ? 1 : 0);
/** Murcha: prazo vencido sem concluir. */
export const wilted = (pct: number, deadline: string | null, today: string) => pct < 1 && !!deadline && deadline < today;
/** Vigor da grama (0–1): horas de estudo (30 h/mês = cheio) e dias com missão cumprida nos últimos 30 dias. */
export function grassVigor(studyMinutes30: number, activeDays30: number) {
  const s = Math.min(1, Math.max(0, studyMinutes30) / (30 * 60)), d = Math.min(1, Math.max(0, activeDays30) / 30);
  return Math.round((s * 0.6 + d * 0.4) * 100) / 100;
}
/** Estrelas do campo: título que resume o seu momento. */
export function fieldTitle(vigor: number, blooming: number, total: number) {
  if (total && blooming === total && vigor > 0.7) return "Campo lendário";
  if (vigor > 0.6 || (total && blooming / total >= 0.5)) return "Campo fértil";
  if (vigor > 0.25 || blooming > 0) return "Campo brotando";
  return "Terra preparada";
}
