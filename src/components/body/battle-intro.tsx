"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { haptic } from "@/components/game/xp";
import type { Beast } from "@/lib/bestiary";
import { CreaturePortrait } from "./creature-portrait";

/** Abertura do treino: a criatura da semana desperta. Quanto maior a ameaça, mais forte tudo fica. */
export function BattleIntro({ title, beast, onDone }: { title: string; beast: Beast; onDone: () => void }) {
  const done = useRef(onDone); done.current = onDone;
  const t = beast.threat;
  useEffect(() => {
    const pulse = Array.from({ length: t }, () => [50 + t * 10, 40]).flat();
    const t1 = setTimeout(() => haptic([...pulse, 120 + t * 40]), 900);
    const t2 = setTimeout(() => done.current(), 2300 + t * 150);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [t]);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[90] grid place-items-center overflow-hidden" style={{ background: `radial-gradient(120% 80% at 50% 110%, ${beast.color}22, #000 60%)` }}
      onClick={() => done.current()} role="dialog" aria-label="Início do treino">
      <div className="absolute inset-0 intro-flash" style={{ background: `radial-gradient(${40 + t * 8}% ${36 + t * 7}% at 50% 42%, ${beast.color}${t >= 4 ? "aa" : "77"}, transparent 70%)` }} />
      {t >= 4 && <div className="absolute inset-0 intro-flash pointer-events-none" style={{ animationDelay: ".3s", boxShadow: `inset 0 0 ${t * 30}px ${beast.color}` }} />}
      <div className="absolute -inset-[60%] intro-rays pointer-events-none" style={{ background: `conic-gradient(from 0deg at 50% 46%, transparent 0 8%, ${beast.color}22 10%, transparent 12% 30%, ${beast.color}1a 32%, transparent 34% 55%, ${beast.color}22 57%, transparent 59% 80%, ${beast.color}18 82%, transparent 84%)` }} />
      <div className="absolute left-1/2 top-[56%] intro-shock pointer-events-none" style={{ borderColor: beast.color, ["--d" as string]: `${0.95}s` } as React.CSSProperties} />
      {t >= 3 && <div className="absolute left-1/2 top-[56%] intro-shock pointer-events-none" style={{ borderColor: beast.eye, ["--d" as string]: `1.2s` } as React.CSSProperties} />}
      {Array.from({ length: 10 + t * 6 }, (_, i) => (
        <span key={i} className="intro-ember" style={{ left: `${(i * 37) % 100}%`, background: i % 3 ? beast.color : beast.eye, animationDelay: `${(i % 9) * 0.18}s`, animationDuration: `${2.4 - t * 0.2 + (i % 4) * 0.3}s`, width: 2 + (i % 3), height: 2 + (i % 3) }} />
      ))}
      <div className={`relative flex flex-col items-center px-5 text-center max-w-md w-full max-h-dvh justify-center py-[max(16px,env(safe-area-inset-top))] ${t >= 3 ? "intro-quake" : ""}`} style={{ ["--q" as string]: `${t * 1.5}px` } as React.CSSProperties}>
        {beast.angel ? (
          <CreaturePortrait eager id={beast.id} className="intro-beast" style={{ width: "min(88vw, 46dvh, 420px)" }} />
        ) : (
          <CreaturePortrait encounter eager id={beast.id} className="intro-beast intro-breathe"
            style={{ width: `min(${200 + t * 16}px, 72vw, 40dvh)`, ["--shake" as string]: `${2 + t * 2}px`, animationIterationCount: `1, ${1 + t}`, filter: `drop-shadow(0 0 ${t * 8}px ${beast.color}88)` }} />
        )}
        {!beast.angel && <div className="flex gap-1 mt-4 intro-text" aria-label={`Ameaça ${t} de 5`}>
          {[1, 2, 3, 4, 5].map((i) => <span key={i} className="h-1.5 w-6 rounded-full" style={{ background: i <= t ? beast.color : "rgba(255,255,255,.12)", boxShadow: i <= t ? `0 0 8px ${beast.color}` : "none" }} />)}
        </div>}
        {beast.angel && <p className="text-[11px] text-muted mt-4 intro-text">{beast.epithet}</p>}
        <p className="text-[11px] font-semibold tracking-[.35em] mt-3 intro-text" style={{ color: beast.color }}>{beast.angel ? `EXEMPLO DA SEMANA · ${beast.virtue?.toUpperCase()}` : t >= 5 ? "☠ AMEAÇA MÁXIMA" : `AMEAÇA ${t}/5`} {beast.angel ? "" : ` · ${beast.epithet.toUpperCase()}`}</p>
        <p className="font-display text-[clamp(28px,9vw,40px)] leading-none uppercase mt-2 intro-text" style={{ animationDelay: ".2s", textShadow: `0 0 30px ${beast.color}` }}>{beast.name}</p>
        <p className="text-sm text-ink/80 mt-2 intro-text" style={{ animationDelay: ".35s" }}>{beast.line}</p>
        {beast.ref && <p className="text-[11px] text-muted mt-1 intro-text" style={{ animationDelay: ".4s" }}>Inspirado em {beast.ref}</p>}
        <p className="text-xs text-muted mt-4 intro-text" style={{ animationDelay: ".5s" }}>{beast.angel ? `Siga o exemplo no treino de hoje: ${title}` : `Missão: ${title}`}</p>
      </div>
      <p className="absolute bottom-[max(20px,env(safe-area-inset-bottom))] left-0 right-0 text-center text-[11px] text-muted tracking-[.3em] intro-text" style={{ animationDelay: ".9s" }}>TOQUE PARA COMEÇAR</p>
    </div>,
    document.body,
  );
}
