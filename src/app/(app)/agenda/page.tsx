import { headers } from "next/headers";
import { Agenda, type CalEvent } from "@/components/agenda/agenda";
import { todayISO } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const sb = await createClient();
  const today = todayISO();
  const { m } = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(m ?? "") ? `${m}-01` : today.slice(0, 8) + "01";
  const from = new Date(Date.parse(month + "T12:00:00Z") - 7 * 864e5).toISOString().slice(0, 10);
  const to = new Date(Date.parse(month + "T12:00:00Z") + 45 * 864e5).toISOString().slice(0, 10);
  const [ev, st] = await Promise.all([
    sb.from("calendar_events").select("id,title,date,start_time,end_time,category,location,notes,remind_min").gte("date", from).lte("date", to).order("date").order("start_time", { nullsFirst: true }),
    sb.from("settings").select("calendar_token").maybeSingle(),
  ]);
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const token = (st.data as { calendar_token?: string | null } | null)?.calendar_token ?? null;
  return (
    <Agenda today={today} month={month} events={(ev.data ?? []) as CalEvent[]} ready={!ev.error}
      feed={token && host ? `${host}/api/agenda/${token}.ics` : null} />
  );
}
