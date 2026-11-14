import Link from "next/link";
import { PageHeader } from "@/components/ui";
const items = [
  { href: "/eventos", label: "Event Center", sub: "Hell Week, desafios e insígnias", color: "#e0393e" },
  { href: "/status", label: "Status", sub: "Nível, atributos e conquistas", color: "#ff4d8a" },
  { href: "/financas", label: "Finanças", sub: "Fluxo, caixinhas e patrimônio", color: "#ff4d8a" },
  { href: "/livros", label: "Livros", sub: "Estante, leituras e anotações", color: "#ff5a6e" },
  { href: "/metas", label: "Metas e objetivos", sub: "Destinos e passos mensuráveis", color: "#d12b65" },
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
