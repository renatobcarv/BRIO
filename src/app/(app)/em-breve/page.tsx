import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { FUTURE } from "@/lib/edition";

export const metadata = { title: "Em breve · BRIO" };

export default function EmBreve() {
  return (
    <>
      <PageHeader eyebrow="Próxima etapa" title="Área restrita" />
      <p className="text-muted text-[15px] -mt-2">Essa área é exclusiva da conta principal.</p>
      <ul className="grid sm:grid-cols-2 gap-3 mt-6">
        {FUTURE.map((f) => (
          <li key={f.href} className="glass p-5 flex items-center justify-between gap-3">
            <div><p className="font-semibold">{f.label}</p><p className="text-sm text-muted mt-0.5">{f.hint}</p></div>
            <span className="tag shrink-0" style={{ color: "#ffb21e" }}>Restrita</span>
          </li>
        ))}
      </ul>
      <Link href="/" className="btn btn-accent mt-6 w-full sm:w-auto">Voltar ao Início</Link>
    </>
  );
}
