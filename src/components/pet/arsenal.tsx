"use client";
import { useState, useTransition } from "react";
import { equipItem } from "@/app/(app)/mascote-actions";
import { CreaturePortrait } from "@/components/body/creature-portrait";
import { GEAR, ITEM_CAP, SLOTS, TIER, type Equipped, type Gear } from "@/lib/items";
import { ATTRS, type Attr } from "@/lib/game";
import { Sheet } from "@/components/kit";
import type { BeastId } from "@/lib/bestiary";

const A = "#ffb21e";
/** Símbolo simples de cada espaço (SVG próprio, preto e âmbar). */
const GLYPH: Record<Attr, string> = {
  forca: "M6 4l3 8-3 8M12 3v18M18 4l-3 8 3 8", vigor: "M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z",
  sabedoria: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", servico: "M7 21c-2 0-3-2-2-4l2-5h4l-1 5c0 2-1 4-3 4zM15 15c-2 0-3-2-2-4l2-5h4l-1 5c0 2-1 4-3 4z",
  disciplina: "M4 8c3 3 13 3 16 0M12 11v5m-3 0h6l-3 5z", ordem: "M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z",
};
function Glyph({ slot, color, size = 26 }: { slot: Attr; color: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={GLYPH[slot]} /></svg>;
}

export function Arsenal({ unlocked, equipped, trophies, ready, petName }: { unlocked: string[]; equipped: Equipped; trophies: { id: BeastId; won: number }[]; ready: boolean; petName: string }) {
  const [slot, setSlot] = useState<Attr | null>(null), [msg, setMsg] = useState(""), [pending, start] = useTransition();
  const own = new Set(unlocked);
  const act = (s: Attr, id: string | null) => start(async () => { const e = await equipItem(s, id); setMsg(e ?? ""); if (!e) setSlot(null); });
  return (
    <section className="hunt-card p-5 mt-6">
      <div className="flex items-end justify-between gap-3">
        <div><p className="label">Arsenal de {petName}</p><p className="font-display text-2xl mt-1">Equipamento</p></div>
        <p className="text-right text-[12px] text-white/55"><span className="text-[22px] font-bold" style={{ color: A }}>{unlocked.length}</span>/{GEAR.length} conquistados</p>
      </div>
      <p className="text-[12.5px] text-white/55 mt-1">Cada item vem de uma conquista real e dá bônus de XP no atributo dele, a partir do dia em que é equipado. Teto total: {Math.round(ITEM_CAP * 100)}%.</p>
      {!ready && <p className="text-[13px] mt-3" style={{ color: A }}>Para equipar, rode o SQL <b>20261127000000_itens.sql</b> no Supabase.</p>}
      <div className="grid grid-cols-3 gap-2 mt-4">
        {SLOTS.map(({ slot: s, label }) => {
          const it = equipped[s] ? GEAR.find((x) => x.id === equipped[s]!.id) : undefined, c = it ? TIER[it.tier].color : "rgba(255,255,255,.25)";
          const avail = GEAR.filter((x) => x.slot === s && own.has(x.id)).length;
          return (
            <button key={s} onClick={() => setSlot(s)} className="rounded-[14px] p-3 text-center border transition-colors" style={{ borderColor: it ? c + "66" : "rgba(255,255,255,.07)", background: it ? `radial-gradient(90% 80% at 50% 20%, ${c}22, #0b0b0d 75%)` : "rgba(255,255,255,.03)" }}>
              <span className="mx-auto grid place-items-center h-11 w-11 rounded-full" style={{ background: it ? c + "1f" : "rgba(255,255,255,.04)" }}><Glyph slot={s} color={it ? c : "rgba(255,255,255,.35)"} /></span>
              <span className="block text-[10px] text-white/45 mt-1.5">{label} · {ATTRS[s].label}</span>
              <span className="block text-[12px] font-semibold leading-tight mt-0.5 line-clamp-2">{it ? it.name : avail ? `${avail} disponível` : "Vazio"}</span>
              {it && <span className="block text-[10.5px]" style={{ color: A }}>+{it.pct}% XP</span>}
            </button>);
        })}
      </div>
      <p className="text-[12px] text-white/50 mt-3"><b style={{ color: A }}>{SLOTS.filter((s) => equipped[s.slot]).length} de 6</b> espaços equipados. Cada bônus vale só no atributo do item, e o extra total nunca passa de {Math.round(ITEM_CAP * 100)}% do seu XP.</p>

      <div className="mt-6">
        <p className="label">Troféus de caça</p>
        {trophies.length === 0 ? <p className="text-[13px] text-white/50 mt-2">Vença a fera da semana no Treino para ganhar o primeiro troféu.</p> : (
          <div className="flex gap-2 overflow-x-auto pb-1 mt-2">
            {trophies.map((t) => (
              <div key={t.id} className="shrink-0 w-[92px] text-center rounded-[12px] p-2 bg-white/[.03] border border-white/[.06]">
                <div className="mx-auto h-14 w-14"><CreaturePortrait id={t.id} className="w-full h-full" /></div>
                <p className="text-[10.5px] font-semibold mt-1 truncate">×{t.won}</p>
              </div>))}
          </div>)}
      </div>

      <Sheet accent={A} open={!!slot} onClose={() => { setSlot(null); setMsg(""); }} title={slot ? `${SLOTS.find((x) => x.slot === slot)!.label} · ${ATTRS[slot].label}` : ""}>
        {slot && <ul className="grid gap-2">
          {GEAR.filter((x) => x.slot === slot).map((x: Gear) => {
            const has = own.has(x.id), on = equipped[slot]?.id === x.id, c = TIER[x.tier].color;
            return (
              <li key={x.id} className="flex items-center gap-3 rounded-[14px] p-3 border" style={{ borderColor: on ? c : "rgba(255,255,255,.07)", opacity: has ? 1 : 0.55 }}>
                <span className="grid place-items-center h-11 w-11 shrink-0 rounded-full" style={{ background: has ? c + "1f" : "rgba(255,255,255,.04)" }}><Glyph slot={slot} color={has ? c : "rgba(255,255,255,.3)"} /></span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[14px] font-semibold">{x.name} <span className="text-[11px] font-normal" style={{ color: c }}>{TIER[x.tier].label} · +{x.pct}%</span></span>
                  <span className="block text-[12px] text-white/55">{has ? x.lore : `🔒 ${x.how}`}</span>
                </span>
                {has && <button disabled={pending || !ready} className={`btn !min-h-9 !px-3 text-[12px] ${on ? "" : "btn-accent"}`} onClick={() => act(slot, on ? null : x.id)}>{on ? "Tirar" : "Equipar"}</button>}
              </li>);
          })}
        </ul>}
        {msg && <p className="text-sm mt-3" style={{ color: A }}>{msg}</p>}
      </Sheet>
    </section>
  );
}
