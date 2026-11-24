"use client";
import { useState, useTransition } from "react";
import { applyDietAdjust } from "@/app/(app)/corpo/diet-actions";
import { Consult } from "./consult";
import { phaseOf, type Goal } from "@/lib/diet-plan";
import { weekNutrition, weightRate } from "@/lib/master";
import { NUTRI } from "@/lib/personas";
import Image from "next/image";

const G = "#9de3ac";
type Plan = { kcal: number; protein_g: number; goal: Goal; profile: { kg?: number; targetKg?: number | null; rate?: number | null; weeks?: number | null } } | null;

/** Helena acompanha a dieta: fase (cutting/bulking), progresso até o peso objetivo e o ajuste da semana pela tendência real do peso. */
export function DietCoach({ plan, weights, today }: { plan: Plan; weights: { date: string; kg: number }[]; today: string }) {
  const [msg, setMsg] = useState(""), [busy, start] = useTransition();
  if (!plan) return <section className="hunt-card p-5 mb-4"><p className="label" style={{ color: G }}>{NUTRI.short}</p><p className="text-[14px] text-white/70 mt-1">Vamos montar sua dieta numa conversa rápida: objetivo, peso alvo, rotina e o que você gosta de comer.</p><Consult kind="dieta" /></section>;
  const ph = phaseOf(plan.goal), rate = weightRate(weights, today), nut = weekNutrition(plan.goal, "", null, rate, plan.kcal);
  const cur = weights.length ? weights.slice().sort((a, b) => a.date.localeCompare(b.date)).at(-1)!.kg : plan.profile.kg ?? null, start0 = plan.profile.kg ?? cur, tgt = plan.profile.targetKg ?? null;
  const prog = start0 && tgt && cur != null && start0 !== tgt ? Math.max(0, Math.min(1, (start0 - cur) / (start0 - tgt))) : null;
  const run = (f: () => Promise<string | null>, ok: string) => start(async () => { const e = await f(); setMsg(e ?? ok); });
  return (
    <section className="hunt-card p-5 mb-4 relative isolate overflow-hidden">
      {/* Arte da Helena dissolvendo para o fundo (mesmo estilo do Mestre). */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[260px] sm:h-[300px] [mask-image:linear-gradient(180deg,#000_40%,transparent)]">
        <Image src="/cards/nutricionista.webp" fill alt="" unoptimized sizes="(max-width: 768px) 100vw, 1200px" className="object-cover" style={{ objectPosition: "77% 28%" }} />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#0b0b0c_0%,#0b0b0cf2_32%,#0b0b0c8c_58%,transparent_85%)]" />
      </div>
      <div className="relative flex min-h-[120px] sm:min-h-[150px] flex-col justify-end">
        <div className="flex items-center gap-2"><span className="relative size-9 overflow-hidden rounded-full border-2" style={{ borderColor: G }}><Image src="/cards/nutricionista-avatar.webp" alt="" fill unoptimized sizes="36px" className="object-cover" /></span>
          <p className="label" style={{ color: G }}>{NUTRI.name} · ajuste da semana</p></div>
        <p className="font-display text-4xl mt-1">{ph.label}</p>
        <p className="text-[14px] text-white/70"><b className="text-white text-[20px]">{plan.kcal.toLocaleString("pt-BR")}</b> kcal/dia · {plan.protein_g} g de proteína</p>
      </div>
      {tgt && cur != null && <div className="relative mt-4">
        <div className="flex justify-between text-[12px] text-white/60"><span>{start0} kg</span><span className="font-semibold text-white">agora {cur} kg</span><span>meta {tgt} kg</span></div>
        <div className="h-2 rounded-full bg-white/10 mt-1"><i className="block h-2 rounded-full" style={{ width: `${(prog ?? 0) * 100}%`, background: G }} /></div>
        <p className="text-[12px] text-white/50 mt-1">{plan.profile.rate ? `Ritmo planejado: ${String(plan.profile.rate).replace(".", ",")} kg/semana · ` : ""}{Math.abs(cur - tgt) > 0.3 ? `faltam ${Math.abs(Math.round((cur - tgt) * 10) / 10).toString().replace(".", ",")} kg` : "meta alcançada!"}</p>
      </div>}
      <ul className="relative mt-4 grid gap-1.5">{nut.tips.map((t, i) => <li key={i} className="text-[13.5px] text-white/80">• {t.text}</li>)}</ul>
      {nut.adj !== 0 && <button className="relative btn btn-accent w-full mt-3" disabled={busy} onClick={() => run(() => applyDietAdjust(nut.adj), "Ajuste aplicado: metas e porções atualizadas.")}>Aplicar ajuste: {nut.adj > 0 ? "+" : ""}{nut.adj} kcal/dia</button>}
      <div className="relative"><Consult kind="dieta" /></div>
      {msg && <p className="relative text-[13px] mt-2" style={{ color: G }}>{msg}</p>}
    </section>
  );
}
