import Image from "next/image";

export function Medal({ art, color, earned, size = 64, label = "", glow = true }: {
  art: string;
  color: string;
  earned: boolean;
  size?: number;
  label?: string;
  glow?: boolean;
}) {
  return (
    <Image src={`/medalhas/${art}.webp`} alt={label} width={size} height={size} unoptimized
      className="medal-motion shrink-0 object-contain" data-earned={earned}
      style={{ filter: earned ? (glow ? `drop-shadow(0 0 8px ${color}45)` : undefined) : "grayscale(.85) brightness(.62)" }} />
  );
}
