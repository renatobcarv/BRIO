import { CardArt } from "@/components/card-art";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
const items = [
  { href: "/eventos", label: "Event Center", art: "agenda", sub: "Hell Week, desafios e insígnias", color: "#e0393e" },
  { href: "/status", label: "Status", art: "conquistas", sub: "Nível, atributos e conquistas", color: "#ff2800" },
  { href: "/financas", label: "Finanças", art: "financas", sub: "Fluxo, caixinhas e patrimônio", color: "#ff2800" },
  { href: "/livros", label: "Livros", art: "estudos", sub: "Estante, leituras e anotações", color: "#ff4d3d" },
  { href: "/metas", label: "Metas e objetivos", art: "metas", sub: "Destinos e passos mensuráveis", color: "#dc0000" },
  { href: "/configuracoes", label: "Configurações", sub: "Checklist, metas padrão, backup", color: "#9a978f" },
] as const;
export default function Mais() {
  return (
    <>
      <PageHeader eyebrow="Mais" title="Outras áreas" />
      <div className="grid gap-3">
        {items.map((it, i) => (
          <Link key={it.href} href={it.href} className={`glass rise rise-${i + 1} relative isolate overflow-hidden flex items-center gap-4 p-5 min-h-16`}>
            {"art" in it && <CardArt name={it.art} />}
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: it.color }} />
            <span><span className="block font-display text-xl">{it.label}</span><span className="text-sm text-muted">{it.sub}</span></span>
          </Link>
        ))}
      </div>
    </>
  );
}
