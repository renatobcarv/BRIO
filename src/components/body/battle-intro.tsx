"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { haptic } from "@/components/game/xp";
import type { Beast, BeastId } from "@/lib/bestiary";

const STONE = (id: string, a: string, b: string) => <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient>;

/** Arte de cada criatura (SVG original, 240×240). */
function Art({ id, c, eye, wings = 1 }: { id: BeastId; c: string; eye: string; wings?: number }) {
  const E = (p: React.ReactNode) => <g className="intro-eyes" style={{ filter: `drop-shadow(0 0 8px ${eye})` }}>{p}</g>;
  if (id === "vigia" || id === "arauto" || id === "guerreiro") {
    const pairs = Array.from({ length: wings }, (_, i) => i);
    return (<>
      <defs>{STONE("s", "#3a3326", "#0b0906")}<linearGradient id="w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={eye} /><stop offset="1" stopColor={c} stopOpacity=".15" /></linearGradient></defs>
      {/* asas */}
      {pairs.map((i) => { const y = 60 + i * 34, sp = 1 - i * 0.14; return (
        <g key={i} className="intro-wing" style={{ animationDelay: `${0.15 + i * 0.12}s` }}>
          <path d={`M110 ${y + 40}C${110 - 70 * sp} ${y - 20} ${110 - 110 * sp} ${y + 10} ${110 - 116 * sp} ${y + 70}c${30 * sp}-${20} ${50 * sp}-10 ${70 * sp} 0c-${10 * sp}-${16} 0-${26} 36-${30}z`} fill="url(#w)" stroke={c} strokeWidth="2" />
          {[0, 1, 2, 3].map((f) => <path key={f} d={`M${104 - f * 4} ${y + 38 - f * 2}L${110 - (40 + f * 18) * sp} ${y + 30 + f * 10}M${136 + f * 4} ${y + 38 - f * 2}L${130 + (40 + f * 18) * sp} ${y + 30 + f * 10}`} stroke={eye} strokeOpacity=".35" strokeWidth="1.5" />)}
          <path d={`M130 ${y + 40}C${130 + 70 * sp} ${y - 20} ${130 + 110 * sp} ${y + 10} ${130 + 116 * sp} ${y + 70}c-${30 * sp}-${20} -${50 * sp}-10 -${70 * sp} 0c${10 * sp}-${16} 0-${26} -36-${30}z`} fill="url(#w)" stroke={c} strokeWidth="2" />
        </g>); })}
      {/* armadura */}
      <path d="M58 240l18-62 44-18 44 18 18 62z" fill="url(#s)" stroke={c} strokeWidth="3" />
      <path d="M86 186l34 18 34-18M92 208l28 14 28-14" fill="none" stroke={c} strokeOpacity=".55" strokeWidth="2" />
      <path d="M58 200c4-18 16-28 30-30l-6 26zM182 200c-4-18-16-28-30-30l6 26z" fill={c} fillOpacity=".25" stroke={c} strokeWidth="2" />
      {/* elmo */}
      <path d="M90 76l30-26 30 26v52l-12 22h-36l-12-22z" fill="url(#s)" stroke={c} strokeWidth="3" strokeLinejoin="round" />
      <path d="M120 50v34" stroke={c} strokeWidth="4" />
      {E(<><path d="M96 106h20l-4 7H98z" fill={eye} /><path d="M144 106h-20l4 7h14z" fill={eye} /></>)}
      <path d="M108 132h24" stroke={c} strokeWidth="3" strokeLinecap="round" />
      {/* lança de luz */}
      <path className="intro-eyes" d="M196 236L214 40" stroke={eye} strokeWidth="4" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${c})` }} />
    </>);
  }
  switch (id) {
    case "golem": return (<>
      <defs>{STONE("s", "#4a4a52", "#141417")}</defs>
      <path d="M14 236l18-64 52-22h72l52 22 18 64z" fill="url(#s)" stroke="#2a2a30" strokeWidth="3" />
      <path d="M72 64l26-30h44l26 30 8 58-14 40-22 16h-40l-22-16-14-40z" fill="url(#s)" stroke="#5c5c66" strokeWidth="2" strokeLinejoin="round" />
      <path className="intro-eyes" d="M120 64l-6 18 8 10-4 14M84 120l14 6-4 14M168 112l-12 10 6 12M60 196l26-14 12 10M180 196l-22-12-10 8" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" />
      <path d="M80 98l40 8 40-8-6 10-34 4-34-4z" fill="#232328" />
      {E(<><rect x="88" y="110" width="22" height="8" rx="2" fill={eye} /><rect x="130" y="110" width="22" height="8" rx="2" fill={eye} /></>)}
      <path className="intro-jaw" d="M98 150h44l-6 8h-32z" fill={c} /></>);
    case "lobo": return (<>
      <defs>{STONE("s", "#5a6470", "#15181c")}</defs>
      <path d="M60 40l22 50M180 40l-22 50" stroke="#8a96a3" strokeWidth="10" strokeLinecap="round" />
      <path d="M60 40l40 46h40l40-46 6 70-30 50-46 60-46-60-30-50z" fill="url(#s)" stroke="#9aa6b2" strokeWidth="2" strokeLinejoin="round" />
      <path d="M120 96v70M98 150l22 20 22-20" fill="none" stroke="#2a3038" strokeWidth="3" />
      {E(<><path d="M82 112l26 8-24 6z" fill={eye} /><path d="M158 112l-26 8 24 6z" fill={eye} /></>)}
      <path className="intro-jaw" d="M100 176l20 30 20-30-20 8z" fill="#0d0f12" stroke={c} strokeWidth="2" />
      <path d="M40 210l40-20M200 210l-40-20" stroke={c} strokeOpacity=".5" strokeWidth="3" /></>);
    case "javali": return (<>
      <defs>{STONE("s", "#6b4a2a", "#1a1008")}</defs>
      <path d="M40 120l30-60h100l30 60-10 60-40 40h-60l-40-40z" fill="url(#s)" stroke="#a0703c" strokeWidth="3" strokeLinejoin="round" />
      <path d="M70 60h100v24H70z" fill="#3a3f46" stroke="#8a929c" strokeWidth="2" />
      {E(<><circle cx="88" cy="118" r="8" fill={eye} /><circle cx="152" cy="118" r="8" fill={eye} /></>)}
      <rect x="96" y="150" width="48" height="36" rx="14" fill="#2a1a0e" stroke="#a0703c" strokeWidth="2" />
      <path className="intro-jaw" d="M92 176c-20-4-30-24-26-44M148 176c20-4 30-24 26-44" fill="none" stroke="#f5efe0" strokeWidth="9" strokeLinecap="round" /></>);
    case "serpe": return (<>
      <defs>{STONE("s", "#3b2450", "#0c0612")}</defs>
      <path d="M30 230c10-60 60-60 60-110S60 60 120 30c60 30 30 40 30 90s50 50 60 110z" fill="url(#s)" stroke={c} strokeWidth="2" />
      <path d="M120 30l-14 40h28z" fill={c} opacity=".7" />
      {[0, 1, 2, 3].map((i) => <path key={i} d={`M${96 - i * 4} ${150 + i * 18}h${48 + i * 8}`} stroke={c} strokeOpacity=".35" strokeWidth="2" />)}
      {E(<><path d="M92 96l24 12-22 4z" fill={eye} /><path d="M148 96l-24 12 22 4z" fill={eye} /></>)}
      <path className="intro-jaw" d="M104 130l16 20 16-20" fill="none" stroke={eye} strokeWidth="3" /></>);
    case "titan": return (<>
      <defs>{STONE("s", "#3a1410", "#0a0303")}</defs>
      <path d="M4 236l24-70 60-24h64l60 24 24 70z" fill="url(#s)" stroke={c} strokeOpacity=".6" strokeWidth="3" />
      <path d="M78 40l14 18 14-26 14 22 14-22 14 26 14-18 6 30H72z" fill={c} className="intro-eyes" />
      <path d="M70 70h100l10 60-16 40-24 18h-40l-24-18-16-40z" fill="url(#s)" stroke={c} strokeWidth="3" strokeLinejoin="round" />
      <path className="intro-eyes" d="M120 70v30M90 140l-16 30M150 140l16 30M30 200l40-20M210 200l-40-20" stroke={c} strokeWidth="4" strokeLinecap="round" />
      {E(<><rect x="84" y="108" width="28" height="9" rx="2" fill={eye} /><rect x="128" y="108" width="28" height="9" rx="2" fill={eye} /></>)}
      <path className="intro-jaw" d="M94 152h52l-8 12h-36z" fill={eye} /></>);
    case "juggernaut": return (<>
      <defs>{STONE("s", "#2e2e33", "#060607")}</defs>
      <path d="M0 240l20-80 70-30h60l70 30 20 80z" fill="url(#s)" stroke="#5a5a62" strokeWidth="3" />
      <path d="M30 170l-14-30 40 10M210 170l14-30-40 10" fill="#3a3a40" stroke={c} strokeWidth="2" />
      <path d="M66 50h108l14 70-20 60-48 20-48-20-20-60z" fill="url(#s)" stroke="#8a8a94" strokeWidth="3" strokeLinejoin="round" />
      <path d="M78 104h84v18H78z" fill="#000" />
      {E(<rect x="80" y="108" width="80" height="10" fill={c} />)}
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={96 + i * 12} y="142" width="4" height="26" fill="#000" />)}
      <path d="M120 50v40" stroke="#8a8a94" strokeWidth="6" />
      <path d="M100 50l20-14 20 14" fill="none" stroke="#8a8a94" strokeWidth="5" strokeLinejoin="round" /></>);
    case "sentinela": return (<>
      <defs>{STONE("s", "#1f4a34", "#06120c")}</defs>
      <path d="M120 20l60 80-60 130-60-130z" fill="url(#s)" stroke={c} strokeWidth="3" strokeLinejoin="round" />
      <path d="M60 100h120M120 20v210M90 100l30 130 30-130" fill="none" stroke={c} strokeOpacity=".4" strokeWidth="2" />
      {E(<><circle cx="104" cy="88" r="6" fill={eye} /><circle cx="136" cy="88" r="6" fill={eye} /></>)}
      <path className="intro-jaw" d="M108 122h24" stroke={eye} strokeWidth="3" strokeLinecap="round" /></>);
    case "guardiao": return (<>
      <defs>{STONE("s", "#4a3a10", "#0c0904")}</defs>
      <path d="M10 236l20-70 64-26h52l64 26 20 70z" fill="url(#s)" stroke={c} strokeWidth="3" />
      <path d="M76 44h88l12 30-8 70-20 26h-56l-20-26-8-70z" fill="url(#s)" stroke={c} strokeWidth="3" strokeLinejoin="round" />
      <path d="M90 44l30-24 30 24" fill="none" stroke={c} strokeWidth="5" strokeLinejoin="round" />
      {E(<><path d="M86 100h30v10H90z" fill={eye} /><path d="M154 100h-30v10h26z" fill={eye} /></>)}
      <path className="intro-jaw" d="M100 146h40" stroke={c} strokeWidth="5" strokeLinecap="round" /></>);
  }
}

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
      <div className={`relative flex flex-col items-center px-6 text-center ${t >= 3 ? "intro-quake" : ""}`} style={{ ["--q" as string]: `${t * 1.5}px` } as React.CSSProperties}>
        <svg viewBox="0 0 240 240" className="intro-beast intro-breathe" aria-hidden
          style={{ width: 200 + t * 16, ["--shake" as string]: `${2 + t * 2}px`, animationIterationCount: `1, ${1 + t}`, filter: `drop-shadow(0 0 ${t * 8}px ${beast.color}88)` } as React.CSSProperties}>
          <Art id={beast.id} c={beast.color} eye={beast.eye} wings={beast.wings} />
        </svg>
        <div className="flex gap-1 mt-4 intro-text" aria-label={`Ameaça ${t} de 5`}>
          {[1, 2, 3, 4, 5].map((i) => <span key={i} className="h-1.5 w-6 rounded-full" style={{ background: i <= t ? beast.color : "rgba(255,255,255,.12)", boxShadow: i <= t ? `0 0 8px ${beast.color}` : "none" }} />)}
        </div>
        <p className="text-[11px] font-semibold tracking-[.35em] mt-3 intro-text" style={{ color: beast.color }}>{t >= 5 ? "☠ AMEAÇA MÁXIMA" : `AMEAÇA ${t}/5`} · {beast.epithet.toUpperCase()}</p>
        <p className="font-display text-4xl uppercase mt-2 intro-text" style={{ animationDelay: ".2s", textShadow: `0 0 30px ${beast.color}` }}>{beast.name}</p>
        <p className="text-sm text-ink/80 mt-2 intro-text" style={{ animationDelay: ".35s" }}>{beast.line}</p>
        <p className="text-xs text-muted mt-4 intro-text" style={{ animationDelay: ".5s" }}>Missão: {title}</p>
      </div>
    </div>,
    document.body,
  );
}
