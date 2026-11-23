"use client";
import { useState } from "react";
import { REFS } from "@/lib/coach";
import { weekNutrition, weightRate, type DietGoal } from "@/lib/master";
import { masterFor, type Workout } from "./training-core";
import { WeekEditor } from "./week-editor";
import { absence } from "@/lib/mestre";
import type { Program } from "@/lib/training";

const A = "#ffb21e";
export type Nutrition = { goal: DietGoal; kcal: number; weights: { date: string; kg: number }[] };

/** Relatório do Mestre: o que muda nesta semana no treino e na alimentação, e por quê (com estudos). */
export function MasterCard({ program, workouts, today, nutrition }: { program: Program; workouts: Workout[]; today: string; nutrition?: Nutrition }) {
  const [open, setOpen] = useState(false);
  const m = masterFor(program, today, workouts);
  if (!m) return null;
  const rate = nutrition ? weightRate(nutrition.weights, today) : null;
  const nut = nutrition && nutrition.kcal > 0 ? weekNutrition(nutrition.goal, m.phase.kind, m.wave, rate, nutrition.kcal) : null;
  const fb = m.feedback;
  const lastDate = workouts[0]?.date, away = lastDate ? absence(Math.round((Date.parse(today) - Date.parse(lastDate)) / 864e5)) : null;
  const done = fb ? [...fb.muscles.values()].reduce((a, x) => a + x.done, 0) : 0, planned = fb ? [...fb.muscles.values()].reduce((a, x) => a + x.planned, 0) : 0;
  return (
    <section className="hunt-card rise p-5 mt-4 relative overflow-hidden">
      <div aria-hidden className="absolute -right-12 -top-12 h-44 w-44 rounded-full" style={{ background: `radial-gradient(circle, ${A}26, transparent 70%)` }} />
      <div className="relative flex items-start gap-3">
        <span className="grid place-items-center h-11 w-11 shrink-0 rounded-full border font-display text-lg" style={{ borderColor: A, color: A }}>M</span>
        <div className="min-w-0 flex-1">
          <p className="label" style={{ color: A }}>O Mestre · semana {m.week}</p>
          <p className="font-display text-2xl leading-tight">{m.wave ?? m.phase.name}</p>
          {fb?.trained && <p className="text-[12px] text-white/55 mt-0.5">Semana passada: {fb.sessions} treino(s) · {done}/{planned} séries planejadas{planned ? ` (${Math.round((done / planned) * 100)}%)` : ""}</p>}
        </div>
      </div>
      {away && <p className="relative mt-3 text-[13.5px] rounded-[12px] p-3 border" style={{ borderColor: A + "44" }}>{away}</p>}
      <ul className="relative mt-3 grid gap-2">
        {m.changes.map((c, i) => <li key={i} className="flex gap-2 text-[13.5px] leading-snug"><span style={{ color: A }}>›</span><span>{c.text}</span></li>)}
      </ul>
      {nut && <div className="relative mt-4 rounded-[14px] p-3 bg-white/[.04]">
        <p className="text-[12px] text-white/50">Alimentação desta semana</p>
        <p className="text-[20px] font-bold">{nut.kcal.toLocaleString("pt-BR")} kcal/dia{nut.adj ? <span className="text-[13px] font-semibold ml-2" style={{ color: A }}>{nut.adj > 0 ? "+" : ""}{nut.adj}</span> : null}</p>
        <ul className="mt-1 grid gap-1">{nut.tips.map((t, i) => <li key={i} className="text-[12.5px] text-white/70">• {t.text}</li>)}</ul>
      </div>}
      <WeekEditor programId={program.id} week={m.week} days={m.days} adjusted={!!m.adjusted} />
      <button className="relative text-[12px] text-white/50 mt-3 underline underline-offset-2" onClick={() => setOpen(!open)}>{open ? "Esconder" : "Ver"} os estudos por trás</button>
      {open && <ul className="relative mt-2 grid gap-1.5">
        {[...new Set([...m.changes, ...(nut?.tips ?? [])].map((c) => c.ref))].map((r) => <li key={r} className="text-[11.5px] text-white/50 leading-snug">{REFS[r]}</li>)}
      </ul>}
    </section>
  );
}
