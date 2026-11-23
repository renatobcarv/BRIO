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

// Cada peça representa uma barriga muscular. O grupo define o destaque do treino.
type Shape = { m?: Muscle; d: string };
const FRONT: Shape[] = [
  { d: "M53 33Q45 34 37 40Q45 39 55 44L59 39Z" },
  { m: "ombro_lateral", d: "M33 40Q17 37 13 51L13 65Q20 64 23 56Z" },
  { m: "ombro_anterior", d: "M33 41Q24 45 20 59Q19 66 24 68Q32 64 34 54L39 45Z" },
  { m: "peito", d: "M40 43Q48 39 58 45L59 59Q56 69 45 69Q35 68 30 62Q33 49 40 43Z" },
  { m: "biceps", d: "M25 68Q33 65 33 73Q33 83 25 91Q16 96 16 87Q17 77 25 68Z" },
  { d: "M14 65Q12 73 10 84L13 87Q16 76 21 68Z M12 92Q20 92 17 99L8 115L5 113Z M17 96Q22 97 20 103L11 118L9 116Z" },
  { m: "abdomen", d: "M50 71Q55 73 59 69L59 79Q54 82 49 79Z M49 82Q54 84 59 81V92Q54 94 49 91Z M49 94Q54 96 59 94V105Q54 108 51 104Z M51 107Q55 110 59 107V122Q55 119 51 107Z" },
  { m: "abdomen", d: "M34 68Q39 72 43 73L38 79Z M37 81L44 76 46 80 40 85Z M40 87L47 82 47 87 42 92Z M46 94L49 90Q47 103 52 110L47 116Z" },
  { m: "quadriceps", d: "M39 115Q44 119 46 129Q39 144 42 162Q35 158 33 147Q32 128 39 115Z M46 126Q51 127 52 134Q49 148 45 162Q42 151 46 126Z M54 135Q58 145 54 156Q52 165 47 163Q47 156 54 135Z" },
  { d: "M50 118Q57 118 58 126L55 139Q51 129 50 118Z M42 164Q46 167 52 164L51 171Q47 176 43 170Z" },
  { m: "panturrilhas", d: "M39 171Q44 171 45 181L44 197Q39 193 38 183Z M50 174Q54 177 52 187L47 199L48 183Z" },
  { d: "M45 177Q47 176 48 179L45 204L42 206L44 190Z" },
];
const BACK: Shape[] = [
  { m: "costas", d: "M53 32Q47 35 37 40L45 42 57 53 59 39Z M59 42L51 57 57 68 59 62Z" },
  { m: "ombro_lateral", d: "M33 40Q17 37 13 51L13 64Q20 60 23 53Z" },
  { m: "ombro_posterior", d: "M34 40Q25 43 19 56Q19 64 25 65Q32 62 34 55L40 44Z" },
  { m: "costas", d: "M40 44Q47 46 50 54Q46 62 34 61L30 57Z M32 63Q43 66 51 58L48 68 36 72Z M38 74Q49 70 53 65Q58 74 51 88L47 96Q43 84 38 74Z M57 72Q56 89 59 103L51 108Q47 101 50 91Z" },
  { m: "triceps", d: "M25 66Q32 63 32 70Q28 81 20 87Q16 85 19 77Z M17 65Q20 64 21 67L16 83Q12 88 12 83Q11 74 17 65Z" },
  { d: "M13 89Q19 87 19 93L10 113L6 113Z M18 94Q23 94 20 101L12 117L10 115Z" },
  { m: "gluteos", d: "M44 100Q48 108 58 105L59 119Q55 131 45 129Q36 126 38 116Z" },
  { m: "posteriores", d: "M38 128Q43 130 45 135L44 162Q36 157 35 147Q33 137 38 128Z M47 131Q55 130 58 123L55 143Q54 154 48 164L46 159Z" },
  { d: "M43 164Q47 167 52 164L51 172Q47 175 43 170Z" },
  { m: "panturrilhas", d: "M39 171Q45 172 46 179L45 191Q41 198 38 190Q35 181 39 171Z M49 172Q54 172 54 183Q52 194 47 195L46 189Z" },
  { d: "M45 195L48 195 46 205 43 207Z" },
];

