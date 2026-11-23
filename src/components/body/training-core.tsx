"use client";

import { masterWeek } from "@/lib/master";
import { warmup } from "@/lib/gym-tools";
import { todayWorkout } from "@/lib/training";

import type { PlanExercise, SplitDay, WorkoutPlan } from "@/lib/settings";
import { dayTitle, programPosition, type PlannedEx, type Program } from "@/lib/training";

import { nextSetKg, setLoads, starterLoad, suggestLoad, type Suggestion } from "@/lib/progression";

export const G = "#ffb21e";
export type DbSet = { exercise: string; set_no: number; reps: number; kg: number; rpe?: number | null };
export type Workout = { id: string; date: string; split_label: string | null; notes: string | null; duration_min: number | null; sets: DbSet[]; planned?: PlannedEx[] | null; program_id?: string | null; week_no?: number | null; phase?: string | null };
/** auto: a carga veio do app (pode ser reajustada ao vivo); vira false quando você digita. */
export type LSet = { kg: string; reps: string; done: boolean; rpe?: string; auto?: boolean; warm?: boolean };
export type Target = PlanExercise & Partial<Pick<PlannedEx, "kg" | "rpe" | "rir" | "notes">>;
export type LEx = { name: string; target?: Target; sets: LSet[]; loadNote?: string };
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
  return suggestLoad(historyOf(workouts, t.name, date), { reps: t.reps, rpe: t.rpe ?? null }, { deload, today: date });
}
export function lastFor(workouts: Workout[], name: string, beforeDate: string) {
  const w = workouts.find((w) => w.date <= beforeDate && w.sets.some((s) => s.exercise.toLowerCase() === name.toLowerCase()));
  return w ? { date: w.date, sets: w.sets.filter((s) => s.exercise.toLowerCase() === name.toLowerCase()) } : null;
}

