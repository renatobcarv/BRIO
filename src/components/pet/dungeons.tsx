"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { runDungeon } from "@/app/(app)/mascote-actions";
import { CreaturePortrait } from "@/components/body/creature-portrait";
import { PetPortrait } from "./portrait";
import { DUNGEONS, RUNS_PER_DAY, SKILLS, power, recommended, type Line, type Stats } from "@/lib/dungeon";
import { STAGES } from "@/lib/pet";

const A = "#ffb21e", RED = "#ff453a", GREEN = "#30d158";
type D = { ready: boolean; stage: number; stats: Stats; hp: number; best: number; runsToday: number };
type Result = { win: boolean; cleared: number; hp: number; log: Line[]; gold: number; essence: number };

function Bar({ v, max, color }: { v: number; max: number; color: string }) {
  return <div className="h-2.5 rounded-full bg-white/10 overflow-hidden"><i className="block h-full rounded-full transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, (v / Math.max(1, max)) * 100))}%`, background: color }} /></div>;
}

/** Masmorras: o mascote luta com as habilidades da fase; vida regenera com o tempo. */
export function Dungeons({ d, pet }: { d: D; pet: { name: string; species: string } }) {
  const router = useRouter();
  const [battle, setBattle] = useState<{ name: string; r: Result } | null>(null), [k, setK] = useState(0), [err, setErr] = useState(""), [busy, start] = useTransition();
  const p = power(d.stats), left = RUNS_PER_DAY - d.runsToday;
  useEffect(() => { if (!battle || k >= battle.r.log.length) return; const t = setTimeout(() => setK(k + 1), 420); return () => clearTimeout(t); }, [battle, k]);
  const go = (id: number) => start(async () => { setErr(""); const r = await runDungeon(id); if ("error" in r && r.error) return setErr(r.error); if ("result" in r && r.result) { setBattle({ name: r.dungeon, r: r.result }); setK(0); } });
  const cur = battle ? battle.r.log[Math.min(k, battle.r.log.length - 1)] : null, foe = battle && cur ? DUNGEONS.find((x) => x.name === battle.name)!.rooms[cur.foe] : null, over = battle && k >= battle.r.log.length;
  return (
    <section className="hunt-card p-5 mt-6 relative overflow-hidden">
      <div aria-hidden className="absolute -left-16 -top-16 h-56 w-56 rounded-full" style={{ background: `radial-gradient(circle, ${RED}22, transparent 70%)` }} />
      <div className="relative flex items-end justify-between gap-3">
        <div><p className="label">Masmorras</p><p className="font-display text-2xl mt-1">{pet.name} vai à caça</p></div>
        <p className="text-right text-[12px] text-white/55"><span className="text-[22px] font-bold" style={{ color: A }}>{p}</span> de poder<br />{left > 0 ? `${left} entrada(s) hoje` : "Volta amanhã"}</p>
      </div>
      {!d.ready && <p className="text-[13px] mt-3" style={{ color: A }}>Rode o SQL <b>20261203000000_masmorras.sql</b> no Supabase para liberar as masmorras.</p>}

      <div className="relative mt-4 grid grid-cols-[88px_1fr] gap-4 items-center">
        <PetPortrait species={pet.species} stage={STAGES[d.stage]} size={88} />
        <div>
          <div className="flex justify-between text-[12px]"><span>Vida</span><span className="font-mono">{d.hp}/{d.stats.maxHp}</span></div>
          <Bar v={d.hp} max={d.stats.maxHp} color={d.hp < d.stats.maxHp * 0.3 ? RED : GREEN} />
          <p className="text-[11px] text-white/45 mt-1">Regenera 25% por hora. Fase {STAGES[d.stage].name}.</p>
          <div className="grid grid-cols-3 gap-1 mt-2 text-center text-[11px]">{([["Ataque", d.stats.atk], ["Defesa", d.stats.def], ["Velocidade", d.stats.spd]] as const).map(([l, v]) => <span key={l} className="rounded-[8px] bg-white/[.05] py-1"><b className="block text-[14px]">{v}</b>{l}</span>)}</div>
        </div>
      </div>

      <div className="relative mt-4"><p className="text-[12px] text-white/55 mb-1.5">Habilidades (cada fase libera uma)</p>
        <div className="flex flex-wrap gap-1.5">{SKILLS.map((s) => { const on = s.stage <= d.stage; return <span key={s.key} title={s.desc} className="rounded-full px-2.5 py-1 text-[11.5px] border" style={{ borderColor: on ? A + "66" : "rgba(255,255,255,.08)", color: on ? "#fff" : "rgba(255,255,255,.35)" }}>{on ? s.name : `🔒 ${s.name} · ${STAGES[s.stage].name}`}</span>; })}</div></div>

      {battle ? (
        <div className="relative mt-5 rounded-[16px] border border-white/10 bg-black/40 p-4">
          <p className="label" style={{ color: A }}>{battle.name}</p>
          {foe && cur && <div className="grid grid-cols-2 gap-3 mt-2 items-center">
            <div className="text-center"><PetPortrait species={pet.species} stage={STAGES[d.stage]} size={72} className={`mx-auto ${cur.who === "foe" ? "dg-hit" : ""}`} /><Bar v={cur.petHp} max={d.stats.maxHp} color={GREEN} /><p className="text-[11px] mt-1 font-mono">{cur.petHp}</p></div>
            <div className="text-center"><div className={`mx-auto h-[72px] w-[72px] ${cur.who === "pet" ? "dg-hit" : ""}`} style={{ filter: cur.foeHp <= 0 ? "grayscale(1) opacity(.4)" : undefined }}><CreaturePortrait id={foe.beast} className="w-full h-full" /></div><Bar v={cur.foeHp} max={foe.hp} color={RED} /><p className="text-[11px] mt-1">{foe.name}</p></div>
          </div>}
          <ul className="mt-3 grid gap-1 max-h-40 overflow-y-auto text-[13px]">{battle.r.log.slice(Math.max(0, k - 5), k + 1).map((l, j) => <li key={j} className="chat-in" style={{ color: l.who === "pet" ? GREEN : l.who === "foe" ? "#ff8a80" : A }}>{l.t}</li>)}</ul>
          {over ? <div className="chat-in mt-3 text-center">
            <p className="font-display text-3xl" style={{ color: battle.r.win ? A : "#ff8a80" }}>{battle.r.win ? "Vitória!" : "Derrota."}</p>
            <p className="text-[13px] text-white/65">{battle.r.win ? "Andar limpo." : `Venceu ${battle.r.cleared} de ${DUNGEONS.find((x) => x.name === battle.name)!.rooms.length} salas.`} +{battle.r.gold} Ouro · +{battle.r.essence} essência (o mascote evolui com ela).</p>
            <button className="btn btn-accent w-full mt-3" onClick={() => { setBattle(null); router.refresh(); }}>Voltar</button>
          </div> : <button className="text-[12px] text-white/45 mt-2 underline" onClick={() => setK(battle.r.log.length)}>Pular animação</button>}
        </div>
      ) : (
        <div className="relative mt-5 grid gap-2">
          {DUNGEONS.map((x) => { const rec = recommended(x), locked = x.id > d.best + 1, ok = p >= rec, done = x.id <= d.best; return (
            <div key={x.id} className="flex items-center gap-3 rounded-[14px] border p-3" style={{ borderColor: done ? A + "44" : "rgba(255,255,255,.07)", opacity: locked ? 0.45 : 1 }}>
              <div className="h-12 w-12 shrink-0" style={{ filter: locked ? "grayscale(1) brightness(.3)" : undefined }}><CreaturePortrait id={x.rooms.at(-1)!.beast} className="w-full h-full" /></div>
              <div className="flex-1 min-w-0"><p className="text-[14px] font-semibold truncate">{x.id}. {x.name} {done && <span style={{ color: A }}>✓</span>}</p>
                <p className="text-[11.5px]" style={{ color: ok ? "rgba(255,255,255,.55)" : "#ff8a80" }}>Poder recomendado {rec} · {x.rooms.length} salas · +{x.gold} Ouro</p></div>
              <button className="btn !min-h-9 !px-3 text-[12px] btn-accent disabled:opacity-40" disabled={busy || locked || !d.ready || left <= 0} onClick={() => go(x.id)}>{locked ? "🔒" : "Enviar"}</button>
            </div>); })}
        </div>)}
      {err && <p className="relative text-[13px] mt-3" style={{ color: A }}>{err}</p>}
    </section>
  );
}
