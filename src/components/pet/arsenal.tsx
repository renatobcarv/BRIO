"use client";
import { useState, useTransition } from "react";
import { buyItem, equipItem, upgradeItem } from "@/app/(app)/mascote-actions";
import { CreaturePortrait } from "@/components/body/creature-portrait";
import { GEAR, ITEM_CAP, MAX_LEVEL, PRICE, SLOTS, TIER, buyable, gearById, gearPct, upgradeCost, type Equipped, type Gear } from "@/lib/items";
import { ATTRS, type Attr } from "@/lib/game";
import { Sheet } from "@/components/kit";
import { ALL, type BeastId } from "@/lib/bestiary";

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

type Props = { owned: Record<string, string>; levels: Record<string, number>; gold: number; drops: { date: string; beast: BeastId; item: string; dup: boolean }[]; kills: number;
  equipped: Equipped; trophies: { id: BeastId; won: number }[]; ready: boolean; petName: string };
const Coin = ({ v }: { v: number }) => <span className="font-semibold" style={{ color: A }}>◉ {v.toLocaleString("pt-BR")}</span>;

export function Arsenal({ owned, levels, gold, drops, kills, equipped, trophies, ready, petName }: Props) {
  const [slot, setSlot] = useState<Attr | null>(null), [tab, setTab] = useState<"equipar" | "loja" | "evoluir">("equipar");
  const [msg, setMsg] = useState(""), [pending, start] = useTransition();
  const has = (id: string) => !!owned[id], lv = (id: string) => levels[id] ?? 1;
  const run = (f: () => Promise<string | null>, ok = "") => start(async () => { const e = await f(); setMsg(e ?? ok); if (!e) setSlot(null); });
  const Row = ({ x, children }: { x: Gear; children?: React.ReactNode }) => { const c = TIER[x.tier].color, mine = has(x.id);
    return (
      <li className="flex items-center gap-3 rounded-[14px] p-3 border" style={{ borderColor: equipped[x.slot]?.id === x.id ? c : "rgba(255,255,255,.07)", opacity: mine || tab === "loja" ? 1 : 0.55 }}>
        <span className="relative grid place-items-center h-11 w-11 shrink-0 rounded-full" style={{ background: mine ? c + "1f" : "rgba(255,255,255,.04)" }}><Glyph slot={x.slot} color={mine ? c : "rgba(255,255,255,.35)"} />
          {mine && lv(x.id) > 1 && <b className="absolute -bottom-1 -right-1 text-[9px] rounded-full px-1 bg-black border" style={{ borderColor: A, color: A }}>N{lv(x.id)}</b>}</span>
        <span className="flex-1 min-w-0">
          <span className="block text-[14px] font-semibold leading-tight">{x.name}</span>
          <span className="block text-[11px]" style={{ color: c }}>{TIER[x.tier].label} · {ATTRS[x.slot].label} · +{gearPct(x, mine ? lv(x.id) : 1)}% XP</span>
          <span className="block text-[12px] text-white/55 leading-snug">{mine ? x.lore : x.source === "conquista" ? `🔒 ${x.how}` : "Cai das feras · ou compre na loja"}</span>
        </span>{children}
      </li>); };
  return (
    <section className="hunt-card p-5 mt-6">
      <div className="flex items-end justify-between gap-3">
        <div><p className="label">Arsenal de {petName}</p><p className="font-display text-2xl mt-1">Equipamento</p></div>
        <div className="text-right"><p className="text-[22px] leading-none"><Coin v={gold} /></p><p className="text-[11px] text-white/45 mt-1">Ouro · {Object.keys(owned).length}/{GEAR.length} itens</p></div>
      </div>
      <p className="text-[12.5px] text-white/55 mt-1">Cada treino da campanha derrota a fera da semana, rende Ouro e pode deixar um item (chance maior em feras fortes e chefes). Bônus só no atributo do item, a partir do dia em que equipa; extra total limitado a {Math.round(ITEM_CAP * 100)}%.</p>
      {!ready && <p className="text-[13px] mt-3" style={{ color: A }}>Para equipar, comprar e evoluir, rode o SQL <b>20261127000000_itens.sql</b> no Supabase.</p>}

      <div className="grid grid-cols-3 gap-1 p-1 rounded-[12px] bg-white/[.05] mt-4" role="tablist">
        {(["equipar", "loja", "evoluir"] as const).map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => { setTab(t); setMsg(""); }} className={`rounded-[9px] py-2 text-[13px] font-semibold capitalize ${tab === t ? "bg-[#f5f5f7] text-black" : "text-white/65"}`}>{t}</button>)}
      </div>
      {msg && <p className="text-sm mt-3" style={{ color: A }}>{msg}</p>}

      {tab === "equipar" && <>
        <div className="grid grid-cols-3 gap-2 mt-4">
          {SLOTS.map(({ slot: s, label }) => {
            const it = equipped[s] ? gearById(equipped[s]!.id) : undefined, c = it ? TIER[it.tier].color : "rgba(255,255,255,.25)";
            const avail = GEAR.filter((x) => x.slot === s && has(x.id)).length;
            return (
              <button key={s} onClick={() => setSlot(s)} className="rounded-[14px] p-3 text-center border" style={{ borderColor: it ? c + "66" : "rgba(255,255,255,.07)", background: it ? `radial-gradient(90% 80% at 50% 20%, ${c}22, #0b0b0d 75%)` : "rgba(255,255,255,.03)" }}>
                <span className="mx-auto grid place-items-center h-11 w-11 rounded-full" style={{ background: it ? c + "1f" : "rgba(255,255,255,.04)" }}><Glyph slot={s} color={it ? c : "rgba(255,255,255,.35)"} /></span>
                <span className="block text-[10px] text-white/45 mt-1.5">{label} · {ATTRS[s].label}</span>
                <span className="block text-[12px] font-semibold leading-tight mt-0.5 line-clamp-2">{it ? it.name : avail ? `${avail} disponível` : "Vazio"}</span>
                {it && <span className="block text-[10.5px]" style={{ color: A }}>+{gearPct(it, lv(it.id))}% XP</span>}
              </button>);
          })}
        </div>
        <div className="mt-6"><p className="label">Saques recentes</p>
          {drops.length === 0 ? <p className="text-[13px] text-white/50 mt-2">{kills ? `${kills} abates até agora, nenhum item ainda. Feras mais fortes e chefes deixam mais.` : "Cumpra um treino da campanha para a primeira caçada."}</p> : (
            <ul className="mt-2 divide-y divide-white/[.06]">{drops.map((d, i) => { const it = gearById(d.item)!; return (
              <li key={i} className="flex items-center gap-3 py-2 text-[13px]"><span className="font-mono text-[11px] text-white/40 w-11">{d.date.slice(8)}/{d.date.slice(5, 7)}</span>
                <span className="flex-1 min-w-0 truncate">{ALL(d.beast).name} deixou <b style={{ color: TIER[it.tier].color }}>{it.name}</b></span>
                {d.dup && <span className="text-[11px] text-white/45">repetido → <Coin v={Math.round(PRICE[it.tier] / 3)} /></span>}</li>); })}</ul>)}
        </div>
        <div className="mt-6"><p className="label">Troféus de caça</p>
          {trophies.length === 0 ? <p className="text-[13px] text-white/50 mt-2">Vença a fera da semana no Treino para ganhar o primeiro troféu.</p> : (
            <div className="flex gap-2 overflow-x-auto pb-1 mt-2">{trophies.map((t) => (
              <div key={t.id} className="shrink-0 w-[92px] text-center rounded-[12px] p-2 bg-white/[.03] border border-white/[.06]">
                <div className="mx-auto h-14 w-14"><CreaturePortrait id={t.id} className="w-full h-full" /></div><p className="text-[10.5px] font-semibold mt-1">×{t.won}</p></div>))}</div>)}
        </div>
      </>}

      {tab === "loja" && <ul className="grid gap-2 mt-4">
        {GEAR.filter(buyable).sort((a, b) => PRICE[a.tier] - PRICE[b.tier]).map((x) => <Row key={x.id} x={x}>
          {has(x.id) ? <span className="text-[12px] text-white/45">Já é seu</span>
            : <button disabled={pending || !ready || gold < PRICE[x.tier]} className="btn btn-accent !min-h-9 !px-3 text-[12px] disabled:opacity-40" onClick={() => run(() => buyItem(x.id), `${x.name} comprado!`)}>◉ {PRICE[x.tier]}</button>}
        </Row>)}
        <p className="text-[12px] text-white/45">Itens de conquista não se compram: só se ganham.</p>
      </ul>}

      {tab === "evoluir" && <ul className="grid gap-2 mt-4">
        {GEAR.filter((x) => has(x.id)).length === 0 && <p className="text-[13px] text-white/50">Ganhe ou compre um item para poder evoluí-lo.</p>}
        {GEAR.filter((x) => has(x.id)).map((x) => { const l = lv(x.id), cost = upgradeCost(x, l); return <Row key={x.id} x={x}>
          {l >= MAX_LEVEL ? <span className="text-[12px]" style={{ color: A }}>Nível máx.</span>
            : <button disabled={pending || !ready || gold < cost} className="btn !min-h-9 !px-3 text-[12px] disabled:opacity-40" onClick={() => run(() => upgradeItem(x.id), `${x.name} subiu para o nível ${l + 1}!`)}>N{l}→{l + 1} · ◉ {cost}</button>}
        </Row>; })}
      </ul>}

      <Sheet accent={A} open={!!slot} onClose={() => setSlot(null)} title={slot ? `${SLOTS.find((x) => x.slot === slot)!.label} · ${ATTRS[slot].label}` : ""}>
        {slot && <ul className="grid gap-2">{GEAR.filter((x) => x.slot === slot).map((x) => { const on = equipped[slot]?.id === x.id; return <Row key={x.id} x={x}>
          {has(x.id) && <button disabled={pending || !ready} className={`btn !min-h-9 !px-3 text-[12px] ${on ? "" : "btn-accent"}`} onClick={() => run(() => equipItem(slot, on ? null : x.id))}>{on ? "Tirar" : "Equipar"}</button>}
        </Row>; })}</ul>}
      </Sheet>
    </section>
  );
}
