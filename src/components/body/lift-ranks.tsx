"use client";
import { LIFTS, TIERS, bestLifts, overallRank, rankOf, type Lift } from "@/lib/lift-ranks";

/** Ranking dos básicos: patente por levantamento, a próxima meta em kg e a patente geral. */
export function LiftRanks({ sets, bodyweight, sex = "m" }: { sets: { exercise: string; kg: number; reps: number }[]; bodyweight: number | null; sex?: "m" | "f" }) {
  if (!bodyweight) return <section className="glass rise p-5 mt-4"><p className="label">Ranking dos básicos</p><p className="text-[13px] text-white/55 mt-1">Registre seu peso em Status › Corpo para ver sua patente em cada levantamento.</p></section>;
  const best = bestLifts(sets), keys = Object.keys(LIFTS) as Lift[];
  const r = Object.fromEntries(keys.map((k) => [k, rankOf(k, best[k], bodyweight, sex)])) as Record<Lift, ReturnType<typeof rankOf>>;
  const all = overallRank(r);
  return (
    <section id="tr-ranking" className="glass rise p-5 mt-4 scroll-mt-20 relative overflow-hidden">
      <div aria-hidden className="absolute -right-12 -top-12 h-44 w-44 rounded-full" style={{ background: `radial-gradient(circle, ${all.color}33, transparent 70%)` }} />
      <div className="flex items-end justify-between relative">
        <div><p className="label">Ranking dos básicos</p><p className="font-display text-3xl mt-1" style={{ color: all.color }}>{all.name}</p><p className="text-[12px] text-white/50">Patente geral: o levantamento mais fraco puxa para baixo.</p></div>
        <div className="flex gap-1" aria-hidden>{TIERS.map((t, i) => <i key={t.key} className="h-6 w-1.5 rounded-full" style={{ background: i <= TIERS.findIndex((x) => x.key === all.key) ? t.color : "rgba(255,255,255,.1)" }} />)}</div>
      </div>
      <div className="grid gap-2 mt-4 sm:grid-cols-3 relative">
        {keys.map((k) => { const x = r[k], has = best[k] > 0; return (
          <div key={k} className="rounded-[14px] border p-3" style={{ borderColor: x.tier.color + "55", background: `radial-gradient(90% 80% at 50% 0%, ${x.tier.color}1f, transparent 70%)` }}>
            <p className="text-[12px] text-white/60">{LIFTS[k].label}</p>
            <p className="font-display text-2xl leading-tight" style={{ color: x.tier.color }}>{has ? x.tier.name : "—"}</p>
            <p className="text-[11.5px] text-white/50">{has ? `1RM ≈ ${Math.round(best[k])} kg · ${x.rel.toFixed(2).replace(".", ",")}× o peso` : "sem registro ainda"}</p>
            <div className="h-1.5 rounded-full bg-white/10 mt-2"><i className="block h-1.5 rounded-full" style={{ width: `${(has ? x.progress : 0) * 100}%`, background: x.tier.color }} /></div>
            <p className="text-[11px] mt-1" style={{ color: x.nextTier?.color ?? x.tier.color }}>{x.nextTier ? `+${x.toNext} kg de 1RM para ${x.nextTier.name}` : "Topo do ranking."}</p>
          </div>); })}
      </div>
      <p className="text-[10.5px] text-white/35 mt-3 relative">Faixas aproximadas de força relativa para treino natural. Patentes: {TIERS.map((t) => t.name).join(" › ")}.</p>
    </section>
  );
}
