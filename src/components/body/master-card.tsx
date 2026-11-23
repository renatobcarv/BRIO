"use client";
import Image from "next/image";
import { REFS } from "@/lib/coach";
import { suggestAdjustments, weekNutrition, weightRate, type DietGoal } from "@/lib/master";
import { masterFor, type Workout } from "./training-core";
import { WeekEditor } from "./week-editor";
import { absence } from "@/lib/mestre";
import type { Program } from "@/lib/training";

const A = "#ffb21e";
const ORDERS = {
  treino: ["Cumpra o combinado.", "Abra o treino de hoje. Comece pelo aquecimento e execute uma série de cada vez.", "Abrir treino de hoje"],
  andamento: ["Termine o que começou.", "Retome a sessão e mantenha a técnica até a última série.", "Retomar sessão"],
  feito: ["Você entregou.", "Treino registrado. Agora cumpra a próxima parte do plano: recupere bem.", "Ver treino de hoje"],
  descanso: ["Recuperação é tarefa.", "Hoje o plano pede descanso. Cuide do sono, da alimentação e chegue pronto para a próxima sessão.", "Ver semana de treino"],
} as const;

export type MasterDay = keyof typeof ORDERS;
export type Nutrition = { goal: DietGoal; kcal: number; weights: { date: string; kg: number }[] };

/** Relatório do Mestre: o que muda nesta semana no treino e na alimentação, e por quê (com estudos). */
export function MasterCard({ program, workouts, today, nutrition, day, onViewDay }: { program: Program; workouts: Workout[]; today: string; nutrition?: Nutrition; day: MasterDay; onViewDay: () => void }) {
  const m = masterFor(program, today, workouts);
  if (!m) return null;
  const rate = nutrition ? weightRate(nutrition.weights, today) : null;
  const nut = nutrition && nutrition.kcal > 0 ? weekNutrition(nutrition.goal, m.phase.kind, m.wave, rate, nutrition.kcal) : null;
  const fb = m.feedback;
  const lastDate = workouts[0]?.date, away = lastDate ? absence(Math.round((Date.parse(today) - Date.parse(lastDate)) / 864e5)) : null;
  const done = fb ? [...fb.muscles.values()].reduce((a, x) => a + x.done, 0) : 0, planned = fb ? [...fb.muscles.values()].reduce((a, x) => a + x.planned, 0) : 0;
  const [command, instruction, action] = ORDERS[day];
  const percent = planned > 0 ? Math.round((done / planned) * 100) : null;
  const returning = day === "treino" && away;
  return (
    <section className="hunt-card rise mt-4 min-w-0 overflow-hidden !border-[#a875303d]" aria-label="Briefing do Mestre">
      <header className="relative isolate flex min-h-56 flex-col justify-end overflow-hidden p-4 sm:p-6">
        <Image src="/cards/mestre.webp" fill alt="" unoptimized sizes="(max-width: 768px) 100vw, 700px" className="-z-20 object-cover object-[68%_37%] sm:object-[center_37%]" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#080807_2%,#080807eb_29%,#08080728_73%),linear-gradient(0deg,#101011_1%,transparent_60%)]" />
        <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#ffd084]">O Mestre · Semana {m.week}</p>
        <h2 className="mt-2 max-w-[65%] text-balance font-display text-[clamp(1.65rem,4vw,3rem)] font-bold uppercase leading-[.98] tracking-tight text-white">{m.wave ?? m.phase.name}</h2>
      </header>
      <div className="space-y-4 px-4 pb-5 sm:px-6">
        <div className="rounded-xl border border-[#ffb21e55] border-l-[3px] border-l-[#ffb21e] bg-[linear-gradient(125deg,#2b200f,#141311_70%)] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#ffcb68]">{returning ? "Ordem de retorno" : "Ordem do dia"}</p>
          <p className="mt-1.5 font-display text-2xl font-bold uppercase leading-tight text-white">{command}</p>
          <p className="mt-1.5 max-w-prose text-sm leading-snug text-white/80">{returning || instruction}</p>
          <a href="#tr-hoje" onClick={onViewDay} className="press mt-4 inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-md bg-[#ffc157] px-4 py-2 text-center text-sm font-bold text-[#211400] hover:bg-[#ffd185] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffc157] sm:w-auto">
            {action}<span aria-hidden="true">↓</span>
          </a>
        </div>
        {fb && (
          <section className="rounded-xl border border-white/10 bg-black/25 p-4" aria-label="Execução da semana passada">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/65">Execução da semana passada</p>
            <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="text-sm text-white/75"><strong className="text-lg text-white">{fb.sessions}</strong> {fb.sessions === 1 ? "treino" : "treinos"} · {done}/{planned} séries planejadas</p>
              {percent !== null && <strong className="num text-2xl text-[#ffcb68]">{percent}%</strong>}
            </div>
            {percent !== null && (
              <div aria-hidden="true" className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[#ffb21e]" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
              </div>
            )}
          </section>
        )}
        <section aria-label="Plano da semana">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#ffcb68]">Plano da semana</p>
          <ul className="mt-2 divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-black/20">
            {m.changes.map((c, i) => (
              <li key={i} className="flex items-baseline gap-3 px-3 py-2.5 text-[13.5px] leading-snug text-white/85">
                <span aria-hidden="true" className="num text-xs text-[#ffcb68]">{String(i + 1).padStart(2, "0")}</span><span>{c.text}</span>
              </li>
            ))}
          </ul>
        </section>
        {nut && <section aria-label="Alimentação desta semana" className="rounded-xl border border-white/10 bg-white/[.035] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/65">Alimentação desta semana</p>
          <p className="mt-1 text-xl font-bold">{nut.kcal.toLocaleString("pt-BR")} kcal/dia{nut.adj ? <span className="ml-2 text-[13px] font-semibold" style={{ color: A }}>{nut.adj > 0 ? "+" : ""}{nut.adj}</span> : null}</p>
          <ul className="mt-2 grid gap-1.5">{nut.tips.map((t, i) => <li key={i} className="text-[13px] text-white/75">• {t.text}</li>)}</ul>
        </section>}
        <div>
          <WeekEditor programId={program.id} week={m.week} days={m.days} adjusted={!!m.adjusted} suggestions={m.adjusted ? [] : suggestAdjustments(m.days, workouts, { programId: program.id, kind: m.phase.kind, week: m.week, weekInPhase: 1, today })} />
          <details className="mt-3 text-white/70">
            <summary className="min-h-10 cursor-pointer py-2 text-xs underline underline-offset-2">Estudos por trás do plano</summary>
            <ul className="mt-1 grid gap-1.5">
              {[...new Set([...m.changes, ...(nut?.tips ?? [])].map((c) => c.ref))].map((r) => <li key={r} className="text-xs leading-snug">{REFS[r]}</li>)}
            </ul>
          </details>
        </div>
      </div>
    </section>
  );
}
