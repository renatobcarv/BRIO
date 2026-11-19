"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { choosePet, drawPet, renamePet } from "@/app/(app)/mascote-actions";
import { DRAWS_PER_MONTH, DUPLICATE_ESSENCE, RARITY, SPECIES, STAGES, speciesOf, type PetStage } from "@/lib/pet";

export type PetView = { id: string; name: string; species: string; adopted_on: string; essence: number; stage: PetStage; next: PetStage | null; progress: number; mood: string; idle: number;
  todayBuff: { label: string; pct: number } | null; buffs: { date: string; label: string }[]; feedToday: number; fed: { date: string; xp: number; label: string }[]; bonusTotal: number };

const MOOD: Record<string, { t: string; c: string }> = {
  alimentado: { t: "Alimentado hoje", c: "#30d158" }, satisfeito: { t: "Satisfeito", c: "#ffb21e" }, "com fome": { t: "Com fome", c: "#ff7a5c" }, faminto: { t: "Faminto", c: "#ff453a" },
};

/** O mascote: tamanho, aura e brilho mudam com a fase; a fome deixa ele apagado. */
export function PetArt({ p, size = 260 }: { p: Pick<PetView, "name" | "species" | "mood" | "stage">; size?: number }) {
  const hungry = p.mood === "faminto" || p.mood === "com fome", sp = speciesOf(p.species), lvl = STAGES.indexOf(p.stage);
  return (
    <div className="relative grid place-items-center shrink-0" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full pet-aura" style={{ background: `radial-gradient(circle, ${p.stage.aura}${hungry ? "22" : "55"}, transparent 65%)` }} />
      {lvl >= 4 && <div className="absolute inset-[6%] rounded-full border pet-aura" style={{ borderColor: `${RARITY[sp.rarity].color}55` }} />}
      {sp.key === "pantera"
        ? <img src="/pantera/mascote.webp" alt={`${p.name}, ${p.stage.name}`} className="relative object-contain pet-breathe pet-img" style={{ width: size * p.stage.scale, height: size * p.stage.scale, filter: hungry ? "grayscale(.7) brightness(.6)" : `brightness(${1.3 + lvl * 0.1})` }} />
        : <span role="img" aria-label={`${p.name}, ${sp.name}, ${p.stage.name}`} className="relative pet-breathe pet-glyph" style={{ fontSize: size * 0.48 * p.stage.scale, color: hungry ? "#6b6b70" : "#fff", textShadow: hungry ? "none" : `0 0 ${6 + lvl * 5}px ${p.stage.aura}, 0 0 ${2 + lvl * 2}px ${RARITY[sp.rarity].color}` }}>{sp.glyph}</span>}
    </div>
  );
}

export function PetCard({ p }: { p: PetView | null }) {
  if (!p) return (
    <Link href="/mascote" className="hunt-card block p-4 mt-4">
      <p className="label">Mascote</p><p className="font-semibold mt-1">Adote seu filhote de pantera →</p><p className="text-[12px] text-white/50">Ele cresce com o que você faz e às vezes te dá bônus de XP.</p>
    </Link>);
  const m = MOOD[p.mood] ?? MOOD.satisfeito;
  return (
    <Link href="/mascote" className="hunt-card flex items-center gap-4 p-4 mt-4">
      <PetArt p={p} size={84} />
      <div className="min-w-0 flex-1">
        <p className="label">{p.stage.name} · <span style={{ color: m.c }}>{m.t}</span></p>
        <p className="font-display text-2xl truncate">{p.name}</p>
        <div className="flex gap-[2px] mt-2" aria-hidden>{Array.from({ length: 12 }, (_, i) => <i key={i} className="h-[4px] flex-1" style={{ background: i < Math.round(p.progress * 12) ? p.stage.aura : "rgba(255,255,255,.08)" }} />)}</div>
        <p className="text-[11.5px] mt-1.5" style={{ color: p.todayBuff ? "#ffb21e" : undefined }}>{p.todayBuff ? `Bônus hoje: ${p.todayBuff.label}` : "Sem bônus hoje. Talvez amanhã."}</p>
      </div>
    </Link>);
}

