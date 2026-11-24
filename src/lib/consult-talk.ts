// Conversa da consulta: o que o treinador e a nutricionista respondem a cada resposta. Puro e testável.
export type Who = "treino" | "dieta";
export const GREET: Record<Who, string> = {
  treino: "Fala! Eu sou o treinador. Vou te fazer umas perguntas rápidas pra montar uma periodização que caiba na sua vida, não na de outra pessoa.",
  dieta: "Oi, agora é comigo, a nutricionista. Com o treino definido, vou ajustar a comida pra ele render. Prometo que é rápido.",
};

/** Reação curta e humana à resposta (ou null para seguir direto). */
export function reactTo(key: string, val: unknown): string | null {
  const v = typeof val === "string" ? val.trim() : val;
  switch (key) {
    case "goal": return ({ powerbuilding: "Força e estética juntas. Gosto disso.", forca: "Força. Vamos atrás de número na barra.", hipertrofia: "Hipertrofia: volume bem distribuído é o caminho.", recomposicao: "Recomposição: perder gordura sem perder músculo. Dá, com paciência.", emagrecimento: "Emagrecer preservando músculo: o treino de força é seu seguro.", condicionamento: "Condicionamento: fôlego e força andando juntos.", hibrido: "Híbrido: forte e com fôlego. A gente faz os dois conviverem." } as Record<string, string>)[String(v)] ?? "Anotado.";
    case "runs": return `${v} corridas. Vou deixar a maioria leve e uma forte, longe dos dias de perna.`;
    case "runGoal": return v === "21k" ? "Meia maratona! O longão vai crescendo semana a semana." : v === "saude" ? "Fôlego e saúde: corrida leve é o coração disso." : `${v}: vou incluir tiros no ritmo de prova.`;
    case "style": return v === "oldschool" ? "Old school. Barra, básico pesado e suor. Do jeito clássico." : "Moderno: vou usar o melhor das máquinas e polias.";
    case "focus": return v === "geral" ? "Equilibrado, então. Nada fica pra trás." : v === "big3" ? "Os três básicos. Vamos treinar como powerlifter." : `Especialização no ${v}. Ele vai aparecer 3 vezes por semana.`;
    case "level": return v === "iniciante" ? "Ótimo momento: no começo tudo cresce rápido. Vou começar com menos volume." : v === "avancado" ? "Experiente. Você vai precisar de mais volume e variação pra continuar evoluindo." : "Base boa. Agora o segredo é progressão organizada.";
    case "days": return Number(v) <= 3 ? `${v} dias bem feitos valem mais que 6 pela metade. Vou usar corpo inteiro.` : `${v} dias. Consigo dividir melhor e cada músculo treina 2× por semana.`;
    case "minutes": return Number(v) <= 45 ? "Treino curto e direto. Vou priorizar o que dá mais resultado." : "Tempo bom. Dá pra fazer o principal e os acessórios com calma.";
    case "equipment": return v === "casa" ? "Em casa dá certo, sim. Peso do corpo bem progredido é treino de verdade." : v === "halteres" ? "Halteres e banco resolvem muita coisa." : "Academia completa: vou usar o melhor de cada máquina.";
    case "priority": return Array.isArray(v) && v.length ? `Prioridade anotada: ${v.length === 1 ? "esse grupo ganha" : "esses grupos ganham"} mais séries.` : "Sem prioridade: tudo cresce junto.";
    case "sleep": return Number(v) < 6.5 ? "Sono curto pesa na recuperação. Vou começar com menos volume, e dormir mais vira parte do plano." : "Sono em dia. Isso acelera tudo.";
    case "stress": return v === "alto" ? "Estresse alto também cansa o corpo. Vou pegar mais leve no começo." : null;
    case "injuries": return v ? "Obrigado por avisar. Vou marcar os exercícios com atenção. Se doer, a gente troca." : null;
    case "weeks": return `${v} semanas. Tempo suficiente pra ver diferença de verdade.`;
    case "sex": return null;
    case "age": return Number(v) >= 40 ? "Com a idade a recuperação muda um pouco, e a proteína fica ainda mais importante." : null;
    case "kg": return "Com peso e altura eu calculo seu gasto calórico.";
    case "meals": return `${v} refeições. Vou dividir a proteína entre elas.`;
    case "likes": return v ? "Vou colocar isso no cardápio. Dieta boa é a que você gosta de seguir." : null;
    case "dislikes": return v ? "Fica fora, prometo." : null;
    case "restrictions": return v ? "Restrição anotada e respeitada." : null;
    case "budget": return v === "economico" ? "Dá pra comer bem gastando pouco: arroz, feijão, ovo e frango fazem milagre." : null;
    case "cook": return "Fechado. Vou montar tudo e te mostrar o plano completo.";
    default: return null;
  }
}
/** Passagem de vez entre especialistas. */
export const HANDOFF = "Treino desenhado. Vou te passar pra nutricionista, que cuida da parte que faz o treino render.";
