import Image from "next/image";

export function Medal({ art, color, earned, size = 64, label = "" }: {
  art: string;
  color: string;
  earned: boolean;
  size?: number;
  label?: string;
}) {
  return (
    <Image src={`/medalhas/${art}.webp`} alt={label} width={size} height={size} unoptimized
      className="shrink-0 object-contain"
      style={{ filter: earned ? `drop-shadow(0 0 8px ${color}45)` : "grayscale(.85) brightness(.62)" }} />
  );
}
