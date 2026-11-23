"use client";
import { useEffect, useRef, useState } from "react";
import { CreaturePortrait } from "@/components/body/creature-portrait";
import { ALL, type BeastId } from "@/lib/bestiary";
import { sealDifficulty } from "@/lib/items";

const A = "#ffb21e";
const R = 120, C = 140;
const arc = (a0: number, a1: number, r = R) => {
  const p = (a: number) => [C + r * Math.cos(((a - 90) * Math.PI) / 180), C + r * Math.sin(((a - 90) * Math.PI) / 180)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `M${x0} ${y0} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
};

/** Minigame do selo: toque quando a agulha estiver na zona âmbar. Erre uma vez e a fera foge. */
export function SealGame({ beast, threat, boss, onEnd }: { beast: BeastId; threat: number; boss: boolean; onEnd: (ok: boolean) => void }) {
  const d = sealDifficulty(threat, boss);
  const [phase, setPhase] = useState<"intro" | "play" | "won" | "lost">("intro");
  const [round, setRound] = useState(0), [zone, setZone] = useState(() => 60 + Math.random() * 240);
  const ang = useRef(0), speed = useRef(d.speed), dir = useRef(1), raf = useRef(0), last = useRef(0);
  const [, tick] = useState(0);
  useEffect(() => {
    if (phase !== "play") return;
    const loop = (t: number) => {
      if (last.current) ang.current = (ang.current + dir.current * speed.current * ((t - last.current) / 1000) + 360) % 360;
      last.current = t; tick((x) => x + 1); raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf.current); last.current = 0; };
  }, [phase]);
  const hit = () => {
    if (phase !== "play") return;
    const diff = Math.abs(((ang.current - zone + 540) % 360) - 180);
    if (diff > d.zoneDeg / 2) { setPhase("lost"); navigator.vibrate?.(200); return; }
    navigator.vibrate?.(30);
    if (round + 1 >= d.rounds) { setPhase("won"); return; }
    setRound(round + 1); speed.current *= d.speedUp; if (boss || threat >= 4) dir.current *= -1;
    setZone((zone + 90 + Math.random() * 180) % 360);
  };
  const b = ALL(beast), a = ang.current;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/90 backdrop-blur-sm p-4" role="dialog" aria-modal aria-label={`Domar ${b.name}`}
      onPointerDown={(e) => { if (phase === "play") { e.preventDefault(); hit(); } }}>
      <div className="w-full max-w-sm text-center select-none">
        <p className="text-[11px] tracking-[.35em] uppercase" style={{ color: A }}>{boss ? "Chefe · " : ""}Ameaça {threat}</p>
        <p className="font-display text-3xl mt-1">{b.name}</p>
        <div className="relative mx-auto mt-4" style={{ width: 280, height: 280 }}>
          <div className="absolute inset-[50px]" style={{ filter: phase === "won" ? `drop-shadow(0 0 24px ${A})` : phase === "lost" ? "grayscale(1) brightness(.35)" : `drop-shadow(0 0 10px ${b.color}88)` }}>
            <CreaturePortrait id={beast} className="w-full h-full" />
          </div>
          <svg width="280" height="300" className="absolute inset-0 overflow-visible" aria-hidden>
            <circle cx={C} cy={C} r={R} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="10" />
            {phase === "play" && <path d={arc(zone - d.zoneDeg / 2, zone + d.zoneDeg / 2)} fill="none" stroke={A} strokeWidth="14" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 8px ${A})` }} />}
            {phase === "play" && <line x1={C} y1={C} x2={C + (R + 12) * Math.cos(((a - 90) * Math.PI) / 180)} y2={C + (R + 12) * Math.sin(((a - 90) * Math.PI) / 180)} stroke="#f5f5f7" strokeWidth="3" strokeLinecap="round" />}
            {Array.from({ length: d.rounds }, (_, i) => <circle key={i} cx={C - (d.rounds - 1) * 9 + i * 18} cy={C + R + 26} r="5" fill={i < round || phase === "won" ? A : "rgba(255,255,255,.15)"} />)}
          </svg>
        </div>
        {phase === "intro" && <>
          <p className="text-[14px] text-white/70 mt-3">A fera derrotada ainda resiste. Toque na tela quando a agulha passar pela zona âmbar. São {d.rounds} selos, e cada um fica mais rápido. <b>Uma única tentativa:</b> errou, ela foge para sempre.</p>
          <div className="grid grid-cols-2 gap-2 mt-5">
            <button className="btn" onClick={() => onEnd(false)} onPointerDown={(e) => e.stopPropagation()}>Deixar ir</button>
            <button className="btn btn-accent" onPointerDown={(e) => e.stopPropagation()} onClick={() => setPhase("play")}>Selar</button>
          </div>
          <p className="text-[11px] text-white/40 mt-2">“Deixar ir” também gasta a tentativa.</p>
        </>}
        {phase === "play" && <p className="text-[13px] text-white/60 mt-3">Selo {round + 1} de {d.rounds} · toque em qualquer lugar</p>}
        {phase === "won" && <>
          <p className="text-[22px] font-bold mt-3" style={{ color: A }}>Levante-se.</p>
          <p className="text-[14px] text-white/70">{b.name} agora é sua aliada.</p>
          <button className="btn btn-accent w-full mt-5" onClick={() => onEnd(true)}>Receber</button>
        </>}
        {phase === "lost" && <>
          <p className="text-[20px] font-bold mt-3 text-white/80">O selo quebrou.</p>
          <p className="text-[14px] text-white/55">{b.name} fugiu. Outra oportunidade pode surgir em uma caçada futura.</p>
          <button className="btn w-full mt-5" onClick={() => onEnd(false)}>Voltar</button>
        </>}
      </div>
    </div>
  );
}
