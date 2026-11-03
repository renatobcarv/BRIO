import Link from "next/link";
import { PageHeader, Verse } from "@/components/ui";
import { BodyToday } from "@/components/body/today";
import { Weight } from "@/components/body/weight";
import { Training } from "@/components/body/training";
import { addDays, dow, todayISO } from "@/lib/date";
import { getSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const TABS = [["hoje", "Hoje"], ["peso", "Peso"], ["treino", "Treino"]] as const;

export default async function Page({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const tab = (await searchParams).aba ?? "hoje";
  const sb = await createClient();
  const s = await getSettings(sb);
  const today = todayISO();
  const todaySplit = s.workout_split.find((d) => d.dow === dow(today)) ?? { dow: dow(today), label: "Off", focus: "Descanso" };

  let content: React.ReactNode = null;
  if (tab === "peso") {
    const { data } = await sb.from("weight_logs").select("id,date,kg").order("date");
    content = <Weight today={today} goal={s.weight_goal_kg} start={s.weight_start_kg}
      logs={(data ?? []).map((l) => ({ ...l, kg: Number(l.kg) }))} />;
  } else if (tab === "treino") {
    const { data } = await sb.from("workouts").select("id,date,split_label,notes,workout_sets(exercise,set_no,reps,kg)")
      .order("date", { ascending: false }).limit(300);
    const workouts = (data ?? []).map((w) => ({ id: w.id, date: w.date, split_label: w.split_label, notes: w.notes,
      sets: (w.workout_sets ?? []).map((x) => ({ ...x, kg: Number(x.kg) })).sort((a, b) => a.set_no - b.set_no) }));
    content = <Training today={today} split={s.workout_split} todaySplit={todaySplit} workouts={workouts} />;
  } else {
    const from = addDays(today, -6);
    const [water, meals, sleep] = await Promise.all([
      sb.from("water_logs").select("date,ml").gte("date", from),
      sb.from("meals").select("slot,done,kcal,protein_g").eq("date", today),
      sb.from("sleep_logs").select("date,hours").gte("date", from),
    ]);
    const days = Array.from({ length: 7 }, (_, i) => addDays(from, i));
    const water7 = days.map((d) => ({ date: d, ml: (water.data ?? []).filter((w) => w.date === d).reduce((a, w) => a + w.ml, 0) }));
    const sl = (sleep.data ?? []).map((x) => Number(x.hours));
    content = <BodyToday today={today} waterMl={water7.at(-1)!.ml} waterGoal={s.water_goal_ml} water7={water7}
      meals={meals.data ?? []} kcalGoal={s.kcal_goal} proteinGoal={s.protein_goal_g} split={todaySplit}
      sleepHours={(sleep.data ?? []).find((x) => x.date === today)?.hours ?? null}
      sleepAvg={sl.length ? sl.reduce((a, b) => a + b, 0) / sl.length : null} />;
  }

  return (
    <>
      <PageHeader eyebrow="Corpo" title="Treino, água e dieta" color="#8ac295" />
      <div className="flex gap-2 mb-4 rise" role="tablist" style={{ ["--accent" as string]: "#8ac295" }}>
        {TABS.map(([k, l]) => <Link key={k} href={`/corpo?aba=${k}`} role="tab" aria-selected={tab === k} aria-pressed={tab === k} className="chip !min-h-11 !px-5">{l}</Link>)}
      </div>
      {content}
      <Verse area="corpo" />
    </>
  );
}
