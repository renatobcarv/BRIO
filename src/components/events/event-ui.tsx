"use client";
import { LORE, wordOfDay } from "@/lib/event-lore";
import { useEffect, useState } from "react";
import type { Badge, GameEvent } from "@/lib/events";

/** Insígnia de evento: glória (metal e brilho) ou cicatriz (escura, marcada). */
export function EventBadge({ b, size = 56, locked = false }: { b: Badge; size?: number; locked?: boolean }) {
  const glory = b.kind === "glory";
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={b.name} className="shrink-0"
      style={{ filter: locked ? "grayscale(1) brightness(.4)" : glory ? `drop-shadow(0 0 10px ${b.color})` : "drop-shadow(0 0 6px #3a0a0a)" }}>
      <defs><linearGradient id={`eb-${b.id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={glory ? "#fbe7ae" : "#3a3a3c"} /><stop offset=".5" stopColor={glory ? b.color : "#1c1c1e"} /><stop offset="1" stopColor={glory ? "#5c0f0f" : "#0d0d0d"} /></linearGradient></defs>
      <path d="M24 2l18 8v13c0 11-8 19-18 23C14 42 6 34 6 23V10z" fill={`url(#eb-${b.id})`} stroke={glory ? "#fbe7ae" : "#5a1414"} strokeWidth="1.2" />
      <path d={b.icon} fill={glory ? "#0d0d0d" : "none"} stroke={glory ? "none" : "#c43838"} strokeWidth={glory ? 0 : 2.6} strokeLinecap="round" transform="translate(6 6) scale(.75)" />
    </svg>
  );
}

/** Contagem regressiva ao vivo até uma data (meia-noite de São Paulo). */
export function Countdown({ to, color }: { to: string; color: string }) {
  const target = Date.parse(to + "T00:00:00-03:00");
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const ms = Math.max(0, target - (now ?? target));
  const parts = [[Math.floor(ms / 864e5), "dias"], [Math.floor(ms / 36e5) % 24, "horas"], [Math.floor(ms / 6e4) % 60, "min"], [Math.floor(ms / 1e3) % 60, "seg"]] as const;
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {parts.map(([v, l]) => (
        <div key={l} className="rounded-xl py-2 text-center border" style={{ borderColor: color + "55", background: "#0d0606" }}>
          <p className="num text-2xl leading-none" style={{ color, textShadow: `0 0 14px ${color}` }}>{now == null ? "--" : String(v).padStart(2, "0")}</p>
          <p className="text-[10px] text-muted mt-1">{l}</p>
        </div>
      ))}
    </div>
  );
}

const STAGE = { anunciado: "Anunciado", contagem: "Contagem regressiva", ativo: "Em andamento", vitoria: "Vencido", falha: "Não concluído" } as const;
const STEPS = ["anunciado", "contagem", "ativo", "resultado"] as const;

