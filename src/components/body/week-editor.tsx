"use client";
import { useState, useTransition } from "react";
import { saveWeekOverride } from "@/app/(app)/corpo/program-actions";
import { POOL } from "@/lib/coach";
import { PRESETS, applyPreset, moveDay, totalSets, type Preset } from "@/lib/master";
import { MUSCLES, type PlannedEx } from "@/lib/training";
import { Sheet } from "@/components/kit";

const A = "#ffb21e";
const WD = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const altsFor = (e: PlannedEx) => [...new Set(Object.values(POOL).flatMap((p) => p[e.muscle] ?? []))].filter((x) => x !== e.name);

/** Ajustar semana: parte da proposta do Mestre; vale só para esta semana. */
export function WeekEditor({ programId, week, days: initial, adjusted }: { programId: string; week: number; days: Record<string, PlannedEx[]>; adjusted: boolean }) {
  const [open, setOpen] = useState(false), [days, setDays] = useState(initial), [note, setNote] = useState(""), [msg, setMsg] = useState(""), [busy, start] = useTransition();
  const [moving, setMoving] = useState<string | null>(null);
  const edit = (d: string, i: number, p: Partial<PlannedEx> | null) => setDays({ ...days, [d]: p === null ? days[d].filter((_, k) => k !== i) : days[d].map((e, k) => (k === i ? { ...e, ...p } : e)) });
  const save = (v: Record<string, PlannedEx[]> | null) => start(async () => { const e = await saveWeekOverride(programId, week, v, note); setMsg(e ?? (v ? "Semana ajustada." : "Voltou à proposta do Mestre.")); if (!e) setTimeout(() => location.reload(), 700); });
  const keys = Object.keys(days).sort((a, b) => (+a || 7) - (+b || 7));
  return (
    <>
      <button className="btn w-full mt-3" onClick={() => { setDays(initial); setOpen(true); setMsg(""); }}>{adjusted ? "Editar ajuste da semana" : "Ajustar semana"}</button>
      <Sheet accent={A} open={open} onClose={() => setOpen(false)} title={`Semana ${week} · ajuste`}>
        <p className="text-[13px] text-white/60">Vale só para esta semana. O plano base continua igual. {totalSets(days)} séries no total.</p>
        <div className="grid gap-2 mt-3">{(Object.keys(PRESETS) as Preset[]).map((p) => (
          <button key={p} className="text-left rounded-[12px] p-3 bg-white/[.05]" onClick={() => { setDays(applyPreset(initial, p)); setNote(PRESETS[p].label); }}>
            <span className="block text-[14px] font-semibold">{PRESETS[p].label}</span><span className="block text-[12px] text-white/50">{PRESETS[p].hint}</span></button>))}</div>
        {keys.map((d) => (
          <div key={d} className="mt-5">
            <div className="flex items-center justify-between"><p className="font-semibold">{WD[+d]}</p>
              <button className="text-[12px]" style={{ color: A }} onClick={() => setMoving(moving === d ? null : d)}>{moving === d ? "Cancelar" : "Mudar dia"}</button></div>
            {moving === d && <div className="flex gap-1 mt-2">{WD.map((l, k) => <button key={k} disabled={String(k) === d} onClick={() => { setDays(moveDay(days, d, String(k))); setMoving(null); }} className="flex-1 rounded-[8px] py-2 text-[12px] bg-white/[.06] disabled:opacity-30">{l}</button>)}</div>}
            <ul className="mt-2 grid gap-1.5">{days[d].map((e, i) => (
              <li key={i} className="rounded-[12px] bg-white/[.04] p-2.5">
                <div className="flex items-center gap-2">
                  <select className="flex-1 min-w-0 bg-transparent text-[13.5px] font-medium" value={e.name} onChange={(ev) => edit(d, i, { name: ev.target.value })} aria-label="Exercício">
                    <option value={e.name}>{e.name}</option>{altsFor(e).map((x) => <option key={x} value={x}>{x}</option>)}</select>
                  <button aria-label="Menos uma série" className="h-8 w-8 rounded-full bg-white/[.08]" onClick={() => edit(d, i, { sets: Math.max(1, e.sets - 1) })}>−</button>
                  <span className="w-6 text-center font-semibold">{e.sets}</span>
                  <button aria-label="Mais uma série" className="h-8 w-8 rounded-full bg-white/[.08]" onClick={() => edit(d, i, { sets: Math.min(10, e.sets + 1) })}>+</button>
                  <button aria-label="Remover" className="h-8 w-8 rounded-full text-white/50" onClick={() => edit(d, i, null)}>×</button>
                </div>
                <p className="text-[11px] text-white/45 mt-0.5">{MUSCLES[e.muscle]} · {e.reps} reps{e.rpe ? ` · RPE ${String(e.rpe).replace(".", ",")}` : ""}</p>
              </li>))}</ul>
          </div>))}
        <input className="field w-full mt-5" placeholder="Motivo (opcional): viagem, dor, prova…" value={note} onChange={(e) => setNote(e.target.value)} maxLength={80} />
        <button className="btn btn-accent w-full mt-3" disabled={busy} onClick={() => save(days)}>{busy ? "Salvando…" : "Salvar ajuste da semana"}</button>
        {adjusted && <button className="btn w-full mt-2" disabled={busy} onClick={() => save(null)}>Voltar à proposta do Mestre</button>}
        {msg && <p className="text-sm mt-2" style={{ color: A }}>{msg}</p>}
      </Sheet>
    </>
  );
}
