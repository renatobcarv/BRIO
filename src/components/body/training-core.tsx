"use client";

import { todayWorkout } from "@/lib/training";

import type { PlanExercise, SplitDay, WorkoutPlan } from "@/lib/settings";
import { dayTitle, programPosition, type PlannedEx, type Program } from "@/lib/training";

import { suggestLoad, type Suggestion } from "@/lib/progression";

export const G = "#ffb21e";
export type DbSet = { exercise: string; set_no: number; reps: number; kg: number; rpe?: number | null };
export type Workout = { id: string; date: string; split_label: string | null; notes: string | null; duration_min: number | null; sets: DbSet[]; planned?: PlannedEx[] | null; week_no?: number | null; phase?: string | null };
export type LSet = { kg: string; reps: string; done: boolean; rpe?: string };
export type Target = PlanExercise & Partial<Pick<PlannedEx, "kg" | "rpe" | "rir" | "notes">>;
export type LEx = { name: string; target?: Target; sets: LSet[] };
export type Session = { date: string; label: string; exercises: LEx[]; notes: string; startedAt: number | null; editingId?: string;
  programId?: string | null; weekNo?: number | null; phase?: string | null; planned?: PlannedEx[] | null };

export const e1rm = (kg: number, reps: number) => (reps <= 0 ? 0 : reps === 1 ? kg : kg * (1 + Math.min(reps, 12) / 30));
export const volume = (sets: DbSet[]) => sets.filter((s) => !isTimed(s.exercise)).reduce((a, s) => a + Number(s.kg) * s.reps, 0);
export const firstNum = (s: string) => Number((s.match(/\d+/) ?? ["0"])[0]);
/** Exercícios medidos em tempo (cardio, mobilidade): o campo "reps" guarda minutos. */
export const isTimed = (name: string, muscle?: string) => muscle === "cardio" || /cardio|bike|bicicleta|caminhada|corrida|esteira|el[ií]ptico|mobilidade|alongamento|remo erg|escada/i.test(name);
export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
export const ORDER = [1, 2, 3, 4, 5, 6, 0];

/** Histórico de um exercício (séries de força) para a sugestão de carga. */
export function historyOf(workouts: Workout[], name: string, beforeDate: string) {
  return workouts.filter((w) => w.date <= beforeDate).flatMap((w) => w.sets.filter((x) => x.exercise.toLowerCase() === name.toLowerCase()).map((x) => ({ date: w.date, kg: Number(x.kg), reps: x.reps, rpe: x.rpe ?? null })));
}
export function suggestionFor(workouts: Workout[], t: Target, date: string, deload: boolean): Suggestion | null {
  if (isTimed(t.name, (t as { muscle?: string }).muscle)) return null;
  return suggestLoad(historyOf(workouts, t.name, date), { reps: t.reps, rpe: t.rpe ?? null }, { deload });
}
export function lastFor(workouts: Workout[], name: string, beforeDate: string) {
  const w = workouts.find((w) => w.date <= beforeDate && w.sets.some((s) => s.exercise.toLowerCase() === name.toLowerCase()));
  return w ? { date: w.date, sets: w.sets.filter((s) => s.exercise.toLowerCase() === name.toLowerCase()) } : null;
}

export type Ctx = { programId: string; weekNo: number; phase: string; deload?: boolean } | null;
export function buildSession(date: string, day: SplitDay, plan: Target[], workouts: Workout[], ctx: Ctx = null): Session {
  return {
    date, label: [day.label, day.focus, ctx ? `S${ctx.weekNo}` : ""].filter(Boolean).join(" · "), notes: "", startedAt: null,
    programId: ctx?.programId ?? null, weekNo: ctx?.weekNo ?? null, phase: ctx?.phase ?? null,
    planned: ctx ? (plan as PlannedEx[]).map((p) => ({ ...p })) : null,
    exercises: plan.map((p) => {
      const last = lastFor(workouts, p.name, date);
      const sug = p.kg == null ? suggestionFor(workouts, p, date, !!ctx?.deload) : null;
      const kg = p.kg != null ? String(p.kg) : sug ? String(sug.kg) : last?.sets[0] ? String(last.sets[0].kg) : "";
      return { name: p.name, target: p, sets: Array.from({ length: p.sets }, (_, i) => ({
        kg: p.kg != null || sug ? kg : last?.sets[i] ? String(last.sets[i].kg) : last?.sets.at(-1) ? String(last.sets.at(-1)!.kg) : "", reps: String(firstNum(p.reps) || ""), done: false, rpe: "" })) };
    }),
  };
}
/** Plano do dia: fase atual do programa ativo, senão o plano semanal simples. */
export function dayPlan(d: number, plan: WorkoutPlan, program: Program | null, today: string): { list: Target[]; ctx: Ctx; title?: string } {
  if (program) {
    const pos = programPosition(program, today);
    const ph = program.phases[pos.phaseIndex];
    if (pos.status === "andamento" && ph) return { list: ph.days[String(d)] ?? [], title: dayTitle(ph, String(d)), ctx: { programId: program.id, weekNo: pos.week, phase: ph.name, deload: ph.kind === "deload" } };
  }
  const list = plan.days[String(d)] ?? [];
  return { list, ctx: null, title: todayWorkout(d, plan.days as never, null, today).title };
}

/* ───────────── Cronômetro de descanso ───────────── */
