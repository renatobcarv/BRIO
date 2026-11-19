// Regras puras de aprendizagem: revisão espaçada, domínio por evidência e XP de estudo.
// Sem dependências: testado com node --test.

export type Mastery = "nao_estudado" | "contato" | "compreensao" | "pratica" | "dominado" | "revisar";
export const MASTERY: Record<Mastery, { label: string; color: string; hint: string }> = {
  nao_estudado: { label: "Não estudado", color: "#6b6b70", hint: "Ainda sem contato." },
  contato: { label: "Em contato", color: "#a1a1a6", hint: "Reconhece o assunto, não explica." },
  compreensao: { label: "Em compreensão", color: "#ffb21e", hint: "Explica com as próprias palavras." },
  pratica: { label: "Em prática", color: "#ffd28a", hint: "Resolve problemas com o conceito." },
  dominado: { label: "Dominado", color: "#ffb21e", hint: "Aplica e ensina sem ajuda." },
  revisar: { label: "Precisa revisar", color: "#ff453a", hint: "Errou na recuperação recente." },
};

/** Escala de evidência (0–5) usada pela IA e pelas revisões:
 * 0 nada · 1 reconhece · 2 explica · 3 resolve · 4 aplica em situação real · 5 ensina/reproduz sem ajuda */
export function masteryFromLevel(level: number): Mastery {
  return level >= 5 ? "dominado" : level >= 3 ? "pratica" : level >= 2 ? "compreensao" : level >= 1 ? "contato" : "nao_estudado";
}

/** Domínio a partir das evidências mais recentes (as 3 últimas pesam; um erro recente pede revisão). */
export function masteryFromEvidence(ev: { date: string; level: number; score?: number | null }[]): Mastery {
  if (!ev.length) return "nao_estudado";
  const recent = [...ev].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  if (recent[0].score != null && recent[0].score < 50) return "revisar";
  return masteryFromLevel(Math.round(recent.reduce((a, e) => a + e.level, 0) / recent.length));
}

export type ReviewState = { interval_days: number; ease: number; hits: number; misses: number };
/** Qualidade 0–5 (estilo SM-2). < 3 = errou: intervalo volta a 1 dia e a facilidade cai. */
export function nextReview(s: ReviewState, quality: number, today: string): ReviewState & { review_at: string; mastery: Mastery } {
  const q = Math.max(0, Math.min(5, Math.round(quality)));
  let { interval_days, ease, hits, misses } = s;
  if (q < 3) { misses++; interval_days = 1; ease = Math.max(1.3, ease - 0.2); }
  else {
    hits++;
    interval_days = interval_days <= 0 ? 1 : interval_days === 1 ? 3 : Math.round(interval_days * ease);
    ease = Math.min(3, Math.max(1.3, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))));
  }
  interval_days = Math.min(interval_days, 180);
  const d = new Date(today + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + interval_days);
  const mastery: Mastery = q < 3 ? "revisar" : hits >= 4 && interval_days >= 21 ? "dominado" : hits >= 2 ? "pratica" : "compreensao";
  return { interval_days, ease: Math.round(ease * 100) / 100, hits, misses, review_at: d.toISOString().slice(0, 10), mastery };
}

/** XP de estudo vem de aprendizagem demonstrada, não de tempo. */
export function evidenceXp(e: { kind: string; level: number; score?: number | null }): number {
  const base = { avaliacao: 20, explicacao: 15, desafio: 15, revisao: 5, projeto: 60 }[e.kind] ?? 5;
  const quality = e.score != null ? e.score / 100 : e.level / 5;
  return Math.max(1, Math.round(base * (0.4 + quality) + e.level * 2));
}

export type LearnStats = { sessions: number; evidence: { kind: string; level: number; score: number | null; date: string }[]; notes: number; reviewsOk: number; projectsDone: number; certificates: number; hoursCert: number };
export type LearnAch = { id: string; title: string; desc: string; got: boolean; cur: number; goal: number; tier: "bronze" | "prata" | "ouro" };
/** Conquistas de aprendizado: só contam evidências e entregas, não tempo de tela. */
export function learningAchievements(s: LearnStats): LearnAch[] {
  const ev = s.evidence, lvl = (n: number, k?: string) => ev.filter((e) => e.level >= n && (!k || e.kind === k)).length;
  const a = (id: string, title: string, desc: string, cur: number, goal: number, tier: LearnAch["tier"]): LearnAch => ({ id, title, desc, cur: Math.min(cur, goal), goal, got: cur >= goal, tier });
  return [
    a("primeira-sessao", "Primeiro passo", "Abrir a primeira sessão com o tutor", s.sessions, 1, "bronze"),
    a("dez-sessoes", "Estudante constante", "10 sessões de estudo com IA", s.sessions, 10, "prata"),
    a("primeira-avaliacao", "Posto à prova", "Fazer a primeira avaliação de domínio", ev.filter((e) => e.kind === "avaliacao").length, 1, "bronze"),
    a("explica", "Explica com as próprias palavras", "Atingir nível 2+ numa avaliação", lvl(2, "avaliacao"), 1, "bronze"),
    a("resolve", "Resolve problemas", "Atingir nível 3+ em 3 avaliações", lvl(3, "avaliacao"), 3, "prata"),
    a("dominio", "Domínio comprovado", "Atingir nível 5 numa avaliação", lvl(5, "avaliacao"), 1, "ouro"),
    a("base-20", "Biblioteca mental", "20 anotações na base de conhecimento", s.notes, 20, "bronze"),
    a("revisor-25", "Memória de aço", "25 revisões corretas", s.reviewsOk, 25, "prata"),
    a("revisor-100", "Recuperação ativa", "100 revisões corretas", s.reviewsOk, 100, "ouro"),
    a("construtor", "Construtor", "Concluir um projeto no Build Lab", s.projectsDone, 1, "prata"),
    a("projeto-aprovado", "Aplicou no mundo real", "Projeto avaliado com nível 4+", lvl(4, "projeto"), 1, "ouro"),
    a("certificado-1", "Formação registrada", "Indexar o primeiro certificado", s.certificates, 1, "bronze"),
    a("cem-horas", "Cem horas certificadas", "Somar 100 horas em certificados", Math.round(s.hoursCert), 100, "ouro"),
  ];
}
