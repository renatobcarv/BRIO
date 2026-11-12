import Link from "next/link";
import { PageHeader } from "@/components/ui";
const items = [
  { href: "/status", label: "Status", sub: "Nível, atributos e conquistas", color: "#e0ac53" },
  { href: "/financas", label: "Finanças", sub: "Fluxo, caixinhas e patrimônio", color: "#d9c49a" },
  { href: "/livros", label: "Livros", sub: "Estante, leituras e anotações", color: "#7fc4bd" },
  { href: "/metas", label: "Metas e objetivos", sub: "Destinos e passos mensuráveis", color: "#ac8fd6" },
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
