import { CardArt, type CardArtName } from "@/components/card-art";
import Link from "next/link";
import { PageHeader } from "@/components/ui";

// Tudo que não cabe na barra de baixo do celular (mesma ordem do menu lateral).
const MENU: [string, string][] = [["/perfil", "Perfil"], ["/corpo", "Corpo"], ["/status", "Status"], ["/mascote", "Mascote"], ["/agenda", "Agenda"], ["/sonhos", "Sonhos"], ["/estudos", "Estudos"], ["/eventos", "Eventos"], ["/financas", "Finanças"], ["/livros", "Livros"], ["/configuracoes", "Configurações"]];
const INFO: Record<string, { sub: string; art?: CardArtName }> = {
  "/perfil": { sub: "Você no BRIO: nível, semana, mascote, feras e itens", art: "conquistas" },
  "/corpo": { sub: "Água, sono, peso e alimentação", art: "corpo" },
  "/status": { sub: "Nível, patentes, atributos e conquistas", art: "conquistas" },
  "/mascote": { sub: "Sorteio, coleção e o seu companheiro", art: "mascote" },
  "/agenda": { sub: "Linha do tempo, Google Agenda e IA", art: "agenda" },
  "/sonhos": { sub: "Quadro de sonhos com quem você ama", art: "sonhos" },
  "/estudos": { sub: "Trilhas, estudar com IA, conhecimento", art: "estudos" },
  "/eventos": { sub: "Hell Week, desafios e insígnias", art: "eventos" },
  "/financas": { sub: "Saldo, orçamento, parcelas e caixinhas", art: "financas" },
  "/livros": { sub: "Estante, leituras e medalhas", art: "estudos" },
  "/configuracoes": { sub: "Checklist, metas padrão, backup", art: "configuracoes" },
};
const EXTRA: { href: string; label: string; color: string; sub: string; art?: CardArtName }[] = [
  { href: "/treino?aba=ferramentas", label: "Vestiário", color: "#b98add", sub: "Ferramentas de treino", art: "vestiario" },
  { href: "/bestiario", label: "Bestiário", color: "#ffb21e", sub: "Feras, anjos e a Clareira" },
];

export default function Mais() {
  const items = [...MENU.map(([href, label]) => ({ href, label, color: "#ffb21e", ...INFO[href] })), ...EXTRA];
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
