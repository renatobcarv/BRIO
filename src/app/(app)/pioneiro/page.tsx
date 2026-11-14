import { PageHeader, Verse } from "@/components/ui";
import { Pioneer } from "@/components/pioneer/pioneer";
import { FieldHub, type Contact } from "@/components/pioneer/field-hub";
import { addMonths, isoMonthParam, monthEnd, serviceYearStart, todayISO } from "@/lib/date";
import { getSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const month = isoMonthParam((await searchParams).m);
  const today = todayISO();
  const sb = await createClient();
  const s = await getSettings(sb);
  const sy = serviceYearStart(month);
  const syEnd = monthEnd(addMonths(sy, 11));

  const [entries, goal, plan, year, contacts, todayRows] = await Promise.all([
    sb.from("pioneer_entries").select("id,date,category,minutes").gte("date", month).lte("date", monthEnd(month)),
    sb.from("pioneer_month_goals").select("goal_minutes").eq("month", month).maybeSingle(),
    sb.from("pioneer_week_plan").select("minutes_by_day").maybeSingle(),
    sb.from("pioneer_entries").select("date,minutes").gte("date", sy).lte("date", syEnd),
    sb.from("field_contacts").select("*").order("next_visit", { nullsFirst: false }),
    sb.from("pioneer_entries").select("*").eq("date", today).order("created_at"),
  ]);
  const goalMin = goal.data?.goal_minutes ?? s.pioneer_goal_minutes;
  const curMonth = today.slice(0, 8) + "01";
  const monthMin = (year.data ?? []).filter((e) => e.date >= curMonth).reduce((a, e) => a + e.minutes, 0);
  const months = Array.from({ length: 12 }, (_, i) => addMonths(sy, i));
  const yearData = months.map((m) => ({
    month: m, minutes: (year.data ?? []).filter((e) => e.date.slice(0, 7) === m.slice(0, 7)).reduce((a, e) => a + e.minutes, 0),
  }));

  return (
    <>
      <PageHeader eyebrow="Pioneiro" title="Serviço de campo" color="#f5f5f7" />
      <FieldHub today={today} contacts={(contacts.error ? [] : contacts.data ?? []) as Contact[]} todayEntries={todayRows.data ?? []} monthMinutes={monthMin} goal={goalMin} />
      <div className="mt-6" />
      <Pioneer key={month} month={month} today={today}
        goal={goal.data?.goal_minutes ?? s.pioneer_goal_minutes}
        entries={entries.data ?? []} plan={plan.data?.minutes_by_day ?? [0, 0, 0, 0, 0, 0, 0]} year={yearData} />
      <Verse area="pioneiro" />
    </>
  );
}
