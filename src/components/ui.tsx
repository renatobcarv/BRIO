import { verseFor, type Area } from "@/lib/verses";

export function PageHeader({ eyebrow, title, color = "#ffb340" }: { eyebrow: string; title: string; color?: string }) {
  return (
    <header className="rise mb-6">
      <p className="label" style={{ color }}>{eyebrow}</p>
      <h1 className="font-display text-4xl md:text-5xl mt-2 leading-tight">{title}</h1>
    </header>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`glass p-5 rise ${className}`}>{children}</section>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="font-display italic text-muted text-lg text-center py-8">{children}</p>;
}

export function Ring({ value, size = 120, stroke = 10, color = "#ffb340", children }:
  { value: number; size?: number; stroke?: number; color?: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, v = Math.max(0, Math.min(1, value));
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v)} className="ring-anim"
          style={{ ["--c" as string]: c, transition: "stroke-dashoffset 900ms cubic-bezier(.34,1.56,.64,1)", filter: v > 0 ? `drop-shadow(0 0 6px ${color}88)` : undefined }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function Verse({ area }: { area: Area }) {
  const [text, ref] = verseFor(area);
  return (
    <footer className="mt-12 mb-4 text-center rise">
      <p className="font-display italic text-muted text-lg max-w-md mx-auto">“{text}”</p>
      <p className="label mt-2">{ref}</p>
    </footer>
  );
}
