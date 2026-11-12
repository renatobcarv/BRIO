import type { EventType } from "./events.ts";

/** Textos originais, estoicos (tradução livre) e textos bíblicos na Tradução do Novo Mundo. */
export type Lore = { why: string; how: string; words: { t: string; a: string }[] };

export const LORE: Record<EventType, Lore> = {
  genesis: {
    why: "Todo ciclo nasce frágil. Na primeira semana a empolgação é alta e o hábito ainda não existe, por isso é onde a maioria desiste. O GENESIS existe para que a largada seja um ato de vontade, não de humor.",
    how: "Cumpra todos os treinos planejados para a primeira semana da campanha. Vencer dá FIRST BLOOD; falhar deixa a cicatriz FALSE START.",
    words: [
      { t: "O começo não é a parte mais fácil. É a parte mais honesta: ali ainda não há resultado para te sustentar, só a decisão.", a: "BRIO" },
      { t: "Pois quem desprezou o dia das coisas pequenas?", a: "Zacarias 4:10" },
      { t: "A disciplina é escolher entre o que você quer agora e o que você quer mais.", a: "BRIO" },
      { t: "Quem é fiel no mínimo também é fiel no muito, e quem é injusto no mínimo também é injusto no muito.", a: "Lucas 16:10" },
      { t: "Comece onde está. Use o que tem. Faça o que pode. Amanhã você já não será o mesmo que começou.", a: "BRIO" },
      { t: "Não é porque as coisas são difíceis que não ousamos; é porque não ousamos que elas são difíceis.", a: "Sêneca" },
      { t: "A semente não discute com a terra. Ela simplesmente começa a morrer para dar fruto.", a: "BRIO" },
    ],
  },
  hell_week: {
    why: "Toda fase de intensificação tem uma semana que testa se o plano era real ou só bonito no papel. A HELL WEEK é o fogo que separa intenção de caráter: carga alta, execução limpa, ego no chão.",
    how: "Cumpra os treinos da semana registrando o RPE, sem treinar mais de 6 dias seguidos e sem inventar sessões extras. Vencer dá a insígnia de glória; quebrar dá a cicatriz.",
    words: [
      { t: "O fogo não destrói o ouro. Só tira dele o que nunca foi ouro.", a: "BRIO" },
      { t: "O obstáculo no caminho torna-se o caminho.", a: "Marco Aurélio" },
      { t: "A tribulação produz perseverança; a perseverança, por sua vez, uma condição aprovada; a condição aprovada, por sua vez, esperança.", a: "Romanos 5:3, 4" },
      { t: "Intensidade sem controle é vaidade. Controle sem intensidade é medo. Aqui você precisa dos dois.", a: "BRIO" },
      { t: "Ninguém é mais infeliz do que aquele que nunca foi provado: não teve a chance de conhecer a si mesmo.", a: "Sêneca" },
      { t: "Você não sobe ao nível das suas metas. Você cai ao nível dos seus hábitos sob pressão.", a: "BRIO" },
      { t: "A dor da disciplina pesa gramas. A do arrependimento pesa toneladas.", a: "BRIO" },
    ],
  },
  war_rations: {
    why: "Ninguém vence uma guerra com o estoque vazio. Na semana mais dura do ciclo, comer bem não é detalhe, é estratégia. War Rations existe porque a força é construída no treino e consolidada na mesa.",
    how: "Bata a meta de proteína nos dias da Hell Week. Cada dia batido conta; a semana completa vale a recompensa.",
    words: [
      { t: "Quem governa a própria boca governa o próprio corpo, e quem governa o corpo se prepara para governar mais.", a: "BRIO" },
      { t: "Quem é lento para se irar é melhor do que o homem poderoso, e quem controla seu temperamento é melhor do que quem conquista uma cidade.", a: "Provérbios 16:32" },
      { t: "Coma para a missão, não para o momento.", a: "BRIO" },
      { t: "Não é o que entra pela boca num dia que te define, é o que você repete em todos.", a: "BRIO" },
      { t: "Primeiro diga a si mesmo o que você quer ser; depois faça o que precisa fazer.", a: "Epicteto" },
    ],
  },
  sanctuary: {
    why: "O músculo não cresce no treino, cresce no descanso que vem depois. O SANCTUARY é o deload com propósito: baixar a carga não é recuar, é preparar o próximo avanço. Até a terra precisava de repouso.",
    how: "Treine nos dias planejados com carga e esforço reduzidos, e durma bem. Descansar com disciplina também é vitória.",
    words: [
      { t: "Para tudo há um tempo determinado, um tempo para cada atividade debaixo dos céus.", a: "Eclesiastes 3:1" },
      { t: "O arco sempre esticado se quebra.", a: "provérbio antigo" },
      { t: "Descansar não é parar. É afiar o machado antes de voltar à floresta.", a: "BRIO" },
      { t: "Quem não sabe recuar um passo nunca aprende a dar dois.", a: "BRIO" },
      { t: "Em nenhum lugar o homem encontra retiro mais tranquilo do que na própria alma.", a: "Marco Aurélio" },
    ],
  },
  judgment: {
    why: "Todo ciclo termina numa prestação de contas. O JUDGMENT DAY não é para te condenar nem te bajular: é o espelho. O que foi semeado nas últimas semanas aparece agora, em números.",
    how: "Feche a última semana cumprindo os treinos e registre seus testes. O resumo do ciclo mostra o que foi construído.",
    words: [
      { t: "Não se enganem: Deus não é alguém de quem se possa zombar. Pois o que a pessoa semear, isso também colherá.", a: "Gálatas 6:7" },
      { t: "Os números não mentem e não têm pena. É por isso que são bons amigos.", a: "BRIO" },
      { t: "Não pergunte se foi fácil. Pergunte se foi fiel.", a: "BRIO" },
      { t: "Pare de discutir como deve ser um homem bom. Seja um.", a: "Marco Aurélio" },
      { t: "Um ciclo encerrado com honestidade vale mais que dez começados com promessa.", a: "BRIO" },
    ],
  },
};

/** Uma frase por dia, estável ao longo do dia e diferente entre eventos. */
export function wordOfDay(type: EventType, date: string) {
  const w = LORE[type].words;
  const n = [...(date + type)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  return w[n % w.length];
}
