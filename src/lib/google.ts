// Google Agenda (OAuth 2.0 + Calendar API v3) via fetch. Só no servidor: usa GOOGLE_CLIENT_SECRET.
import "server-only";

const ID = process.env.GOOGLE_CLIENT_ID ?? "", SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
export const googleReady = () => !!ID && !!SECRET;
export const SCOPES = "openid email https://www.googleapis.com/auth/calendar.events";

export function authUrl(redirect: string, state: string) {
  const p = new URLSearchParams({ client_id: ID, redirect_uri: redirect, response_type: "code", scope: SCOPES, access_type: "offline", prompt: "consent", include_granted_scopes: "true", state });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}
export async function exchangeCode(code: string, redirect: string) {
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: ID, client_secret: SECRET, redirect_uri: redirect, grant_type: "authorization_code" }) });
  if (!r.ok) throw new Error("Google recusou o código.");
  const j = await r.json() as { refresh_token?: string; access_token: string; id_token?: string };
  let email: string | null = null;
  if (j.id_token) { try { email = JSON.parse(Buffer.from(j.id_token.split(".")[1], "base64url").toString()).email ?? null; } catch { /* sem e-mail */ } }
  return { refresh: j.refresh_token ?? null, access: j.access_token, email };
}
export async function accessToken(refresh: string) {
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ refresh_token: refresh, client_id: ID, client_secret: SECRET, grant_type: "refresh_token" }) });
  if (!r.ok) throw new Error("Conexão com o Google expirou. Conecte de novo.");
  return ((await r.json()) as { access_token: string }).access_token;
}
export async function revoke(refresh: string) { await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refresh)}`, { method: "POST" }).catch(() => {}); }

type Ev = { title: string; date: string; start_time: string | null; end_time: string | null; location: string | null; notes: string | null; remind_min: number | null };
const TZ = "America/Sao_Paulo";
const plus1 = (iso: string) => new Date(Date.parse(iso + "T12:00:00Z") + 864e5).toISOString().slice(0, 10);
function body(e: Ev) {
  const t = (x: string) => x.slice(0, 5) + ":00";
  const end = e.end_time ?? (e.start_time ? `${String(Math.min(23, +e.start_time.slice(0, 2) + 1)).padStart(2, "0")}:${e.start_time.slice(3, 5)}` : null);
  return {
    summary: e.title, location: e.location ?? undefined, description: e.notes ?? undefined,
    start: e.start_time ? { dateTime: `${e.date}T${t(e.start_time)}`, timeZone: TZ } : { date: e.date },
    end: e.start_time ? { dateTime: `${e.date}T${t(end!)}`, timeZone: TZ } : { date: plus1(e.date) },
    reminders: e.remind_min != null ? { useDefault: false, overrides: [{ method: "popup", minutes: e.remind_min }] } : { useDefault: true },
    extendedProperties: { private: { brio: "1" } },
  };
}
const base = (cal: string) => `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal)}/events`;
export async function upsert(token: string, cal: string, e: Ev, googleId?: string | null) {
  const r = await fetch(googleId ? `${base(cal)}/${googleId}` : base(cal), { method: googleId ? "PUT" : "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(body(e)) });
  if (r.status === 404 && googleId) return upsert(token, cal, e, null);
  if (!r.ok) throw new Error("Não foi possível enviar ao Google.");
  return ((await r.json()) as { id: string }).id;
}
export async function remove(token: string, cal: string, googleId: string) {
  await fetch(`${base(cal)}/${googleId}`, { method: "DELETE", headers: { authorization: `Bearer ${token}` } });
}
export type GEvent = { id: string; title: string; date: string; start_time: string | null; end_time: string | null; location: string | null; fromBrio: boolean; link: string | null };
/** Eventos do Google num intervalo (para mostrar na agenda do BRIO). */
export async function list(token: string, cal: string, from: string, to: string): Promise<GEvent[]> {
  const p = new URLSearchParams({ timeMin: `${from}T00:00:00-03:00`, timeMax: `${to}T23:59:59-03:00`, singleEvents: "true", orderBy: "startTime", maxResults: "500" });
  const r = await fetch(`${base(cal)}?${p}`, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!r.ok) return [];
  const j = (await r.json()) as { items?: { id: string; summary?: string; location?: string; htmlLink?: string; start: { date?: string; dateTime?: string }; end: { date?: string; dateTime?: string }; extendedProperties?: { private?: { brio?: string } } }[] };
  const hm = (dt?: string) => (dt ? new Date(new Date(dt).getTime() - 3 * 36e5).toISOString().slice(11, 16) : null);
  const day = (s: { date?: string; dateTime?: string }) => s.date ?? new Date(new Date(s.dateTime!).getTime() - 3 * 36e5).toISOString().slice(0, 10);
  return (j.items ?? []).map((i) => ({ id: i.id, title: i.summary ?? "(sem título)", date: day(i.start), start_time: hm(i.start.dateTime), end_time: hm(i.end.dateTime), location: i.location ?? null, fromBrio: i.extendedProperties?.private?.brio === "1", link: i.htmlLink ?? null }));
}
