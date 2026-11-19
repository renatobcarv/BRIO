"use client";
import { guessMuscle, MUSCLES, type Muscle } from "@/lib/training";

/** Músculos do dia: principais (mais séries) em destaque, secundários mais claros. */
export function musclesOf(list: { name: string; sets?: number; muscle?: string | null }[]) {
  const c = new Map<Muscle, number>();
  for (const x of list) { const m = (x.muscle && x.muscle in MUSCLES ? x.muscle : guessMuscle(x.name)) as Muscle; if (m === "cardio" || m === "outro") continue; c.set(m, (c.get(m) ?? 0) + (x.sets ?? 3)); }
  const sorted = [...c].sort((a, b) => b[1] - a[1]);
  const top = sorted[0]?.[1] ?? 0;
  return sorted.map(([m, sets]) => ({ m, sets, main: sets >= top * 0.5 }));
}

// Silhueta própria (frente e costas) com regiões por grupo muscular. Sem imagem externa.
type Shape = { m: Muscle; d: string };
const FRONT: Shape[] = [
  { m: "ombro_anterior", d: "M28 30c-6 1-9 6-9 11l7 1 5-9z M72 30c6 1 9 6 9 11l-7 1-5-9z" },
  { m: "ombro_lateral", d: "M19 41c-1 3-1 6 0 8l5-1 2-6z M81 41c1 3 1 6 0 8l-5-1-2-6z" },
  { m: "peito", d: "M33 31h16v15c-6 2-12 1-16-3l-2-8z M51 31h16l2 4-2 8c-4 4-10 5-16 3z" },
  { m: "biceps", d: "M20 50c-2 6-2 12 0 16l6-1 1-14z M80 50c2 6 2 12 0 16l-6-1-1-14z" },
  { m: "abdomen", d: "M38 48h24l-1 26H39z" },
  { m: "quadriceps", d: "M34 80h14l-1 30h-11z M52 80h14l-2 30H53z" },
  { m: "panturrilhas", d: "M37 116h9l-1 22h-7z M54 116h9l-1 22h-7z" },
];
const BACK: Shape[] = [
  { m: "ombro_posterior", d: "M28 30c-6 1-9 6-9 11l7 1 5-9z M72 30c6 1 9 6 9 11l-7 1-5-9z" },
  { m: "costas", d: "M33 30h34l1 10-6 18H38l-6-18z" },
  { m: "triceps", d: "M20 46c-2 6-2 12 0 18l6-1 1-15z M80 46c2 6 2 12 0 18l-6-1-1-15z" },
  { m: "gluteos", d: "M36 66h13v14H35z M51 66h13l1 14H51z" },
  { m: "posteriores", d: "M35 84h13l-1 28h-11z M52 84h13l-1 28H53z" },
  { m: "panturrilhas", d: "M36 116h10l-1 22h-8z M54 116h10l-1 22h-8z" },
];
const BODY = "M50 4a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM30 26h40c8 2 13 8 14 16l3 30-6 1-4-24-2 22-3 6 3 6 2 40-4 22h-9l-1-34-3 34h-9l-4-22 2-40 3-6-3-6-2-22-4 24-6-1 3-30c1-8 6-14 14-16z";

function Figure({ shapes, on }: { shapes: Shape[]; on: Map<Muscle, boolean> }) {
  return (
    <svg viewBox="0 0 100 145" className="w-full h-auto" aria-hidden>
      <path d={BODY} fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.18)" strokeWidth=".8" />
      {shapes.map((s) => { const v = on.get(s.m); return <path key={s.m} d={s.d} fill={v === undefined ? "rgba(255,255,255,.07)" : v ? "#ff2800" : "rgba(255,40,0,.42)"} style={v ? { filter: "drop-shadow(0 0 4px rgba(255,40,0,.7))" } : undefined} />; })}
    </svg>
  );
}

export function MuscleMap({ list, compact = false }: { list: { name: string; sets?: number; muscle?: string | null }[]; compact?: boolean }) {
  const ms = musclesOf(list);
  if (!ms.length) return null;
  const on = new Map(ms.map((x) => [x.m, x.main] as const));
  return (
    <figure className={`grid ${compact ? "grid-cols-[120px_1fr]" : "grid-cols-[minmax(0,170px)_1fr]"} gap-4 items-center`} aria-label={`Músculos do dia: ${ms.map((x) => MUSCLES[x.m]).join(", ")}`}>
      <div className="grid grid-cols-2 gap-1"><Figure shapes={FRONT} on={on} /><Figure shapes={BACK} on={on} /></div>
      <figcaption className="grid gap-1.5 content-center min-w-0">
        {ms.slice(0, compact ? 4 : 8).map(({ m, sets, main }) => (
          <span key={m} className="flex items-center gap-2 text-[13px] min-w-0"><i className="h-2.5 w-2.5 shrink-0" style={{ background: main ? "#ff2800" : "#ff280066" }} /><span className={`flex-1 truncate ${main ? "text-white" : "text-white/60"}`}>{MUSCLES[m]}</span><span className="font-mono text-[11px] text-white/45 shrink-0">{sets}</span></span>))}
      </figcaption>
    </figure>
  );
}
