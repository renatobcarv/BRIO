"use client";
import { useState } from "react";
import { Sheet } from "@/components/kit";
import { BeastArt } from "./battle-intro";
import { CelestialArt } from "./celestial-art";
import { ALL, type BeastId, type Record_ } from "@/lib/bestiary";

const br = (d?: string) => (d ? d.split("-").reverse().slice(0, 2).join("/") : "");
function Art({ id, size }: { id: BeastId; size: string }) {
  const b = ALL(id);
  return b.angel
    ? <svg viewBox="0 0 320 320" className={size} aria-hidden><CelestialArt id={id} c={b.color} eye={b.eye} /></svg>
    : <svg viewBox="0 0 240 240" className={size} aria-hidden><BeastArt id={id} c={b.color} eye={b.eye} /></svg>;
}

/** Grade do bestiário: toque abre a criatura em tela cheia. */
export function BestiaryGrid({ ids, rec, angel }: { ids: BeastId[]; rec: Record<BeastId, Record_>; angel: boolean }) {
  const [sel, setSel] = useState<BeastId | null>(null);
  return (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        {ids.map((id) => {
          const x = ALL(id), y = rec[id], open = y.won > 0, seen = open || y.met > 0;
          return (
            <button key={id} onClick={() => setSel(id)} className="press rounded-3xl p-3 border text-center relative overflow-hidden"
              style={{ borderColor: open ? x.color + "66" : "rgba(255,255,255,.07)", background: open ? `radial-gradient(90% 70% at 50% 25%, ${x.color}30, #0b0b0d 70%)` : "#0b0b0d" }}>
              <div className="mx-auto w-full aspect-square max-w-[140px]" style={{ filter: open ? `drop-shadow(0 0 12px ${x.color}88)` : seen ? "grayscale(.6) brightness(.5)" : "grayscale(1) brightness(.16)" }}>
                <Art id={id} size="w-full h-full" />
              </div>
              <p className="text-[13px] font-bold uppercase leading-tight mt-1 break-words">{seen ? x.name : "???"}</p>
              <p className="text-[10px] text-muted leading-tight mt-0.5 line-clamp-2">{seen ? (angel ? x.virtue : x.epithet) : "Ainda não encontrado"}</p>
              <p className="text-xs font-semibold mt-1.5" style={{ color: open ? x.color : undefined }}>{open ? `${angel ? "✨" : "⚔"} ×${y.won}` : seen ? <span className="text-muted">{angel ? "incompleto" : "escapou"}</span> : <span className="text-faint">🔒</span>}</p>
            </button>
          );
        })}
      </div>
      <BeastSheet sel={sel} rec={rec} onClose={() => setSel(null)} />
    </>
  );
}

export function BeastSheet({ sel, rec, onClose }: { sel: BeastId | null; rec: Record<BeastId, Record_>; onClose: () => void }) {
  const b = sel ? ALL(sel) : null, r = sel ? rec[sel] : null, known = !!r && (r.won > 0 || r.met > 0), angel = !!b?.angel;
  return (
    <Sheet tone="war" accent={b?.color} open={!!sel} onClose={onClose} title={known && b ? b.name : "???"}>
        {b && r && (
          <div className="text-center">
            <div className="relative mx-auto w-full max-w-[320px] aspect-square rounded-[28px] overflow-hidden" style={{ background: `radial-gradient(80% 70% at 50% 45%, ${b.color}33, #050505 75%)` }}>
              <div className="absolute inset-0 grid place-items-center" style={{ filter: known ? `drop-shadow(0 0 18px ${b.color}99)` : "grayscale(1) brightness(.16)" }}>
                <Art id={sel!} size="w-[92%] h-[92%]" />
              </div>
            </div>
            <p className="text-[11px] font-semibold tracking-[.3em] mt-4" style={{ color: b.color }}>{angel ? `EXEMPLO · ${b.virtue?.toUpperCase()}` : `AMEAÇA · ${b.epithet.toUpperCase()}`}</p>
            {known ? <p className="text-[15px] text-ink/85 mt-2 leading-snug">{b.line}</p> : <p className="text-sm text-muted mt-2">Aparece numa semana da sua campanha. Cumpra todos os treinos dela para desbloquear.</p>}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="rounded-2xl bg-white/[.05] p-3"><p className="num text-2xl" style={{ color: b.color }}>{r.won}</p><p className="text-[11px] text-muted">{angel ? "conquistas" : "abates"}</p></div>
              <div className="rounded-2xl bg-white/[.05] p-3"><p className="num text-2xl">{r.met}</p><p className="text-[11px] text-muted">encontros</p></div>
              <div className="rounded-2xl bg-white/[.05] p-3"><p className="num text-lg mt-1">{r.last ? br(r.last) : "—"}</p><p className="text-[11px] text-muted">última</p></div>
            </div>
          </div>
        )}
    </Sheet>
  );
}

