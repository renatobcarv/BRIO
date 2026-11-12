import Link from "next/link";
import { PageHeader } from "@/components/ui";
const items = [
  { href: "/status", label: "Status", sub: "Nível, atributos e conquistas", color: "#ffb340" },
  { href: "/financas", label: "Finanças", sub: "Fluxo, caixinhas e patrimônio", color: "#3ee6c1" },
  { href: "/livros", label: "Livros", sub: "Estante, leituras e anotações", color: "#ff9f0a" },
  { href: "/metas", label: "Metas e objetivos", sub: "Destinos e passos mensuráveis", color: "#bf5af2" },
  { href: "/configuracoes", label: "Configurações", sub: "Checklist, metas padrão, backup", color: "#9a978f" },
];
export default function Mais() {
  return (
    <>
      <PageHeader eyebrow="Mais" title="Outras áreas" />
      <div className="grid gap-3">
        {items.map((it, i) => (
          <Link key={it.href} href={it.href} className={`glass rise rise-${i + 1} flex items-center gap-4 p-5 min-h-16`}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: it.color }} />
            <span><span className="block font-display text-xl">{it.label}</span><span className="text-sm text-muted">{it.sub}</span></span>
          </Link>
        ))}
      </div>
    </>
  );
}
