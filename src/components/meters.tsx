/** Medidores visuais que enchem (estilo garrafa de água). SVG puro, funciona no servidor e no cliente. */
const clamp = (p: number) => Math.max(0, Math.min(1, Number.isFinite(p) ? p : 0));
// IDs determinísticos (iguais no servidor e no navegador): mesmo conteúdo, mesmo id.
const uid = (k: string, ...v: unknown[]) => { let h = 7; for (const c of k + JSON.stringify(v)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return `${k}${h.toString(36)}`; };

/** Líquido com onda dentro de um recorte. */
function Liquid({ clip, w, h, top, bottom, pct, a, b }: { clip: string; w: number; h: number; top: number; bottom: number; pct: number; a: string; b: string }) {
  const id = uid("m", clip, pct, a, b), y = bottom - (bottom - top) * clamp(pct);
  return (
    <>
      <defs>
        <clipPath id={`${id}c`}><path d={clip} /></clipPath>
        <linearGradient id={`${id}g`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient>
      </defs>
      <g clipPath={`url(#${id}c)`}>
        <rect width={w} height={h} fill="rgba(255,255,255,.045)" />
        <g style={{ transform: `translateY(${y}px)`, transition: "transform 1s cubic-bezier(.34,1.56,.64,1)" }}>
          <path className="meter-wave" d={`M0 4q${w / 8} -6 ${w / 4} 0t${w / 4} 0t${w / 4} 0t${w / 4} 0t${w / 4} 0t${w / 4} 0t${w / 4} 0t${w / 4} 0V${h}H0z`} fill={`url(#${id}g)`} opacity=".55" />
          <rect y="4" width={w} height={h} fill={`url(#${id}g)`} />
        </g>
      </g>
      <path d={clip} fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="1.5" />
    </>
  );
}

/** Ampulheta: areia de cima desce para baixo (horas de ministério). */
export function Hourglass({ pct, size = 56, color = "#0a84ff" }: { pct: number; size?: number; color?: string }) {
  const p = clamp(pct), id = uid("h", pct, color);
  const topH = 34 * (1 - p), botH = 34 * p;
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 50 70" aria-hidden>
      <defs><clipPath id={`${id}c`}><path d="M10 6h30c0 14-11 20-13 29 2 9 13 15 13 29H10c0-14 11-20 13-29-2-9-13-15-13-29z" /></clipPath></defs>
      <g clipPath={`url(#${id}c)`}>
        <rect width="50" height="70" fill="rgba(255,255,255,.045)" />
        <rect x="0" y={35 - topH} width="50" height={topH} fill={color} opacity=".85" style={{ transition: "all 1s ease" }} />
        <rect x="0" y={64 - botH} width="50" height={botH} fill={color} style={{ transition: "all 1s ease" }} />
        {p > 0 && p < 1 && <rect className="meter-sand" x="24" y="34" width="2" height="30" fill={color} />}
      </g>
      <path d="M10 6h30c0 14-11 20-13 29 2 9 13 15 13 29H10c0-14 11-20 13-29-2-9-13-15-13-29z" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="1.5" />
      <path d="M6 4h38M6 66h38" stroke="rgba(255,255,255,.55)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Coqueteleira de proteína. */
export function Shaker({ pct, size = 48, color = "#ffb340" }: { pct: number; size?: number; color?: string }) {
  return (
    <svg width={size} height={size * 1.5} viewBox="0 0 48 72" aria-hidden>
      <rect x="12" y="2" width="24" height="9" rx="3" fill="rgba(255,255,255,.35)" />
      <rect x="9" y="10" width="30" height="5" rx="2" fill="rgba(255,255,255,.2)" />
      <Liquid clip="M10 16h28l-3 50a4 4 0 0 1-4 4H17a4 4 0 0 1-4-4z" w={48} h={72} top={18} bottom={70} pct={pct} a="#ffe0a3" b={color} />
      {[30, 42, 54].map((y) => <path key={y} d={`M33 ${y}h3`} stroke="rgba(255,255,255,.35)" strokeWidth="1.2" />)}
    </svg>
  );
}

/** Frasco de energia (calorias). */
export function Flask({ pct, size = 52, color = "#ff6a3d" }: { pct: number; size?: number; color?: string }) {
  const over = pct > 1.05;
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 52 68" aria-hidden>
      <rect x="19" y="2" width="14" height="6" rx="2" fill="rgba(255,255,255,.35)" />
      <Liquid clip="M20 8h12v14c10 4 16 13 16 23a22 22 0 0 1-44 0c0-10 6-19 16-23z" w={52} h={68} top={10} bottom={67} pct={pct} a="#ffd27a" b={over ? "#ff453a" : color} />
      <circle cx="18" cy="44" r="2.5" fill="rgba(255,255,255,.4)" className="meter-bubble" />
      <circle cx="30" cy="52" r="1.8" fill="rgba(255,255,255,.35)" className="meter-bubble" style={{ animationDelay: ".7s" }} />
    </svg>
  );
}

/** Lua que cresce com as horas de sono (cheia em 8 h). */
export function Moon({ hours, size = 56 }: { hours: number | null; size?: number }) {
  const p = clamp((hours ?? 0) / 8), id = uid("l", hours, size), good = (hours ?? 0) >= 7;
  // sombra desliza da direita para fora conforme a lua enche
  const shadowX = 28 + 56 * p;
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" aria-hidden style={good ? { filter: "drop-shadow(0 0 10px rgba(191,214,255,.55))" } : undefined}>
      <defs>
        <radialGradient id={`${id}g`} cx=".35" cy=".35" r=".8"><stop offset="0" stopColor="#ffffff" /><stop offset=".6" stopColor="#cfd8ea" /><stop offset="1" stopColor="#8796b3" /></radialGradient>
        <clipPath id={`${id}c`}><circle cx="28" cy="28" r="24" /></clipPath>
      </defs>
      <circle cx="28" cy="28" r="24" fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.18)" />
      <g clipPath={`url(#${id}c)`}>
        <circle cx="28" cy="28" r="24" fill={`url(#${id}g)`} opacity={hours == null ? 0.15 : 1} />
        <circle cx={shadowX} cy="28" r="25" fill="#0b0e16" style={{ transition: "cx 1s ease" }} />
        <circle cx="20" cy="22" r="3" fill="#8796b3" opacity=".35" /><circle cx="30" cy="36" r="4" fill="#8796b3" opacity=".3" />
      </g>
    </svg>
  );
}

