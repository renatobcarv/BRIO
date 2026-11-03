import { Card, PageHeader } from "@/components/ui";
import { signOut } from "@/app/actions";
export default function Config() {
  return (
    <>
      <PageHeader eyebrow="Ajustes" title="Configurações" color="#9a978f" />
      <Card>
        <p className="text-muted text-sm mb-4">Checklist, metas padrão, divisão de treino, foto e backup chegam na Fase 8.</p>
        <form action={signOut}>
          <button className="min-h-11 rounded-xl border border-white/10 px-5 text-sm hover:bg-white/5">Sair</button>
        </form>
      </Card>
    </>
  );
}
