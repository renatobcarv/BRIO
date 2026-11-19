"use client";
import { useState } from "react";
import { CARDIO, cardioSummary, kcalOf, kindOf, pace, speed, type CardioKind, type Run } from "@/lib/cardio";

const A = "#ffb21e";
const n = (v: string) => Number(String(v).replace(",", ".")) || 0;
const f1 = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

/** Registro de cardio: tipo, distância e tempo; mostra ritmo, velocidade e calorias na hora. */
export function CardioPanel({ name, km, min, bodyweight = 75, onChange, onRename }: { name: string; km: string; min: string; bodyweight?: number | null; onChange: (p: { km: string; min: string }) => void; onRename?: (name: string) => void }) {
  const [kind, setKind] = useState<CardioKind>(kindOf(name));
  const totalMin = n(min), dist = n(km);
  const [mm, setMm] = useState(String(Math.floor(totalMin) || "")), [ss, setSs] = useState("");
  const setTime = (m: string, s: string) => { setMm(m); setSs(s); const t = n(m) + n(s) / 60; onChange({ km, min: t ? String(Math.round(t)) : "" }); };
  const p = pace(dist, n(mm) + n(ss) / 60), v = speed(dist, n(mm) + n(ss) / 60), kc = kcalOf(kind, n(mm) + n(ss) / 60, bodyweight ?? 75);
  return (
    <div className="grid gap-3">
      <div className="flex gap-1.5 overflow-x-auto pb-1" role="radiogroup" aria-label="Tipo de cardio">
        {(Object.keys(CARDIO) as CardioKind[]).filter((k) => k !== "outro").map((k) => (
          <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => { setKind(k); if (onRename && kindOf(name) !== k) onRename(CARDIO[k].label); }}
            className={`shrink-0 rounded-full px-3.5 min-h-9 text-[13px] ${kind === k ? "bg-[#f5f5f7] text-black font-semibold" : "bg-white/[.06] text-white/70"}`}>{CARDIO[k].label}</button>))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="rounded-[14px] bg-white/[.05] p-3">
          <span className="block text-[12px] text-white/50">Distância</span>
          <span className="flex items-baseline gap-1"><input className="w-full min-w-0 bg-transparent !text-[34px] font-bold tracking-tight outline-none" inputMode="decimal" placeholder="0" value={km === "0" ? "" : km} onChange={(e) => onChange({ km: e.target.value, min })} aria-label="Distância em km" /><span className="text-white/45">km</span></span>
          <span className="flex gap-1 mt-1">{[1, 3, 5, 10].map((x) => <button key={x} type="button" className="text-[11px] rounded-full bg-white/[.06] px-2 py-0.5" onClick={() => onChange({ km: String(x), min })}>{x}</button>)}</span>
        </label>
        <div className="rounded-[14px] bg-white/[.05] p-3">
          <span className="block text-[12px] text-white/50">Tempo</span>
          <span className="flex items-baseline gap-1">
            <input className="w-14 bg-transparent !text-[34px] font-bold tracking-tight outline-none text-right" inputMode="numeric" placeholder="0" value={mm} onChange={(e) => setTime(e.target.value, ss)} aria-label="Minutos" />
            <span className="text-[28px] font-bold text-white/40">:</span>
            <input className="w-12 bg-transparent !text-[34px] font-bold tracking-tight outline-none" inputMode="numeric" placeholder="00" maxLength={2} value={ss} onChange={(e) => setTime(mm, e.target.value)} aria-label="Segundos" />
          </span>
          <span className="flex gap-1 mt-1">{[20, 30, 45, 60].map((x) => <button key={x} type="button" className="text-[11px] rounded-full bg-white/[.06] px-2 py-0.5" onClick={() => setTime(String(x), "")}>{x}'</button>)}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[[CARDIO[kind].pace ? "Ritmo" : "Velocidade", CARDIO[kind].pace ? (p ? `${p}` : "—") : (v ? `${f1(v)}` : "—"), CARDIO[kind].pace ? "min/km" : "km/h"], [CARDIO[kind].pace ? "Velocidade" : "Ritmo", CARDIO[kind].pace ? (v ? f1(v) : "—") : (p ?? "—"), CARDIO[kind].pace ? "km/h" : "min/km"], ["Calorias", kc ? String(kc) : "—", "kcal (estim.)"]].map(([l, val, u]) => (
          <div key={l} className="rounded-[12px] bg-white/[.03] py-2.5"><p className="text-[11px] text-white/45">{l}</p><p className="text-[22px] font-bold" style={{ color: l === "Calorias" ? undefined : A }}>{val}</p><p className="text-[10px] text-white/40">{u}</p></div>))}
      </div>
    </div>
  );
}

/** Painel de corridas/cardio no Treino: semana, recordes e últimas sessões. */
export function CardioStats({ runs, today }: { runs: Run[]; today: string }) {
  if (!runs.length) return null;
  const s = cardioSummary(runs, today);
  return (
    <section id="tr-cardio" className="glass rise p-5 mt-4 scroll-mt-20">
      <p className="label">Corrida e cardio</p>
      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        {[["Semana", `${f1(s.weekKm)} km`, `${s.weekMin} min`], ["Melhor ritmo", s.best ? `${pace(s.best.km, s.best.min)}` : "—", s.best ? `/km em ${f1(s.best.km)} km` : "corra 1 km+"], ["Mais longa", s.longest ? `${f1(s.longest.km)} km` : "—", `${f1(s.totalKm)} km no total`]].map(([l, v, u]) => (
          <div key={l} className="rounded-[12px] bg-white/[.04] py-3"><p className="text-[11px] text-white/45">{l}</p><p className="text-[22px] font-bold" style={{ color: A }}>{v}</p><p className="text-[10.5px] text-white/40">{u}</p></div>))}
      </div>
      <ul className="mt-4 divide-y divide-white/[.06]">
        {s.recent.map((r, i) => (
          <li key={i} className="flex items-center gap-3 py-2.5 text-[13.5px]">
            <span className="font-mono text-[11px] text-white/40 w-11">{r.date.slice(8)}/{r.date.slice(5, 7)}</span>
            <span className="flex-1 truncate">{r.name}</span>
            <span className="text-white/70">{r.km ? `${f1(r.km)} km` : ""}</span>
            <span className="text-white/50 w-14 text-right">{r.min} min</span>
            <span className="w-16 text-right" style={{ color: A }}>{CARDIO[kindOf(r.name)].pace ? (pace(r.km, r.min) ? `${pace(r.km, r.min)}/km` : "") : speed(r.km, r.min) ? `${f1(speed(r.km, r.min)!)} km/h` : ""}</span>
          </li>))}
      </ul>
    </section>
  );
}