/** Pote de moedas (caixinhas). */
export function Jar({ pct, size = 72, color = "#30d158" }: { pct: number; size?: number; color?: string }) {
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 64 74" aria-hidden>
      <rect x="16" y="2" width="32" height="8" rx="3" fill="rgba(255,255,255,.4)" />
      <Liquid clip="M18 10h28v6c8 3 12 9 12 18v30a8 8 0 0 1-8 8H14a8 8 0 0 1-8-8V34c0-9 4-15 12-18z" w={64} h={74} top={14} bottom={72} pct={pct} a="#d6ffe2" b={color} />
      {clamp(pct) > 0.08 && [[20, 62], [34, 66], [44, 58], [28, 54]].filter((_, i) => i < 1 + Math.floor(clamp(pct) * 4)).map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx="6" ry="2.6" fill="#ffd27a" stroke="#b8862b" strokeWidth=".8" />))}
      <path d="M14 30v26" stroke="rgba(255,255,255,.18)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Garrafa pequena (água) para os atalhos. */
export function MiniBottle({ pct, size = 40, color = "#30d158" }: { pct: number; size?: number; color?: string }) {
  return (
    <svg width={size} height={size * 1.6} viewBox="0 0 40 64" aria-hidden>
      <Liquid clip="M14 2h12v8c0 3 7 5 7 12v36a5 5 0 0 1-5 5H12a5 5 0 0 1-5-5V22c0-7 7-9 7-12z" w={40} h={64} top={8} bottom={63} pct={pct} a="#7ee8a2" b={color} />
    </svg>
  );
}

