import { headers } from "next/headers";
import { Agenda, type CalEvent } from "@/components/agenda/agenda";
import { todayISO } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { accessToken, googleReady, list, type GEvent } from "@/lib/google";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ m?: string; google?: string }> }) {
  const sb = await createClient();
  const today = todayISO();
  const { m, google: flash } = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(m ?? "") ? `${m}-01` : today.slice(0, 8) + "01";
  const from = new Date(Date.parse(month + "T12:00:00Z") - 7 * 864e5).toISOString().slice(0, 10);
  const to = new Date(Date.parse(month + "T12:00:00Z") + 45 * 864e5).toISOString().slice(0, 10);
  const [ev, st] = await Promise.all([
    sb.from("calendar_events").select("id,title,date,start_time,end_time,category,location,notes,remind_min").gte("date", from).lte("date", to).order("date").order("start_time", { nullsFirst: true }),
    sb.from("settings").select("calendar_token").maybeSingle(),
  ]);
  const gc = await sb.from("google_calendar").select("refresh_token,calendar_id,email").maybeSingle();
  let gEvents: GEvent[] = [], gErr = false;
  if (gc.data && googleReady()) {
    try { gEvents = (await list(await accessToken(gc.data.refresh_token), gc.data.calendar_id, from, to)).filter((e) => !e.fromBrio); } catch { gErr = true; }
  }
  const st2 = await getSettings(sb);
  // Rotina fixa: refeições com horário no nome (ex.: "Almoço · 12h", "Jantar 21:30")
  const routine = st2.meal_slots.map((m) => { const r = /(\d{1,2})(?:h|:)(\d{2})?/i.exec(m.label); return r ? { label: m.label.replace(/\s*[·-]?\s*\d{1,2}(h|:)\d{0,2}\s*$/i, "").trim() || m.label, time: `${r[1].padStart(2, "0")}:${r[2] ?? "00"}` } : null; }).filter(Boolean) as { label: string; time: string }[];
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const token = (st.data as { calendar_token?: string | null } | null)?.calendar_token ?? null;
  return (
    <Agenda today={today} month={month} events={(ev.data ?? []) as CalEvent[]} ready={!ev.error}
      feed={token && host ? `${host}/api/agenda/${token}.ics` : null}
      google={{ ready: googleReady(), connected: !!gc.data, email: gc.data?.email ?? null, migrated: !gc.error, error: gErr, flash: flash ?? null }} gEvents={gEvents} routine={routine} />
  );
}
