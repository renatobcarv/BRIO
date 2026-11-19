"use client";
import type { CSSProperties } from "react";
import { useState } from "react";
import { HI, Ico } from "@/components/hunt-icons";
import { Sheet } from "@/components/kit";
import { CreaturePortrait } from "./creature-portrait";
import { ALL, hasEncounterArt, type BeastId, type Record_ } from "@/lib/bestiary";

const br = (d?: string) => (d ? d.split("-").reverse().slice(0, 2).join("/") : "");
/** Grade do bestiário: toque abre a criatura em tela cheia. */
export function BestiaryGrid({ ids, rec, angel }: { ids: BeastId[]; rec: Record<BeastId, Record_>; angel: boolean }) {
  const [sel, setSel] = useState<BeastId | null>(null);
  return (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        {ids.map((id) => {
          const x = ALL(id), y = rec[id], open = y.won > 0, seen = open || y.met > 0;
          return (
            <button key={id} onClick={() => setSel(id)} className="press rounded-[8px] p-3 border text-center relative overflow-hidden"
              style={{ borderColor: open ? x.color + "66" : "rgba(255,255,255,.07)", background: open ? `radial-gradient(90% 70% at 50% 25%, ${x.color}30, #0b0b0d 70%)` : "#0b0b0d" }}>
              <div className="mx-auto w-full aspect-square max-w-[140px]" style={{ filter: open ? `drop-shadow(0 0 12px ${x.color}88)` : seen ? "grayscale(.6) brightness(.5)" : "grayscale(1) brightness(.16)" }}>
                <CreaturePortrait id={id} className="w-full h-full" />
              </div>
              <p className="text-[13px] font-bold uppercase leading-tight mt-1 break-words">{seen ? x.name : "???"}</p>
              <p className="text-[10px] text-muted leading-tight mt-0.5 line-clamp-2">{seen ? (angel ? x.virtue : x.epithet) : "Ainda não encontrado"}</p>
              <p className="flex items-center justify-center gap-1 text-xs font-semibold mt-1.5" style={{ color: open ? x.color : undefined }}>
                {open ? <><Ico d={angel ? HI.spark : HI.trophy} size={13} /> ×{y.won}</> : seen
                  ? <span className="text-muted">{angel ? "incompleto" : "escapou"}</span>
                  : <Ico d={HI.lock} size={13} className="text-faint" />}
              </p>
            </button>
          );
        })}
      </div>
      <BeastSheet sel={sel} rec={rec} onClose={() => setSel(null)} />
    </>
  );
}

