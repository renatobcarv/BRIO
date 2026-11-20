import { CardArt } from "@/components/card-art";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { moreItems } from "@/components/nav";

// Tudo que não cabe na barra de baixo do celular. Segue o menu lateral: item novo no menu aparece aqui sozinho.
const INFO: Record<string, { sub: string; art?: "agenda" | "conquistas" | "estudos" | "financas" | "metas" | "pioneiro" | "sonhos" | "treino" }> = {
  "/status": { sub: "Nível, patentes, atributos e conquistas", art: "conquistas" },
  "/mascote": { sub: "Sorteio, coleção e o seu companheiro" },
  "/agenda": { sub: "Linha do tempo, Google Agenda e IA", art: "agenda" },
  "/sonhos": { sub: "Quadro de sonhos com quem você ama", art: "sonhos" },
  "/estudos": { sub: "Trilhas, estudar com IA, conhecimento", art: "estudos" },
  "/eventos": { sub: "Hell Week, desafios e insígnias" },
  "/financas": { sub: "Saldo, orçamento, parcelas e caixinhas", art: "financas" },
  "/livros": { sub: "Estante, leituras e medalhas", art: "estudos" },
  "/metas": { sub: "Missões, marcos e troféus", art: "metas" },
  "/configuracoes": { sub: "Checklist, metas padrão, backup" },
};
const EXTRA: { href: string; label: string; color: string; sub: string; art?: "treino" }[] = [{ href: "/bestiario", label: "Bestiário", color: "#ffb21e", sub: "Feras, anjos e a Clareira" }];

export default function Mais() {
  const items = [...moreItems.map((it) => ({ href: it.href, label: it.label, color: it.color, ...INFO[it.href] })), ...EXTRA];
  return (
    <>
      <PageHeader eyebrow="Mais" title="Outras áreas" />
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((it, i) => (
          <Link key={it.href} href={it.href} className={`glass rise rise-${Math.min(i + 1, 6)} relative isolate overflow-hidden flex items-center gap-4 p-5 min-h-16`}>
            {it.art && <CardArt name={it.art} />}
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: it.color }} />
            <span><span className="block font-display text-xl">{it.label}</span>{it.sub && <span className="text-sm text-muted">{it.sub}</span>}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
