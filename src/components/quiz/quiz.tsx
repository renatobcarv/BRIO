"use client";
import { useState } from "react";
import { CountUp } from "@/components/count-up";
import { useXp, haptic } from "@/components/game/xp";

export type Step = { title: string; hint?: string; content: React.ReactNode; canNext?: boolean; skippable?: boolean };

/** Fluxo em perguntas: uma por vez, avanço com deslize, recompensa no final. */
export function Quiz({ steps, onFinish, xp, color = "#ffb340", rewardTitle, rewardLines = [], onClose }: {
  steps: Step[]; onFinish: () => Promise<string | null>; xp: number; color?: string; rewardTitle: string; rewardLines?: string[]; onClose: () => void;
}) {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const { gain, celebrate } = useXp();
  const last = i === steps.length - 1, step = steps[i];
  const go = (d: number) => { haptic(8); setDir(d); setI((x) => Math.max(0, Math.min(steps.length - 1, x + d))); };
  const finish = async () => {
    setBusy(true); setErr("");
    const e = await onFinish();
    setBusy(false);
    if (e) { setErr(e); return; }
    setDone(true); gain(xp, rewardTitle, color); setTimeout(() => celebrate(`+${xp} XP`, rewardTitle), 250);
  };

  if (done) return (
    <div className="text-center py-6 reward-in" style={{ ["--glow" as string]: color }}>
      <div className="mx-auto h-24 w-24 rounded-full grid place-items-center glow" style={{ background: color }}>
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12.5l4.5 4.5L19 7.5" className="check-draw" /></svg>
      </div>
      <p className="mt-5"><span className="num text-6xl text-glow" style={{ color }}>+<CountUp value={xp} /></span> <span className="text-xl text-muted">XP</span></p>
      <p className="font-display text-2xl mt-2">{rewardTitle}</p>
      {rewardLines.length > 0 && <ul className="mt-4 grid gap-1.5 text-sm text-muted">{rewardLines.map((l) => <li key={l}>{l}</li>)}</ul>}
      <button className="btn btn-accent w-full mt-6 !min-h-12" onClick={onClose}>Continuar</button>
    </div>
  );

  return (
    <div className="grid gap-5">
      <div className="flex gap-1.5" aria-label={`Passo ${i + 1} de ${steps.length}`}>
        {steps.map((_, k) => <i key={k} className="h-1 flex-1 rounded-full transition-all duration-500" style={{ background: k <= i ? color : "rgba(255,255,255,.1)", boxShadow: k === i ? `0 0 10px ${color}` : "none" }} />)}
      </div>
      <div key={i} className={dir > 0 ? "step-in-right" : "step-in-left"}>
        <p className="font-display text-[26px] leading-tight">{step.title}</p>
        {step.hint && <p className="text-sm text-muted mt-1">{step.hint}</p>}
        <div className="mt-5">{step.content}</div>
      </div>
      {err && <p role="alert" className="rounded-xl p-3 text-sm text-[#ff453a] bg-[#ff453a]/10 border border-[#ff453a]/30">{err}</p>}
      <div className="flex gap-2">
        {i > 0 && <button className="btn !min-h-12 !px-5" onClick={() => go(-1)} aria-label="Voltar">‹</button>}
        {step.skippable && !last && <button className="btn !min-h-12 text-muted" onClick={() => go(1)}>Pular</button>}
        <button className="btn btn-accent flex-1 !min-h-12 text-[15px]" disabled={busy || step.canNext === false} onClick={() => (last ? finish() : go(1))}>
          {busy ? "Salvando…" : last ? `Concluir · +${xp} XP` : "Continuar"}</button>
      </div>
    </div>
  );
}

/** Opções grandes de tocar, com ícone e brilho na escolhida. */
export function Choices<T extends string>({ value, onChange, options, cols = 2 }: { value: T | null; onChange: (v: T) => void; options: { value: T; label: string; icon?: string; color: string; sub?: string }[]; cols?: 2 | 3 }) {
  return (
    <div className={`grid gap-2.5 ${cols === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button key={o.value} onClick={() => { haptic(10); onChange(o.value); }} aria-pressed={on}
            className="press text-left rounded-2xl p-3.5 border transition-all duration-300 min-h-[84px] flex flex-col justify-between"
            style={{ background: on ? `linear-gradient(160deg, ${o.color}33, #141416)` : "#141416", borderColor: on ? o.color : "rgba(255,255,255,.07)", boxShadow: on ? `0 0 0 1px ${o.color}55, 0 10px 26px -12px ${o.color}` : "none" }}>
            {o.icon && <span className="h-8 w-8 rounded-[10px] grid place-items-center" style={{ background: o.color }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={o.icon} /></svg></span>}
            <span className="mt-2"><span className="block text-[15px] font-semibold leading-tight">{o.label}</span>{o.sub && <span className="block text-xs text-muted mt-0.5">{o.sub}</span>}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Chips rápidos de valor (ex.: 15, 30, 60 min). */
export function QuickPick({ values, value, onChange, format = (v: number) => String(v), color = "#ffb340" }: { values: number[]; value: number; onChange: (v: number) => void; format?: (v: number) => string; color?: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((v) => (
        <button key={v} onClick={() => { haptic(8); onChange(v); }} className="press rounded-2xl px-4 min-h-12 text-[15px] font-semibold border transition-all"
          style={{ background: value === v ? color : "#141416", color: value === v ? "#000" : undefined, borderColor: value === v ? color : "rgba(255,255,255,.08)", boxShadow: value === v ? `0 0 18px -4px ${color}` : "none" }}>{format(v)}</button>
      ))}
    </div>
  );
}

export function Stepper({ value, onChange, min = 0, max = 99, color = "#ffb340" }: { value: number; onChange: (v: number) => void; min?: number; max?: number; color?: string }) {
  return (
    <div className="flex items-center justify-center gap-6">
      <button className="press h-14 w-14 rounded-full border border-white/10 bg-[#141416] text-2xl" onClick={() => { haptic(8); onChange(Math.max(min, value - 1)); }} aria-label="Menos">−</button>
      <span className="num text-6xl w-24 text-center text-glow" style={{ color, ["--glow" as string]: color }}>{value}</span>
      <button className="press h-14 w-14 rounded-full text-2xl text-black" style={{ background: color, boxShadow: `0 0 20px -4px ${color}` }} onClick={() => { haptic(10); onChange(Math.min(max, value + 1)); }} aria-label="Mais">+</button>
    </div>
  );
}