export type Ctx = { programId: string; weekNo: number; phase: string; deload?: boolean } | null;
const WARM_RE = /agachamento livre|agachamento frontal|agachamento pausado|supino reto com barra|supino inclinado com barra|levantamento terra|terra\b|desenvolvimento com barra|remada curvada com barra/i;
export function buildSession(date: string, day: SplitDay, plan: Target[], workouts: Workout[], ctx: Ctx = null, bodyweight: number | null = null): Session {
  const warmed = new Set<string>();
  return {
    date, label: [day.label, day.focus, ctx ? `S${ctx.weekNo}` : ""].filter(Boolean).join(" · "), notes: "", startedAt: null,
    programId: ctx?.programId ?? null, weekNo: ctx?.weekNo ?? null, phase: ctx?.phase ?? null,
    planned: ctx ? (plan as PlannedEx[]).map((p) => ({ ...p })) : null,
    exercises: plan.map((p) => {
      const last = lastFor(workouts, p.name, date), timed = isTimed(p.name, (p as { muscle?: string }).muscle);
      const sug = p.kg == null && !timed ? suggestionFor(workouts, p, date, !!ctx?.deload) : null;
      const starter = !timed && p.kg == null && !sug && !last ? starterLoad(p.name, bodyweight) : null;
      const base = p.kg != null ? p.kg : sug ? sug.kg : last?.sets[0] ? Math.floor((Number(last.sets[0].kg) * 0.9) / 2.5) * 2.5 : starter ?? 0;
      const reps = firstNum(p.reps) || 8;
      const loads = timed ? [] : setLoads(base, p.sets, reps);
      const note = timed ? undefined : p.kg != null ? "Carga definida no plano" : sug ? `Sugerida: ${sug.reason}` : last ? "10% abaixo da última carga para calibrar: o app ajusta após a 1ª série" : starter ? "Carga inicial estimada pelo seu peso: comece leve, o app ajusta após a 1ª série" : undefined;
      const work = Array.from({ length: p.sets }, (_, i) => ({
        kg: timed ? (last?.sets[i] ? String(last.sets[i].kg) : "") : loads[i] ? String(loads[i]) : "", reps: String(firstNum(p.reps) || ""), done: false, rpe: "", auto: !timed && !!loads[i] }));
      // Aquecimento automático antes dos levantamentos principais com barra (até ~90% da carga de trabalho).
      const isMain = !timed && WARM_RE.test(p.name) && !warmed.has(p.name) && (loads[0] ?? 0) >= 40;
      if (isMain) warmed.add(p.name);
      const warm = isMain ? warmup(loads[0]).filter((w) => w.kg < loads[0]).map((w) => ({ kg: String(w.kg), reps: String(w.reps), done: false, rpe: "", auto: false, warm: true })) : [];
      return { name: p.name, target: p, loadNote: note, sets: [...warm, ...work] };
    }),
  };
}
/** Plano do dia: fase atual do programa ativo, senão o plano semanal simples. */
/** Semana do programa ajustada pelo Mestre (memo por programa+semana+registros). */
const masterCache = new WeakMap<Program, WeakMap<Workout[], Map<number, ReturnType<typeof masterWeek>>>>();
export function masterFor(program: Program, today: string, workouts: Workout[]) {
  const pos = programPosition(program, today), ph = program.phases[pos.phaseIndex];
  if (pos.status !== "andamento" || !ph) return null;
  const before = program.phases.slice(0, pos.phaseIndex).reduce((a, f) => a + f.weeks, 0);
  const ov = program.week_overrides?.[String(pos.week)];
  let byHistory = masterCache.get(program);
  if (!byHistory) { byHistory = new WeakMap(); masterCache.set(program, byHistory); }
  let byWeek = byHistory.get(workouts);
  if (!byWeek) { byWeek = new Map(); byHistory.set(workouts, byWeek); }
  let m = byWeek.get(pos.week);
  if (!m) {
    const ctx = { programId: program.id, kind: ph.kind, week: pos.week, weekInPhase: pos.week - before };
    const base = masterWeek(ph.days, workouts, ctx);
    m = ov ? { ...base, days: ov.days, changes: [
      { text: `Semana ajustada por você${ov.note ? `: ${ov.note}` : ""}. O Mestre respeita.`, ref: "rpe" },
      ...base.changes.filter((c) => c.ref === "overload"),
    ] } : base;
    byWeek.set(pos.week, m);
  }
  return { ...m, phase: ph, week: pos.week, adjusted: !!ov };
}
export function dayPlan(d: number, plan: WorkoutPlan, program: Program | null, today: string, workouts: Workout[] = []): { list: Target[]; ctx: Ctx; title?: string } {
  if (program) {
    const pos = programPosition(program, today);
    const ph = program.phases[pos.phaseIndex];
    if (pos.status === "andamento" && ph) {
      const m = masterFor(program, today, workouts);
      return { list: m?.days[String(d)] ?? ph.days[String(d)] ?? [], title: dayTitle(ph, String(d)), ctx: { programId: program.id, weekNo: pos.week, phase: ph.name, deload: ph.kind === "deload" } };
    }
  }
  const list = plan.days[String(d)] ?? [];
  return { list, ctx: null, title: todayWorkout(d, plan.days as never, null, today).title };
}

/* ───────────── Cronômetro de descanso ───────────── */

/** Depois de uma série feita com RPE, recalcula as próximas séries automáticas do mesmo exercício. */
export function liveAdjust(ex: LEx, doneIdx: number): LEx {
  const d = ex.sets[doneIdx], rpe = Number(String(d?.rpe ?? "").replace(",", "."));
  if (!d || d.warm || !rpe || isTimed(ex.name)) return ex;
  const reps = firstNum(ex.target?.reps ?? d.reps) || Number(d.reps) || 8;
  return { ...ex, sets: ex.sets.map((x, j) => {
    if (j <= doneIdx || x.done || x.warm || x.auto === false) return x;
    const kg = nextSetKg({ kg: Number(String(d.kg).replace(",", ".")), reps: Number(d.reps), rpe }, { reps, rpe: ex.target?.rpe ?? 8 }, Number(String(x.kg).replace(",", ".")) || 0);
    return { ...x, kg: kg ? String(kg) : x.kg, auto: true };
  }) };
}
