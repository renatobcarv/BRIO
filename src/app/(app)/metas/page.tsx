import { Verse } from "@/components/ui";
import { Goals } from "@/components/goals/goals";
import { monthEnd, monthStart, todayISO } from "@/lib/date";
import { AREAS, goalStats, type AreaKey, type GoalRow } from "@/lib/goals";
import { GoalGarden } from "@/components/goals/garden";
import { grassVigor } from "@/lib/garden";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Page() {
  const sb = await createClient();
  const today = todayISO(), m = monthStart(today);
  const [obj, goals, boxes, pioneer, weight, bible, booksYear] = await Promise.all([
    sb.from("objectives").select("id,title,area,description").order("created_at"),
    sb.from("goals").select("*").order("featured", { ascending: false }).order("deadline", { nullsFirst: false }),
    sb.from("savings_boxes").select("id,name,saved"),
    sb.from("pioneer_entries").select("minutes").gte("date", m).lte("date", monthEnd(m)),
    sb.from("weight_logs").select("kg").order("date", { ascending: false }).limit(1).maybeSingle(),
    sb.from("bible_reading").select("id", { count: "exact", head: true }),
    sb.from("books").select("id", { count: "exact", head: true }).eq("status", "lido").gte("finished_at", today.slice(0, 4) + "-01-01"),
  ]);
  // Plantação: grama cresce com estudo e dias de missão nos últimos 30 dias.
  const from30 = new Date(Date.parse(today + "T12:00:00Z") - 29 * 864e5).toISOString().slice(0, 10);
  const [st30, ck30] = await Promise.all([sb.from("study_entries").select("minutes").gte("date", from30), sb.from("daily_checks").select("date").eq("done", true).gte("date", from30)]);
  const studyMin = (st30.data ?? []).reduce((a, e) => a + Number(e.minutes || 0), 0), activeDays = new Set((ck30.data ?? []).map((c) => c.date as string)).size;
  const pioneerH = (pioneer.data ?? []).reduce((a, e) => a + e.minutes, 0) / 60;
  const list: GoalRow[] = (goals.data ?? []).map((g) => {
    const r = { ...g, target: Number(g.target), current: Number(g.current), start_value: Number(g.start_value) } as GoalRow;
    if (r.auto_source === "pioneer_month") r.current = Math.round(pioneerH * 100) / 100;
    if (r.auto_source === "weight" && weight.data) r.current = Number(weight.data.kg);
    if (r.auto_source === "bible_chapters") r.current = bible.count ?? 0;
    if (r.auto_source === "books_year") r.current = booksYear.count ?? 0;
    if (r.auto_source === "savings_box") r.current = Number((boxes.data ?? []).find((b) => b.id === r.auto_ref)?.saved ?? 0);
    return r;
  });
  // Mantém o valor salvo em sincronia com o automático (o Início lê "current").
  await Promise.all(list.filter((g, i) => g.auto_source && g.current !== Number(goals.data![i].current))
    .map((g) => sb.from("goals").update({ current: g.current }).eq("id", g.id)));

  return (
    <div className="goals-page">
      <GoalGarden today={today} vigor={grassVigor(studyMin, activeDays)} studyH={studyMin / 60} activeDays={activeDays}
        goals={list.map((g) => ({ id: g.id, title: g.title, pct: goalStats(g, today).pct, color: AREAS[g.area as AreaKey]?.color ?? "#ffb21e", area: String(g.area ?? "padrao"), deadline: g.deadline ?? null }))} />
      <Goals today={today} objectives={obj.data ?? []} goals={list} boxes={(boxes.data ?? []).map(({ id, name }) => ({ id, name }))} />
      <Verse area="metas" />
    </div>
  );
}
