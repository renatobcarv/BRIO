import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacidade · BRIO" };
export default function Privacidade() {
  return (
    <main className="max-w-xl mx-auto px-5 py-14 text-[15px] leading-relaxed text-ink/85">
      <h1 className="font-display text-4xl text-ink">Política de Privacidade</h1>
      <p className="text-xs text-muted mt-2">Atualizada em 13/11/2026</p>
      <p className="mt-6">O BRIO é um aplicativo pessoal e privado, usado por um único dono. Não há cadastro aberto ao público.</p>
      <h2 className="font-display text-xl text-ink mt-6">Dados</h2>
      <p className="mt-2">Os registros (rotina, treinos, alimentação, finanças, agenda) ficam num banco de dados com acesso restrito ao próprio dono. Nada é vendido, compartilhado ou usado para publicidade.</p>
      <h2 className="font-display text-xl text-ink mt-6">Google Agenda</h2>
      <p className="mt-2">Quando o dono conecta o Google Agenda, o BRIO usa a permissão <i>calendar.events</i> apenas para criar, atualizar, apagar e exibir os eventos da própria agenda do dono. O token de acesso fica guardado de forma protegida e é revogado ao desconectar. O uso das informações recebidas das APIs do Google segue a Política de Dados do Usuário dos Serviços de API do Google, incluindo os requisitos de Uso Limitado.</p>
      <h2 className="font-display text-xl text-ink mt-6">Exclusão</h2>
      <p className="mt-2">O dono pode exportar ou apagar seus dados a qualquer momento nas Configurações, e desconectar o Google na Agenda.</p>
    </main>
  );
}
