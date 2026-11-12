"use client";
import { useId } from "react";
import type { BeastId } from "@/lib/bestiary";

/** Seres celestiais não humanoides (viewBox 320×320), desenhados e animados em SVG. */
export function CelestialArt({ id, c, eye }: { id: BeastId; c: string; eye: string }) {
  const u = useId().replace(/:/g, "");
  const R = (n: number) => Array.from({ length: n }, (_, i) => i);
  const feather = (L: number, w: number) => `M0 0Q${w} ${-L * 0.5} 0 ${-L}Q${-w} ${-L * 0.5} 0 0z`;
  const defs = (
    <defs>
      <radialGradient id={`${u}core`} cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#fff" /><stop offset=".35" stopColor={eye} /><stop offset="1" stopColor={c} stopOpacity="0" /></radialGradient>
      <radialGradient id={`${u}aura`} cx=".5" cy=".5" r=".5"><stop offset="0" stopColor={c} stopOpacity=".55" /><stop offset="1" stopColor={c} stopOpacity="0" /></radialGradient>
      <linearGradient id={`${u}feat`} x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor={eye} /><stop offset="1" stopColor={c} stopOpacity=".2" /></linearGradient>
      <linearGradient id={`${u}metal`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={eye} /><stop offset=".45" stopColor={c} /><stop offset="1" stopColor="#120a04" /></linearGradient>
      <linearGradient id={`${u}obs`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4a4652" /><stop offset=".5" stopColor="#151318" /><stop offset="1" stopColor="#050406" /></linearGradient>
      <filter id={`${u}glow`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      <filter id={`${u}soft`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10" /></filter>
    </defs>
  );
  const aura = <circle cx="160" cy="160" r="150" fill={`url(#${u}aura)`} className="cel-pulse" style={{ transformOrigin: "160px 160px" }} />;
  const core = (r: number, cy = 160) => <>
    <circle cx="160" cy={cy} r={r * 2.2} fill={`url(#${u}core)`} opacity=".55" filter={`url(#${u}soft)`} className="cel-pulse" style={{ transformOrigin: `160px ${cy}px` }} />
    <circle cx="160" cy={cy} r={r} fill={`url(#${u}core)`} />
  </>;
  // Asa de penas em leque (lado direito; espelha com side=-1)
  const wing = (side: 1 | -1, x: number, y: number, s: number, rot: number, cls = "cel-flap", delay = 0) => (
    <g className={cls} style={{ transformOrigin: `${x}px ${y}px`, animationDelay: `${delay}s` }}>
      <g transform={`translate(${x} ${y}) scale(${side * s} ${s}) rotate(${rot})`}>
        {[{ n: 11, L: 130, a0: -80, a1: 40 }, { n: 9, L: 88, a0: -70, a1: 30 }, { n: 7, L: 50, a0: -60, a1: 20 }].map((r, ri) =>
          R(r.n).map((i) => { const k = i / (r.n - 1); return <path key={`${ri}${i}`} d={feather(r.L * (1.05 - 0.4 * k), 10)} transform={`translate(${ri * 5} ${k * 18}) rotate(${r.a0 + (r.a1 - r.a0) * k + 90})`} fill={`url(#${u}feat)`} stroke={c} strokeOpacity=".6" strokeWidth=".8" opacity={0.95 - ri * 0.05} />; }))}
        <path d="M0 0C30 -26 70 -34 120 -26" fill="none" stroke={eye} strokeWidth="3" strokeLinecap="round" opacity=".85" />
      </g>
    </g>
  );

  switch (id) {
    case "aureo": return (<>{defs}{aura}
      {[{ rx: 128, ry: 40, rot: 0, d: 9 }, { rx: 118, ry: 52, rot: 60, d: 13 }, { rx: 108, ry: 64, rot: -60, d: 17 }].map((r, i) => (
        <g key={i} transform={`rotate(${r.rot} 160 160)`}>
          <g className={i % 2 ? "cel-spin-rev" : "cel-spin"} style={{ transformOrigin: "160px 160px", animationDuration: `${r.d}s` }}>
            <ellipse cx="160" cy="160" rx={r.rx} ry={r.ry} fill="none" stroke={`url(#${u}metal)`} strokeWidth="11" filter={`url(#${u}glow)`} />
            <ellipse cx="160" cy="160" rx={r.rx} ry={r.ry} fill="none" stroke="#1a1004" strokeWidth="3" strokeDasharray="2 9" />
            {R(8).map((k) => { const a = (k / 8) * Math.PI * 2; return <circle key={k} cx={160 + Math.cos(a) * r.rx} cy={160 + Math.sin(a) * r.ry} r="4" fill="#fff" filter={`url(#${u}glow)`} />; })}
          </g>
        </g>))}
      {R(12).map((k) => <path key={k} d="M160 160L160 30" stroke={eye} strokeOpacity=".25" strokeWidth="2" transform={`rotate(${k * 30} 160 160)`} className="cel-flicker" style={{ animationDelay: `${k * 0.13}s` }} />)}
      {core(22)}
    </>);

    case "alcion": return (<>{defs}{aura}
      {R(5).map((k) => <path key={k} d={`M160 190q${-30 + k * 15} 60 ${-40 + k * 20} 120`} fill="none" stroke={k % 2 ? eye : c} strokeWidth={6 - Math.abs(k - 2) * 1.5} strokeLinecap="round" opacity=".8" className="cel-tail" style={{ animationDelay: `${k * 0.15}s` }} filter={`url(#${u}glow)`} />)}
      {[2, 1, 0].map((p) => <g key={p}>{wing(1, 172, 150 + p * 12, 1 - p * 0.18, -10 + p * 26, "cel-flap", p * 0.2)}{wing(-1, 148, 150 + p * 12, 1 - p * 0.18, -10 + p * 26, "cel-flap", p * 0.2)}</g>)}
      <path d="M160 96c18 18 22 52 14 86-6 22-22 22-28 0-8-34-4-68 14-86z" fill={`url(#${u}metal)`} stroke={eye} strokeWidth="2" filter={`url(#${u}glow)`} />
      <path d="M160 96l-8-22 8 10 8-10z" fill={eye} />
      <path d="M152 112l6 4M168 112l-6 4" stroke="#fff" strokeWidth="4" strokeLinecap="round" className="cel-flicker" filter={`url(#${u}glow)`} />
      {core(9, 150)}
    </>);

    case "vertice": return (<>{defs}{aura}
      {R(4).map((k) => (
        <g key={k} className="cel-orbit" style={{ transformOrigin: "160px 160px", animationDelay: `${-k * 2}s` }}>
          <path d={`M${k % 2 ? 268 : 52} ${k < 2 ? 110 : 210}l${k % 2 ? 26 : -26} -36 ${k % 2 ? 8 : -8} 60z`} fill={`url(#${u}obs)`} stroke={c} strokeWidth="2" filter={`url(#${u}glow)`} />
        </g>))}
      <g className="cel-float">
        <path d="M160 40l62 120-62 120-62-120z" fill={`url(#${u}obs)`} stroke={c} strokeWidth="3" strokeLinejoin="round" />
        <path d="M160 40v240M98 160h124M160 40l-20 120 20 120M160 40l20 120-20 120" fill="none" stroke="#6a6672" strokeOpacity=".5" strokeWidth="1.5" />
        <path d="M160 70l-10 40 14 24-12 30 10 36" fill="none" stroke={c} strokeWidth="3.5" className="cel-flicker" filter={`url(#${u}glow)`} />
        <path d="M120 150l20 6M200 170l-22 4M140 210l10-14" stroke={c} strokeWidth="2.5" className="cel-flicker" style={{ animationDelay: ".4s" }} />
        {core(10, 160)}
      </g>
      <g className="cel-blade" filter={`url(#${u}glow)`}>
        <path d="M160 6l7 34-7 8-7-8z" fill="#fff" />
      </g>
    </>);

    case "fulgor": return (<>{defs}{aura}
      {wing(1, 190, 150, 1.05, -30, "cel-flap")}{wing(-1, 130, 150, 1.05, -30, "cel-flap")}
      {R(22).map((k) => { const a = (k / 22) * 360, L = 70 + (k % 3) * 18; return <path key={k} d={`M0 0l8 ${-L * 0.45}-6 4 10 ${-L * 0.55}`} fill="none" stroke={k % 2 ? eye : c} strokeWidth="3" strokeLinejoin="round" transform={`translate(160 168) rotate(${a})`} className="cel-flicker" style={{ animationDelay: `${(k % 7) * 0.12}s` }} filter={`url(#${u}glow)`} />; })}
      <path d="M160 108l44 26 6 46-20 34-30 16-30-16-20-34 6-46z" fill={`url(#${u}metal)`} stroke={eye} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M160 108v124M118 172l42 10 42-10M134 214l26-12 26 12" fill="none" stroke="#3a2a10" strokeWidth="2" opacity=".7" />
      <path d="M126 150l22 8-20 6zM194 150l-22 8 20 6z" fill="#fff" filter={`url(#${u}glow)`} className="cel-flicker" />
      <path d="M150 196h20l-10 12z" fill="#2a1a08" />
    </>);

    case "eter": return (<>{defs}{aura}
      {core(28)}
      {wing(1, 168, 175, 1.1, 0, "cel-flap", 0)}{wing(-1, 152, 175, 1.1, 0, "cel-flap", 0)}
      <g className="cel-flap-slow" style={{ transformOrigin: "160px 150px" }}>{wing(1, 150, 168, 0.85, -105, "", 0)}{wing(-1, 170, 168, 0.85, -105, "", 0)}</g>
      <g className="cel-flap-slow" style={{ transformOrigin: "160px 220px", animationDelay: ".6s" }}>{wing(1, 150, 196, 0.7, 120, "", 0)}{wing(-1, 170, 196, 0.7, 120, "", 0)}</g>
      {R(16).map((k) => <circle key={k} cx={100 + ((k * 47) % 120)} cy={260 - ((k * 31) % 60)} r={1.5 + (k % 3)} fill={k % 2 ? eye : c} className="cel-rise" style={{ animationDelay: `${(k % 8) * 0.3}s` }} />)}
    </>);

    case "orbita": return (<>{defs}{aura}
      {wing(1, 200, 160, 0.95, -20)}{wing(-1, 120, 160, 0.95, -20)}
      {wing(1, 200, 175, 0.75, 40, "cel-flap", 0.3)}{wing(-1, 120, 175, 0.75, 40, "cel-flap", 0.3)}
      {[{ rx: 96, ry: 96, cls: "cel-spin", d: 10 }, { rx: 96, ry: 30, cls: "cel-spin-rev", d: 7 }].map((w, i) => (
        <g key={i} className={w.cls} style={{ transformOrigin: "160px 160px", animationDuration: `${w.d}s` }}>
          <ellipse cx="160" cy="160" rx={w.rx} ry={w.ry} fill="none" stroke={`url(#${u}metal)`} strokeWidth="9" filter={`url(#${u}glow)`} />
          <ellipse cx="160" cy="160" rx={w.rx - 14} ry={Math.max(8, w.ry - 14)} fill="none" stroke={c} strokeOpacity=".5" strokeWidth="2" />
          {R(12).map((k) => { const a = (k / 12) * Math.PI * 2; return <g key={k}><circle cx={160 + Math.cos(a) * w.rx} cy={160 + Math.sin(a) * w.ry} r="6" fill="#06101a" stroke={eye} strokeWidth="1.5" /><circle cx={160 + Math.cos(a) * w.rx} cy={160 + Math.sin(a) * w.ry} r="2.6" fill={c} /></g>; })}
          {i === 0 && R(8).map((k) => <path key={k} d={`M160 160L${160 + Math.cos((k / 8) * Math.PI * 2) * 82} ${160 + Math.sin((k / 8) * Math.PI * 2) * 82}`} stroke={c} strokeOpacity=".35" strokeWidth="2" />)}
        </g>))}
      {R(3).map((k) => <path key={k} d={`M${70 + k * 70} ${60 + (k % 2) * 30}l10 20-8 2 12 22`} fill="none" stroke="#fff" strokeWidth="2" className="cel-flicker" style={{ animationDelay: `${k * 0.3}s` }} filter={`url(#${u}glow)`} />)}
      {core(16)}
    </>);
    default: return null;
  }
}
