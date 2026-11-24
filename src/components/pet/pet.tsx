"use client";
import { PetRoulette } from "./roulette";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { choosePet, drawPet, renamePet } from "@/app/(app)/mascote-actions";
import { PetPortrait } from "./portrait";
import { PetKingdom, type PetHud } from "./kingdom";
import { Sheet } from "@/components/kit";
import { DRAWS_PER_MONTH, DUPLICATE_ESSENCE, RARITY, SPECIES, STAGES, speciesOf, stageOf, type PetStage } from "@/lib/pet";

export type PetView = { id: string; name: string; species: string; adopted_on: string; essence: number; stage: PetStage; next: PetStage | null; progress: number; mood: string; idle: number;
  todayBuff: { label: string; pct: number } | null; buffs: { date: string; label: string }[]; feedToday: number; fed: { date: string; xp: number; label: string }[]; bonusTotal: number };

const MOOD: Record<string, { t: string; c: string }> = {
  alimentado: { t: "Alimentado hoje", c: "#30d158" }, satisfeito: { t: "Satisfeito", c: "#ffb21e" }, "com fome": { t: "Com fome", c: "#ffd28a" }, faminto: { t: "Faminto", c: "#ff453a" },
};

export function PetArt({ p, size = 260 }: { p: Pick<PetView, "name" | "species" | "mood" | "stage">; size?: number }) {
  const hungry = p.mood === "faminto" || p.mood === "com fome";
  const sp = speciesOf(p.species);
  const lateStage = p.stage.from >= STAGES[4].from;

  return (
    <div className="relative grid aspect-square place-items-center shrink-0" style={{ width: `min(${size}px, 100%)` }}>
      <div className="absolute inset-0 rounded-full pet-aura" style={{ background: `radial-gradient(circle, ${p.stage.aura}${hungry ? "22" : "55"}, transparent 65%)` }} />
      {lateStage && <div className="absolute inset-[6%] rounded-full border pet-aura" style={{ borderColor: `${RARITY[sp.rarity].color}55` }} />}
      <div className={`relative pet-breathe ${hungry ? "grayscale-[.7] brightness-[.65]" : ""}`} style={{ width: `${70 + p.stage.scale * 26}%` }}>
        <PetPortrait species={sp.key} stage={p.stage} size={size} className="h-auto w-full" alt={`${p.name}, ${sp.name}, fase ${p.stage.name}`} />
      </div>
    </div>
  );
}