/** Saco de grãos (carboidrato). */
export function Grain({ pct, size = 46, color = "#ffd60a" }: { pct: number; size?: number; color?: string }) {
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 46 64" aria-hidden>
      <path d="M14 8c3 3 15 3 18 0" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="2.5" strokeLinecap="round" />
      <Liquid clip="M15 10h16l2 6c7 5 10 13 10 24 0 14-8 22-20 22S3 54 3 40c0-11 3-19 10-24z" w={46} h={64} top={12} bottom={62} pct={pct} a="#fff3b0" b={color} />
      {clamp(pct) > 0.15 && [[16, 50], [24, 54], [30, 48], [20, 44]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="2" ry="1.2" fill="#b8860b" opacity=".6" />)}
    </svg>
  );
}

/** Gota (gordura). */
export function Drop({ pct, size = 40, color = "#bf5af2" }: { pct: number; size?: number; color?: string }) {
  return (
    <svg width={size} height={size * 1.35} viewBox="0 0 40 54" aria-hidden>
      <Liquid clip="M20 2s16 18 16 30a16 16 0 0 1-32 0C4 20 20 2 20 2z" w={40} h={54} top={4} bottom={52} pct={pct} a="#ecd4ff" b={color} />
      <path d="M12 30c0-5 3-10 5-13" stroke="rgba(255,255,255,.4)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** Barra carregada: uma anilha acesa por sessão feita na semana. */
export function Barbell({ done, total, width = 150, color = "#e0393e" }: { done: number; total: number; width?: number; color?: string }) {
  const n = Math.max(1, Math.min(8, total)), per = Math.ceil(n / 2), lit = Math.min(done, n);
  const plate = (i: number, side: 1 | -1) => {
    const idx = side === -1 ? i * 2 : i * 2 + 1, on = idx < lit, x = 50 + side * (21 + i * 9), h = 40 - i * 4;
    return <rect key={`${side}${i}`} x={side === 1 ? x : x - 8} y={30 - h / 2} width="8" height={h} rx="2"
      fill={on ? color : "rgba(255,255,255,.08)"} stroke={on ? "#ffb3a8" : "rgba(255,255,255,.35)"} strokeWidth="1" strokeDasharray={on ? undefined : "2 2"}
      style={{ filter: on ? `drop-shadow(0 0 5px ${color})` : "none", transition: "all .6s" }} />;
  };
  return (
    <svg width={width} height={width * 0.4} viewBox="0 0 100 60" aria-hidden>
      <rect x="4" y="28" width="92" height="4" rx="2" fill="#c7c7cc" />
      <rect x="25" y="25" width="4" height="10" rx="1" fill="#8e8e93" /><rect x="71" y="25" width="4" height="10" rx="1" fill="#8e8e93" />
      {Array.from({ length: per }, (_, i) => [plate(i, -1), plate(i, 1)])}
    </svg>
  );
}

/** Fornalha: arde mais conforme o volume se aproxima (ou passa) da semana anterior. */
export function Forge({ pct, size = 56, color = "#ff6a3d" }: { pct: number; size?: number; color?: string }) {
  const p = clamp(pct), id = uid("f", pct, color);
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 56 62" aria-hidden>
      <defs><linearGradient id={`${id}g`} x1="0" x2="0" y1="1" y2="0"><stop offset="0" stopColor="#ff3b30" /><stop offset=".6" stopColor={color} /><stop offset="1" stopColor="#ffd27a" /></linearGradient></defs>
      <path d="M6 58V26a22 22 0 0 1 44 0v32z" fill="#1a1414" stroke="rgba(255,255,255,.25)" strokeWidth="1.5" />
      <path d="M14 58V32a14 14 0 0 1 28 0v26z" fill="#060404" />
      <g style={{ transformOrigin: "28px 58px", transform: `scaleY(${0.15 + p * 0.85})`, transition: "transform 1s cubic-bezier(.34,1.56,.64,1)" }}>
        <path className="flame" d="M28 26c3 7 11 10 11 20a11 11 0 0 1-22 0c0-6 3-9 5-11 1 4 3 6 5 7-2-7 0-12 1-16z" fill={`url(#${id}g)`} style={{ filter: p > 0 ? `drop-shadow(0 0 ${4 + p * 10}px ${color})` : "none" }} />
      </g>
      {[16, 24, 32, 40].map((x) => <rect key={x} x={x} y="56" width="4" height="4" fill="#2a2020" />)}
    </svg>
  );
}

/** Pilha de livros: um livro por meta, aceso ao ser lido. */
export function BookStack({ done, total, size = 72, color = "#ff9f0a" }: { done: number; total: number; size?: number; color?: string }) {
  const n = Math.max(1, Math.min(12, total)), lit = Math.min(done, n), h = 6, W = 64;
  const tones = ["#ff9f0a", "#0a84ff", "#30d158", "#bf5af2", "#ff453a", "#64d2ff", "#ffd60a"];
  return (
    <svg width={size} height={size * ((n * (h + 1) + 8) / W)} viewBox={`0 0 ${W} ${n * (h + 1) + 8}`} aria-hidden>
      {Array.from({ length: n }, (_, i) => {
        const y = n * (h + 1) + 2 - (i + 1) * (h + 1), on = i < lit, w = 44 + ((i * 7) % 12), x = (W - w) / 2 + (((i * 5) % 7) - 3);
        const c = on ? tones[i % tones.length] : "transparent";
        return <g key={i} className={on ? "rise" : ""} style={{ animationDelay: `${i * 60}ms` }}>
          <rect x={x} y={y} width={w} height={h} rx="1.5" fill={on ? c : "rgba(255,255,255,.05)"} stroke={on ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.25)"} strokeDasharray={on ? undefined : "2 2"} />
          {on && <rect x={x + 4} y={y + 2} width={w - 8} height="1.2" fill="rgba(255,255,255,.45)" />}
        </g>;
      })}
      <rect x="4" y={n * (h + 1) + 2} width={W - 8} height="3" rx="1.5" fill={color} opacity=".5" />
    </svg>
  );
}

/** Vela: a chama cresce com os minutos de estudo (alvo da semana). */
export function Candle({ pct, size = 44, color = "#ffb340" }: { pct: number; size?: number; color?: string }) {
  const p = clamp(pct), body = 18 + p * 34;
  return (
    <svg width={size} height={size * 2.15} viewBox="0 -14 40 86" aria-hidden className="overflow-visible">
      <ellipse cx="20" cy="69" rx="16" ry="3" fill="rgba(255,255,255,.12)" />
      <rect x="12" y={68 - body} width="16" height={body} rx="3" fill="#f4ecd8" style={{ transition: "all 1s ease" }} />
      <path d={`M12 ${72 - body}q4 4 8 0t8 0`} fill="none" stroke="#e7dcc2" strokeWidth="2" />
      <path d={`M20 ${68 - body}v-5`} stroke="#3a3a3c" strokeWidth="1.5" />
      {p > 0 && <g style={{ transformOrigin: `20px ${63 - body}px`, transform: `scale(${0.6 + p * 0.7})` }}>
        <path className="flame" d={`M20 ${63 - body - 16}c3 6 7 9 7 13a7 7 0 0 1-14 0c0-4 4-7 7-13z`} fill={color} style={{ filter: `drop-shadow(0 0 ${6 + p * 8}px ${color})` }} />
        <path className="flame" d={`M20 ${63 - body - 8}c1 3 3 4 3 6a3 3 0 0 1-6 0c0-2 2-3 3-6z`} fill="#fff6dc" style={{ animationDelay: ".2s" }} />
      </g>}
    </svg>
  );
}

/** Pergaminho que se desenrola (capítulos da Bíblia). */
export function Scroll({ pct, size = 64, color = "#ffb340" }: { pct: number; size?: number; color?: string }) {
  const p = clamp(pct), w = 8 + p * 44;
  return (
    <svg width={size} height={size * 0.62} viewBox="0 0 64 40" aria-hidden>
      <rect x="6" y="6" width={w} height="28" fill="#efe3c4" style={{ transition: "width 1s ease" }} />
      {Array.from({ length: Math.floor(w / 8) }, (_, i) => <path key={i} d={`M${10 + i * 8} 13h5M${10 + i * 8} 19h5M${10 + i * 8} 25h4`} stroke="#a08a5a" strokeWidth="1" />)}
      <rect x="2" y="3" width="8" height="34" rx="4" fill={color} />
      <rect x={4 + w} y="3" width="8" height="34" rx="4" fill={color} style={{ transition: "x 1s ease" }} />
    </svg>
  );
}

/** Troféu que se enche (metas). */
export function Trophy({ pct, size = 48, color = "#ffd60a" }: { pct: number; size?: number; color?: string }) {
  const full = clamp(pct) >= 1;
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 48 56" aria-hidden style={full ? { filter: `drop-shadow(0 0 10px ${color})` } : undefined}>
      <path d="M10 8H4c0 9 4 14 10 15M38 8h6c0 9-4 14-10 15" fill="none" stroke={full ? color : "rgba(255,255,255,.35)"} strokeWidth="3" />
      <Liquid clip="M10 4h28v14c0 10-6 16-14 16S10 28 10 18z" w={48} h={56} top={6} bottom={34} pct={pct} a="#fff3b0" b={color} />
      <rect x="21" y="34" width="6" height="9" fill={full ? color : "rgba(255,255,255,.3)"} />
      <rect x="14" y="43" width="20" height="7" rx="2" fill={full ? color : "rgba(255,255,255,.3)"} />
      {full && <path d="M24 11l2 4 4.5.6-3.3 3 .8 4.4-4-2.1-4 2.1.8-4.4-3.3-3 4.5-.6z" fill="#fff" />}
    </svg>
  );
}

