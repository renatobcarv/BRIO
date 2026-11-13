import type { Metadata } from "next";
export const metadata: Metadata = { title: "Termos · BRIO" };
export default function Termos() {
  return (
    <main className="max-w-xl mx-auto px-5 py-14 text-[15px] leading-relaxed text-ink/85">
      <h1 className="font-display text-4xl text-ink">Termos de Serviço</h1>
      <p className="text-xs text-muted mt-2">Atualizados em 13/11/2026</p>
      <p className="mt-6">O BRIO é uma ferramenta pessoal de organização e constância, de uso privado do seu dono. O acesso é restrito e não há oferta do serviço a terceiros.</p>
      <p className="mt-4">As informações de treino e alimentação são estimativas e não substituem orientação de profissionais de saúde. O app é fornecido como está, sem garantias.</p>
      <p className="mt-4">Integrações (como o Google Agenda) são usadas somente por iniciativa do dono e podem ser desconectadas a qualquer momento.</p>
    </main>
  );
}