export function PetCard({ p }: { p: PetView | null }) {
  if (!p) return (
    <Link href="/mascote" className="hunt-card block p-4 mt-4">
      <p className="label">Mascote</p><p className="font-semibold mt-1">Sorteie seu primeiro mascote →</p><p className="text-[12px] text-white/50">Ele cresce com o que você faz e às vezes te dá bônus de XP.</p>
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
export function PetPage({ p, ready, draws, month, today, hud }: { p: PetView | null; ready: boolean; draws: Draw[]; month: string; today: string; hud?: PetHud | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [rolling, setRolling] = useState(false);
  const [got, setGot] = useState<{ species: string; duplicate: boolean } | null>(null);
  const [spin, setSpin] = useState<{ species: string; duplicate: boolean } | null>(null);
  const [pick, setPick] = useState<string | null>(null), [name, setName] = useState("");
  const [evolution, setEvolution] = useState<PetStage | null>(null);
  const petId = p?.id;
  const stageFrom = p?.stage.from;
  const previousEvolution = evolution && evolution.from > 0 ? stageOf(evolution.from - 1) : null;

  useEffect(() => {
    if (!petId || stageFrom == null) return;
    const key = `brio:mascote:fase:${petId}`;
    try {
      const saved = localStorage.getItem(key);
      localStorage.setItem(key, String(stageFrom));
      if (saved != null && stageFrom > Number(saved)) setEvolution(stageOf(stageFrom));
    } catch {
      // A prévia continua disponível quando o armazenamento local estiver desativado.
    }
  }, [petId, stageFrom]);

  if (!ready) return <p className="hunt-card p-5 text-sm">Rode a migração <code className="text-[#ffb21e]">20261125000000_mascote.sql</code> no Supabase.</p>;
  const owned = new Set(draws.map((d) => d.species));
  const used = draws.filter((d) => d.month === month && !d.free).length, firstFree = draws.length === 0;
  const left = firstFree ? 1 : Math.max(0, DRAWS_PER_MONTH - used);
  const doDraw = () => start(async () => {
    setErr(null); setGot(null); setSpin(null); setRolling(true);
    const r = await drawPet().catch(() => ({ error: "Sem conexão." }) as { error: string });
    if ("error" in r && r.error) { setRolling(false); setErr(r.error); return; }
    const rr = r as { species: string; duplicate: boolean };
    setSpin({ species: rr.species, duplicate: rr.duplicate }); // a roleta revela quando parar
  });
  const m = p ? MOOD[p.mood] ?? MOOD.satisfeito : null, hungry = p ? p.mood === "faminto" || p.mood === "com fome" : false;
  const chance = (k: string) => { const s = speciesOf(k); const tot = Object.values(RARITY).reduce((a, r) => a + r.weight, 0); return (RARITY[s.rarity].weight / SPECIES.filter((x) => x.rarity === s.rarity).length / tot) * 100; };

  return (
    <div className="grid gap-4">
      <PetKingdom key={p?.id ?? "visitante"} pet={p} today={today} hud={hud} />
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
        <div className={`grid place-items-center min-h-[240px] min-w-0 ${spin ? "lg:col-span-2 lg:order-first" : ""}`}>
          {spin ? <PetRoulette result={spin.species} onDone={() => { setGot(spin); setSpin(null); setRolling(false); router.refresh(); }} />
            : rolling ? <span className="text-[110px] pet-spin" aria-label="Sorteando">❔</span>
            : got ? (() => { const s = speciesOf(got.species), r = RARITY[s.rarity]; return (
              <div className="text-center pet-reveal">
                <PetPortrait species={s.key} stage={STAGES[0]} size={168} className="mx-auto pet-breathe" />
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
              <PetPortrait species={s.key} stage={active && p ? p.stage : STAGES[0]} size={64} className={`mx-auto ${has ? "" : "brightness-[.17] grayscale"}`} />
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
                  <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left hover:text-[#ffb21e]"
                    onClick={() => setEvolution(s)} aria-current={on ? "step" : undefined} aria-label={`Ver evolução: ${s.name}`}>
                    <PetPortrait species={p.species} stage={s} size={40} />
                    <span className="font-semibold">{s.name}</span>
                  </button>
                  <span className="font-mono text-[11px] text-white/50">{s.from.toLocaleString("pt-BR")}</span>
                  <span className="font-mono text-[11px] text-[#ffb21e] w-28 text-right">{Math.round(s.buffChance * 100)}% · até +{Math.round(s.buffMax * 100)}%</span>
                </li>); })}
            </ol>
            <p className="text-[11.5px] text-white/45 mt-2">Toque numa fase para ver a evolução. À direita estão a chance de bônus por dia e o bônus máximo.</p>
          </section>
          <section className="hunt-card p-5">
            <p className="label mb-3">Do que ele se alimentou</p>
            {p.fed.length === 0 ? <p className="text-[13px] text-white/50">Ainda nada. Registre um treino, estudo ou leitura.</p> : (
              <ul className="divide-y divide-white/[.06]">{p.fed.map((f, i) => <li key={i} className="flex items-center gap-3 py-2 text-[13px]"><span className="font-mono text-[11px] text-white/40 w-12">{f.date.slice(8)}/{f.date.slice(5, 7)}</span><span className="flex-1 truncate">{f.label}</span><span className="num" style={{ color: "#ffb21e" }}>+{f.xp}</span></li>)}</ul>)}
            {p.buffs.length > 0 && <><p className="label mt-5 mb-2">Últimos bônus</p><ul className="grid gap-1">{p.buffs.slice(0, 5).map((b) => <li key={b.date} className="text-[12.5px] text-white/65"><span className="font-mono text-white/40 mr-2">{b.date.slice(8)}/{b.date.slice(5, 7)}</span>{b.label}</li>)}</ul></>}
          </section>
        </div>)}

      <Sheet open={!!(p && evolution)} onClose={() => setEvolution(null)} title="Evolução do mascote">
        {p && evolution && (
          <div key={evolution.key} className="text-center">
            <div className="relative isolate mx-auto grid aspect-square w-full max-w-xs place-items-center">
              {previousEvolution && (
                <div className="pet-evolution-previous absolute inset-0 grid place-items-center">
                  <PetPortrait species={p.species} stage={previousEvolution} size={240} className="w-[80%]" />
                </div>
              )}
              <div className={`grid w-full place-items-center ${previousEvolution ? "pet-evolution-result" : ""}`}>
                <PetArt p={{ ...p, mood: "alimentado", stage: evolution }} size={300} />
              </div>
              <Image src="/mascotes/evolucao.webp" alt="" width={384} height={384} unoptimized
                className="pet-evolution-art pointer-events-none absolute inset-0 h-full w-full object-contain" />
            </div>
            <p className="font-display text-3xl">{evolution.name}</p>
            <p className="text-sm text-white/65 mt-1">
              {evolution.from <= p.essence ? `${p.name} · ${speciesOf(p.species).name}` : `Prévia · ${evolution.from.toLocaleString("pt-BR")} de essência`}
            </p>
          </div>
        )}
      </Sheet>

      {pick && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Escolher mascote">
          <form className="hunt-card w-full max-w-sm p-6 text-center" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await choosePet(pick, name); if (r) setErr(r); else { setPick(null); setGot(null); router.refresh(); } }); }}>
            <PetPortrait species={pick} stage={p?.stage ?? STAGES[0]} size={120} className="mx-auto pet-breathe" />
            <p className="font-display text-3xl mt-2">{speciesOf(pick).name}</p>
            <p className="text-[13px] text-white/55 mt-1">{speciesOf(pick).trait}</p>
            <input className="field mt-4 text-center" placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} autoFocus />
            <div className="flex gap-2 mt-4"><button type="button" className="btn flex-1" onClick={() => setPick(null)}>Cancelar</button><button className="btn btn-accent flex-1" disabled={pending || !name.trim()}>Confirmar</button></div>
          </form>
        </div>)}
    </div>);
}