type Draw = { species: string; month: string; free: boolean; duplicate: boolean };
export function PetPage({ p, ready, draws, month }: { p: PetView | null; ready: boolean; draws: Draw[]; month: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [rolling, setRolling] = useState(false);
  const [got, setGot] = useState<{ species: string; duplicate: boolean } | null>(null);
  const [pick, setPick] = useState<string | null>(null), [name, setName] = useState("");
  if (!ready) return <p className="hunt-card p-5 text-sm">Rode a migração <code className="text-[#ffb21e]">20261125000000_mascote.sql</code> no Supabase.</p>;
  const owned = new Set(draws.map((d) => d.species));
  const used = draws.filter((d) => d.month === month && !d.free).length, firstFree = draws.length === 0;
  const left = firstFree ? 1 : Math.max(0, DRAWS_PER_MONTH - used);
  const doDraw = () => start(async () => {
    setErr(null); setGot(null); setRolling(true);
    const [r] = await Promise.all([drawPet().catch(() => ({ error: "Sem conexão." }) as { error: string }), new Promise((ok) => setTimeout(ok, 1600))]);
    setRolling(false);
    if ("error" in r && r.error) { setErr(r.error); return; }
    const rr = r as { species: string; duplicate: boolean };
    setGot({ species: rr.species, duplicate: rr.duplicate }); router.refresh();
  });
  const m = p ? MOOD[p.mood] ?? MOOD.satisfeito : null, hungry = p ? p.mood === "faminto" || p.mood === "com fome" : false;
  const chance = (k: string) => { const s = speciesOf(k); const tot = Object.values(RARITY).reduce((a, r) => a + r.weight, 0); return (RARITY[s.rarity].weight / SPECIES.filter((x) => x.rarity === s.rarity).length / tot) * 100; };

  return (
    <div className="grid gap-4">
      {p && m && (
        <section className="hunt-card relative overflow-hidden p-6 lg:p-8 grid lg:grid-cols-2 gap-6 items-center">
          <div className="grid place-items-center"><PetArt p={p} size={300} /></div>
          <div>
            <p className="label">{speciesOf(p.species).name} · {p.stage.name} · <span style={{ color: m.c }}>{m.t}</span></p>
            <button className="font-display text-6xl mt-1 text-left hover:text-[#ffb21e]" title="Renomear" onClick={() => { const n = prompt("Novo nome", p.name)?.trim(); if (n) start(async () => { await renamePet(n); router.refresh(); }); }}>{p.name}</button>
            <p className="text-white/55 mt-2 text-[14px]">{speciesOf(p.species).trait} Desde {p.adopted_on.split("-").reverse().join("/")} · {p.essence.toLocaleString("pt-BR")} de essência · {p.bonusTotal.toLocaleString("pt-BR")} XP de bônus que ele já te deu.</p>
            <div className="mt-5 flex justify-between label !text-[9px]"><span>{p.stage.name}</span><span style={{ color: "#ffb21e" }}>{p.next ? `${p.next.name} em ${(p.next.from - p.essence).toLocaleString("pt-BR")}` : "Fase máxima"}</span></div>
            <div className="flex gap-[3px] mt-1.5" aria-hidden>{Array.from({ length: 20 }, (_, i) => <i key={i} className="h-[6px] flex-1" style={{ background: i < Math.round(p.progress * 20) ? p.stage.aura : "rgba(255,255,255,.08)" }} />)}</div>
            <div className={`mt-5 border p-4 rounded-[8px] ${p.todayBuff ? "border-[#ffb21e66] bg-[#ffb21e10]" : "border-white/10"}`}>
              <p className="label !text-[9px]">Bônus de hoje</p>
              <p className="font-display text-3xl mt-1" style={{ color: p.todayBuff ? "#ffb21e" : "#8a8a90" }}>{p.todayBuff ? p.todayBuff.label : "Nenhum hoje"}</p>
              <p className="text-[12.5px] text-white/55 mt-1">{p.todayBuff ? "Vale para todo XP que você ganhar hoje. Aproveite." : hungry ? "Com fome ele não dá bônus. Faça algo hoje para alimentá-lo." : `Chance diária na fase ${p.stage.name}: ${Math.round(p.stage.buffChance * 100)}%. Não é sempre: volte amanhã.`}</p>
            </div>
            <p className="text-[12.5px] mt-3 text-white/60">Comeu hoje: <b className="text-white">{p.feedToday} de essência</b></p>
          </div>
        </section>)}

      {/* Sorteio */}
      <section className="hunt-card relative overflow-hidden p-6 lg:p-8 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 items-center">
        <div>
          <p className="label">Sorteio</p>
          <h2 className="font-display text-4xl mt-1">{p ? "Tente a sorte" : "Sorteie seu primeiro mascote"}<span className="text-[#ffb21e]">.</span></h2>
          <p className="text-white/60 text-[14px] mt-2">{firstFree ? "O primeiro sorteio é grátis." : `${left} de ${DRAWS_PER_MONTH} sorteios restantes em ${month.split("-").reverse().join("/")}.`} Repetido vira +{DUPLICATE_ESSENCE} de essência para o mascote ativo. O dragão sai em cerca de 1 a cada 100.</p>
          <button className="btn btn-accent mt-5 !min-h-14 !px-8" disabled={pending || left <= 0} onClick={doDraw}>{rolling ? "Sorteando…" : left > 0 ? "Sortear" : "Sem sorteios este mês"}</button>
          {err && <p className="text-[12.5px] text-[#ff453a] mt-3" role="alert">{err}</p>}
        </div>
        <div className="grid place-items-center min-h-[240px]">
          {rolling ? <span className="text-[110px] pet-spin" aria-label="Sorteando">❔</span>
            : got ? (() => { const s = speciesOf(got.species), r = RARITY[s.rarity]; return (
              <div className="text-center pet-reveal">
                <span className="block text-[120px] leading-none pet-glyph" style={{ textShadow: `0 0 30px ${r.color}` }}>{s.glyph}</span>
                <p className="label mt-3" style={{ color: r.color }}>{r.label}</p>
                <p className="font-display text-4xl">{s.name}</p>
                <p className="text-[13px] text-white/60 mt-1">{got.duplicate ? `Repetido: +${DUPLICATE_ESSENCE} de essência.` : "Novo na coleção!"}</p>
                {!got.duplicate && <button className="btn mt-3" onClick={() => { setPick(s.key); setName(""); }}>{p ? "Tornar meu mascote" : "Adotar"}</button>}
              </div>); })()
            : <span className="text-[90px] opacity-30" aria-hidden>❔</span>}
        </div>
      </section>

      {/* Coleção */}
      <section className="hunt-card p-5">
        <div className="flex items-baseline justify-between mb-3"><p className="label">Coleção</p><span className="font-mono text-[12px] text-[#ffb21e]">{owned.size}/{SPECIES.length}</span></div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {SPECIES.map((s) => { const has = owned.has(s.key), r = RARITY[s.rarity], active = p?.species === s.key; return (
            <button key={s.key} disabled={!has || active} onClick={() => { setPick(s.key); setName(p?.name ?? ""); }}
              className={`relative text-center border rounded-[8px] p-3 transition-colors ${active ? "border-[#ffb21e] bg-[#ffb21e10]" : has ? "border-white/10 hover:border-white/30" : "border-white/[.05]"}`}>
              <span className="block text-[46px] leading-none pet-glyph" style={has ? { textShadow: `0 0 14px ${r.color}88` } : { filter: "brightness(0)", opacity: .5 }}>{s.glyph}</span>
              <span className="block text-[13px] font-semibold mt-2">{has ? s.name : "???"}</span>
              <span className="block text-[10px] font-mono mt-0.5" style={{ color: r.color }}>{r.label} · {chance(s.key).toFixed(1).replace(".", ",")}%</span>
              {active && <span className="absolute top-1.5 right-1.5 text-[9px] uppercase tracking-wider text-[#ffb21e]">ativo</span>}
            </button>); })}
        </div>
        <p className="text-[11.5px] text-white/45 mt-2">Toque num mascote que você já tem para torná-lo o ativo. A essência e a fase continuam: o vínculo é seu.</p>
      </section>

      {p && (
        <div className="grid lg:grid-cols-2 gap-4">
          <section className="hunt-card p-5">
            <p className="label mb-3">Fases</p>
            <ol className="grid gap-px bg-white/[.06] border border-white/[.06]">
              {STAGES.map((s) => { const on = s.key === p.stage.key, done = p.essence >= s.from; return (
                <li key={s.key} className={`flex items-center gap-3 px-3 py-2.5 ${on ? "bg-[#140303]" : "bg-[#080808]"} ${done ? "" : "opacity-55"}`}>
                  <i className="h-3 w-3 rounded-full" style={{ background: s.aura, boxShadow: on ? `0 0 10px ${s.aura}` : "none" }} />
                  <span className="flex-1 font-semibold">{s.name}</span>
                  <span className="font-mono text-[11px] text-white/50">{s.from.toLocaleString("pt-BR")}</span>
                  <span className="font-mono text-[11px] text-[#ffb21e] w-28 text-right">{Math.round(s.buffChance * 100)}% · até +{Math.round(s.buffMax * 100)}%</span>
                </li>); })}
            </ol>
            <p className="text-[11.5px] text-white/45 mt-2">À direita: chance de bônus por dia e tamanho máximo do bônus.</p>
          </section>
          <section className="hunt-card p-5">
            <p className="label mb-3">Do que ele se alimentou</p>
            {p.fed.length === 0 ? <p className="text-[13px] text-white/50">Ainda nada. Registre um treino, estudo ou leitura.</p> : (
              <ul className="divide-y divide-white/[.06]">{p.fed.map((f, i) => <li key={i} className="flex items-center gap-3 py-2 text-[13px]"><span className="font-mono text-[11px] text-white/40 w-12">{f.date.slice(8)}/{f.date.slice(5, 7)}</span><span className="flex-1 truncate">{f.label}</span><span className="num" style={{ color: "#ffb21e" }}>+{f.xp}</span></li>)}</ul>)}
            {p.buffs.length > 0 && <><p className="label mt-5 mb-2">Últimos bônus</p><ul className="grid gap-1">{p.buffs.slice(0, 5).map((b) => <li key={b.date} className="text-[12.5px] text-white/65"><span className="font-mono text-white/40 mr-2">{b.date.slice(8)}/{b.date.slice(5, 7)}</span>{b.label}</li>)}</ul></>}
          </section>
        </div>)}

      {pick && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Escolher mascote">
          <form className="hunt-card w-full max-w-sm p-6 text-center" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await choosePet(pick, name); if (r) setErr(r); else { setPick(null); setGot(null); router.refresh(); } }); }}>
            <span className="block text-[80px] leading-none pet-glyph">{speciesOf(pick).glyph}</span>
            <p className="font-display text-3xl mt-2">{speciesOf(pick).name}</p>
            <p className="text-[13px] text-white/55 mt-1">{speciesOf(pick).trait}</p>
            <input className="field mt-4 text-center" placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} autoFocus />
            <div className="flex gap-2 mt-4"><button type="button" className="btn flex-1" onClick={() => setPick(null)}>Cancelar</button><button className="btn btn-accent flex-1" disabled={pending || !name.trim()}>Confirmar</button></div>
          </form>
        </div>)}
    </div>);
}
