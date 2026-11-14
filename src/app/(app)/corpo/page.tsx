import Link from "next/link";
import { eaten } from "@/lib/meals";
import { Verse } from "@/components/ui";
import { BodyToday } from "@/components/body/today";
import { Nutrition } from "@/components/body/nutrition";
import { Training } from "@/components/body/training";
import { Weight } from "@/components/body/weight";
import { ProgramView } from "@/components/body/program";
import type { Muscle, Program } from "@/lib/training";
import { computeEvents } from "@/lib/events";
import { FireLayer, EventCard } from "@/components/events/event-ui";
import { addDays, dow, todayISO } from "@/lib/date";
import { getSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const TABS = [["hoje", "Hoje"], ["treino", "Treino"], ["alimentacao", "Dieta"], ["peso", "Peso"]] as const;
const N = (v: unknown) => Number(v) || 0;

export default async function Page({ searchParams }: { searchParams: Promise<{ aba?: string; d?: string }> }) {
  const sp = await searchParams;
  const openProgram = sp.aba === "programa";
  const tab = openProgram ? "treino" : sp.aba ?? "hoje";
  const sb = await createClient();
  const today = todayISO();
  const s = await getSettings(sb);
  const todaySplit = s.workout_split.find((d) => d.dow === dow(today)) ?? { dow: dow(today), label: "Off", focus: "Descanso" };
  let content: React.ReactNode;
  let onFire = false;
  let warEvent: React.ReactNode = null;

  if (tab === "peso") {
    const { data } = await sb.from("weight_logs").select("id,date,kg").order("date");
    content = <Weight today={today} goal={s.weight_goal_kg} startKg={s.weight_start_kg} rate={s.weight_rate_kg_week} logs={(data ?? []).map((l) => ({ ...l, kg: N(l.kg) }))} />;
  } else if (tab === "treino") {
    const q = (cols: string) => sb.from("workouts").select(cols).order("date", { ascending: false }).order("created_at", { ascending: false }).limit(400);
    const bw = await sb.from("weight_logs").select("kg").order("date", { ascending: false }).limit(1).maybeSingle();
    let [res, prog] = await Promise.all([
      q("id,date,split_label,notes,duration_min,planned,week_no,phase,workout_sets(exercise,set_no,reps,kg,rpe)"),
      sb.from("training_programs").select("*").eq("active", true).maybeSingle(),
    ]);
    // Sem a migração de periodização: usa as colunas antigas.
    if (res.error) res = await q("id,date,split_label,notes,duration_min,workout_sets(exercise,set_no,reps,kg)");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = res.data as any[] | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const workouts = (data ?? []).map((w: any) => ({ id: w.id, date: w.date, split_label: w.split_label, notes: w.notes, duration_min: w.duration_min,
      planned: w.planned, week_no: w.week_no, phase: w.phase,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sets: (w.workout_sets ?? []).map((x: any) => ({ ...x, kg: N(x.kg), rpe: x.rpe != null ? N(x.rpe) : null })).sort((a: any, b: any) => a.exercise.localeCompare(b.exercise) || a.set_no - b.set_no) }));
    const [progs, wsP] = await Promise.all([
      sb.from("training_programs").select("*").order("created_at", { ascending: false }),
      sb.from("workouts").select("program_id,week_no").not("program_id", "is", null),
    ]);
    const doneMap: Record<string, number> = {};
    for (const w of wsP.data ?? []) { const k = `${w.program_id}:${w.week_no}`; doneMap[k] = (doneMap[k] ?? 0) + 1; }
    const programSlot = progs.error
      ? <p className="text-sm text-[#ff453a]">Rode a migração supabase/migrations/20261106000000_periodizacao.sql no Supabase para usar programas.</p>
      : <ProgramView programs={(progs.data ?? []) as Program[]} today={today} planDays={s.workout_plan.days}
          overrides={((s as unknown as { exercise_muscles?: Record<string, Muscle> }).exercise_muscles) ?? {}} sessionsDone={doneMap} />;
    const evs = computeEvents({ today, travel: s.travel ?? [], programs: (progs.error ? [] : progs.data ?? []) as Program[], proteinGoal: s.protein_goal_g, meals: [], sleep: [],
      workouts: workouts.map((w: { date: string; sets: { exercise: string; kg: number; reps: number; rpe?: number | null }[] }) => ({ date: w.date, sets: w.sets })) });
    const hot = evs.find((e) => (e.stage === "ativo" || e.stage === "contagem") && (e.type === "hell_week" || e.type === "judgment" || e.type === "genesis"));
    onFire = !!evs.find((e) => e.type === "hell_week" && (e.stage === "ativo" || e.stage === "contagem"));
    if (hot) warEvent = <Link href="/eventos" className="block mb-4"><EventCard e={hot} compact /></Link>;
    content = <Training today={today} split={s.workout_split} plan={s.workout_plan} workouts={workouts} program={prog.error ? null : (prog.data as Program | null) ?? null} programSlot={programSlot} openProgram={openProgram} bodyweight={bw.data ? N(bw.data.kg) : s.weight_start_kg} />;
  } else if (tab === "alimentacao") {
    const date = sp.d && /^\d{4}-\d{2}-\d{2}$/.test(sp.d) ? sp.d : today;
    const from = addDays(date, -6);
    const [items, meals, foods, week, hist, weekDone] = await Promise.all([
      sb.from("meal_items").select("id,slot,name,kcal,protein_g,carbs_g,fat_g").eq("date", date).order("created_at"),
      sb.from("meals").select("slot,done").eq("date", date),
      sb.from("foods").select("id,name,portion,kcal,protein_g,carbs_g,fat_g").order("name"),
      sb.from("meal_items").select("date,slot,kcal,protein_g").gte("date", from).lte("date", date),
      sb.from("meal_items").select("date,slot,name,kcal,protein_g,carbs_g,fat_g").gte("date", addDays(date, -45)).lt("date", date).not("slot", "like", "extra|%").order("date", { ascending: false }).limit(600),
      sb.from("meals").select("date,slot").eq("done", true).gte("date", from).lte("date", date),
    ]);
    const weekEaten = eaten((week.data ?? []) as { date: string; slot: string; kcal: number; protein_g: number }[], new Set((weekDone.data ?? []).map((m) => `${m.date}|${m.slot}`)));
    // Refeições salvas: combinações já registradas (por dia e refeição), sem repetir a mesma combinação.
    const groups = new Map<string, { date: string; slot: string; items: { name: string; kcal: number; protein_g: number; carbs_g: number; fat_g: number }[] }>();
    for (const r of (hist.data ?? []) as { date: string; slot: string; name: string; kcal: number; protein_g: number; carbs_g: number; fat_g: number }[]) { const k = `${r.date}|${r.slot}`; const g = groups.get(k) ?? { date: r.date, slot: r.slot, items: [] }; g.items.push({ name: r.name, kcal: N(r.kcal), protein_g: N(r.protein_g), carbs_g: N(r.carbs_g), fat_g: N(r.fat_g) }); groups.set(k, g); }
    const seen = new Set<string>(), saved = ([...groups.values()] as { date: string; slot: string; items: { name: string; kcal: number; protein_g: number; carbs_g: number; fat_g: number }[] }[]).filter((g) => { const sig = g.slot + "|" + g.items.map((i) => i.name).sort().join("+"); if (seen.has(sig)) return false; seen.add(sig); return true; }).slice(0, 24);
    const days = Array.from({ length: 7 }, (_, i) => addDays(from, i));
    const wk = days.map((d) => { const l = weekEaten.filter((x) => x.date === d); return { date: d, kcal: l.reduce((a, x) => a + N(x.kcal), 0), protein: Math.round(l.reduce((a, x) => a + N(x.protein_g), 0)) }; });
    content = <Nutrition key={date} date={date} today={today} slots={s.meal_slots}
      items={(items.data ?? []).map((i) => ({ ...i, kcal: N(i.kcal), protein_g: N(i.protein_g), carbs_g: N(i.carbs_g), fat_g: N(i.fat_g) }))}
      doneSlots={(meals.data ?? []).filter((m) => m.done).map((m) => m.slot)}
      foods={(foods.data ?? []).map((f) => ({ ...f, kcal: N(f.kcal), protein_g: N(f.protein_g), carbs_g: N(f.carbs_g), fat_g: N(f.fat_g) }))}
      goals={{ kcal: s.kcal_goal, protein: s.protein_goal_g, carbs: s.carbs_goal_g, fat: s.fat_goal_g }} week={wk} saved={saved} />;
  } else {
    const from = addDays(today, -6);
    const [water, sleep, food, weight, doneToday] = await Promise.all([
      sb.from("water_logs").select("date,ml").gte("date", from),
      sb.from("sleep_logs").select("date,hours").gte("date", from),
      sb.from("meal_items").select("slot,kcal,protein_g").eq("date", today),
      sb.from("weight_logs").select("kg").order("date", { ascending: false }).limit(1).maybeSingle(),
      sb.from("meals").select("slot").eq("date", today).eq("done", true),
    ]);
    const foodEaten = eaten((food.data ?? []) as { slot: string; kcal: number; protein_g: number }[], (doneToday.data ?? []).map((m) => m.slot));
    const days = Array.from({ length: 7 }, (_, i) => addDays(from, i));
    const water7 = days.map((d) => ({ date: d, ml: (water.data ?? []).filter((w) => w.date === d).reduce((a, w) => a + w.ml, 0) }));
    const sleep7 = days.map((d) => { const r = (sleep.data ?? []).find((x) => x.date === d); return { date: d, hours: r ? N(r.hours) : null }; });
    content = <BodyToday today={today} waterMl={water7.at(-1)!.ml} waterGoal={s.water_goal_ml} water7={water7}
      split={todaySplit} exercises={(s.workout_plan.days[String(todaySplit.dow)] ?? []).length}
      food={{ kcal: foodEaten.reduce((a, x) => a + N(x.kcal), 0), protein: foodEaten.reduce((a, x) => a + N(x.protein_g), 0), kcalGoal: s.kcal_goal, proteinGoal: s.protein_goal_g }}
      sleepHours={sleep7.at(-1)!.hours} sleep7={sleep7} weightKg={weight.data ? N(weight.data.kg) : s.weight_start_kg} />;
  }

  // Resumo dos 4 setores (sempre visível, leve)
  const [sumW, sumF, sumD, sumKg] = await Promise.all([
    sb.from("water_logs").select("ml").eq("date", today),
    sb.from("meal_items").select("slot,kcal,protein_g").eq("date", today),
    sb.from("meals").select("slot").eq("date", today).eq("done", true),
    sb.from("weight_logs").select("kg").order("date", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const sumKcal = Math.round(eaten((sumF.data ?? []) as { slot: string; kcal: number; protein_g: number }[], (sumD.data ?? []).map((m) => m.slot)).reduce((a, x) => a + N(x.kcal), 0));
  const sumMl = (sumW.data ?? []).reduce((a, w) => a + w.ml, 0);
  const SECT: Record<string, { n: string; title: string; line: string; stat: string; sub: string; icon: string }> = {
    hoje: { n: "01", title: "Hoje", line: "O corpo de hoje: água, sono, comida e treino num relance.", stat: `${(sumMl / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} L`, sub: "água", icon: "M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" },
    treino: { n: "02", title: "Covil", line: "Onde a pantera fica mais forte. Disciplina conquista o impulso.", stat: todaySplit.label, sub: todaySplit.focus || "treino do dia", icon: "M3 10v4M21 10v4M6 7v10M18 7v10M6 12h12" },
    alimentacao: { n: "03", title: "Dieta", line: "Combustível medido. Nada de achismo no prato.", stat: `${sumKcal}`, sub: `de ${s.kcal_goal} kcal`, icon: "M7 3v8a3 3 0 0 0 6 0V3M10 3v18M17 3c-2 2-2 6 0 8v10" },
    peso: { n: "04", title: "Peso", line: "A balança não mente. Tendência acima de um dia ruim.", stat: sumKg.data ? `${N(sumKg.data.kg).toLocaleString("pt-BR")} kg` : "—", sub: s.weight_goal_kg ? `meta ${s.weight_goal_kg} kg` : "último registro", icon: "M5 20h14l-2-12H7zM9 8a3 3 0 0 1 6 0" },
  };
  const cur = SECT[tab] ?? SECT.hoje;

  return (
    <>
      <div className={tab === "treino" ? `war ${onFire ? "war-fire" : ""}` : undefined}>
      {tab === "treino" && onFire && <FireLayer />}
      <header className="rise mb-4">
        <p className="label flex items-center gap-2" style={{ color: "#ff2800" }}><span className="h-1.5 w-1.5 war-pulse" style={{ background: "#ff2800", boxShadow: "0 0 10px #ff2800" }} />Corpo · setor {cur.n}</p>
        <h1 className="font-display text-5xl mt-2">{cur.title}</h1>
        <p className="text-sm text-muted mt-2">{cur.line}</p>
      </header>
      <nav aria-label="Setores do corpo" className="sticky top-0 z-30 -mx-4 px-4 py-2 mb-5 bg-[#050505]/90 backdrop-blur-xl md:static md:mx-0 md:px-0 md:bg-transparent md:backdrop-blur-none">
        <div className="grid grid-cols-4 gap-px bg-white/[.08] border border-white/[.08] rounded-[8px] overflow-hidden">
          {TABS.map(([k]) => { const x = SECT[k], on = tab === k; return (
            <Link key={k} href={`/corpo?aba=${k}`} aria-current={on ? "page" : undefined}
              className={`relative min-w-0 px-2 py-2.5 sm:px-3 sm:py-3 transition-colors ${on ? "bg-[#140303]" : "bg-[#080808] hover:bg-[#0e0e0e]"}`}>
              {on && <span aria-hidden className="absolute left-0 right-0 top-0 h-[2px]" style={{ background: "#ff2800", boxShadow: "0 0 12px #ff2800" }} />}
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={on ? "#ff2800" : "#8a8a8f"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0"><path d={x.icon} /></svg>
                <span className={`label !text-[9px] !tracking-[.14em] truncate ${on ? "!text-white" : ""}`}>{k === "treino" ? "Treino" : x.title}</span>
              </span>
              <span className={`num block text-lg sm:text-2xl leading-none mt-2 truncate ${on ? "text-white" : "text-white/70"}`}>{x.stat}</span>
              <span className="block text-[10px] text-white/45 mt-1 truncate">{x.sub}</span>
            </Link>); })}
        </div>
      </nav>
      {tab === "treino" && warEvent}
      {content}
      <Verse area="corpo" />
      </div>
    </>
  );
}
