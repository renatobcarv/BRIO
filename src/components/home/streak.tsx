"use client";
import { useTransition } from "react";
import { excuseToday, honestRestart } from "@/app/(app)/home-actions";

export type DayState = { date: string; label: string; state: "done" | "excused" | "partial" | "none" | "future"; today: boolean };

function Flame({ lit, size = 72 }: { lit: boolean; size?: number }) {
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 64 74" className={lit ? "flame" : ""} aria-hidden>
      <defs>
        <linearGradient id="fl1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={lit ? "#f7d78c" : "#3a3c42"} /><stop offset="1" stopColor={lit ? "#e0ac53" : "#26282d"} /></linearGradient>
        <linearGradient id="fl2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={lit ? "#fff3cf" : "#4a4c52"} /><stop offset="1" stopColor={lit ? "#f3c46a" : "#33353a"} /></linearGradient>
      </defs>
      <path d="M32 2c4 12 18 18 18 38a18 18 0 0 1-36 0c0-9 4-14 8-18 1 6 4 9 7 10-3-12 1-22 3-30z" fill="url(#fl1)" />
      <path d="M32 34c2 6 9 9 9 18a9 9 0 0 1-18 0c0-5 3-8 5-10 0 3 2 5 3 5-1-5 0-9 1-13z" fill="url(#fl2)" />
    </svg>
  );
}

export function Streak({ count, best, excusedToday, week }: { count: number; best: number; excusedToday: boolean; week: DayState[] }) {
  const [pending, start] = useTransition();
  const lit = count > 0;
  return (
    <section className="glass rise mt-4 overflow-hidden relative">
      {lit && <div className="absolute left-1/2 -top-20 -translate-x-1/2 h-56 w-56 rounded-full blur-3xl opacity-25" style={{ background: "#e0ac53" }} />}
      <div className="relative p-5 flex items-center gap-4">
        <Flame lit={lit} />
        <div className="flex-1">
          <p className="font-display leading-none"><span className="num text-6xl" style={{ color: lit ? "#f3d48a" : undefined }}>{count}</span></p>
          <p className="text-sm mt-1" style={{ color: lit ? "#e0ac53" : "#9a978f" }}>{count === 1 ? "dia seguido" : "dias seguidos"}</p>
        </div>
        <div className="text-right"><p className="label">Recorde</p><p className="num text-2xl mt-1">{best}</p></div>
      </div>
      <div className="relative grid grid-cols-7 gap-1.5 px-5 pb-4">
        {week.map((d) => (
          <div key={d.date} className="flex flex-col items-center gap-1.5">
            <span className={`text-[11px] uppercase ${d.today ? "text-ink font-semibold" : "text-faint"}`}>{d.label}</span>
            <span className={`h-9 w-9 rounded-full grid place-items-center border transition-colors ${d.today ? "ring-2 ring-[#e0ac53]/60 ring-offset-2 ring-offset-[#0d0f13]" : ""}`}
              style={{
                background: d.state === "done" ? "linear-gradient(160deg,#f3d48a,#e0ac53)" : d.state === "excused" ? "rgba(132,174,212,.25)" : "transparent",
                borderColor: d.state === "done" ? "transparent" : d.state === "partial" ? "#e0ac5388" : "rgba(255,255,255,.12)",
              }} title={d.state === "done" ? "Completo" : d.state === "excused" ? "Justificado" : d.state === "partial" ? "Parcial" : ""}>
              {d.state === "done" && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#120f08" strokeWidth="3.2" aria-hidden><path d="M5 12l5 5L20 7" /></svg>}
              {d.state === "excused" && <span className="text-[10px] text-[#84aed4]">J</span>}
              {d.state === "partial" && <i className="h-1.5 w-1.5 rounded-full bg-[#e0ac53]" />}
            </span>
          </div>
        ))}
      </div>
      <div className="relative grid grid-cols-2 gap-2 px-5 pb-5">
        <button className="btn text-sm" disabled={pending} aria-pressed={excusedToday} onClick={() => start(() => excuseToday())}>{excusedToday ? "Justificado ✓" : "Dia justificado"}</button>
        <button className="btn text-sm" disabled={pending} onClick={() => { if (confirm("Recomeçar do zero? O recorde fica guardado.")) start(() => honestRestart()); }}>Recomeço honesto</button>
      </div>
    </section>
  );
}
