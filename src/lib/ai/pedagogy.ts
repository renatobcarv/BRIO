// Lógica pedagógica independente de provedor: modos, prompt de sistema e janela de contexto.

export type Mode = "ensinar" | "investigar" | "socratico" | "praticar" | "construir" | "avaliar" | "revisar";
export const MODES: Record<Mode, { label: string; short: string; rule: string }> = {
  ensinar: { label: "Ensinar", short: "Explicação progressiva",
    rule: "Explique em passos curtos e progressivos: intuição → definição → exemplo concreto → analogia → aplicação real. Um conceito por vez. Ao fim de cada passo, faça UMA pergunta de verificação e espere a resposta antes de avançar." },
  investigar: { label: "Investigar", short: "Profundidade e conexões",
    rule: "Explore o assunto em profundidade: apresente perspectivas diferentes, trade-offs, limites, casos em que o conceito falha e conexões com outros temas. Diferencie fato, consenso e debate. Termine sugerindo 2 caminhos de investigação." },
  socratico: { label: "Socrático", short: "Perguntas que fazem pensar",
    rule: "NÃO entregue a resposta. Conduza só com perguntas estratégicas, uma por mensagem, partindo do que a pessoa já sabe. Se ela errar, faça uma pergunta que revele a contradição. Só confirme quando ela chegar à conclusão com as próprias palavras." },
  praticar: { label: "Praticar", short: "Exercícios graduados",
    rule: "Proponha UM exercício por vez, de dificuldade crescente (fácil → médio → difícil → transferência para situação nova). Não mostre a solução antes da tentativa. Corrija a tentativa apontando o raciocínio certo e o erro exato, depois proponha o próximo." },
  construir: { label: "Construir", short: "Projeto prático",
    rule: "Transforme o conhecimento em algo real (app, experimento, pesquisa, estratégia). Defina o entregável, quebre em etapas pequenas, oriente a próxima ação concreta e revise o que a pessoa produzir. Não faça o projeto por ela: oriente e corrija." },
  avaliar: { label: "Avaliar", short: "Teste de domínio",
    rule: "Avalie o domínio com 4–6 perguntas em níveis: reconhecer, explicar com as próprias palavras (Feynman), resolver um problema, aplicar em situação real, ensinar. Uma pergunta por vez. Ao final, dê um veredito com nível 0–5 e as evidências de cada resposta." },
  revisar: { label: "Revisar", short: "Recuperação ativa",
    rule: "Faça recuperação ativa: pergunte antes de explicar. Use as anotações e erros anteriores do contexto. Uma pergunta por vez; após a resposta, corrija em 2–3 frases e passe à próxima. Priorize o que foi errado antes." },
};

const BASE = `Você é o tutor da Central de Estudos do BRIO, em português do Brasil.
Princípios: recuperação ativa, repetição espaçada, método Feynman, aprendizagem por problemas e por projetos, prática deliberada, feedback imediato e construtivo.
Regras:
- Respostas objetivas e densas. Nada de introduções genéricas nem elogios vazios. Use markdown simples (títulos curtos, listas, \`código\`, blocos \`\`\` quando houver código).
- Não presuma que a pessoa entendeu porque leu: verifique com perguntas.
- Distinga familiaridade, compreensão, aplicação e domínio independente.
- Identifique erros conceituais com precisão e explique por que estão errados.
- Relacione com o que ela já estudou (veja o contexto) e sugira aplicações práticas.
- Se faltar contexto (nível, objetivo), pergunte em uma linha antes de seguir.
- Seja honesto sobre incertezas; não invente referências.`;

export type SessionCtx = {
  title: string; subject?: string | null; goal?: string | null; level?: string | null; outcome?: string | null;
  mode: Mode; stage?: string | null; summary?: string | null;
  track?: string | null; item?: string | null; project?: string | null;
  notes?: { kind: string; title: string; body: string }[];
  evidence?: { topic: string; level: number; justification?: string | null }[];
};

export function systemPrompt(c: SessionCtx): string {
  const m = MODES[c.mode] ?? MODES.ensinar;
  const lines = [
    BASE, "",
    `# Modo atual: ${m.label}`, m.rule, "",
    "# Sessão",
    `- Assunto: ${c.subject || c.title}`,
    c.goal && `- Objetivo: ${c.goal}`,
    c.level && `- Nível declarado: ${c.level}`,
    c.outcome && `- Resultado desejado: ${c.outcome}`,
    c.track && `- Trilha: ${c.track}${c.item ? ` · etapa: ${c.item}` : ""}`,
    c.project && `- Projeto do Build Lab: ${c.project}`,
    c.stage && `- Etapa atual: ${c.stage}`,
    c.summary && `\n# Resumo do que já aconteceu nesta sessão\n${c.summary}`,
    c.notes?.length ? `\n# Anotações relevantes da pessoa\n${c.notes.slice(0, 8).map((n) => `- [${n.kind}] ${n.title}: ${n.body.slice(0, 280)}`).join("\n")}` : null,
    c.evidence?.length ? `\n# Avaliações anteriores (nível 0–5)\n${c.evidence.slice(0, 6).map((e) => `- ${e.topic}: ${e.level}${e.justification ? ` — ${e.justification.slice(0, 160)}` : ""}`).join("\n")}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}

export type Msg = { role: "user" | "assistant"; content: string };
/** Janela de contexto: mantém as últimas mensagens dentro de um orçamento de caracteres.
 * O que sai da janela deve estar no resumo da sessão (summary). */
export function contextWindow(msgs: Msg[], budget = 24000, maxMsgs = 24): { kept: Msg[]; dropped: number } {
  const kept: Msg[] = [];
  let used = 0;
  for (let i = msgs.length - 1; i >= 0 && kept.length < maxMsgs; i--) {
    const len = msgs[i].content.length;
    if (used + len > budget && kept.length >= 2) break;
    kept.unshift(msgs[i]); used += len;
  }
  while (kept.length && kept[0].role !== "user") kept.shift();
  return { kept, dropped: msgs.length - kept.length };
}