/** Clareira das Bestas: cena noturna com todas as criaturas já vencidas. */
export function Clareira({ rec }: { rec: Record<BeastId, Record_> }) {
  const [sel, setSel] = useState<BeastId | null>(null);
  const won = (Object.keys(rec) as BeastId[]).filter((id) => rec[id].won > 0).sort((a, b) => rec[b].won - rec[a].won);
  // posições em arco ao redor da fogueira (fundo menor, frente maior)
  const SLOTS = [[50, 30, 28], [24, 38, 24], [76, 38, 24], [16, 56, 22], [84, 56, 22], [34, 64, 25], [66, 64, 25], [50, 80, 28], [20, 80, 24], [80, 80, 24], [36, 92, 20], [64, 92, 20], [14, 94, 18], [86, 94, 18]];
  return (
    <>
    <section className="relative isolate rounded-[28px] overflow-hidden border border-white/10 aspect-[4/5] max-h-[78dvh] mx-auto w-full"
      style={{ background: "radial-gradient(70% 40% at 50% 100%, rgba(255,106,61,.28), transparent 70%), radial-gradient(90% 60% at 50% 0%, #0d1a2e, #04060a 70%)" }}>
      {/* céu, lua e estrelas */}
      <div className="absolute right-[12%] top-[7%] w-12 h-12 rounded-full" style={{ background: "radial-gradient(circle at 35% 35%, #fff, #cfd8ea 60%, #8796b3)", boxShadow: "0 0 40px rgba(207,216,234,.5)" }} />
      {Array.from({ length: 28 }, (_, i) => <span key={i} className="absolute rounded-full bg-white cel-flicker" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 23) % 34}%`, width: 1 + (i % 2), height: 1 + (i % 2), animationDelay: `${(i % 7) * 0.3}s`, opacity: 0.7 }} />)}
      {/* árvores em silhueta */}
      <svg className="absolute inset-x-0 top-[22%] w-full h-[40%]" viewBox="0 0 400 160" preserveAspectRatio="none" aria-hidden>
        <path d="M0 160V70l14-30 10 26 12-46 14 40 10-22 16 34 12-50 14 44 10-18 14 28 16-40 12 36 14-24 12 30 18-52 12 46 14-20 12 30 16-44 14 38 10-16 14 26 16-48 12 42 14-22 14 30 12-36 16 32V160z" fill="#050a10" />
      </svg>
      {/* chão e névoa */}
      <div className="absolute inset-x-0 bottom-0 h-[52%]" style={{ background: "linear-gradient(180deg, transparent, #0a0d0a 30%, #060806)" }} />
      <div className="absolute inset-x-[-10%] bottom-[30%] h-16 cel-float" style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(180,200,230,.12), transparent 70%)" }} />
      {/* fogueira central */}
      <div className="absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2 w-10 h-12">
        <div className="absolute inset-x-0 bottom-0 h-3 rounded-full bg-[#2a1608]" />
        <div className="absolute left-1/2 bottom-2 -translate-x-1/2 w-7 h-10 rounded-[50%_50%_40%_40%] cel-flicker" style={{ background: "radial-gradient(60% 70% at 50% 80%, #fff3c4, #ff5a6e 45%, #e0393e 80%, transparent)", filter: "blur(.5px)", boxShadow: "0 0 50px 20px rgba(255,106,61,.35)" }} />
      </div>
      {won.length === 0 ? (
        <div className="absolute inset-x-6 bottom-[12%] text-center">
          <p className="font-display text-xl">A clareira está vazia.</p>
          <p className="text-sm text-muted mt-1">Cumpra todos os treinos de uma semana da campanha e a primeira criatura vem descansar aqui.</p>
        </div>
      ) : won.slice(0, SLOTS.length).map((id, i) => {
        const [x, y, w] = SLOTS[i], b = ALL(id);
        return (
          <button key={id} onClick={() => setSel(id)} className="absolute -translate-x-1/2 -translate-y-1/2 press rise" aria-label={b.name}
            style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, zIndex: Math.round(y), animationDelay: `${i * 80}ms` }}>
            <div className="cel-float" style={{ animationDelay: `${i * 0.4}s`, filter: `drop-shadow(0 0 10px ${b.color}88)` }}><Art id={id} size="w-full h-auto" /></div>
            <span className="block mx-auto mt-[-6px] h-1.5 w-2/3 rounded-full bg-black/60 blur-[2px]" />
            {rec[id].won > 1 && <span className="absolute -top-1 right-0 text-[10px] font-bold rounded-full px-1.5 bg-black/70 border" style={{ borderColor: b.color, color: b.color }}>×{rec[id].won}</span>}
          </button>
        );
      })}
      <p className="absolute left-4 top-4 text-[10px] font-semibold tracking-[.3em] text-white/70">CLAREIRA DAS BESTAS</p>
    </section>
    <BeastSheet sel={sel} rec={rec} onClose={() => setSel(null)} />
    </>
  );
}
