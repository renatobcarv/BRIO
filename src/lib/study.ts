// Central de Estudos: regras puras (progresso, próximo passo, revisão espaçada, sequência).
export type StudyStatus = "afazer" | "estudando" | "revisar" | "dominado";
export type SItem = { id: string; track_id: string; module: string; title: string; position: number; est_min: number | null; status: StudyStatus; weak: boolean; confidence: number | null; link: string | null; notes: string | null; review_at: string | null; review_step: number; done_at: string | null };
export type STrack = { id: string; title: string; why: string | null; weakness: string | null; deadline: string | null; color: string; daily_min: number; status: "ativo" | "pausado" | "concluido"; finished_at: string | null };
export type SLog = { date: string; track_id: string | null; item_id: string | null; minutes: number; kind: string };

export const INTERVALS = [1, 3, 7, 14, 30];
const add = (iso: string, n: number) => new Date(Date.parse(iso + "T12:00:00Z") + n * 864e5).toISOString().slice(0, 10);

/** Progresso: dominado vale 1, revisar 0,75, estudando 0,4. */
export function progress(items: SItem[]) {
  if (!items.length) return 0;
  const w = { afazer: 0, estudando: 0.4, revisar: 0.75, dominado: 1 } as const;
  return items.reduce((a, i) => a + w[i.status], 0) / items.length;
}
/** Próximo passo: revisão vencida > fraqueza em andamento > o que está estudando > o próximo a fazer na ordem. */
export function nextStep(items: SItem[], today: string): SItem | null {
  const due = items.filter((i) => i.review_at && i.review_at <= today).sort((a, b) => (a.review_at! < b.review_at! ? -1 : 1));
  if (due[0]) return due[0];
  const ord = [...items].sort((a, b) => a.position - b.position);
  return ord.find((i) => i.status === "estudando" && i.weak) ?? ord.find((i) => i.status === "estudando") ?? ord.find((i) => i.status === "afazer" && i.weak) ?? ord.find((i) => i.status === "afazer") ?? ord.find((i) => i.status === "revisar") ?? null;
}
/** Revisão: lembrou → próximo intervalo (e domina ao passar do último); esqueceu → volta ao começo. */
export function review(i: Pick<SItem, "review_step">, remembered: boolean, today: string) {
  if (!remembered) return { status: "revisar" as StudyStatus, review_step: 0, review_at: add(today, 1) };
  const step = i.review_step + 1;
  return step >= INTERVALS.length ? { status: "dominado" as StudyStatus, review_step: step, review_at: null } : { status: "dominado" as StudyStatus, review_step: step, review_at: add(today, INTERVALS[step]) };
}
/** Ao dominar um conteúdo pela primeira vez, agenda a primeira revisão. */
export const firstReview = (today: string) => ({ review_step: 0, review_at: add(today, INTERVALS[0]) });

/** Dias seguidos com estudo (até hoje ou ontem). */
export function studyStreak(logs: SLog[], today: string) {
  const d = new Set(logs.map((l) => l.date)); let n = 0;
  for (let x = d.has(today) ? today : add(today, -1); d.has(x); x = add(x, -1)) n++;
  return n;
}
/** Minutos por dia nos últimos n dias. */
export const perDay = (logs: SLog[], today: string, n = 14) =>
  Array.from({ length: n }, (_, i) => add(today, i - n + 1)).map((date) => ({ date, min: logs.filter((l) => l.date === date).reduce((a, l) => a + l.minutes, 0) }));
/** Ritmo para fechar no prazo: minutos por dia necessários. */
export function pace(items: SItem[], deadline: string | null, today: string) {
  const left = items.filter((i) => i.status !== "dominado").reduce((a, i) => a + (i.est_min ?? 30) * (i.status === "afazer" ? 1 : 0.5), 0);
  if (!deadline) return { leftMin: left, perDay: null as number | null, days: null as number | null };
  const days = Math.max(1, Math.round((Date.parse(deadline) - Date.parse(today)) / 864e5));
  return { leftMin: left, perDay: Math.ceil(left / days), days };
}