/** Cartão cinematográfico do evento. */
export function EventCard({ e, compact = false }: { e: GameEvent; compact?: boolean }) {
  const live = e.stage === "ativo" || e.stage === "contagem", hot = e.type === "hell_week" && live;
  const stepIdx = e.stage === "anunciado" ? 0 : e.stage === "contagem" ? 1 : e.stage === "ativo" ? 2 : 3;
  const endLabel = e.end.split("-").reverse().slice(0, 2).join("/"), startLabel = e.start.split("-").reverse().slice(0, 2).join("/");
  return (
    <section className={`relative overflow-hidden rounded-[28px] p-5 border ${hot ? "event-hot" : ""}`}
      style={{ borderColor: e.color + (live ? "aa" : "44"), background: `radial-gradient(120% 80% at 50% 0%, ${e.color}${live ? "40" : "1f"}, #0b0606 65%)`, boxShadow: live ? `0 20px 60px -24px ${e.color}` : undefined }}>
      {hot && <FireLayer contained />}
      <div className="relative">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${live ? "war-pulse" : ""}`} style={{ background: e.color, boxShadow: `0 0 10px ${e.color}` }} />
          <p className="text-[10px] font-semibold tracking-[.3em]" style={{ color: e.color }}>ASCENSION EVENT · {STAGE[e.stage].toUpperCase()}</p>
        </div>
        <p className="font-display text-[40px] leading-none mt-3 tracking-tight uppercase" style={{ textShadow: live ? `0 0 30px ${e.color}` : undefined }}>{e.title}</p>
        <p className="text-sm text-ink/80 mt-2">{e.tagline}</p>
        <p className="text-xs text-muted mt-1">{startLabel} – {endLabel} · {e.program}</p>
        {(() => { const w = wordOfDay(e.type, new Date(Date.now() - 3 * 36e5).toISOString().slice(0, 10)); return (
          <blockquote className="mt-4 pl-3 border-l-2" style={{ borderColor: e.color }}>
            <p className="text-[15px] italic leading-snug text-ink/90">“{w.t}”</p>
            <p className="text-[11px] text-muted mt-1">— {w.a}</p>
          </blockquote>); })()}
        <details className="mt-3 group">
          <summary className="text-xs font-semibold cursor-pointer list-none" style={{ color: e.color }}>Por que este evento existe ›</summary>
          <p className="text-sm text-ink/80 mt-2 leading-relaxed">{LORE[e.type].why}</p>
          <p className="label mt-3">Como vencer</p>
          <p className="text-sm text-ink/80 mt-1 leading-relaxed">{LORE[e.type].how}</p>
        </details>

        {(e.stage === "anunciado" || e.stage === "contagem") && <div className="mt-4"><p className="label mb-2">Começa em</p><Countdown to={e.start} color={e.color} /></div>}
        {e.stage === "ativo" && <div className="mt-4"><p className="label mb-2">Termina em</p><Countdown to={new Date(Date.parse(e.end + "T12:00:00Z") + 864e5).toISOString().slice(0, 10)} color={e.color} /></div>}

        {!compact && (
          <>
            <div className="flex gap-1 mt-5">{STEPS.map((st, i) => <div key={st} className="flex-1"><div className="h-1 rounded-full" style={{ background: i <= stepIdx ? e.color : "rgba(255,255,255,.08)", boxShadow: i === stepIdx ? `0 0 10px ${e.color}` : "none" }} /><p className="text-[9px] text-muted mt-1 capitalize">{st}</p></div>)}</div>
            <ul className="grid gap-2.5 mt-4">
              {e.objectives.map((o, i) => (
                <li key={i}>
                  <div className="flex justify-between gap-3 text-sm"><span className={o.done ? "" : "text-ink/85"}>{o.done ? "✓ " : ""}{o.label}{o.safety ? " 🛡" : ""}</span>
                    {!o.safety && <span className="num text-muted shrink-0">{o.value}{o.unit ?? ""} / {o.target}{o.unit ?? ""}</span>}</div>
                  {!o.safety && <div className="h-1.5 rounded-full bg-white/[.07] mt-1 overflow-hidden"><div className="h-full rounded-full bar-grow" style={{ width: `${Math.min(100, Math.max(2, (o.value / o.target) * 100))}%`, background: o.done ? "#30d158" : e.color }} /></div>}
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="mt-4 rounded-2xl p-3 border" style={{ borderColor: e.color + "44", background: "#0d0606" }}>
          <p className="text-[10px] font-semibold tracking-[.25em]" style={{ color: e.color }}>RECOMPENSA</p>
          <p className="text-sm mt-1">{e.boost}</p>
        </div>
        {!compact && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            {[e.glory, e.scar].map((b) => {
              const got = (b.kind === "glory" && e.stage === "vitoria") || (b.kind === "scar" && e.stage === "falha");
              return (
                <div key={b.id} className={`rounded-2xl p-3 border ${got ? "achv-shine relative overflow-hidden" : ""}`} style={{ borderColor: got ? b.color : "rgba(255,255,255,.06)", background: "#0d0606", opacity: got || e.stage !== "vitoria" && e.stage !== "falha" ? 1 : 0.35 }}>
                  <div className="flex items-center gap-2"><EventBadge b={b} size={40} locked={!got && (e.stage === "vitoria" || e.stage === "falha")} />
                    <div className="min-w-0"><p className="text-[11px] font-bold tracking-wider" style={{ color: b.kind === "glory" ? b.color : "#c43838" }}>{b.name}</p><p className="text-[10px] text-muted">{b.kind === "glory" ? "se vencer" : "se falhar"}</p></div></div>
                  <p className="text-[11px] text-muted mt-1.5 leading-snug">{b.desc}</p>
                </div>
              );
            })}
          </div>
        )}
        {e.retro && (e.stage === "vitoria" || e.stage === "falha") && !compact && (
          <p className="text-xs text-muted mt-3">Retrospectiva: {e.retro.sessions} treinos · {(e.retro.volume / 1000).toFixed(1).replace(".", ",")} t de volume · RPE registrado em {e.retro.rpeShare}% das séries.</p>
        )}
      </div>
    </section>
  );
}

/** Fogo: chamas na base e brasas subindo. Respeita "reduzir movimento". */
export function FireLayer({ contained = false }: { contained?: boolean }) {
  return (
    <div className={`${contained ? "absolute" : "fixed"} inset-0 pointer-events-none overflow-hidden ${contained ? "" : "z-0"}`} aria-hidden>
      <div className="fire-glow" />
      {Array.from({ length: contained ? 14 : 26 }).map((_, i) => (
        <i key={i} className="ember" style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i * 0.37) % 4}s`, animationDuration: `${3.2 + (i % 5) * 0.6}s`, ["--drift" as string]: `${((i * 23) % 40) - 20}px` }} />
      ))}
    </div>
  );
}
