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