export function BeastSheet({ sel, rec, onClose }: { sel: BeastId | null; rec: Record<BeastId, Record_>; onClose: () => void }) {
  const [pose, setPose] = useState<BeastId | null>(null);
  const b = sel ? ALL(sel) : null, r = sel ? rec[sel] : null, known = !!r && (r.won > 0 || r.met > 0), angel = !!b?.angel;
  return (
    <Sheet tone="war" accent={b?.color} open={!!sel} onClose={() => { setPose(null); onClose(); }} title={known && b ? b.name : "???"}>
        {b && r && (
          <div className="text-center">
            <div className="relative mx-auto w-full max-w-[320px] aspect-square rounded-[8px] overflow-hidden" style={{ background: `radial-gradient(80% 70% at 50% 45%, ${b.color}33, #050505 75%)` }}>
              <div className="absolute inset-0 grid place-items-center" style={{ filter: known ? `drop-shadow(0 0 18px ${b.color}99)` : "grayscale(1) brightness(.16)" }}>
                <CreaturePortrait id={sel!} encounter={pose === sel} className="w-[92%] h-[92%]" />
              </div>
            </div>
            {known && hasEncounterArt(b.id) && (
              <button type="button" className="btn mt-3" aria-pressed={pose === sel} onClick={() => setPose(pose === sel ? null : sel)}>
                Pose de encontro
              </button>
            )}
            <p className="text-[11px] font-semibold tracking-[.3em] mt-4" style={{ color: b.color }}>{angel ? `EXEMPLO · ${b.virtue?.toUpperCase()}` : `AMEAÇA · ${b.epithet.toUpperCase()}`}</p>
            {known ? <p className="text-[15px] text-ink/85 mt-2 leading-snug">{b.line}</p> : <p className="text-sm text-muted mt-2">Aparece numa semana da sua campanha. Cumpra todos os treinos dela para desbloquear.</p>}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="rounded-[8px] bg-white/[.05] p-3"><p className="num text-2xl" style={{ color: b.color }}>{r.won}</p><p className="text-[11px] text-muted">{angel ? "conquistas" : "abates"}</p></div>
              <div className="rounded-[8px] bg-white/[.05] p-3"><p className="num text-2xl">{r.met}</p><p className="text-[11px] text-muted">encontros</p></div>
              <div className="rounded-[8px] bg-white/[.05] p-3"><p className="num text-lg mt-1">{r.last ? br(r.last) : "—"}</p><p className="text-[11px] text-muted">última</p></div>
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
  const SLOTS = [[50, 30, 28], [24, 38, 24], [76, 38, 24], [16, 56, 22], [84, 56, 22], [34, 64, 25], [66, 64, 25], [50, 80, 28], [20, 80, 24], [80, 80, 24], [36, 92, 20], [64, 92, 20], [14, 94, 18], [86, 94, 18], [12, 32, 16], [88, 32, 16]];
  return (
    <>
    <section className="bestiary-clearing relative isolate mx-auto w-full overflow-hidden rounded-[8px] border border-white/10 aspect-[4/5]" aria-label="Clareira das Bestas">
      <div className="clearing-firelight" aria-hidden />
      <div className="clearing-campfire pointer-events-none absolute z-[58]" aria-hidden>
        <picture>
          <source srcSet="/bestiario/fogueira-parada.webp" media="(prefers-reduced-motion: reduce)" />
          <img src="/bestiario/fogueira.webp" alt="" width={192} height={192} className="block h-auto w-full" />
        </picture>
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className="clearing-ember" style={{
            left: `${39 + (i * 7) % 24}%`,
            animationDelay: `-${i * .31}s`,
            animationDuration: `${1.6 + (i % 4) * .35}s`,
            "--ember-drift": `${(i % 5 - 2) * 9}px`,
          } as CSSProperties} />
        ))}
      </div>
      {won.length === 0 ? (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/75 to-transparent px-6 pb-[8%] pt-12 text-center">
          <p className="font-display text-xl">A clareira está vazia.</p>
          <p className="text-sm text-white/80 mt-1">Cumpra todos os treinos de uma semana da campanha e a primeira criatura vem descansar aqui.</p>
        </div>
      ) : won.slice(0, SLOTS.length).map((id, i) => {
        const [x, y, w] = SLOTS[i], b = ALL(id);
        return (
          <button key={id} onClick={() => setSel(id)} className="absolute -translate-x-1/2 -translate-y-1/2 press rise" aria-label={b.name}
            style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, zIndex: Math.round(y), animationDelay: `${i * 80}ms` }}>
            <div className="cel-float" style={{ animationDelay: `${i * 0.4}s`, filter: `drop-shadow(0 0 10px ${b.color}88)` }}><CreaturePortrait id={id} className="w-full h-auto" /></div>
            <span className="block mx-auto mt-[-6px] h-1.5 w-2/3 rounded-full bg-black/60 blur-[2px]" />
            {rec[id].won > 1 && <span className="absolute -top-1 right-0 text-[10px] font-bold rounded-full px-1.5 bg-black/70 border" style={{ borderColor: b.color, color: b.color }}>×{rec[id].won}</span>}
          </button>
        );
      })}
      <p className="absolute left-4 top-4 rounded bg-black/55 px-2 py-1 text-[10px] font-semibold tracking-[.25em] text-white/90">CLAREIRA DAS BESTAS</p>
    </section>
    <BeastSheet sel={sel} rec={rec} onClose={() => setSel(null)} />
    </>
  );
}
