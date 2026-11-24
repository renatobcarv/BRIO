"use client";
import { useState, useTransition } from "react";
import { applyDietAdjust, recalcForTarget } from "@/app/(app)/corpo/diet-actions";
import { phaseOf, type Goal } from "@/lib/diet-plan";
import { weekNutrition, weightRate } from "@/lib/master";
import { NUTRI } from "@/lib/personas";

const A = "#ffb21e", G = "#9de3ac";
type Plan = { kcal: number; protein_g: number; goal: Goal; profile: { kg?: number; targetKg?: number | null; rate?: number | null; weeks?: number | null } } | null;

/** Helena acompanha a dieta: fase (cutting/bulking), progresso até o peso objetivo e o ajuste da semana pela tendência real do peso. */
export function DietCoach({ plan, weights, today }: { plan: Plan; weights: { date: string; kg: number }[]; today: string }) {
  const [target, setTarget] = useState(String(plan?.profile.targetKg ?? "")), [weeks, setWeeks] = useState(""), [msg, setMsg] = useState(""), [busy, start] = useTransition();
  if (!plan) return <section className="hunt-card p-5 mb-4"><p className="label" style={{ color: G }}>{NUTRI.short}</p><p className="text-[14px] text-white/70 mt-1">Crie seu plano alimentar pela consulta no Treino (ou em Dieta) para eu acompanhar seu cutting ou bulking.</p></section>;
  const ph = phaseOf(plan.goal), rate = weightRate(weights, today), nut = weekNutrition(plan.goal, "", null, rate, plan.kcal);
  const cur = weights.length ? weights.slice().sort((a, b) => a.date.localeCompare(b.date)).at(-1)!.kg : plan.profile.kg ?? null, start0 = plan.profile.kg ?? cur, tgt = plan.profile.targetKg ?? null;
  const prog = start0 && tgt && cur != null && start0 !== tgt ? Math.max(0, Math.min(1, (start0 - cur) / (start0 - tgt))) : null;
  const run = (f: () => Promise<string | null>, ok: string) => start(async () => { const e = await f(); setMsg(e ?? ok); });
  return (
    <section className="hunt-card p-5 mb-4 relative overflow-hidden">
      <div aria-hidden className="absolute -right-14 -top-14 h-48 w-48 rounded-full" style={{ background: `radial-gradient(circle, ${G}22, transparent 70%)` }} />
      <div className="relative flex items-end justify-between gap-3">
        <div><p className="label" style={{ color: G }}>{NUTRI.short} · ajuste da semana</p><p className="font-display text-3xl mt-1">{ph.label}</p></div>
        <div className="text-right"><p className="text-[26px] font-bold leading-none">{plan.kcal.toLocaleString("pt-BR")}</p><p className="text-[11px] text-white/50">kcal/dia · {plan.protein_g} g proteína</p></div>
      </div>
      {tgt && cur != null && <div className="relative mt-4">
        <div className="flex justify-between text-[12px] text-white/60"><span>{start0} kg</span><span className="font-semibold text-white">agora {cur} kg</span><span>meta {tgt} kg</span></div>
        <div className="h-2 rounded-full bg-white/10 mt-1"><i className="block h-2 rounded-full" style={{ width: `${(prog ?? 0) * 100}%`, background: G }} /></div>
        <p className="text-[12px] text-white/50 mt-1">{plan.profile.rate ? `Ritmo planejado: ${String(plan.profile.rate).replace(".", ",")} kg/semana · ` : ""}{Math.abs(cur - tgt) > 0.3 ? `faltam ${Math.abs(Math.round((cur - tgt) * 10) / 10).toString().replace(".", ",")} kg` : "meta alcançada!"}</p>
      </div>}
      <ul className="relative mt-4 grid gap-1.5">{nut.tips.map((t, i) => <li key={i} className="text-[13.5px] text-white/80">• {t.text}</li>)}</ul>
      {nut.adj !== 0 && <button className="relative btn btn-accent w-full mt-3" disabled={busy} onClick={() => run(() => applyDietAdjust(nut.adj), "Ajuste aplicado: metas e porções atualizadas.")}>Aplicar ajuste: {nut.adj > 0 ? "+" : ""}{nut.adj} kcal/dia</button>}
      <details className="relative mt-3"><summary className="text-[13px] text-white/60 underline underline-offset-2 cursor-pointer min-h-10 flex items-center">Recalcular pelo peso objetivo</summary>
        <form className="grid grid-cols-2 gap-2 mt-2" onSubmit={(e) => { e.preventDefault(); run(() => recalcForTarget(Number(target.replace(",", ".")), Number(weeks) || null), "Plano recalculado pelo peso objetivo."); }}>
          <label className="text-[12px] text-white/55">Peso objetivo (kg)<input className="field w-full mt-1" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="80" /></label>
          <label className="text-[12px] text-white/55">Prazo (semanas, opcional)<input className="field w-full mt-1" inputMode="numeric" value={weeks} onChange={(e) => setWeeks(e.target.value)} placeholder="16" /></label>
          <button className="btn col-span-2" disabled={busy || !Number(target.replace(",", "."))}>{busy ? "Calculando…" : "Recalcular calorias"}</button>
          <p className="col-span-2 text-[11px] text-white/40">Ritmo seguro: perder 0,5–1% do peso por semana (ganhar 0,25–0,5%). Proteína ~2,2 g/kg no cutting para preservar músculo. Não substitui um nutricionista.</p>
        </form></details>
      {msg && <p className="relative text-[13px] mt-2" style={{ color: G }}>{msg}</p>}
    </section>
  );
}
