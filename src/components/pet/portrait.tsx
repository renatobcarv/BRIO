import Image from "next/image";
import { speciesOf, type PetStage } from "@/lib/pet";

export function PetPortrait({ species, stage, size, alt = "", className = "", adventure = false }: {
  species: string;
  stage: PetStage;
  size: number;
  alt?: string;
  className?: string;
  adventure?: boolean;
}) {
  const key = speciesOf(species).key;
  const src = adventure ? `/mascotes/aventura/${key}.webp` : `/mascotes/${key}/${stage.key}.webp`;
  return <Image src={src} alt={alt}
    width={size} height={size} unoptimized className={`shrink-0 object-contain ${className}`} />;
}
