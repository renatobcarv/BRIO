"use client";

import { ExerciseThumb } from "@/components/body/exercise-media";
import { SwapSheet } from "@/components/body/exercise-swap";

import { CardioPanel } from "@/components/body/cardio";

import { useEffect, useRef, useState, useTransition } from "react";
import { saveWorkout } from "@/app/(app)/corpo/actions";

import { Empty } from "@/components/ui";
import { fmt, n } from "@/components/kit";
import { addDays, dow, shortDate, weekdayShort } from "@/lib/date";
import type { SplitDay, WorkoutPlan } from "@/lib/settings";
import { type Program } from "@/lib/training";










import { G, ORDER, buildSession, dayPlan, liveAdjust, e1rm, isTimed, lastFor, mmss, type LSet, type Session, type Workout } from "./training-core";

export function RestTimer({ until, onDone, onAdd }: { until: number; onDone: () => void; onAdd: (s: number) => void }) {
  const [now, setNow] = useState(Date.now());
  const fired = useRef(false);
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(id); }, []);
  const left = Math.max(0, Math.ceil((until - now) / 1000));
  useEffect(() => {
    if (left === 0 && !fired.current) { fired.current = true; try { navigator.vibrate?.([200, 100, 200]); } catch {} setTimeout(onDone, 1500); }
  }, [left, onDone]);
  return (
    <div className="fixed left-3 right-3 md:left-auto md:right-6 md:w-80 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] md:bottom-6 z-40 sheet-up">
      <div className="rounded-[8px] border border-white/10 bg-[#111113]/95 backdrop-blur-xl p-3 flex items-center gap-3 shadow-2xl">
        <div className="flex-1"><p className="label">{left ? "Descanso" : "Bora!"}</p><p className="num text-3xl" style={{ color: left ? G : "#ffb21e" }}>{mmss(left)}</p></div>
        <button className="btn !px-3" onClick={() => onAdd(15)}>+15s</button>
        <button className="btn" onClick={onDone}>Pular</button>
      </div>
    </div>
  );
}

