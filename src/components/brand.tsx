/** Marca BRIO (preto + vermelho): "b" geométrico com o círculo vermelho. Vetorial, sem depender de fonte. */
export const BRAND_RED = "#d12b65";

/** Símbolo: B angular em forma de "play" (traço claro) com o arco inferior em magenta. */
export function BrioMark({ size = 96, glow = true }: { size?: number; glow?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="14 6 96 112" aria-hidden style={glow ? { filter: "drop-shadow(0 0 18px rgba(209,43,101,.5))" } : undefined}>
      <g fill="none" strokeWidth="13" strokeLinejoin="round">
        <path d="M52 12 L91 34 Q99 39 91 45 L27 82" stroke="currentColor" />
        <path d="M27 82 V40 Q27 29 37 34 L60 47" stroke="currentColor" />
        <path className="brio-rise" d="M63 63 L91 79 Q99 84 91 90 L52 112 V99" stroke={BRAND_RED} />
      </g>
    </svg>
  );
}

/** Logotipo por extenso: brio + círculo vermelho. */
export function BrioWordmark({ height = 28, className = "" }: { height?: number; className?: string }) {
  return (
    <svg height={height} viewBox="0 0 282 110" className={className} role="img" aria-label="brio">
      <g fill="currentColor">
        <path d="M8 6l20 12v82H8z" />
        <path d="M80 100h-20V48h20v8c6-7 13-10 24-10v20c-15 0-24 6-24 22z" transform="translate(-0 0)" opacity="0" />
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="19">
        <circle cx="50" cy="74" r="24" />
        <circle cx="218" cy="74" r="24" />
      </g>
      <g fill="currentColor">
        <path d="M95 50h19v50H95z" />
        <path d="M114 70c0-14 9-22 26-22v19c-12 0-17 5-17 15v18h-9z" />
        <path d="M150 50h19v50h-19z" />
      </g>
      <circle className="brio-ember" cx="267" cy="96" r="9" fill="none" stroke={BRAND_RED} strokeWidth="7" />
    </svg>
  );
}
