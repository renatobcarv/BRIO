"use client";
import { useState, useTransition } from "react";
import { saveWeekOverride } from "@/app/(app)/corpo/program-actions";
import { POOL } from "@/lib/coach";
import { PRESETS, applyPreset, moveDay, totalSets, type Preset, type Suggestion } from "@/lib/master";
import { REFS } from "@/lib/coach";
import { MUSCLES, type PlannedEx } from "@/lib/training";
import { Sheet } from "@/components/kit";

const A = "#ffb21e";
const WD = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const altsFor = (e: PlannedEx) => [...new Set(Object.values(POOL).flatMap((p) => p[e.muscle] ?? []))].filter((x) => x !== e.name);

/** Ajustar semana: parte da proposta do Mestre; vale só para esta semana. */
export function WeekEditor({ programId, week, days: initial, adjusted, suggestions = [] }: { programId: string; week: number; days: Record<string, PlannedEx[]>; adjusted: boolean; suggestions?: Suggestion[] }) {
  const [on, setOn] = useState<Set<string>>(() => new Set(suggestions.map((x) => x.id))), [manual, setManual] = useState(false);
  const proposed = () => suggestions.filter((x) => on.has(x.id)).reduce((d, x) => x.apply(d), initial);
  const [open, setOpen] = useState(false), [days, setDays] = useState(initial), [note, setNote] = useState(""), [msg, setMsg] = useState(""), [busy, start] = useTransition();
  const [moving, setMoving] = useState<string | null>(null);
  const edit = (d: string, i: number, p: Partial<PlannedEx> | null) => setDays({ ...days, [d]: p === null ? days[d].filter((_, k) => k !== i) : days[d].map((e, k) => (k === i ? { ...e, ...p } : e)) });
  const save = (v: Record<string, PlannedEx[]> | null) => start(async () => { const e = await saveWeekOverride(programId, week, v, note); setMsg(e ?? (v ? "Semana ajustada." : "Voltou à proposta do Mestre.")); if (!e) setTimeout(() => location.reload(), 700); });
  const keys = Object.keys(days).sort((a, b) => (+a || 7) - (+b || 7));
  return (
    <>
      {!adjusted && suggestions.length > 0 && <p className="text-[12.5px] mt-3" style={{ color: A }}>O Mestre tem {suggestions.length} sugest{suggestions.length > 1 ? "ões" : "ão"} para esta semana.</p>}
      <button className="btn w-full mt-2" onClick={() => { setDays(initial); setOpen(true); setMsg(""); setManual(false); }}>{adjusted ? "Ver ajuste da semana" : suggestions.length ? "Ver sugestões do Mestre" : "Ajustar semana"}</button>
      <Sheet accent={A} open={open} onClose={() => setOpen(false)} title={`Semana ${week} · ajuste`}>
        {suggestions.length > 0 ? <>
          <p className="text-[13px] text-white/60">Li suas últimas semanas. Proponho isto (vale só para esta semana):</p>
          <ul className="grid gap-2 mt-3">{suggestions.map((x) => { const sel = on.has(x.id); return (
            <li key={x.id}><button aria-pressed={sel} onClick={() => { const n = new Set(on); if (sel) n.delete(x.id); else n.add(x.id); setOn(n); }} className="w-full text-left rounded-[14px] p-3 border flex gap-3" style={{ borderColor: sel ? A : "rgba(255,255,255,.08)", background: sel ? A + "12" : "rgba(255,255,255,.03)" }}>
              <span className="mt-0.5 grid place-items-center h-5 w-5 shrink-0 rounded-full border text-[11px]" style={{ borderColor: sel ? A : "rgba(255,255,255,.3)", background: sel ? A : "transparent", color: "#000" }}>{sel ? "✓" : ""}</span>
              <span><span className="block text-[14px] font-semibold">{x.title}</span><span className="block text-[12.5px] text-white/60">{x.why}</span><span className="block text-[10.5px] text-white/35 mt-1">{REFS[x.ref]}</span></span>
            </button></li>); })}</ul>
          <button className="btn btn-accent w-full mt-3" disabled={busy || on.size === 0} onClick={() => { setNote(suggestions.filter((x) => on.has(x.id)).map((x) => x.title).join(" · ").slice(0, 80)); start(async () => { const e = await saveWeekOverride(programId, week, proposed(), "Sugestões do Mestre"); setMsg(e ?? "Ajustes aplicados."); if (!e) setTimeout(() => location.reload(), 700); }); }}>{busy ? "Aplicando…" : `Aplicar ${on.size} sugest${on.size === 1 ? "ão" : "ões"}`}</button>
        </> : <p className="text-[13px] text-white/60">Nada a ajustar: a semana passada foi dentro do plano. Se a vida mudou, use os atalhos abaixo.</p>}
        {msg && !manual && <p className="text-sm mt-2" style={{ color: A }}>{msg}</p>}
        {adjusted && !manual && <button className="btn w-full mt-2" disabled={busy} onClick={() => save(null)}>Voltar à proposta original do Mestre</button>}
        <button className="text-[13px] text-white/50 underline underline-offset-2 mt-4" onClick={() => setManual(!manual)}>{manual ? "Esconder edição manual" : "Prefiro ajustar eu mesmo"}</button>
        {manual && <>
        <p className="text-[13px] text-white/60 mt-3">Vale só para esta semana. {totalSets(days)} séries no total.</p>
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
        {msg && <p className="text-sm mt-2" style={{ color: A }}>{msg}</p>}
        </>}
      </Sheet>
    </>
  );
}
