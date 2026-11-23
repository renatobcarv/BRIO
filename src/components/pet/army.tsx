"use client";
import { useState, useTransition } from "react";
import { setActiveBeast } from "@/app/(app)/mascote-actions";
import { CreaturePortrait } from "@/components/body/creature-portrait";
import { ALL, FERAS, type BeastId } from "@/lib/bestiary";
import { BEAST_ATTR, MAX_STARS, tameChance, tamedPct, type Tamed } from "@/lib/items";
import { ATTRS } from "@/lib/game";

const A = "#ffb21e";
type Soldier = Tamed & { level: number };

/** Exército de feras domadas: cada fera derrotada pode se levantar como sua aliada. */
export function Army({ army, active, kills, ready }: { army: Soldier[]; active: BeastId | null; kills: number; ready: boolean }) {
  const [msg, setMsg] = useState(""), [pending, start] = useTransition();
  const by = new Map(army.map((t) => [t.id, t]));
  const cur = active ? by.get(active) : undefined;
  const pick = (id: BeastId | null) => start(async () => setMsg((await setActiveBeast(id)) ?? ""));
  return (
    <section className="hunt-card p-5 mt-6 relative overflow-hidden">
      <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full" style={{ background: `radial-gradient(circle, ${A}22, transparent 70%)` }} />
      <div className="flex items-end justify-between gap-3 relative">
        <div><p className="label">Levante-se</p><p className="font-display text-2xl mt-1">Feras domadas</p></div>
        <p className="text-right text-[12px] text-white/55"><span className="text-[22px] font-bold" style={{ color: A }}>{army.length}</span>/{FERAS.length} domadas</p>
      </div>
      <p className="text-[12.5px] text-white/55 mt-1 relative">Toda fera vencida no Treino pode se erguer como sua aliada. A chance é baixa nas fracas ({Math.round(tameChance(1, false) * 100)}%) e alta nos chefes ({Math.round(tameChance(5, true) * 100)}%). Domar de novo dá estrela. A fera ativa sobe de nível com seu XP e reforça um atributo.</p>
      {!ready && <p className="text-[13px] mt-3" style={{ color: A }}>Para escolher a fera ativa, rode o SQL <b>20261127000000_itens.sql</b> no Supabase.</p>}

      {cur && (
        <div className="mt-4 flex items-center gap-4 rounded-[16px] p-4 border" style={{ borderColor: A + "55", background: `radial-gradient(80% 90% at 20% 50%, ${A}1c, #0b0b0d 70%)` }}>
          <div className="h-24 w-24 shrink-0" style={{ filter: `drop-shadow(0 0 16px ${A}aa)` }}><CreaturePortrait id={cur.id} className="w-full h-full" /></div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[.2em]" style={{ color: A }}>Ao seu lado</p>
            <p className="text-[22px] font-bold leading-tight">{ALL(cur.id).name}</p>
            <p className="text-[12px] text-white/60">Nível {cur.level} · {"★".repeat(cur.stars)}<span className="text-white/20">{"★".repeat(MAX_STARS - cur.stars)}</span></p>
            <p className="text-[12px] mt-0.5" style={{ color: A }}>+{tamedPct(cur.stars)}% XP em {ATTRS[BEAST_ATTR[cur.id]!].label}</p>
          </div>
        </div>)}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
        {FERAS.map((id) => {
          const t = by.get(id), b = ALL(id), on = active === id;
          return (
            <div key={id} className="rounded-[14px] p-3 text-center border" style={{ borderColor: on ? A : t ? A + "33" : "rgba(255,255,255,.06)", background: t ? `radial-gradient(90% 70% at 50% 25%, ${A}18, #0b0b0d 72%)` : "#0b0b0d" }}>
              <div className="mx-auto h-20 w-20" style={{ filter: t ? `drop-shadow(0 0 10px ${A}88)` : "grayscale(1) brightness(.12)" }}><CreaturePortrait id={id} className="w-full h-full" /></div>
              <p className="text-[13px] font-bold mt-1 truncate">{t ? b.name : "???"}</p>
              {t ? <>
                <p className="text-[11px] text-white/55">Nv {t.level} · <span style={{ color: A }}>{"★".repeat(t.stars)}</span></p>
                <p className="text-[10.5px] text-white/45">{ATTRS[BEAST_ATTR[id]!].label} +{tamedPct(t.stars)}%</p>
                <button disabled={pending || !ready} onClick={() => pick(on ? null : id)} className={`btn !min-h-8 !px-3 text-[12px] mt-2 w-full ${on ? "" : "btn-accent"}`}>{on ? "Dispensar" : "Chamar"}</button>
              </> : <p className="text-[10.5px] text-white/40 mt-0.5">Derrote e tente domar</p>}
            </div>);
        })}
      </div>
      {msg && <p className="text-sm mt-3" style={{ color: A }}>{msg}</p>}
      {army.length === 0 && <p className="text-[12.5px] text-white/50 mt-3">{kills ? `${kills} abates até agora. Continue caçando: a próxima pode se levantar.` : "Cumpra um treino da campanha para a primeira caçada."}</p>}
    </section>
  );
}
