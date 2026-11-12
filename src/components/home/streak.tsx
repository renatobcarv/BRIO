"use client";
import { useState, useTransition } from "react";
import { markClean, relapse } from "@/app/(app)/home-actions";
import { useXp } from "@/components/game/xp";
import { MILESTONES, cleanXp, fireTier, nextFire } from "@/lib/clean";
import { CountUp } from "@/components/count-up";

export type DayState = { date: string; label: string; state: "done" | "relapse" | "none" | "future"; today: boolean };

/** Fogo que cresce com a sequência: mais chamas, brasas e brilho a cada faixa. */
function Fire({ n }: { n: number }) {
  const t = fireTier(n), lit = n > 0;
  const tongue = (k: number) => { const side = k % 2 ? 1 : -1, off = 10 + Math.floor(k / 2) * 7; return (
    <path key={k} d={`M${32 + side * off} ${30 + k * 3}c2 7 9 11 9 20a9 9 0 0 1-18 0c0-5 3-8 5-10 0 3 2 5 3 5-1-6 0-10 1-15z`} transform={`translate(${-side * 2} 4) scale(.8)`}
      style={{ transformOrigin: `${32 + side * off}px 70px`, animationDelay: `${k * 0.2}s` }} className="flame" fill={`url(#flA${n})`} opacity=".85" />); };
  return (
    <div className="relative shrink-0 grid place-items-center" style={{ width: 76 * t.scale + 10, height: 88 * t.scale + 12 }}>
      {lit && <div className="absolute inset-0 rounded-full fire-aura" style={{ background: `radial-gradient(50% 50% at 50% 65%, ${t.color}${n >= 14 ? "66" : "40"}, transparent 70%)` }} />}
      {Array.from({ length: t.embers }, (_, i) => <span key={i} className="absolute bottom-6 rounded-full fire-ember" style={{ left: `${20 + ((i * 37) % 60)}%`, width: 2 + (i % 2), height: 2 + (i % 2), background: i % 3 ? t.color : t.core, animationDelay: `${(i % 6) * 0.35}s`, animationDuration: `${1.6 + (i % 4) * 0.3}s` }} />)}
      <svg width={72 * t.scale} height={84 * t.scale} viewBox="0 0 64 74" className="relative overflow-visible" aria-hidden style={lit ? { filter: `drop-shadow(0 0 ${6 + t.flames * 5}px ${t.color})` } : undefined}>
        <defs>
          <linearGradient id={`flA${n}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={t.core} /><stop offset="1" stopColor={t.color} /></linearGradient>
          <linearGradient id={`flB${n}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor={t.core} /></linearGradient>
        </defs>
        {Array.from({ length: t.flames * 2 }, (_, k) => tongue(k))}
        <path d="M32 2c4 12 18 18 18 38a18 18 0 0 1-36 0c0-9 4-14 8-18 1 6 4 9 7 10-3-12 1-22 3-30z" fill={`url(#flA${n})`} className={lit ? "flame" : ""} />
        <path d="M32 34c2 6 9 9 9 18a9 9 0 0 1-18 0c0-5 3-8 5-10 0 3 2 5 3 5-1-5 0-9 1-13z" fill={`url(#flB${n})`} className={lit ? "flame" : ""} style={{ animationDelay: ".3s" }} />
      </svg>
    </div>
  );
}

/** Dias limpos: +1 por dia vencido, recomeço honesto em caso de queda. */
export function Streak({ count: initial, best, todayDone: done0, week: week0, next, ready = true }: { count: number; best: number; todayDone: boolean; week: DayState[]; next: number; ready?: boolean }) {
  const [pending, start] = useTransition();
  const { gain, celebrate } = useXp();
  const [count, setCount] = useState(initial);
  const [done, setDone] = useState(done0);
  const [week, setWeek] = useState(week0);
  const [err, setErr] = useState(ready ? "" : "Falta criar a tabela de dias limpos: rode supabase/migrations/20261113000000_dias_limpos.sql no SQL Editor do Supabase.");
  const lit = count > 0;
  void lit;
  const setToday = (state: DayState["state"]) => setWeek((w) => w.map((d) => (d.today ? { ...d, state } : d)));

  const plusOne = () => {
    const c = count + 1;
    setCount(c); setDone(true); setToday("done");
    gain(cleanXp(c), `Dia limpo · ${c}º seguido`, fireTier(c).color);
    if (fireTier(c).from === c && c > 1) setTimeout(() => celebrate(`O fogo virou ${fireTier(c).name}`, `${c} dias limpos · +${cleanXp(c)} XP por dia`), 900);
    if (MILESTONES.includes(c) && c > 1) setTimeout(() => celebrate(`${c} dias limpos`, c >= best ? "Novo recorde. Continue firme." : "Firme. Um dia de cada vez."), 400);
    start(async () => { const e = await markClean(true); if (e) { setErr(e); setCount(c - 1); setDone(false); setToday("none"); gain(-cleanXp(c)); } });
  };
  const undo = () => { gain(-cleanXp(count)); setCount((c) => Math.max(0, c - 1)); setDone(false); setToday("none"); start(async () => { const e = await markClean(false); if (e) setErr(e); }); };
  const restart = () => {
    if (!confirm("Recomeçar do zero? Seu recorde fica guardado. O que importa é levantar.")) return;
    setCount(0); setDone(false); setToday("relapse"); start(async () => { const e = await relapse(); if (e) setErr(e); });
  };

  return (
    <section className="glass rise mt-4 overflow-hidden">
      <div className="p-5 flex items-center gap-4">
        <Fire n={count} />
        <div className="flex-1">
          <p className="label">Dias limpos</p>
          <p className="mt-1"><CountUp value={count} duration={1100} className={`num text-6xl leading-none ${lit ? "text-glow" : ""}`} style={{ color: lit ? fireTier(count).core : undefined, ["--glow" as string]: fireTier(count).color } as React.CSSProperties} /></p>
          <p className="text-xs font-semibold mt-1 tracking-wide whitespace-nowrap" style={{ color: lit ? fireTier(count).color : "#8e8e93" }}>🔥 {fireTier(count).name.toUpperCase()} · +{cleanXp(done ? count : count + 1)} XP</p>
          <p className="text-[11px] text-muted mt-0.5">{count === 0 ? "Hoje é o dia 1." : nextFire(count) ? `${nextFire(count)!.name} em ${nextFire(count)!.from - count} ${nextFire(count)!.from - count === 1 ? "dia" : "dias"} · marco ${next}` : `Próximo marco: ${next} dias`}</p>
        </div>
        <div className="text-right"><p className="label">Recorde</p><p className="num text-2xl mt-1">{Math.max(best, count)}</p></div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 px-5 pb-4">
        {week.map((d) => (
          <div key={d.date} className="flex flex-col items-center gap-1.5">
            <span className={`text-[11px] ${d.today ? "text-ink font-semibold" : "text-faint"}`}>{d.label}</span>
            <span className={`h-9 w-9 rounded-full grid place-items-center border ${d.today ? "ring-2 ring-white/40 ring-offset-2 ring-offset-[#0f0f11]" : ""}`}
              style={{ boxShadow: d.state === "done" ? `0 0 14px -2px ${fireTier(Math.max(1, count)).color}` : undefined, background: d.state === "done" ? `linear-gradient(160deg,${fireTier(Math.max(1, count)).core},${fireTier(Math.max(1, count)).color})` : d.state === "relapse" ? "rgba(255,69,58,.18)" : "transparent",
                borderColor: d.state === "done" ? "transparent" : d.state === "relapse" ? "#ff453a66" : "rgba(255,255,255,.12)" }}>
              {d.state === "done" && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a0d00" strokeWidth="3.2" aria-hidden><path d="M5 12l5 5L20 7" /></svg>}
            </span>
          </div>
        ))}
      </div>

      {err && <p role="alert" className="mx-5 mb-3 rounded-xl p-3 text-sm text-[#ff453a] bg-[#ff453a]/10 border border-[#ff453a]/30">{err}</p>}
      <div className="px-5 pb-5 grid gap-2">
        {done ? (
          <button className="btn w-full" disabled={pending} onClick={undo}>Hoje já contado ✓ <span className="text-faint text-xs">desfazer</span></button>
        ) : (
          <button className="btn btn-accent w-full !min-h-12 text-[15px]" disabled={pending} onClick={plusOne}>+1 dia limpo <span className="opacity-60 text-sm ml-1">+{cleanXp(count + 1)} XP</span></button>
        )}
        <button className="text-sm text-muted min-h-11" disabled={pending} onClick={restart}>Recomeço honesto</button>
      </div>
    </section>
  );
}
