// Insígnias do ASCENSION: cada patente acrescenta um elemento e sobe de material.
import { RANKS } from "@/lib/game";

const METAL = {
  silver: ["#f2f4f6", "#aeb3ba", "#6f747b", "#d9dce0"],
  red: ["#e65a5a", "#ab2424", "#5c0f0f", "#c43838"],
  gold: ["#fbe7ae", "#c6a15b", "#7a5a22", "#e6c47e"],
} as const;

function Defs({ id }: { id: string }) {
  return (
    <defs>
      {(Object.keys(METAL) as (keyof typeof METAL)[]).map((m) => (
        <linearGradient key={m} id={`${id}-${m}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={METAL[m][0]} /><stop offset=".45" stopColor={METAL[m][1]} /><stop offset=".7" stopColor={METAL[m][2]} /><stop offset="1" stopColor={METAL[m][3]} />
        </linearGradient>
      ))}
      <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".55" /><stop offset=".5" stopColor="#fff" stopOpacity="0" /></linearGradient>
      <radialGradient id={`${id}-rays`}><stop offset="0" stopColor="#fbe7ae" stopOpacity=".8" /><stop offset="1" stopColor="#fbe7ae" stopOpacity="0" /></radialGradient>
    </defs>
  );
}

const SHIELD = "M50 10 L84 22 V48 C84 70 69 84 50 92 C31 84 16 70 16 48 V22 Z";
const SHIELD_IN = "M50 18 L77 27.5 V48 C77 66 65 77.5 50 84 C35 77.5 23 66 23 48 V27.5 Z";
const chevron = (y: number, w = 22, h = 12, t = 6) => `M${50 - w} ${y} L50 ${y + h} L${50 + w} ${y} L${50 + w} ${y + t} L50 ${y + h + t} L${50 - w} ${y + t} Z`;
const star = (cx: number, cy: number, r: number) => Array.from({ length: 10 }, (_, i) => { const a = (Math.PI / 5) * i - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; return `${i ? "L" : "M"}${(cx + Math.cos(a) * rr).toFixed(2)} ${(cy + Math.sin(a) * rr).toFixed(2)}`; }).join(" ") + "Z";
const crown = "M33 14 L38 4 L44 11 L50 2 L56 11 L62 4 L67 14 Z";
const laurel = (side: 1 | -1) => Array.from({ length: 5 }, (_, i) => { const y = 78 - i * 11, x = 50 + side * (38 - i * 1.5); return <ellipse key={i} cx={x} cy={y} rx="3.4" ry="7" transform={`rotate(${side * (35 - i * 6)} ${x} ${y})`} />; });
const wing = (side: 1 | -1) => `M${50 + side * 30} 34 C${50 + side * 46} 30 ${50 + side * 52} 42 ${50 + side * 49} 56 C${50 + side * 44} 50 ${50 + side * 38} 48 ${50 + side * 31} 50 Z`;

/** Insígnia da patente pelo índice (0 = Initiate … 9 = Apex). */
export function Insignia({ index, size = 96, locked = false, glow = true }: { index: number; size?: number; locked?: boolean; glow?: boolean }) {
  const id = `ins${index}`;
  const rank = RANKS[Math.max(0, Math.min(9, index))];
  const m = (k: keyof typeof METAL) => `url(#${id}-${k})`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`Insígnia ${rank.name}`}
      style={{ filter: locked ? "grayscale(1) brightness(.45)" : glow ? `drop-shadow(0 0 ${index >= 6 ? 14 : 9}px ${rank.color}88)` : undefined, overflow: "visible" }}>
      <Defs id={id} />
      {index === 9 && <circle cx="50" cy="50" r="50" fill={`url(#${id}-rays)`} />}
      {index === 9 && Array.from({ length: 12 }, (_, i) => <rect key={i} x="49" y="-2" width="2" height="16" fill="#fbe7ae" opacity=".55" transform={`rotate(${i * 30} 50 50)`} />)}
      {index <= 2 && (
        <g>
          {index >= 1 && <path d="M50 14 L57 22 L50 30 L43 22 Z" fill={m("silver")} />}
          <path d={chevron(index === 2 ? 34 : 40, 26, 16, 9)} fill={m("silver")} stroke="#2a2c30" strokeWidth=".8" />
          {index === 2 && <path d={chevron(56, 26, 16, 9)} fill={m("silver")} stroke="#2a2c30" strokeWidth=".8" />}
        </g>
      )}
      {index >= 3 && (
        <g>
          {index >= 8 && <><path d={wing(-1)} fill={m("gold")} /><path d={wing(1)} fill={m("gold")} /></>}
          {index >= 6 && <g fill={m("gold")}>{laurel(-1)}{laurel(1)}</g>}
          <path d={SHIELD} fill={m(index >= 6 ? "gold" : "silver")} />
          <path d={SHIELD_IN} fill={index >= 6 ? "#5c0f0f" : m("red")} />
          <path d={SHIELD_IN} fill={`url(#${id}-shine)`} opacity=".35" />
          {index === 3 && <path d={chevron(44, 16, 10, 7)} fill={m("silver")} />}
          {index === 4 && <><path d={chevron(48, 16, 10, 6)} fill={m("silver")} /><path d={chevron(60, 16, 10, 6)} fill={m("silver")} /><path d={star(50, 35, 7)} fill={m("silver")} /></>}
          {index === 5 && <g fill={m("silver")}>
            {/* Torre de vigia: base, corpo e ameias */}
            <path d="M38 72 H62 L59 64 H41 Z" />
            <rect x="42" y="38" width="16" height="27" rx="1" />
            <path d="M39 30 H44 V35 H47.5 V30 H52.5 V35 H56 V30 H61 V39 H39 Z" />
            <rect x="48" y="45" width="4" height="7" rx="2" fill="#5c0f0f" />
          </g>}
          {index >= 6 && <><path d={star(index >= 7 ? 50 : 42, 46, 8)} fill={m("gold")} />{index === 6 && <path d={star(58, 46, 8)} fill={m("gold")} />}<path d={chevron(60, 15, 8, 5)} fill={m("gold")} /></>}
          {index >= 7 && <path d={crown} fill={m("gold")} stroke="#5c3d0e" strokeWidth=".6" />}
          {index === 9 && <path d={star(50, 46, 11)} fill="#fff6d8" opacity=".9" />}
        </g>
      )}
    </svg>
  );
}

/** Insígnias dos títulos especiais. */
export function TitleBadge({ id, size = 64, locked = false }: { id: "phoenix" | "titan" | "archon"; size?: number; locked?: boolean }) {
  const k = `t-${id}`;
  const c = id === "phoenix" ? ["#ffd27a", "#e2572b", "#801717"] : id === "titan" ? ["#f2f4f6", "#9aa0a6", "#4a4e54"] : ["#fbe7ae", "#c6a15b", "#7a5a22"];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`Título ${id}`} style={{ filter: locked ? "grayscale(1) brightness(.4)" : `drop-shadow(0 0 12px ${c[1]}99)`, overflow: "visible" }}>
      <defs><linearGradient id={k} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c[0]} /><stop offset=".55" stopColor={c[1]} /><stop offset="1" stopColor={c[2]} /></linearGradient></defs>
      <circle cx="50" cy="50" r="44" fill="#0d0d0d" stroke={`url(#${k})`} strokeWidth="4" />
      {id === "phoenix" && <g fill={`url(#${k})`}>
        <path d="M50 22 C58 34 64 40 62 54 C60 66 54 72 50 76 C46 72 40 66 38 54 C36 40 42 34 50 22 Z" />
        <path d="M38 50 C28 44 20 46 16 52 C24 52 30 56 36 60 Z" /><path d="M62 50 C72 44 80 46 84 52 C76 52 70 56 64 60 Z" />
      </g>}
      {id === "titan" && <g fill={`url(#${k})`}>
        <rect x="30" y="24" width="40" height="7" rx="2" /><rect x="30" y="69" width="40" height="7" rx="2" />
        {[36, 46, 56].map((x) => <rect key={x} x={x} y="32" width="8" height="36" rx="2" />)}
      </g>}
      {id === "archon" && <g fill={`url(#${k})`}>
        <path d="M24 42 C34 38 44 40 50 46 C56 40 66 38 76 42 V72 C66 68 56 70 50 76 C44 70 34 68 24 72 Z" />
        <path d="M36 32 L40 24 L45 30 L50 22 L55 30 L60 24 L64 32 Z" />
      </g>}
    </svg>
  );
}
