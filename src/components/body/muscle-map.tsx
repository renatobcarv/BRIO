"use client";
import { useId } from "react";
import { guessMuscle, MUSCLES, type Muscle } from "@/lib/training";

/** Músculos do dia: principais (mais séries) em destaque, secundários mais claros. */
export function musclesOf(list: { name: string; sets?: number; muscle?: string | null }[]) {
  const c = new Map<Muscle, number>();
  for (const x of list) { const m = (x.muscle && x.muscle in MUSCLES ? x.muscle : guessMuscle(x.name)) as Muscle; if (m === "cardio" || m === "outro") continue; c.set(m, (c.get(m) ?? 0) + (x.sets ?? 3)); }
  const sorted = [...c].sort((a, b) => b[1] - a[1]);
  const top = sorted[0]?.[1] ?? 0;
  return sorted.map(([m, sets]) => ({ m, sets, main: sets >= top * 0.5 }));
}

// Cada região descreve o lado esquerdo e é espelhada no eixo do corpo.
type Shape = { m: Muscle; d: string };
const FRONT: Shape[] = [
  { m: "ombro_anterior", d: "M36 30Q28 28 23 34L21 43Q27 45 32 38Z" },
  { m: "ombro_lateral", d: "M23 34Q18 37 17 45L17 53 23 47 24 42Z" },
  { m: "peito", d: "M36 31Q43 30 49 34L49 49Q39 51 32 44Q30 39 36 31Z" },
  { m: "biceps", d: "M26 46Q31 44 29 53L25 64Q20 67 19 61L20 54Z" },
  { m: "abdomen", d: "M42 51Q46 52 49 51V57H42Z M41 59H49V65H41Z M41 67H49V73H42Z M42 75H49V86Q45 84 42 75Z" },
  { m: "quadriceps", d: "M36 86Q42 86 48 94L45 115Q44 124 39 121Q33 115 34 102Z" },
  { m: "panturrilhas", d: "M38 126Q44 124 44 132L43 150Q38 145 37 137Z" },
];
const BACK: Shape[] = [
  { m: "ombro_posterior", d: "M35 30Q25 29 21 37L18 47Q25 49 30 43Z" },
  { m: "costas", d: "M48 26 38 31 32 44Q38 44 47 39Z M32 47Q39 47 47 41L48 72Q41 68 37 58Z" },
  { m: "triceps", d: "M25 45Q31 47 28 53L25 65Q19 67 19 60L20 53Z" },
  { m: "gluteos", d: "M37 73Q44 72 49 78L49 88Q44 95 36 89Q33 87 37 73Z" },
  { m: "posteriores", d: "M36 93Q42 96 48 92L46 109 45 121Q42 124 39 119Q35 112 35 103Z" },
  { m: "panturrilhas", d: "M38 126Q43 122 45 130L43 149Q39 154 37 144Q35 137 38 126Z" },
];

const BODY = "M50 5C44 5 40 9 40 15Q40 22 45 25L44 28 29 30Q20 31 17 43L15 62 11 77 9 88Q9 92 13 92L17 88 20 77 25 65 30 47Q32 58 36 67L35 77Q31 93 34 114L36 124 35 137 39 154 38 160 34 164Q35 168 44 166L45 154 47 139 47 125 49 109 50 94 51 109 53 125 53 139 55 154 56 166Q65 168 66 164L62 160 61 154 65 137 64 124 66 114Q69 93 65 77L64 67Q68 58 70 47L75 65 80 77 83 88 87 92Q91 92 91 88L89 77 85 62 83 43Q80 31 71 30L56 28 55 25Q60 22 60 15C60 9 56 5 50 5Z";
const CONTOURS = "M44 27Q47 32 50 32Q53 32 56 27M30 48Q34 58 39 60M70 48Q66 58 61 60M20 69Q17 76 15 84M80 69Q83 76 85 84M39 122Q42 128 45 122M61 122Q58 128 55 122M39 155 41 160M61 155 59 160";

function Figure({ back, on }: { back?: boolean; on: Map<Muscle, boolean> }) {
  const id = useId();
  const shapes = back ? BACK : FRONT;

  return (
    <div className="grid justify-items-center">
      <svg viewBox="0 0 100 172" className="h-auto w-full" aria-hidden>
        <defs>
          <linearGradient id={`${id}-body`} x2="1" y2="0">
            <stop stopColor="#191b23" /><stop offset=".5" stopColor="#30333f" /><stop offset="1" stopColor="#191b23" />
          </linearGradient>
          <linearGradient id={`${id}-active`} x2=".8" y2="1">
            <stop stopColor="#ff9162" /><stop offset=".48" stopColor="#ff4b28" /><stop offset="1" stopColor="#a71f28" />
          </linearGradient>
        </defs>
        <path d={BODY} fill={`url(#${id}-body)`} stroke="#626777" strokeWidth="1.3" />
        <path d={CONTOURS} fill="none" stroke="#858998" strokeOpacity=".47" strokeWidth=".8" />
        {back && <path d="M50 31v42" fill="none" stroke="#858998" strokeOpacity=".45" />}
        {shapes.map(({ m, d }) => {
          const active = on.get(m);
          return (
            <g key={m} fill={active ? `url(#${id}-active)` : active === false ? "#922d32" : "#3d414e"}
              stroke={active ? "#ff966f" : active === false ? "#c75a51" : "#5f6474"} strokeWidth=".8" strokeLinejoin="round">
              <path d={d} />
              <path d={d} transform="translate(100 0) scale(-1 1)" />
            </g>
          );
        })}
      </svg>
      <span aria-hidden className="text-[9px] uppercase tracking-wide text-white/50">{back ? "Costas" : "Frente"}</span>
    </div>
  );
}

export function MuscleMap({ list, compact = false }: { list: { name: string; sets?: number; muscle?: string | null }[]; compact?: boolean }) {
  const ms = musclesOf(list);
  if (!ms.length) return null;
  const on = new Map(ms.map((x) => [x.m, x.main] as const));
  return (
    <figure className={`grid ${compact ? "grid-cols-[120px_1fr]" : "grid-cols-[minmax(0,170px)_1fr]"} gap-4 items-center`} aria-label={`Músculos do dia: ${ms.map((x) => MUSCLES[x.m]).join(", ")}`}>
      <div className="grid grid-cols-2 gap-1"><Figure on={on} /><Figure back on={on} /></div>
      <figcaption className="grid gap-1.5 content-center min-w-0">
        {ms.slice(0, compact ? 4 : 8).map(({ m, sets, main }) => (
          <span key={m} className="flex items-center gap-2 text-[13px] min-w-0"><i className="h-2.5 w-2.5 shrink-0" style={{ background: main ? "#ff5733" : "#922d32" }} /><span className={`flex-1 truncate ${main ? "text-white" : "text-white/60"}`}>{MUSCLES[m]}</span><span className="font-mono text-[11px] text-white/45 shrink-0">{sets}</span></span>))}
      </figcaption>
    </figure>
  );
}
