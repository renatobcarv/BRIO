import Image from "next/image";

function mealKind(label: string) {
  const key = label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/cafe|desjejum/.test(key)) return "cafe";
  if (/almoco/.test(key)) return "almoco";
  if (/janta/.test(key)) return "jantar";
  if (/ceia/.test(key)) return "ceia";
  return "lanche";
}

export function MealArt({ label }: { label: string }) {
  return <Image src={`/cards/dieta/${mealKind(label)}.webp`} width={56} height={56} alt="" unoptimized
    className="size-12 shrink-0 rounded-lg object-cover sm:size-14" />;
}
