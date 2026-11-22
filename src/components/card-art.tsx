import Image from "next/image";

export type CardArtName = "treino" | "estudos" | "pioneiro" | "financas" | "metas" | "sonhos" | "agenda" | "conquistas"
  | "mascote" | "configuracoes" | "corpo" | "eventos" | "vestiario";

export function CardArt({ name, cover = false }: { name: CardArtName; cover?: boolean }) {
  return (
    <Image src={`/cards/${name}.webp`} alt="" width={380} height={380} unoptimized
      className={cover
        ? "pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover"
        : "pointer-events-none absolute inset-y-0 right-0 -z-10 h-full w-2/3 max-w-48 object-cover object-center opacity-50 [mask-image:linear-gradient(to_right,transparent,#000_65%)]"} />
  );
}
