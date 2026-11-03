import Link from "next/link";
import { PageHeader, Verse } from "@/components/ui";
import { BodyToday } from "@/components/body/today";
import { Nutrition } from "@/components/body/nutrition";
import { Training } from "@/components/body/training";
import { Weight } from "@/components/body/weight";
import { addDays, dow, todayISO } from "@/lib/date";
import { getSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const TABS = [["hoje", "Hoje"], ["alimentacao", "Alimentação"], ["treino", "Treino"], ["peso", "Peso"]] as const;
const N = (v: unknown) => Number(v) || 0;

export default async function Page({ searchParams }: { searchParams: Promise<{ aba?: string; d?: string }> }) {
  const sp = await searchParams;
  const tab = sp.aba ?? "hoje";
  const sb = await createClient();
  const today = todayISO();
  const s = await getSettings(sb);
  const todaySplit = s.workout_split.find((d) => d.dow === dow(today)) ?? { dow: dow(today), label: "Off", focus: "Descanso" };
  let content: React.ReactNode;

  if (tab === "peso") {
    const { data } = await sb.from("weight_logs").select("id,date,kg").order("date");
    content = <Weight today={today} goal={s.weight_goal_kg} startKg={s.weight_start_kg} rate={s.weight_rate_kg_week} logs={(data ?? []).map((l) => ({ ...l, kg: N(l.kg) }))} />;
  } else if (tab === "treino") {
    const { data } = await sb.from("workouts").select("id,date,split_label,notes,duration_min,workout_sets(exercise,set_no,reps,kg)")
      .order("date", { ascending: false }).order("created_at", { ascending: false }).limit(400);
    const workouts = (data ?? []).map((w) => ({ id: w.id, date: w.date, split_label: w.split_label, notes: w.notes, duration_min: w.duration_min,
      sets: (w.workout_sets ?? []).map((x) => ({ ...x, kg: N(x.kg) })).sort((a, b) => a.exercise.localeCompare(b.exercise) || a.set_no - b.set_no) }));
    content = <Training today={today} split={s.workout_split} plan={s.workout_plan} workouts={workouts} />;
  } else if (tab === "alimentacao") {
    const date = sp.d && /^\d{4}-\d{2}-\d{2}$/.test(sp.d) ? sp.d : today;
    const from = addDays(date, -6);
    const [items, meals, foods, week] = await Promise.all([
      sb.from("meal_items").select("id,slot,name,kcal,protein_g,carbs_g,fat_g").eq("date", date).order("created_at"),
      sb.from("meals").select("slot,done").eq("date", date),
      sb.from("foods").select("id,name,portion,kcal,protein_g,carbs_g,fat_g").order("name"),
      sb.from("meal_items").select("date,kcal,protein_g").gte("date", from).lte("date", date),
    ]);
    const days = Array.from({ length: 7 }, (_, i) => addDays(from, i));
    const wk = days.map((d) => { const l = (week.data ?? []).filter((x) => x.date === d); return { date: d, kcal: l.reduce((a, x) => a + N(x.kcal), 0), protein: Math.round(l.reduce((a, x) => a + N(x.protein_g), 0)) }; });
    content = <Nutrition key={date} date={date} today={today} slots={s.meal_slots}
      items={(items.data ?? []).map((i) => ({ ...i, kcal: N(i.kcal), protein_g: N(i.protein_g), carbs_g: N(i.carbs_g), fat_g: N(i.fat_g) }))}
      doneSlots={(meals.data ?? []).filter((m) => m.done).map((m) => m.slot)}
      foods={(foods.data ?? []).map((f) => ({ ...f, kcal: N(f.kcal), protein_g: N(f.protein_g), carbs_g: N(f.carbs_g), fat_g: N(f.fat_g) }))}
      goals={{ kcal: s.kcal_goal, protein: s.protein_goal_g, carbs: s.carbs_goal_g, fat: s.fat_goal_g }} week={wk} />;
  } else {
    const from = addDays(today, -6);
    const [water, sleep, food, weight] = await Promise.all([
      sb.from("water_logs").select("date,ml").gte("date", from),
      sb.from("sleep_logs").select("date,hours").gte("date", from),
      sb.from("meal_items").select("kcal,protein_g").eq("date", today),
      sb.from("weight_logs").select("kg").order("date", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const days = Array.from({ length: 7 }, (_, i) => addDays(from, i));
    const water7 = days.map((d) => ({ date: d, ml: (water.data ?? []).filter((w) => w.date === d).reduce((a, w) => a + w.ml, 0) }));
    const sleep7 = days.map((d) => { const r = (sleep.data ?? []).find((x) => x.date === d); return { date: d, hours: r ? N(r.hours) : null }; });
    content = <BodyToday today={today} waterMl={water7.at(-1)!.ml} waterGoal={s.water_goal_ml} water7={water7}
      split={todaySplit} exercises={(s.workout_plan.days[String(todaySplit.dow)] ?? []).length}
      food={{ kcal: (food.data ?? []).reduce((a, x) => a + N(x.kcal), 0), protein: (food.data ?? []).reduce((a, x) => a + N(x.protein_g), 0), kcalGoal: s.kcal_goal, proteinGoal: s.protein_goal_g }}
      sleepHours={sleep7.at(-1)!.hours} sleep7={sleep7} weightKg={weight.data ? N(weight.data.kg) : s.weight_start_kg} />;
  }

  return (
    <>
      <PageHeader eyebrow="Corpo" title="Treino, dieta e saúde" color="#8ac295" />
      <div className="sticky top-0 z-30 -mx-4 px-4 py-2 mb-3 bg-base/80 backdrop-blur-xl md:static md:bg-transparent md:backdrop-blur-none md:p-0 md:mx-0">
        <div className="inline-flex p-1 rounded-2xl bg-white/[.04] border border-white/[.06] gap-1 max-w-full overflow-x-auto" role="tablist">
          {TABS.map(([k, l]) => (
            <Link key={k} href={`/corpo?aba=${k}`} role="tab" aria-selected={tab === k}
              className={`min-h-10 px-4 rounded-xl text-sm whitespace-nowrap grid place-items-center transition-colors ${tab === k ? "bg-white/[.09] text-ink" : "text-muted hover:text-ink"}`}>{l}</Link>
          ))}
        </div>
      </div>
      {content}
      <Verse area="corpo" />
    </>
  );
}
