import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Training } from "@/components/body/training";
import { ProgramView } from "@/components/body/program";
import { EventCard } from "@/components/events/event-ui";
import { computeEvents } from "@/lib/events";
import type { Muscle, Program } from "@/lib/training";
import type { Settings } from "@/lib/settings";

const N = (v: unknown) => Number(v) || 0;

/** Carrega e monta a tela de treino (usada em /treino e no setor do Corpo). */
export async function loadTrainingView(sb: SupabaseClient, s: Settings, today: string, openProgram: boolean) {
    const q = (cols: string) => sb.from("workouts").select(cols).order("date", { ascending: false }).order("created_at", { ascending: false }).limit(400);
    const bw = await sb.from("weight_logs").select("kg").order("date", { ascending: false }).limit(1).maybeSingle();
    // Para o Mestre ajustar a alimentação: pesos das últimas 3 semanas e o plano alimentar.
    const [wl, dp] = await Promise.all([
      sb.from("weight_logs").select("date,kg").gte("date", new Date(Date.parse(today + "T12:00:00Z") - 21 * 864e5).toISOString().slice(0, 10)),
      sb.from("diet_plans").select("goal,kcal,profile").maybeSingle(),
    ]);
    const nutrition = { goal: (dp.data?.goal ?? "manter") as "perder" | "manter" | "ganhar" | "recomp", kcal: dp.data?.kcal ?? s.kcal_goal ?? 0, weights: (wl.data ?? []).map((w) => ({ date: w.date as string, kg: N(w.kg) })), sex: ((dp.data?.profile as { sex?: string } | null)?.sex === "f" ? "f" : "m") as "m" | "f" };
    const all = await Promise.all([
      q("id,date,split_label,notes,duration_min,planned,program_id,week_no,phase,workout_sets(exercise,set_no,reps,kg,rpe)"),
      sb.from("training_programs").select("*").eq("active", true).maybeSingle(),
    ]);
    let res = all[0]; const prog = all[1];
    // Sem a migração de periodização: usa as colunas antigas.
    if (res.error) res = await q("id,date,split_label,notes,duration_min,workout_sets(exercise,set_no,reps,kg)");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = res.data as any[] | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const workouts = (data ?? []).map((w: any) => ({ id: w.id, date: w.date, split_label: w.split_label, notes: w.notes, duration_min: w.duration_min,
      planned: w.planned, program_id: w.program_id, week_no: w.week_no, phase: w.phase,
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
          overrides={((s as unknown as { exercise_muscles?: Record<string, Muscle> }).exercise_muscles) ?? {}} sessionsDone={doneMap} workouts={workouts} bodyweight={bw.data ? N(bw.data.kg) : s.weight_start_kg} />;
    const evs = computeEvents({ today, travel: s.travel ?? [], programs: (progs.error ? [] : progs.data ?? []) as Program[], proteinGoal: s.protein_goal_g, meals: [], sleep: [],
      workouts: workouts.map((w: { date: string; sets: { exercise: string; kg: number; reps: number; rpe?: number | null }[] }) => ({ date: w.date, sets: w.sets })) });
    const hot = evs.find((e) => (e.stage === "ativo" || e.stage === "contagem") && (e.type === "hell_week" || e.type === "judgment" || e.type === "genesis"));
    const onFire = !!evs.find((e) => e.type === "hell_week" && (e.stage === "ativo" || e.stage === "contagem"));
    const warEvent = hot ? <Link href="/eventos" className="block mb-4"><EventCard e={hot} compact /></Link> : null;
    const content = <Training today={today} split={s.workout_split} plan={s.workout_plan} workouts={workouts} program={prog.error ? null : (prog.data as Program | null) ?? null} programSlot={programSlot} openProgram={openProgram} bodyweight={bw.data ? N(bw.data.kg) : s.weight_start_kg} nutrition={nutrition} />;
  return { content, warEvent, onFire, workouts: workouts as { date: string; sets: { exercise: string; kg: number; reps: number }[] }[], bodyweight: bw.data ? N(bw.data.kg) : s.weight_start_kg };
}