/** Balança: ponteiro caminha do peso inicial até a meta. */
export function Scale({ pct, size = 64, color = "#30d158" }: { pct: number; size?: number; color?: string }) {
  const p = clamp(pct), a = -120 + p * 240, id = uid("s", pct, color);
  return (
    <svg width={size} height={size * 0.9} viewBox="0 0 64 58" aria-hidden>
      <rect x="2" y="4" width="60" height="52" rx="12" fill="#151517" stroke="rgba(255,255,255,.2)" />
      <defs><linearGradient id={`${id}g`}><stop offset="0" stopColor="#ff9f0a" /><stop offset="1" stopColor={color} /></linearGradient></defs>
      <path d="M14 34a18 18 0 0 1 36 0" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="5" strokeLinecap="round" />
      <path d="M14 34a18 18 0 0 1 36 0" fill="none" stroke={`url(#${id}g)`} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${p * 56.5} 60`} style={{ transition: "stroke-dasharray 1s ease" }} />
      <g style={{ transformOrigin: "32px 34px", transform: `rotate(${a / 2}deg)`, transition: "transform 1s cubic-bezier(.34,1.56,.64,1)" }}><path d="M32 34V18" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></g>
      <circle cx="32" cy="34" r="3" fill="#fff" />
      <rect x="20" y="44" width="24" height="5" rx="2.5" fill="rgba(255,255,255,.12)" />
    </svg>
  );
}

/** Planta que cresce (revisitas e estudos do ministério). */
export function Sprout({ pct, size = 52, color = "#30d158" }: { pct: number; size?: number; color?: string }) {
  const p = clamp(pct), stem = 6 + p * 30, leaves = Math.round(p * 4);
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 52 60" aria-hidden>
      <path d="M12 46h28l-4 12H16z" fill="#8a5a3a" /><rect x="10" y="42" width="32" height="5" rx="2" fill="#a0693f" />
      <path d={`M26 42V${42 - stem}`} stroke={color} strokeWidth="2.5" strokeLinecap="round" style={{ transition: "all 1s" }} />
      {Array.from({ length: leaves }, (_, i) => { const y = 40 - (i + 1) * (stem / 5), s = i % 2 ? 1 : -1; return <path key={i} className="rise" d={`M26 ${y}c${s * 8} -2 ${s * 12} -8 ${s * 12} -8c-${s * 0} 0 -${s * 10} -1 -${s * 12} 8z`} fill={color} opacity=".9" />; })}
      {p >= 1 && <circle cx="26" cy={42 - stem - 4} r="5" fill="#ffd60a" style={{ filter: "drop-shadow(0 0 6px #ffd60a)" }} />}
    </svg>
  );
}

/** Enchimento sólido (sem onda) dentro de uma forma de comida. */
function Fill({ clip, w, h, top, bottom, pct, a, b, stroke = "rgba(255,255,255,.3)" }: { clip: string; w: number; h: number; top: number; bottom: number; pct: number; a: string; b: string; stroke?: string }) {
  const id = uid("ff", clip, pct, a, b), y = bottom - (bottom - top) * clamp(pct);
  return (
    <>
      <defs>
        <clipPath id={`${id}c`}><path d={clip} /></clipPath>
        <linearGradient id={`${id}g`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient>
      </defs>
      <g clipPath={`url(#${id}c)`}>
        <rect width={w} height={h} fill="rgba(255,255,255,.05)" />
        <rect y={y} width={w} height={h} fill={`url(#${id}g)`} style={{ transition: "y 1s cubic-bezier(.34,1.56,.64,1)" }} />
      </g>
      <path d={clip} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
    </>
  );
}

/** Energia (kcal): chama. */
export function EnergyFlame({ pct, size = 44 }: { pct: number; size?: number }) {
  const over = pct > 1.05;
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 48 58" aria-hidden style={clamp(pct) > 0.9 ? { filter: `drop-shadow(0 0 8px ${over ? "#ff453a" : "#ff9f0a"})` } : undefined}>
      <Fill clip="M24 2c5 12 18 18 18 34a18 18 0 0 1-36 0c0-9 5-14 9-18 1 6 4 9 7 10-3-12 0-20 2-26z" w={48} h={58} top={2} bottom={55} pct={pct} a="#ffd27a" b={over ? "#ff453a" : "#ff6a1a"} />
    </svg>
  );
}

