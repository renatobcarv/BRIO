"use client";
import { useId } from "react";
import type { AngelLook } from "@/lib/bestiary";

/** Anjo majestoso (viewBox 320×360): asas em camadas de penas, coluna de luz, armadura ou linho, arma brilhando. */
export function AngelArt({ look, c, eye }: { look: AngelLook; c: string; eye: string }) {
  const u = useId().replace(/:/g, "");
  const SX = 160, SY = 132; // ombros
  const feather = (L: number, w: number) => `M0 0Q${w} ${-L * 0.5} 0 ${-L}Q${-w} ${-L * 0.5} 0 0z`;
  // Uma asa (lado direito); o esquerdo é espelhado.
  const Wing = ({ scale = 1, tilt = 0, delay = 0 }: { scale?: number; tilt?: number; delay?: number }) => {
    const rows = [
      { n: 11, L: 170, w: 12, a0: -78, a1: 62, op: 0.95 },  // primárias
      { n: 10, L: 118, w: 12, a0: -70, a1: 48, op: 0.88 },  // secundárias
      { n: 8, L: 66, w: 11, a0: -62, a1: 30, op: 0.92 },    // coberteiras
    ];
    return (
      <g className="angel-flap" style={{ transformOrigin: `${SX}px ${SY}px`, animationDelay: `${delay}s` }}>
        {[1, -1].map((side) => (
          <g key={side} transform={`translate(${SX} ${SY}) scale(${side * scale} ${scale}) rotate(${tilt}) translate(18 0)`}>
            {rows.map((r, ri) => Array.from({ length: r.n }, (_, i) => {
              const k = i / (r.n - 1), a = r.a0 + (r.a1 - r.a0) * k, L = r.L * (1.05 - 0.45 * k);
              return <path key={`${ri}-${i}`} d={feather(L, r.w)} transform={`translate(${ri * 6 + k * 20} ${k * 30}) rotate(${a + 90})`} fill={`url(#${u}f${ri})`} stroke={c} strokeOpacity={0.55} strokeWidth="1" opacity={r.op} />;
            }))}
            <path d="M0 0C40 -30 90 -40 150 -30" fill="none" stroke={eye} strokeOpacity=".8" strokeWidth="4" strokeLinecap="round" />
          </g>
        ))}
      </g>
    );
  };
  const pairs = look.veil ? 1 : look.wings;
  return (
    <>
      <defs>
        <linearGradient id={`${u}pillar`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={eye} stopOpacity=".55" /><stop offset="1" stopColor={c} stopOpacity="0" /></linearGradient>
        {[0, 1, 2].map((i) => <linearGradient key={i} id={`${u}f${i}`} x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor={eye} stopOpacity={0.95 - i * 0.1} /><stop offset="1" stopColor={c} stopOpacity={0.25 + i * 0.15} /></linearGradient>)}
        <linearGradient id={`${u}armor`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5a5040" /><stop offset=".5" stopColor="#221c14" /><stop offset="1" stopColor="#0a0806" /></linearGradient>
        <linearGradient id={`${u}robe`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fbf7ee" /><stop offset=".6" stopColor="#d9cfbd" /><stop offset="1" stopColor="#8f8676" /></linearGradient>
        <radialGradient id={`${u}glow`} cx=".5" cy=".5" r=".5"><stop offset="0" stopColor={eye} stopOpacity=".9" /><stop offset="1" stopColor={c} stopOpacity="0" /></radialGradient>
        <filter id={`${u}blur`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" /></filter>
      </defs>
      {/* coluna de luz vinda de cima */}
      <path className="angel-pillar" d="M120 0h80l40 360H80z" fill={`url(#${u}pillar)`} />
      <ellipse cx="160" cy="150" rx="120" ry="110" fill={`url(#${u}glow)`} opacity=".35" className="angel-aura" />
      {/* rodas (querubim) */}
      {look.wheels && [[52, 290], [268, 290]].map(([x, y], i) => (
        <g key={i} className="intro-wheel" style={{ transformOrigin: `${x}px ${y}px`, animationDirection: i ? "reverse" : "normal" }}>
          <circle cx={x} cy={y} r="44" fill="none" stroke={c} strokeWidth="4" style={{ filter: `drop-shadow(0 0 8px ${c})` }} />
          <circle cx={x} cy={y} r="28" fill="none" stroke={c} strokeOpacity=".6" strokeWidth="3" />
          {Array.from({ length: 6 }, (_, k) => <path key={k} d={`M${x} ${y}L${x + Math.cos((k / 6) * Math.PI * 2) * 44} ${y + Math.sin((k / 6) * Math.PI * 2) * 44}`} stroke={c} strokeOpacity=".4" strokeWidth="2" />)}
          {Array.from({ length: 12 }, (_, k) => { const a = (k / 12) * Math.PI * 2; return <g key={k}><circle cx={x + Math.cos(a) * 44} cy={y + Math.sin(a) * 44} r="5" fill="#0a0a0a" stroke={eye} strokeWidth="1.5" /><circle cx={x + Math.cos(a) * 44} cy={y + Math.sin(a) * 44} r="2" fill={eye} /></g>; })}
        </g>))}
      {/* asas (pares de trás para frente) */}
      {Array.from({ length: pairs }, (_, i) => pairs - 1 - i).map((i) => <Wing key={i} scale={1 - i * 0.16} tilt={-i * 16} delay={i * 0.25} />)}
      {/* corpo */}
      {look.robe ? (
        <g>
          <path d="M126 150q34-14 68 0l26 200H100z" fill={`url(#${u}robe)`} stroke={eye} strokeWidth="1.5" />
          {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${136 + i * 12} 170q${(i - 2) * 4} 90 ${(i - 2) * 10} 178`} fill="none" stroke="#8f8676" strokeOpacity=".7" strokeWidth="1.5" />)}
          <path d="M128 196h64" stroke="#e8c15a" strokeWidth="7" style={{ filter: "drop-shadow(0 0 6px #e8c15a)" }} />
          <path d="M126 152q-22 30-26 70M194 152q22 30 26 70" stroke={`url(#${u}robe)`} strokeWidth="16" strokeLinecap="round" />
        </g>
      ) : (
        <g>
          <path d="M120 150l40-10 40 10 14 70-14 30h-80l-14-30z" fill={`url(#${u}armor)`} stroke={c} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M134 168l26 14 26-14M138 192l22 12 22-12M142 214l18 10 18-10" fill="none" stroke={c} strokeOpacity=".7" strokeWidth="2" />
          <path d="M106 150q-6 22 4 40l20-12-4-30zM214 150q6 22-4 40l-20-12 4-30z" fill={`url(#${u}armor)`} stroke={c} strokeWidth="2.5" />
          <path d="M120 250l-14 100h108l-14-100z" fill={`url(#${u}armor)`} stroke={c} strokeOpacity=".7" strokeWidth="2" />
          {[0, 1, 2, 3].map((i) => <path key={i} d={`M${126 + i * 22} 254l-4 92`} stroke={c} strokeOpacity=".35" strokeWidth="2" />)}
          <path d="M110 186q-14 40-6 70M210 186q14 40 6 70" stroke="#2a241c" strokeWidth="14" strokeLinecap="round" />
        </g>
      )}
      {/* cabeça */}
      {look.robe ? (
        <g>
          <ellipse cx="160" cy="112" rx="22" ry="27" fill="#2a2418" stroke={eye} strokeWidth="2" />
          <ellipse cx="160" cy="112" rx="30" ry="34" fill={`url(#${u}glow)`} opacity=".7" className="angel-face" />
          <path d="M163 88l-8 22h10l-7 26" fill="none" stroke="#fff" strokeWidth="3" className="angel-face" style={{ filter: `drop-shadow(0 0 6px ${eye})` }} />
          <g className="intro-eyes" style={{ filter: `drop-shadow(0 0 8px ${eye})` }}><circle cx="150" cy="110" r="4" fill="#fff" /><circle cx="170" cy="110" r="4" fill="#fff" /></g>
        </g>
      ) : (
        <g>
          <path d="M138 98l22-26 22 26v34l-10 16h-24l-10-16z" fill={`url(#${u}armor)`} stroke={c} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M160 70v-14" stroke={eye} strokeWidth="4" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${eye})` }} />
          <path d="M142 112h36v8h-36z" fill="#000" />
          <g className="intro-eyes" style={{ filter: `drop-shadow(0 0 10px ${eye})` }}><path d="M144 114h13l-2 4h-11zM176 114h-13l2 4h11z" fill={eye} /></g>
        </g>
      )}
      {/* asas do serafim: rosto e pés cobertos (Isaías 6:2) */}
      {look.veil && (
        <g className="angel-veil">
          {[1, -1].map((side) => <g key={side} transform={`translate(160 0) scale(${side} 1) translate(-160 0)`}>
            {Array.from({ length: 7 }, (_, i) => <path key={i} d={feather(84 - i * 5, 11)} transform={`translate(204 ${150 - i * 2}) rotate(${-38 - i * 7})`} fill={`url(#${u}f0)`} stroke={c} strokeOpacity=".7" />)}
            {Array.from({ length: 7 }, (_, i) => <path key={`p${i}`} d={feather(90 - i * 5, 12)} transform={`translate(204 ${352 - i * 3}) rotate(${-58 - i * 6})`} fill={`url(#${u}f1)`} stroke={c} strokeOpacity=".7" />)}
          </g>)}
        </g>
      )}
      {/* armas */}
      {look.weapon === "lanca" && <g className="angel-weapon" style={{ transformOrigin: "250px 330px" }}>
        <path d="M250 340L268 40" stroke="#c9b48a" strokeWidth="5" strokeLinecap="round" />
        <path d="M268 40l10-34-18 30z" fill={eye} style={{ filter: `drop-shadow(0 0 12px ${c})` }} />
      </g>}
      {look.weapon === "espada" && <g className="angel-weapon" style={{ transformOrigin: "250px 300px" }}>
        <path d="M250 30l9 220-9 16-9-16z" fill={eye} style={{ filter: `drop-shadow(0 0 14px ${c}) drop-shadow(0 0 4px #fff)` }} />
        <path d="M250 40v200" stroke="#fff" strokeOpacity=".8" strokeWidth="1.5" />
        <path d="M228 262h44" stroke="#e8c15a" strokeWidth="8" strokeLinecap="round" />
        <path d="M250 266v40" stroke="#6b5a3a" strokeWidth="8" />
        <path className="angel-blade-fire" d="M250 30q-14 60 0 120q14-60 0-120z" fill={c} opacity=".6" filter={`url(#${u}blur)`} />
      </g>}
    </>
  );
}
