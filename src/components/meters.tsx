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