/** Proteína: coxa de frango. */
export function Drumstick({ pct, size = 44, color = "#ffb340" }: { pct: number; size?: number; color?: string }) {
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 52 56" aria-hidden>
      <path d="M17 37L8 46" stroke="#f4ecd8" strokeWidth="5" strokeLinecap="round" />
      <circle cx="5" cy="45" r="4" fill="#f4ecd8" /><circle cx="9" cy="51" r="4" fill="#f4ecd8" />
      <Fill clip="M36 3c10 3 15 14 11 24-4 9-14 13-23 12l-6-6c-1-9 3-19 10-25 2-2 5-6 8-5z" w={52} h={56} top={3} bottom={40} pct={pct} a="#e8a25a" b={color === "#ffb340" ? "#a8551f" : color} />
      <path d="M38 12c3 2 5 6 4 10" stroke="rgba(255,255,255,.35)" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** Carboidrato: pão. */
export function Bread({ pct, size = 48, color = "#d9a35b" }: { pct: number; size?: number; color?: string }) {
  return (
    <svg width={size} height={size * 0.95} viewBox="0 0 52 50" aria-hidden>
      <Fill clip="M6 20c0-10 9-15 20-15s20 5 20 15c0 4-3 6-4 6v18a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V26c-1 0-4-2-4-6z" w={52} h={50} top={5} bottom={48} pct={pct} a="#f6d39a" b={color} />
      {[16, 26, 36].map((x) => <path key={x} d={`M${x - 3} 12l5 5`} stroke="rgba(120,70,20,.55)" strokeWidth="2" strokeLinecap="round" />)}
    </svg>
  );
}

/** Gordura: abacate. */
export function Avocado({ pct, size = 40, color = "#7bc96f" }: { pct: number; size?: number; color?: string }) {
  const p = clamp(pct);
  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 44 58" aria-hidden>
      <Fill clip="M22 2c6 0 9 8 12 16 4 9 8 14 8 21a20 20 0 0 1-40 0c0-7 4-12 8-21 3-8 6-16 12-16z" w={44} h={58} top={2} bottom={57} pct={pct} a="#d8f0a0" b={color} stroke="#3d6b2a" />
      <circle cx="22" cy="40" r="8" fill={p > 0.3 ? "#8a5a2b" : "rgba(138,90,43,.35)"} stroke="#5a3a1b" />
    </svg>
  );
}
