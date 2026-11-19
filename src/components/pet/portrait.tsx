import Image from "next/image";
import { speciesOf, type PetStage } from "@/lib/pet";

export function PetPortrait({ species, stage, size, alt = "", className = "" }: {
  species: string;
  stage: PetStage;
  size: number;
  alt?: string;
  className?: string;
}) {
  return <Image src={`/mascotes/${speciesOf(species).key}/${stage.key}.webp`} alt={alt}
    width={size} height={size} unoptimized className={`shrink-0 object-contain ${className}`} />;
}
