/** Bestiário do BRIO: cada semana da campanha traz um adversário. Criaturas originais, sem simbologia religiosa. */
export type BeastId = "vigia" | "arauto" | "guerreiro" | "golem" | "lobo" | "javali" | "serpe" | "titan" | "juggernaut" | "sentinela" | "guardiao";
export type Beast = { id: BeastId; name: string; epithet: string; threat: 1 | 2 | 3 | 4 | 5; color: string; eye: string; line: string; wings?: number };

const B: Record<BeastId, Omit<Beast, "threat">> = {
  vigia:      { id: "vigia", name: "O Vigia", epithet: "Anjo guerreiro · asas de bronze", color: "#ffb340", eye: "#fff4d6", wings: 1, line: "Não é inimigo. Veio provar se você é constante." },
  arauto:     { id: "arauto", name: "Arauto da Chama", epithet: "Anjo guerreiro · lâmina de fogo", color: "#ff7a2f", eye: "#fff1a8", wings: 2, line: "Vigia cada série. Nenhuma passa sem ser vista." },
  guerreiro:  { id: "guerreiro", name: "Comandante Alado", epithet: "Anjo guerreiro · seis asas de aço", color: "#64d2ff", eye: "#ffffff", wings: 3, line: "A força dele é disciplina. A sua precisa ser também." },
  golem:      { id: "golem", name: "O Colosso", epithet: "Golem de pedra", color: "#ff5a36", eye: "#ffd27a", line: "Lento, pesado, paciente. Igual ao volume." },
  lobo:       { id: "lobo", name: "Lobo de Ferro", epithet: "Caçador da matilha", color: "#64d2ff", eye: "#e8f6ff", line: "Ataca quem pula série." },
  javali:     { id: "javali", name: "Javali Blindado", epithet: "Fera da trincheira", color: "#ff9f0a", eye: "#ffe08a", line: "Investe sem parar. Aguente o tranco." },
  serpe:      { id: "serpe", name: "Serpe de Obsidiana", epithet: "Predadora das cargas altas", color: "#bf5af2", eye: "#f0d4ff", line: "Aperta a cada repetição." },
  titan:      { id: "titan", name: "Titã de Magma", epithet: "Senhor da fornalha", color: "#ff3b30", eye: "#fff1a8", line: "Só se vence com técnica sob fogo." },
  juggernaut: { id: "juggernaut", name: "Juggernaut", epithet: "Carrasco da Hell Week", color: "#ff2d2d", eye: "#ffffff", line: "Não para. Não cansa. Não perdoa." },
  sentinela:  { id: "sentinela", name: "Sentinela de Cristal", epithet: "Guardião do descanso", color: "#30d158", eye: "#d6ffe2", line: "Teste de controle: menos é mais hoje." },
  guardiao:   { id: "guardiao", name: "O Último Guardião", epithet: "Chefe do ciclo", color: "#ffd60a", eye: "#ffffff", line: "Tudo o que você construiu, agora." },
};
const clamp = (n: number) => Math.max(1, Math.min(5, n)) as Beast["threat"];

/** Escolhe a criatura pela fase e semana. Ameaça cresce com a semana e com o tipo da fase. */
export function beastFor(kind: string | null | undefined, weekInPhase = 1, opts: { hell?: boolean; last?: boolean } = {}): Beast {
  if (opts.hell) return { ...B.juggernaut, threat: 5 };
  switch (kind) {
    case "deload": return { ...B.sentinela, threat: 1 };
    case "realizacao": return { ...B.guardiao, threat: clamp(4 + (opts.last ? 1 : 0)) };
    case "intensificacao": return weekInPhase <= 2 ? { ...B.serpe, threat: clamp(3 + (weekInPhase - 1)) } : { ...B.titan, threat: clamp(4 + (weekInPhase > 3 ? 1 : 0)) };
    case "acumulacao": { const order: BeastId[] = ["vigia", "arauto", "guerreiro"]; const id = order[Math.min(order.length - 1, weekInPhase - 1)]; return { ...B[id], threat: clamp(Math.min(3, weekInPhase)) }; }
    default: { const order: BeastId[] = ["golem", "lobo", "javali"]; return { ...B[order[(weekInPhase - 1) % 3]], threat: clamp(1 + ((weekInPhase - 1) % 3)) }; }
  }
}