const BODY = "M60 5C51 5 46 10 47 18Q47 25 52 30L52 34Q46 36 37 39Q24 36 17 43Q11 49 11 64L9 80 9 89Q5 101 3 114L1 120 2 128 5 129 7 124 11 124 15 117Q21 107 24 96L32 80 35 65Q41 78 46 97Q47 104 42 111L37 113Q31 125 32 142L36 157 38 169Q34 180 37 192L41 203 38 211 33 215 34 218 46 218 49 213 49 201 54 186 55 169 56 153 59 136 60 133 61 136 64 153 65 169 66 186 71 201 71 213 74 218 86 218 87 215 82 211 79 203 83 192Q86 180 82 169L84 157 88 142Q89 125 83 113L78 111Q73 104 74 97Q79 78 85 65L88 80 96 96Q99 107 105 117L109 124 113 124 115 129 118 128 119 120 117 114Q115 101 111 89L111 80 109 64Q109 49 103 43Q96 36 83 39Q74 36 68 33L68 30Q73 25 73 18C74 10 69 5 60 5Z";
const FACE = "M50 19Q53 18 56 19M64 19Q67 18 70 19M60 19L58 24H61M56 27Q60 28 64 27M54 32Q60 36 66 32";
const HAIR = "M47 18Q44 9 51 5Q56 1 64 3Q74 5 73 17L69 13Q63 14 59 10Q54 14 49 14Z";

function Figure({ back, on }: { back?: boolean; on: Map<Muscle, boolean> }) {
  const id = useId();
  return (
    <div className="grid min-w-0 justify-items-center">
      <svg viewBox="0 0 120 221" className="h-auto w-full max-w-24" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-muscle`} x2=".8" y2="1">
            <stop stopColor="#767483" /><stop offset=".38" stopColor="#474551" /><stop offset="1" stopColor="#24232d" />
          </linearGradient>
          <linearGradient id={`${id}-active`} x2=".8" y2="1">
            <stop stopColor="#ffbd87" /><stop offset=".42" stopColor="#ff713d" /><stop offset="1" stopColor="#b42a2d" />
          </linearGradient>
          <linearGradient id={`${id}-secondary`} x2=".8" y2="1">
            <stop stopColor="#e68469" /><stop offset="1" stopColor="#88333e" />
          </linearGradient>
        </defs>
        <path d={BODY} fill="#262530" stroke="#8a8596" strokeWidth=".85" strokeLinejoin="round" />
        <path d={HAIR} fill="#17171e" stroke="#817c8d" strokeWidth=".7" />
        <path d={back ? "M51 17Q60 21 69 17M53 25Q60 27 67 25M54 31Q60 37 66 31M60 45V103" : FACE} fill="none" stroke="#a6a0ad" strokeOpacity=".72" strokeWidth=".8" />
        {(back ? BACK : FRONT).map(({ m, d }, i) => {
          const active = m ? on.get(m) : undefined;
          const gradient = active === true ? "active" : active === false ? "secondary" : "muscle";
          return (
            <g key={i} fill={`url(#${id}-${gradient})`} stroke={active === true ? "#ffc29a" : active === false ? "#f39985" : "#a19aaa"}
              strokeOpacity={active === undefined ? ".72" : "1"} strokeWidth=".8" strokeLinejoin="round">
              <path d={d} />
              <path d={d} transform="translate(120 0) scale(-1 1)" />
            </g>
          );
        })}
      </svg>
      <span aria-hidden="true" className="mt-1 text-[10px] font-medium uppercase tracking-wider text-white/65">{back ? "Costas" : "Frente"}</span>
    </div>
  );
}

export function MuscleMap({ list, compact = false }: { list: { name: string; sets?: number; muscle?: string | null }[]; compact?: boolean }) {
  const ms = musclesOf(list);
  if (!ms.length) return null;
  const on = new Map(ms.map((x) => [x.m, x.main] as const));
  return (
    <figure className={`grid min-w-0 items-center ${compact ? "grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2" : "gap-3 rounded-xl border border-white/10 bg-[#15141a] p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-5 sm:p-4"}`} aria-label={`Músculos do dia: ${ms.map((x) => MUSCLES[x.m]).join(", ")}`}>
      <div className={`mx-auto grid w-full grid-cols-2 ${compact ? "max-w-32 gap-0.5" : "max-w-48 gap-1.5"}`}>
        <Figure on={on} /><Figure back on={on} />
      </div>
      <figcaption className="min-w-0">
        {!compact && <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/65">Séries por músculo</p>}
        <div className={`grid gap-1.5 ${compact ? "" : "grid-cols-2 sm:grid-cols-1"}`}>
          {(compact ? ms.slice(0, 4) : ms).map(({ m, sets, main }) => (
            <span key={m} className={`flex min-w-0 items-center gap-1.5 ${compact ? "text-[11px]" : "text-xs sm:text-sm"}`}>
              <i className="size-2 shrink-0 rounded-sm" style={{ background: main ? "#ff713d" : "#ad5152" }} />
              <span className={`flex-1 leading-tight ${compact ? "truncate" : "break-words"} ${main ? "text-white" : "text-white/75"}`}>{MUSCLES[m]}</span>
              <span className="shrink-0 font-mono text-xs text-white/70">{sets}</span>
            </span>
          ))}
        </div>
      </figcaption>
    </figure>
  );
}
