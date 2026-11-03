export const TZ = "America/Sao_Paulo";

/** "Hoje" no fuso de São Paulo, formato YYYY-MM-DD. */
export function todayISO(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
export function longDate(d = new Date()) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(d);
}
export function greeting(d = new Date()) {
  const h = Number(new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", hour12: false }).format(d));
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}
/** minutos → "h:mm" */
export const toHMM = (m: number) => `${Math.floor(m / 60)}:${String(Math.abs(m % 60)).padStart(2, "0")}`;
/** "h:mm" → minutos */
export function fromHMM(s: string) {
  const [h, m = "0"] = s.split(":");
  return Number(h) * 60 + Number(m);
}
export const brl = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

// ── Aritmética de datas em strings YYYY-MM-DD (sem fuso) ──
const D = (iso: string) => new Date(iso + "T12:00:00Z");
const S = (d: Date) => d.toISOString().slice(0, 10);
export const addDays = (iso: string, n: number) => { const d = D(iso); d.setUTCDate(d.getUTCDate() + n); return S(d); };
export const addMonths = (iso: string, n: number) => { const d = D(iso.slice(0, 7) + "-01"); d.setUTCMonth(d.getUTCMonth() + n); return S(d); };
export const monthStart = (iso: string) => iso.slice(0, 7) + "-01";
export const monthEnd = (iso: string) => addDays(addMonths(iso, 1), -1);
export const daysInMonth = (iso: string) => Number(monthEnd(iso).slice(8));
export const dow = (iso: string) => D(iso).getUTCDay();
export const diffDays = (a: string, b: string) => Math.round((D(a).getTime() - D(b).getTime()) / 86_400_000);
export const monthLabel = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(D(iso));
export const shortDate = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" }).format(D(iso)).replace(".", "");
export const weekdayShort = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
/** Início do ano de serviço (setembro). */
export const serviceYearStart = (iso: string) => {
  const y = Number(iso.slice(0, 4)), m = Number(iso.slice(5, 7));
  return `${m >= 9 ? y : y - 1}-09-01`;
};
export const isoMonthParam = (p?: string) => (p && /^\d{4}-\d{2}$/.test(p) ? p + "-01" : monthStart(todayISO()));
