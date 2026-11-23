"use client";






import { useState, useTransition } from "react";

import { updateSettings } from "@/app/settings-actions";

import { Field, n } from "@/components/kit";
import { weekdayShort } from "@/lib/date";
import type { PlanExercise, SplitDay, WorkoutPlan } from "@/lib/settings";











import { ORDER } from "./training-core";

export function PlanEditor({ split, plan, onDone }: { split: SplitDay[]; plan: WorkoutPlan; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [days, setDays] = useState(() => ORDER.map((d) => split.find((x) => x.dow === d) ?? { dow: d, label: "Off", focus: "" }));
  const [ex, setEx] = useState<Record<string, PlanExercise[]>>(() => Object.fromEntries(ORDER.map((d) => [String(d), plan.days[String(d)] ?? []])));
  const [prs, setPrs] = useState(plan.prs.join(", "));
  const [sel, setSel] = useState(1);
  const di = days.findIndex((d) => d.dow === sel), day = days[di], list = ex[String(sel)] ?? [];
  const setList = (l: PlanExercise[]) => setEx({ ...ex, [String(sel)]: l });
  const upd = (i: number, p: Partial<PlanExercise>) => setList(list.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const move = (i: number, d: number) => { const l = [...list]; [l[i], l[i + d]] = [l[i + d], l[i]]; setList(l); };
  return (
    <div className="grid gap-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {ORDER.map((d) => <button key={d} className="chip shrink-0" aria-pressed={sel === d} onClick={() => setSel(d)}>{weekdayShort[d]} · {days.find((x) => x.dow === d)?.label}</button>)}
      </div>
      <div className="grid grid-cols-[5rem_1fr] gap-2">
        <Field label="Rótulo"><input className="field" value={day.label} onChange={(e) => setDays(days.map((x, j) => (j === di ? { ...x, label: e.target.value } : x)))} /></Field>
        <Field label="Foco"><input className="field" value={day.focus} onChange={(e) => setDays(days.map((x, j) => (j === di ? { ...x, focus: e.target.value } : x)))} /></Field>
      </div>
      <div>
        <div className="grid grid-cols-[1fr_3rem_4rem_3.5rem_auto] gap-1.5 label mb-1"><span>Exercício</span><span>Sér.</span><span>Reps</span><span>Desc.</span><span className="w-[6.5rem]" /></div>
        {list.map((x, i) => (
          <div key={i} className="grid grid-cols-[1fr_3rem_4rem_3.5rem_auto] gap-1.5 mt-1.5">
            <input className="field !px-2 !min-h-11" value={x.name} onChange={(e) => upd(i, { name: e.target.value })} aria-label="Exercício" />
            <input className="field !px-1 !min-h-11 text-center num" inputMode="numeric" value={x.sets} onChange={(e) => upd(i, { sets: Math.max(1, Math.round(n(e.target.value))) })} aria-label="Séries" />
            <input className="field !px-1 !min-h-11 text-center" value={x.reps} onChange={(e) => upd(i, { reps: e.target.value })} aria-label="Repetições" />
            <input className="field !px-1 !min-h-11 text-center num" inputMode="numeric" value={x.rest} onChange={(e) => upd(i, { rest: Math.round(n(e.target.value)) })} aria-label="Descanso em segundos" />
            <div className="flex">
              <button className="btn !px-2 !min-h-11" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Subir">↑</button>
              <button className="btn !px-2 !min-h-11" disabled={i === list.length - 1} onClick={() => move(i, 1)} aria-label="Descer">↓</button>
              <button className="btn !px-2 !min-h-11 text-muted" onClick={() => setList(list.filter((_, j) => j !== i))} aria-label="Remover">✕</button>
            </div>
          </div>
        ))}
        <button className="btn w-full mt-2" onClick={() => setList([...list, { name: "Novo exercício", sets: 3, reps: "10", rest: 90 }])}>+ Exercício</button>
        <p className="text-xs text-faint mt-1">Descanso em segundos. Deixe a lista vazia para dia de descanso.</p>
      </div>
      <Field label="Recordes acompanhados" hint="Separe por vírgula. Ex.: Agachamento, Supino, Levantamento terra">
        <input className="field" value={prs} onChange={(e) => setPrs(e.target.value)} /></Field>
      <button className="btn btn-accent" disabled={pending} onClick={() => start(async () => {
        await updateSettings({ workout_split: days, workout_plan: { days: Object.fromEntries(Object.entries(ex).map(([k, v]) => [k, v.filter((y) => y.name.trim())])), prs: prs.split(",").map((p) => p.trim()).filter(Boolean) } });
        onDone();
      })}>{pending ? "Salvando…" : "Salvar plano"}</button>
    </div>
  );
}

/* ───────────── Tela ───────────── */
