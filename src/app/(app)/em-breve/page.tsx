import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { CORE, FUTURE } from "@/lib/edition";

export const metadata = { title: "Em breve · BRIO" };

export default function EmBreve() {
  return (
    <>
      <PageHeader eyebrow="Próxima etapa" title="Em desenvolvimento" />
      <p className="text-muted text-[15px] -mt-2">Essa área ainda está sendo construída. Seu plano já inclui {CORE.slice(0, -1).join(", ")} e {CORE.at(-1)}.</p>
      <ul className="grid sm:grid-cols-2 gap-3 mt-6">
        {FUTURE.filter((f) => f.href !== "/bestiario").map((f) => (
          <li key={f.href} className="glass p-5 flex items-center justify-between gap-3">
            <div><p className="font-semibold">{f.label}</p><p className="text-sm text-muted mt-0.5">{f.hint}</p></div>
            <span className="tag shrink-0" style={{ color: "#ffb21e" }}>Em breve</span>
          </li>
        ))}
      </ul>
      <Link href="/" className="btn btn-accent mt-6 w-full sm:w-auto">Voltar ao Início</Link>
    </>
  );
}
