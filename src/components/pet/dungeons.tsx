"use client";
import Image from "next/image";
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
  const [battle, setBattle] = useState<{ id: number; name: string; r: Result } | null>(null), [k, setK] = useState(0), [err, setErr] = useState(""), [busy, start] = useTransition();
  const p = power(d.stats), left = RUNS_PER_DAY - d.runsToday;
  useEffect(() => { if (!battle || k >= battle.r.log.length) return; const t = setTimeout(() => setK(k + 1), 420); return () => clearTimeout(t); }, [battle, k]);
  const go = (id: number) => start(async () => { setErr(""); const r = await runDungeon(id); if ("error" in r && r.error) return setErr(r.error); if ("result" in r && r.result) { setBattle({ id, name: r.dungeon, r: r.result }); setK(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? r.result.log.length : 0); } });
  const floor = battle ? DUNGEONS.find((x) => x.id === battle.id) : null;
  const cur = battle?.r.log[Math.min(k, battle.r.log.length - 1)];
  const foe = cur ? floor?.rooms[cur.foe] : null;
  const over = battle && k >= battle.r.log.length;
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
        <div className="relative mt-5 overflow-hidden rounded-2xl border border-white/15 bg-[#110e16]">
          <div className="relative isolate overflow-hidden p-4">
            <Image src={`/cards/masmorras/${battle.id}.webp`} fill alt="" unoptimized className="-z-20 object-cover" />
            <span aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,#110e16,#110e1650_75%,#110e16bb)]" />
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-xl">{battle.name}</h3>
              {cur && floor && <p className="text-xs font-semibold text-[#ffd78d]">{foe?.boss ? "Sala do chefe" : `Sala ${cur.foe + 1} de ${floor.rooms.length}`}</p>}
            </div>
            {foe && cur && <div className="mt-2 grid grid-cols-2 items-end gap-3">
              <div className="min-w-0 text-center">
                <div key={over ? "fim" : `pet-${k}`} className={!over && cur.who === "pet" ? "dg-lunge" : !over && cur.who === "foe" ? "dg-hit" : ""}>
                  <PetPortrait species={pet.species} stage={STAGES[d.stage]} size={116} adventure={!over && cur.who === "pet"} className="mx-auto" />
                </div>
                <Bar v={cur.petHp} max={d.stats.maxHp} color={GREEN} /><p className="mt-1 text-xs text-white/85">{pet.name} · {cur.petHp} PV</p>
              </div>
              <div className="min-w-0 text-center">
                <div key={over ? "fim" : `foe-${k}`} className={`mx-auto size-[116px] max-w-full ${!over && cur.who === "pet" ? "dg-hit" : ""}`} style={{ filter: cur.foeHp <= 0 ? "grayscale(1) opacity(.4)" : undefined }}>
                  <CreaturePortrait id={foe.beast} className="h-full w-full" />
                </div>
                <Bar v={cur.foeHp} max={foe.hp} color={RED} /><p className="mt-1 text-xs text-white/85">{foe.name} · {cur.foeHp} PV</p>
              </div>
            </div>}
          </div>
          <div className="p-4 pt-0">
          <ul className="mt-3 grid gap-1 max-h-40 overflow-y-auto text-[13px]">{battle.r.log.slice(Math.max(0, k - 5), k + 1).map((l, j) => <li key={j} className="chat-in" style={{ color: l.who === "pet" ? GREEN : l.who === "foe" ? "#ff8a80" : A }}>{l.t}</li>)}</ul>
          {over ? <div className="chat-in mt-3 text-center">
            <p className="font-display text-3xl" style={{ color: battle.r.win ? A : "#ff8a80" }}>{battle.r.win ? "Vitória!" : "Derrota."}</p>
            <p className="text-[13px] text-white/65">{battle.r.win ? "Andar limpo." : `Venceu ${battle.r.cleared} de ${floor?.rooms.length} salas.`} +{battle.r.gold} Ouro · +{battle.r.essence} essência (o mascote evolui com ela).</p>
            <button className="btn btn-accent w-full mt-3" onClick={() => { setBattle(null); router.refresh(); }}>Voltar</button>
          </div> : <button className="min-h-10 text-xs text-white/75 underline" onClick={() => setK(battle.r.log.length)}>Pular animação</button>}
          </div>
        </div>
      ) : (
        <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
          {DUNGEONS.map((x) => {
            const rec = recommended(x);
            const locked = x.id > d.best + 1;
            const done = x.id <= d.best;
            return (
              <article key={x.id} className="relative isolate flex min-h-40 flex-col justify-end overflow-hidden rounded-xl border bg-[#151119] p-3"
                style={{ borderColor: done ? A + "55" : "rgba(255,255,255,.14)" }}>
                <Image src={`/cards/masmorras/${x.id}.webp`} fill alt="" unoptimized
                  className={`-z-20 object-cover ${locked ? "saturate-[.55]" : ""}`} />
                <span aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,#0c0a11_5%,#0c0a11bf_46%,#0c0a1110)]" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#ffd78d]">Andar {x.id}{done ? " · Concluído" : locked ? " · Bloqueado" : ""}</p>
                <h3 className="mt-0.5 font-display text-xl leading-tight text-white">{x.name}</h3>
                <p className={`mt-1 text-xs ${p < rec ? "text-[#ffb7af]" : "text-white/80"}`}>Poder recomendado {rec} · {x.rooms.length} salas</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-[#ffd78d]">{x.gold} ouro · {x.essence} essência</p>
                  <button className="btn btn-accent !min-h-10 !px-3 text-xs disabled:opacity-50" disabled={busy || locked || !d.ready || left <= 0 || d.hp <= 0} onClick={() => go(x.id)}>{locked ? "Bloqueado" : "Entrar"}</button>
                </div>
              </article>
            );
          })}
        </div>)}
      {err && <p role="alert" className="relative mt-3 rounded-lg border border-[#ff998c55] bg-[#391a20] p-3 text-sm text-[#ffb7af]">{err}</p>}
    </section>
  );
}
