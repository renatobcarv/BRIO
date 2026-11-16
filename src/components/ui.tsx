import { Ico } from "@/components/hunt-icons";
import { verseFor, type Area } from "@/lib/verses";

export function PageHeader({ eyebrow, title, color = "#ff2800", line, icon }: { eyebrow: string; title: string; color?: string; line?: string; icon?: string }) {
  return (
    <header className="rise mb-5 span-all">
      <p className="label flex items-center gap-2" style={{ color }}>{icon ? <Ico d={icon} size={13} /> : <span className="h-1.5 w-1.5 war-pulse" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />}{eyebrow}</p>
      <h1 className="font-display text-5xl mt-2">{title}<span className="text-[#ffb21e]">.</span></h1>
      {line && <p className="text-sm text-muted mt-2">{line}</p>}
    </header>
  );
}

/** Placar do modo caçador: número grande, barra em segmentos e três colunas. Server-safe. */
export function Board({ icon, label, big, unit, sub, bar, stats = [], note, children }: {
  icon: string; label: string; big: string; unit?: string; sub?: string; bar?: number;
  stats?: [string, string, string, string?][]; note?: React.ReactNode; children?: React.ReactNode;
}) {
  const R = "#ff2800";
  return (
    <section className="hunt-card rise relative overflow-hidden p-5 mb-4 span-all board">
      <span aria-hidden className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: R, boxShadow: `0 0 18px ${R}` }} />
      <p className="label flex items-center gap-1.5"><Ico d={icon} size={13} />{label}</p>
      <p className="num text-6xl leading-none mt-2">{big}{unit && <span className="text-xl text-white/40"> {unit}</span>}</p>
      {sub && <p className="text-[12px] text-white/55 mt-2">{sub}</p>}
      {bar != null && <div className="flex gap-[3px] mt-4" aria-hidden>{Array.from({ length: 20 }, (_, i) => <i key={i} className="h-[5px] flex-1" style={{ background: i < Math.round(Math.max(0, Math.min(1, bar)) * 20) ? R : "rgba(255,255,255,.08)" }} />)}</div>}
      {stats.length > 0 && (
        <div className="grid mt-5 border-t border-white/[.06] divide-x divide-white/[.06]" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0,1fr))` }}>
          {stats.map(([ic, l, v, u]) => (
            <div key={l} className="pt-3 text-center min-w-0"><p className="label !text-[9px] flex items-center justify-center gap-1"><Ico d={ic} size={11} />{l}</p><p className="num text-2xl mt-1 truncate" style={{ color: "#ffb21e" }}>{v}</p>{u && <p className="text-[10px] text-white/45 truncate">{u}</p>}</div>))}
        </div>)}
      {note && <div className="text-[12px] text-white/60 mt-4">{note}</div>}
      {children}
    </section>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`glass p-5 rise ${className}`}>{children}</section>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="font-display italic text-muted text-lg text-center py-8">{children}</p>;
}

export function Ring({ value, size = 120, stroke = 10, color = "#ff2800", children }:
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
