"use client";
import { useState } from "react";
import { guessMuscle, MUSCLES, type Muscle } from "@/lib/training";

// Mapa muscular com a arte aberta do wger (wger.de, CC-BY-SA): base frente/costas + camadas por músculo.
const W = "https://wger.de/static/images/muscles";
const IDS: Partial<Record<Muscle, { id: number; back: boolean }[]>> = {
  peito: [{ id: 4, back: false }], costas: [{ id: 12, back: true }, { id: 9, back: true }],
  ombro_anterior: [{ id: 2, back: false }], ombro_lateral: [{ id: 2, back: false }], ombro_posterior: [{ id: 9, back: true }],
  biceps: [{ id: 1, back: false }, { id: 13, back: false }], triceps: [{ id: 5, back: true }],
  quadriceps: [{ id: 10, back: false }], posteriores: [{ id: 11, back: true }], gluteos: [{ id: 8, back: true }],
  panturrilhas: [{ id: 7, back: true }, { id: 15, back: true }], abdomen: [{ id: 6, back: false }, { id: 14, back: false }],
};

/** Músculos do dia: principais (mais séries) em destaque, secundários mais claros. */
export function musclesOf(list: { name: string; sets?: number; muscle?: string | null }[]) {
  const c = new Map<Muscle, number>();
  for (const x of list) { const m = (x.muscle && x.muscle in MUSCLES ? x.muscle : guessMuscle(x.name)) as Muscle; if (m === "cardio" || m === "outro") continue; c.set(m, (c.get(m) ?? 0) + (x.sets ?? 3)); }
  const sorted = [...c].sort((a, b) => b[1] - a[1]);
  const top = sorted[0]?.[1] ?? 0;
  return sorted.map(([m, sets]) => ({ m, sets, main: sets >= top * 0.5 }));
}

export function MuscleMap({ list, compact = false }: { list: { name: string; sets?: number; muscle?: string | null }[]; compact?: boolean }) {
  const ms = musclesOf(list);
  const [failed, setFailed] = useState(false);
  if (!ms.length) return null;
  const layers = (back: boolean) => ms.flatMap(({ m, main }) => (IDS[m] ?? []).filter((x) => x.back === back).map((x) => ({ src: `${W}/${main ? "main" : "secondary"}/muscle-${x.id}.svg`, key: `${m}-${x.id}` })));
  const Fig = ({ back }: { back: boolean }) => (
    <div className="relative aspect-[1/2] w-full">
      <img src={`${W}/muscular_system_${back ? "back" : "front"}.svg`} alt="" className="absolute inset-0 h-full w-full object-contain" loading="lazy" onError={() => setFailed(true)} />
      {layers(back).map((l) => <img key={l.key} src={l.src} alt="" className="absolute inset-0 h-full w-full object-contain" loading="lazy" />)}
    </div>);
  return (
    <figure className={`grid ${failed ? "grid-cols-1" : compact ? "grid-cols-[110px_1fr]" : "grid-cols-[minmax(0,180px)_1fr]"} gap-4 items-center`} aria-label={`Músculos do dia: ${ms.map((x) => MUSCLES[x.m]).join(", ")}`}>
      {!failed && <div className="muscle-map grid grid-cols-2 gap-1 p-2"><Fig back={false} /><Fig back /></div>}
      <figcaption className="grid gap-1.5 content-center">
        {ms.slice(0, compact ? 4 : 8).map(({ m, sets, main }) => (
          <span key={m} className="flex items-center gap-2 text-[13px]"><i className="h-2.5 w-2.5 shrink-0" style={{ background: main ? "#ff2800" : "#ff280066" }} /><span className={`flex-1 ${main ? "text-white" : "text-white/60"}`}>{MUSCLES[m]}</span><span className="font-mono text-[11px] text-white/45">{sets} séries</span></span>))}
        {!failed && <span className="text-[10px] text-white/35 mt-1">Ilustração: wger.de</span>}
      </figcaption>
    </figure>
  );
}
