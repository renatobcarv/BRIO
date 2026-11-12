"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { haptic } from "@/components/game/xp";

/** Abertura do treino: o Colosso (criatura original do BRIO) desperta, ruge e o celular vibra. */
export function BattleIntro({ title, onDone }: { title: string; onDone: () => void }) {
  const done = useRef(onDone); done.current = onDone;
  useEffect(() => {
    const t1 = setTimeout(() => haptic([60, 40, 60, 40, 220]), 900);
    const t2 = setTimeout(() => done.current(), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black overflow-hidden" onClick={() => done.current()} role="dialog" aria-label="Início do treino">
      <div className="absolute inset-0 intro-flash" style={{ background: "radial-gradient(60% 50% at 50% 45%, rgba(224,57,62,.55), transparent 70%)" }} />
      <div className="relative flex flex-col items-center px-6 text-center">
        <svg viewBox="0 0 240 240" className="w-64 intro-beast" aria-hidden>
          <defs>
            <linearGradient id="stone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4a4a52" /><stop offset="1" stopColor="#141417" /></linearGradient>
          </defs>
          {/* ombros de pedra */}
          <path d="M14 236l18-64 52-22h72l52 22 18 64z" fill="url(#stone)" stroke="#2a2a30" strokeWidth="3" />
          {/* cabeça: bloco de rocha facetado */}
          <path d="M72 64l26-30h44l26 30 8 58-14 40-22 16h-40l-22-16-14-40z" fill="url(#stone)" stroke="#5c5c66" strokeWidth="2" strokeLinejoin="round" />
          <path d="M98 34l22 30 22-30M72 64l48 0 48 0" fill="none" stroke="#2a2a30" strokeWidth="2" />
          {/* rachaduras com magma */}
          <path className="intro-eyes" d="M120 64l-6 18 8 10-4 14M84 120l14 6-4 14M168 112l-12 10 6 12M60 196l26-14 12 10M180 196l-22-12-10 8" fill="none" stroke="#ff5a36" strokeWidth="3" strokeLinecap="round" />
          {/* sobrancelha pesada */}
          <path d="M80 98l40 8 40-8-6 10-34 4-34-4z" fill="#232328" />
          {/* olhos */}
          <g className="intro-eyes"><rect x="88" y="110" width="22" height="8" rx="2" fill="#ffd27a" /><rect x="130" y="110" width="22" height="8" rx="2" fill="#ffd27a" /></g>
          {/* boca: fenda incandescente */}
          <path className="intro-jaw" d="M98 150h44l-6 8h-32z" fill="#ff5a36" />
        </svg>
        <p className="text-[11px] font-semibold tracking-[.4em] mt-4 intro-text" style={{ color: "#e0393e" }}>O COLOSSO DESPERTOU</p>
        <p className="font-display text-4xl uppercase mt-2 intro-text" style={{ animationDelay: ".25s", textShadow: "0 0 30px #e0393e" }}>{title}</p>
        <p className="text-sm text-muted mt-2 intro-text" style={{ animationDelay: ".4s" }}>Vença-o série por série.</p>
      </div>
    </div>,
    document.body,
  );
}
