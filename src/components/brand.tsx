/** Marca do BRIO (Lâmina): B geométrico partido, com o ponto aceso. */
export function BrioMark({ size = 96, glow = true }: { size?: number; glow?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden style={glow ? { filter: "drop-shadow(0 0 22px rgba(255,255,255,.12))" } : undefined}>
      <defs>
        <linearGradient id="brio-g" gradientUnits="userSpaceOnUse" x1="150" y1="100" x2="400" y2="420"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#9a9aa2" /></linearGradient>
      </defs>
      <g fill="none" stroke="url(#brio-g)" strokeWidth="34">
        <path className="brio-rise" d="M176 108v296" />
        <path className="brio-rise" style={{ animationDelay: ".12s" }} d="M210 108h86a68 68 0 0 1 0 136h-86" />
        <path className="brio-rise" style={{ animationDelay: ".24s" }} d="M210 268h100a68 68 0 0 1 0 136h-100" />
      </g>
      <circle className="brio-ember" cx="372" cy="122" r="14" fill="#ff453a" style={{ filter: "drop-shadow(0 0 10px #ff3b30)" }} />
    </svg>
  );
}
