import { RANKS } from "@/lib/game";
import { Medal } from "./medal";

/** Insígnia ilustrada da patente pelo índice. */
export function Insignia({ index, size = 96, locked = false, glow = true }: { index: number; size?: number; locked?: boolean; glow?: boolean }) {
  const rankIndex = Math.max(0, Math.min(RANKS.length - 1, index));
  const rank = RANKS[rankIndex];

  return <Medal art={`patentes/${rankIndex}`} color={rank.color} earned={!locked} glow={glow} label={`Insígnia ${rank.name}`} size={size} />;
}

/** Insígnias dos títulos especiais. */
export function TitleBadge({ id, size = 64, locked = false }: { id: "phoenix" | "titan" | "archon"; size?: number; locked?: boolean }) {
  const color = { phoenix: "#e2572b", titan: "#9aa0a6", archon: "#a88acc" }[id];
  return <Medal art={`titulo-${id}`} color={color} earned={!locked} label={`Título ${id}`} size={size} />;
}
