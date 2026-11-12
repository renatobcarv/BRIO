import { createClient as createAnon } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";
type Row = { id: string; title: string; date: string; start_time: string | null; end_time: string | null; category: string; location: string | null; notes: string | null; remind_min: number | null; updated_at: string };

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const fold = (line: string) => { const out: string[] = []; let l = line; while (l.length > 74) { out.push(l.slice(0, 74)); l = " " + l.slice(74); } out.push(l); return out.join("\r\n"); };
const d8 = (iso: string) => iso.replace(/-/g, "");
const t6 = (t: string) => t.slice(0, 5).replace(":", "") + "00";
const next = (iso: string) => new Date(Date.parse(iso + "T12:00:00Z") + 864e5).toISOString().slice(0, 10);
const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const LABEL: Record<string, string> = { pessoal: "Pessoal", espiritual: "Espiritual", campo: "Campo", treino: "Treino", financas: "Finanças", trabalho: "Trabalho", familia: "Família" };

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const raw = token.replace(/\.ics$/, "");
  if (!/^[a-f0-9]{48}$/.test(raw) || !SUPABASE_URL || !SUPABASE_KEY) return new Response("Not found", { status: 404 });
  const sb = createAnon(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
  const { data, error } = await sb.rpc("calendar_feed", { p_token: raw });
  if (error) return new Response("Not found", { status: 404 });
  const rows = (data ?? []) as Row[];
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//BRIO//Agenda//PT-BR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:BRIO", "X-WR-TIMEZONE:America/Sao_Paulo", "REFRESH-INTERVAL;VALUE=DURATION:PT1H", "X-PUBLISHED-TTL:PT1H"];
  for (const e of rows) {
    lines.push("BEGIN:VEVENT", `UID:${e.id}@brio`, `DTSTAMP:${stamp(e.updated_at)}`, `LAST-MODIFIED:${stamp(e.updated_at)}`);
    if (e.start_time) {
      lines.push(`DTSTART;TZID=America/Sao_Paulo:${d8(e.date)}T${t6(e.start_time)}`);
      const end = e.end_time ?? `${String(Math.min(23, +e.start_time.slice(0, 2) + 1)).padStart(2, "0")}:${e.start_time.slice(3, 5)}`;
      lines.push(`DTEND;TZID=America/Sao_Paulo:${d8(e.date)}T${t6(end)}`);
    } else lines.push(`DTSTART;VALUE=DATE:${d8(e.date)}`, `DTEND;VALUE=DATE:${d8(next(e.date))}`);
    lines.push(`SUMMARY:${esc(e.title)}`, `CATEGORIES:${esc(LABEL[e.category] ?? e.category)}`);
    if (e.location) lines.push(`LOCATION:${esc(e.location)}`);
    if (e.notes) lines.push(`DESCRIPTION:${esc(e.notes)}`);
    if (e.remind_min != null) lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(e.title)}`, `TRIGGER:-PT${e.remind_min}M`, "END:VALARM");
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return new Response(lines.map(fold).join("\r\n") + "\r\n", { headers: { "content-type": "text/calendar; charset=utf-8", "cache-control": "private, max-age=300" } });
}
