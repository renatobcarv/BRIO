import Image from "next/image";
import type { CSSProperties } from "react";
import { hasEncounterArt, type BeastId } from "@/lib/bestiary";

export function CreaturePortrait({ id, className, style, eager = false, encounter = false }: {
  id: BeastId;
  className?: string;
  style?: CSSProperties;
  eager?: boolean;
  encounter?: boolean;
}) {
  return (
    <Image src={`/bestiario/${id}${encounter && hasEncounterArt(id) ? "-encontro" : ""}.webp`} alt="" width={440} height={440}
      className={className} style={style} loading={eager ? "eager" : "lazy"} unoptimized />
  );
}
