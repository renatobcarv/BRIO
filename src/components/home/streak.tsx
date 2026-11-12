"use client";
import { useState, useTransition } from "react";
import { markClean, relapse } from "@/app/(app)/home-actions";
import { useXp } from "@/components/game/xp";
import { MILESTONES } from "@/lib/clean";
import { CountUp } from "@/components/count-up";

export type DayState = { date: string; label: string; state: "done" | "relapse" | "none" | "future"; today: boolean };

function Flame({ lit, size = 72 }: { lit: boolean; size?: number }) {
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 64 74" className={lit ? "flame" : ""} aria-hidden>
      <defs>
        <linearGradient id="fl1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={lit ? "#ffd27a" : "#2c2c2e"} /><stop offset="1" stopColor={lit ? "#ff6b1a" : "#1c1c1e"} /></linearGradient>
        <linearGradient id="fl2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={lit ? "#fff6dc" : "#3a3a3c"} /><stop offset="1" stopColor={lit ? "#ffb340" : "#2c2c2e"} /></linearGradient>
      </defs>
      <path d="M32 2c4 12 18 18 18 38a18 18 0 0 1-36 0c0-9 4-14 8-18 1 6 4 9 7 10-3-12 1-22 3-30z" fill="url(#fl1)" />
      <path d="M32 34c2 6 9 9 9 18a9 9 0 0 1-18 0c0-5 3-8 5-10 0 3 2 5 3 5-1-5 0-9 1-13z" fill="url(#fl2)" />
    </svg>
  );
}

/** Dias limpos: +1 por dia vencido, recomeço honesto em caso de queda. */
export function Streak({ count: initial, best, todayDone: done0, week: week0, next }: { count: number; best: number; todayDone: boolean; week: DayState[]; next: number }) {
  const [pending, start] = useTransition();
  const { gain, celebrate } = useXp();
  const [count, setCount] = useState(initial);
  const [done, setDone] = useState(done0);
  const [week, setWeek] = useState(week0);
  const lit = count > 0;
  const setToday = (state: DayState["state"]) => setWeek((w) => w.map((d) => (d.today ? { ...d, state } : d)));

  const plusOne = () => {
    const c = count + 1;
    setCount(c); setDone(true); setToday("done");
    gain(20, "Dia limpo", "#ff9f0a");
    if (MILESTONES.includes(c) && c > 1) setTimeout(() => celebrate(`${c} dias limpos`, c >= best ? "Novo recorde. Continue firme." : "Firme. Um dia de cada vez."), 400);
    start(() => markClean(true));
  };
  const undo = () => { setCount((c) => Math.max(0, c - 1)); setDone(false); setToday("none"); gain(-20); start(() => markClean(false)); };
  const restart = () => {
    if (!confirm("Recomeçar do zero? Seu recorde fica guardado. O que importa é levantar.")) return;
    setCount(0); setDone(false); setToday("relapse"); start(() => relapse());
  };

  return (
    <section className="glass rise mt-4 overflow-hidden">
      <div className="p-5 flex items-center gap-4">
        <Flame lit={lit} />
        <div className="flex-1">
          <p className="label">Dias limpos</p>
          <p className="mt-1"><CountUp value={count} duration={1100} className={`num text-6xl leading-none ${lit ? "text-glow" : ""}`} style={{ color: lit ? "#ffd27a" : undefined, ["--glow" as string]: "#ff9f0a" } as React.CSSProperties} /></p>
          <p className="text-sm text-muted mt-1">{count === 0 ? "Hoje é o dia 1." : `Próximo marco: ${next} dias`}</p>
        </div>
        <div className="text-right"><p className="label">Recorde</p><p className="num text-2xl mt-1">{Math.max(best, count)}</p></div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 px-5 pb-4">
        {week.map((d) => (
          <div key={d.date} className="flex flex-col items-center gap-1.5">
            <span className={`text-[11px] ${d.today ? "text-ink font-semibold" : "text-faint"}`}>{d.label}</span>
            <span className={`h-9 w-9 rounded-full grid place-items-center border ${d.today ? "ring-2 ring-white/40 ring-offset-2 ring-offset-[#0f0f11]" : ""}`}
              style={{ boxShadow: d.state === "done" ? "0 0 14px -2px #ff9f0a" : undefined, background: d.state === "done" ? "linear-gradient(160deg,#ffd27a,#ff7a1a)" : d.state === "relapse" ? "rgba(255,69,58,.18)" : "transparent",
                borderColor: d.state === "done" ? "transparent" : d.state === "relapse" ? "#ff453a66" : "rgba(255,255,255,.12)" }}>
              {d.state === "done" && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a0d00" strokeWidth="3.2" aria-hidden><path d="M5 12l5 5L20 7" /></svg>}
            </span>
          </div>
        ))}
      </div>

      <div className="px-5 pb-5 grid gap-2">
        {done ? (
          <button className="btn w-full" disabled={pending} onClick={undo}>Hoje já contado ✓ <span className="text-faint text-xs">desfazer</span></button>
        ) : (
          <button className="btn btn-accent w-full !min-h-12 text-[15px]" disabled={pending} onClick={plusOne}>+1 dia limpo</button>
        )}
        <button className="text-sm text-muted min-h-11" disabled={pending} onClick={restart}>Recomeço honesto</button>
      </div>
    </section>
  );
}
