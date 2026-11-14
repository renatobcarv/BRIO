// Planos do BRIO. Preço baixo de propósito: hábito diário custa menos que um café por semana.
export type Plan = { id: "gratis" | "essencial" | "completo"; name: string; price: number; yearly: number; tagline: string; features: string[]; highlight?: boolean };
export const PLANS: Plan[] = [
  { id: "gratis", name: "Grátis", price: 0, yearly: 0, tagline: "Para criar o hábito", features: ["Missão diária e sequência", "Água, sono e peso", "Dias limpos com fogo por faixa", "Leitura da Bíblia e diário"] },
  { id: "essencial", name: "Essencial", price: 4.9, yearly: 49, tagline: "Para quem quer constância de verdade", highlight: true,
    features: ["Tudo do Grátis", "War Room: treino periodizado com sugestão de carga", "Dieta com metas e fora do plano", "Finanças com parcelas e orçamento", "Pioneiro: horas, revisitas e estudos", "Gamificação completa: XP, patentes, eventos e bestiário"] },
  { id: "completo", name: "Completo", price: 9.9, yearly: 99, tagline: "Para organizar a vida inteira",
    features: ["Tudo do Essencial", "Central de Operações com IA (fale e ela agenda)", "Google Agenda em duas vias", "Central de Estudos com plano feito por IA", "Assistente financeiro com IA"] },
];
export const planById = (id: string | null | undefined) => PLANS.find((p) => p.id === id) ?? PLANS[0];
export const brlPrice = (v: number) => (v === 0 ? "R$ 0" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