/* ───────────── Registro da sessão ───────────── */
export function Logger({ s, setS, workouts, onSaved, split, plan, program }: {
  s: Session; setS: (s: Session | null) => void; workouts: Workout[]; onSaved: () => void; split: SplitDay[]; plan: WorkoutPlan; program: Program | null;
}) {
  const [pending, start] = useTransition();
  const [rest, setRest] = useState<number | null>(null);
  const [newEx, setNewEx] = useState("");
  const [swap, setSwap] = useState<number | null>(null);
  const set = (p: Partial<Session>) => setS({ ...s, ...p });
  const updSet = (ei: number, si: number, p: Partial<LSet>) =>
    set({ exercises: s.exercises.map((e, i) => (i !== ei ? e : { ...e, sets: e.sets.map((x, j) => (j === si ? { ...x, ...p } : x)) })), startedAt: s.startedAt ?? Date.now() });
  const toggle = (ei: number, si: number) => {
    const x = s.exercises[ei].sets[si], on = !x.done;
    // Marcou como feita: as próximas séries automáticas se ajustam pelo RPE desta.
    set({ exercises: s.exercises.map((e, i) => { if (i !== ei) return e; const ne = { ...e, sets: e.sets.map((y, j) => (j === si ? { ...y, done: on } : y)) }; return on ? liveAdjust(ne, si) : ne; }), startedAt: s.startedAt ?? Date.now() });
    const r = s.exercises[ei].target?.rest ?? 90;
    if (on && r > 0) setRest(Date.now() + r * 1000);
  };
  const doneSets = s.exercises.flatMap((e) => e.sets.filter((x) => x.done));
  const total = s.exercises.reduce((a, e) => a + e.sets.length, 0);
  const vol = s.exercises.reduce((a, e) => a + e.sets.filter((x) => x.done).reduce((b, x) => b + n(x.kg) * n(x.reps), 0), 0);

  const finish = () => start(async () => {
    const pick = (x: LSet) => (doneSets.length ? x.done : n(x.reps) > 0);
    const sets = s.exercises.flatMap((e) => e.sets.filter(pick).map((x) => ({ exercise: e.name, kg: n(x.kg), reps: Math.round(n(x.reps)), rpe: x.rpe && n(x.rpe) ? Math.min(10, Math.max(1, n(x.rpe))) : null })));
    const duration = s.startedAt && !s.editingId ? Math.round((Date.now() - s.startedAt) / 60000) : null;
    await saveWorkout({ date: s.date, split_label: s.label, notes: s.notes, duration_min: duration, sets,
      program_id: s.programId ?? null, week_no: s.weekNo ?? null, phase: s.phase ?? null, planned: s.planned ?? null }, s.editingId);
    onSaved();
  });

  const loadDay = (d: number) => {
    const day = split.find((x) => x.dow === d) ?? { dow: d, label: "Treino", focus: "" };
    const { list, ctx } = dayPlan(d, plan, program, s.date, workouts);
    setS(buildSession(s.date, day, list, workouts, ctx));
  };

  return (
    <>
      {!s.editingId && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {ORDER.map((d) => { const day = split.find((x) => x.dow === d); const cnt = dayPlan(d, plan, program, s.date, workouts).list.length;
            return <button key={d} className="chip shrink-0" onClick={() => { if (!doneSets.length || confirm("Trocar o treino? As séries marcadas serão perdidas.")) loadDay(d); }}
              aria-pressed={s.label.startsWith(`${day?.label} ·`) && (day?.dow === dow(s.date) || cnt > 0)}>{weekdayShort[d]} · {day?.label ?? "—"}</button>; })}
        </div>
      )}
      <div className="flex items-center gap-3 mt-4">
        <div className="flex-1">
          {s.editingId && <p className="label text-gold">Editando sessão de {shortDate(s.date)}</p>}
          <input className="font-display text-2xl bg-transparent outline-none w-full" value={s.label} onChange={(e) => set({ label: e.target.value })} aria-label="Nome do treino" />
          <p className="text-sm text-muted">{doneSets.length}/{total} séries · volume {Math.round(vol).toLocaleString("pt-BR")} kg</p>
        </div>
        {s.editingId && <input type="date" className="field !w-40" value={s.date} onChange={(e) => set({ date: e.target.value })} aria-label="Data" />}
      </div>

      <div className="grid gap-3 mt-4">
        {s.exercises.length === 0 && <Empty>Dia de descanso. Adicione um exercício se for treinar mesmo assim.</Empty>}
        {s.exercises.map((e, ei) => {
          const last = lastFor(workouts.filter((w) => w.id !== s.editingId), e.name, s.editingId ? addDays(s.date, -1) : s.date);
          const best = Math.max(0, ...e.sets.map((x) => e1rm(n(x.kg), n(x.reps))));
          return (
            <div key={ei} className="rounded-[8px] border border-white/[.07] bg-white/[.02] p-4">
              <div className="flex items-start gap-3">
                <ExerciseThumb name={e.name} size={52} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{e.name}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {e.target ? `${e.target.sets}×${e.target.reps}${e.target.kg != null ? ` @ ${fmt(e.target.kg)} kg` : ""}${e.target.rpe ? ` · RPE ${fmt(e.target.rpe)}` : ""}${e.target.rir != null ? ` · RIR ${e.target.rir}` : ""}${e.target.rest ? ` · ${mmss(e.target.rest)}` : ""}` : "extra"}
                    {last && ` · última (${shortDate(last.date)}): ${last.sets.map((x) => `${fmt(Number(x.kg))}×${x.reps}`).join(", ")}`}
                  </p>
                  {e.loadNote && <p className="text-[11px] mt-0.5" style={{ color: "#ffb21e" }}>{e.loadNote}</p>}
                </div>
                <button className="btn !min-h-9 !px-3 text-[12px]" onClick={() => setSwap(ei)}>Trocar</button>
                <button className="btn !min-h-9 !px-3 text-muted" aria-label={`Remover ${e.name}`} onClick={() => set({ exercises: s.exercises.filter((_, i) => i !== ei) })}>✕</button>
              </div>
              {e.target?.notes && <p className="text-xs text-gold mt-1">{e.target.notes}</p>}
              {isTimed(e.name, e.target && "muscle" in e.target ? String((e.target as { muscle?: string }).muscle) : undefined) ? (
                <div className="mt-3"><CardioPanel name={e.name} km={e.sets[0]?.kg ?? ""} min={e.sets[0]?.reps ?? ""} onChange={(p) => { if (e.sets.length) updSet(ei, 0, { kg: p.km, reps: p.min, done: !!(Number(p.min) > 0) }); }}
                  onRename={(nm) => set({ exercises: s.exercises.map((x, i) => (i === ei ? { ...x, name: nm } : x)) })} /></div>
              ) : <>
              <div className="grid grid-cols-[1.5rem_1fr_1fr_3.25rem_2.75rem] gap-2 items-center mt-3 label"><span>#</span><span>kg</span><span>reps</span><span>RPE</span><span /></div>
              {e.sets.map((x, si) => (
                <div key={si} className="grid grid-cols-[1.5rem_1fr_1fr_3.25rem_2.75rem] gap-2 items-center mt-1.5">
                  <span className="num text-muted">{si + 1}</span>
                  {isTimed(e.name, e.target && "muscle" in e.target ? String((e.target as { muscle?: string }).muscle) : undefined)
                    ? <input className="field !min-h-11 text-center num" inputMode="decimal" placeholder="km" value={x.kg === "0" ? "" : x.kg} onChange={(ev) => updSet(ei, si, { kg: ev.target.value })} aria-label="Distância em km (opcional)" />
                    : <input className="field !min-h-11 text-center num" inputMode="decimal" value={x.kg} onChange={(ev) => updSet(ei, si, { kg: ev.target.value, auto: false })} aria-label={`Carga série ${si + 1}`} />}
                  <input className="field !min-h-11 text-center num" inputMode="numeric" value={x.reps} placeholder={isTimed(e.name) ? "min" : ""} onChange={(ev) => updSet(ei, si, { reps: ev.target.value })} aria-label={isTimed(e.name) ? "Minutos" : `Repetições série ${si + 1}`} />
                  <input className="field !min-h-11 !px-1 text-center num text-sm" inputMode="decimal" placeholder="—" value={x.rpe ?? ""} onChange={(ev) => updSet(ei, si, { rpe: ev.target.value })} aria-label={`RPE série ${si + 1}`} />
                  <button aria-pressed={x.done} aria-label={`Concluir série ${si + 1}`} onClick={() => toggle(ei, si)}
                    className="h-11 w-11 grid place-items-center rounded-xl border transition-colors" style={{ borderColor: x.done ? G : "rgba(255,255,255,.15)", background: x.done ? G : "transparent" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={x.done ? "#120f08" : "#5d5b56"} strokeWidth="3" aria-hidden><path d="M5 12l5 5L20 7" /></svg>
                  </button>
                </div>
              ))}
              </>}
              <div className="flex items-center gap-2 mt-2">
                <button className="btn !min-h-9 text-sm" onClick={() => set({ exercises: s.exercises.map((y, i) => (i !== ei ? y : { ...y, sets: [...y.sets, { ...(y.sets.at(-1) ?? { kg: "", reps: "" }), done: false }] })) })}>+ Série</button>
                {e.sets.length > 1 && <button className="btn !min-h-9 text-sm text-muted" onClick={() => set({ exercises: s.exercises.map((y, i) => (i !== ei ? y : { ...y, sets: y.sets.slice(0, -1) })) })}>− Série</button>}
                {best > 0 && <span className="ml-auto text-xs text-muted">1RM est. <span className="num text-ink">{fmt(best, 0)} kg</span></span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 mt-3">
        <input className="field flex-1" placeholder="Adicionar exercício" value={newEx} onChange={(e) => setNewEx(e.target.value)} list="ex-names" />
        <button className="btn" disabled={!newEx.trim()} onClick={() => { set({ exercises: [...s.exercises, { name: newEx.trim(), sets: [{ kg: "", reps: "", done: false }] }] }); setNewEx(""); }}>Adicionar</button>
      </div>
      <SwapSheet open={swap !== null} name={swap !== null ? s.exercises[swap]?.name ?? "" : ""} muscle={swap !== null ? (s.exercises[swap]?.target as { muscle?: string } | undefined)?.muscle : null}
        onClose={() => setSwap(null)} onPick={(nm) => { if (swap !== null) set({ exercises: s.exercises.map((x, i) => (i === swap ? { ...x, name: nm } : x)) }); }} />
      <datalist id="ex-names">{[...new Set(workouts.flatMap((w) => w.sets.map((x) => x.exercise)))].map((x) => <option key={x} value={x} />)}</datalist>
      <textarea className="field mt-3" placeholder="Observações (como se sentiu, dores, técnica…)" value={s.notes} onChange={(e) => set({ notes: e.target.value })} />
      <div className="flex gap-2 mt-3">
        <button className="btn" onClick={() => { if (confirm(s.editingId ? "Descartar alterações?" : "Descartar o treino em andamento?")) setS(null); }}>Descartar</button>
        <button className="btn btn-accent flex-1" disabled={pending} onClick={finish}>{pending ? "Salvando…" : s.editingId ? "Salvar alterações" : "Finalizar treino"}</button>
      </div>
      {rest && <RestTimer until={rest} onDone={() => setRest(null)} onAdd={(sec) => setRest(rest + sec * 1000)} />}
    </>
  );
}

/* ───────────── Editor do plano ───────────── */
