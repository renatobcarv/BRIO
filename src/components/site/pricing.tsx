"use client";
import Link from "next/link";
import { useState } from "react";
import { PLANS, brlPrice } from "@/lib/plans";

export function Pricing() {
  const [yearly, setYearly] = useState(false);
  return (
    <div>
      <div className="flex justify-center">
        <div className="inline-flex p-1 rounded-full border border-white/10 bg-white/[.04]" role="group" aria-label="Período de cobrança">
          {[[false, "Mensal"], [true, "Anual · 2 meses grátis"]].map(([v, l]) => (
            <button key={String(l)} type="button" aria-pressed={yearly === v} onClick={() => setYearly(v as boolean)}
              className={`min-h-11 px-4 rounded-full text-sm transition-colors ${yearly === v ? "bg-white text-black font-semibold" : "text-muted"}`}>{l as string}</button>))}
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4 mt-8 items-stretch">
        {PLANS.map((p, i) => (
          <div key={p.id} data-i={i} className={`in tilt relative rounded-[28px] p-6 border flex flex-col ${p.highlight ? "md:-translate-y-3" : ""}`}
            style={{ borderColor: p.highlight ? "#ff6a3d" : "rgba(255,255,255,.1)", background: p.highlight ? "radial-gradient(120% 80% at 50% 0%, rgba(255,106,61,.22), #0c0907 70%)" : "linear-gradient(170deg, rgba(255,255,255,.06), #0b0b0d 60%)", boxShadow: p.highlight ? "0 30px 80px -40px #ff6a3d" : "none" }}>
            {p.highlight && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold tracking-[.2em] rounded-full px-3 py-1 text-black" style={{ background: "linear-gradient(90deg,#ffd27a,#ff6a3d)" }}>MAIS ESCOLHIDO</span>}
            <p className="font-display text-2xl">{p.name}</p>
            <p className="text-sm text-muted mt-1">{p.tagline}</p>
            <p className="mt-5 flex items-baseline gap-1">
              <span className="num text-5xl">{brlPrice(yearly ? p.yearly : p.price)}</span>
              {p.price > 0 && <span className="text-muted text-sm">/{yearly ? "ano" : "mês"}</span>}
            </p>
            <p className="text-xs text-muted mt-1 min-h-4">{p.price > 0 ? (yearly ? `equivale a ${brlPrice(p.yearly / 12)}/mês` : "menos que um café por semana") : "para sempre"}</p>
            <ul className="grid gap-2 mt-5 text-sm flex-1">
              {p.features.map((f) => <li key={f} className="flex gap-2"><span aria-hidden className="text-[#30d158] mt-0.5">✓</span><span>{f}</span></li>)}
            </ul>
            <Link href={`/cadastro?plano=${p.id}`} className="mt-6 min-h-12 rounded-2xl grid place-items-center font-semibold press"
              style={p.highlight ? { background: "linear-gradient(160deg,#ff6a3d,#e0393e 55%,#8a1a1d)", color: "#fff", boxShadow: "0 14px 34px -14px #e0393e" } : { border: "1px solid rgba(255,255,255,.15)" }}>
              {p.price ? "Testar 14 dias grátis" : "Começar grátis"}</Link>
          </div>))}
      </div>
      <p className="text-center text-xs text-muted mt-5">Sem cartão no teste. Cancelar é um toque. A cobrança dos planos pagos começa quando o pagamento online for ativado; até lá, tudo liberado no teste.</p>
    </div>
  );
}
