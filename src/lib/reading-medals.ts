// Medalhas de leitura: cada uma diz exatamente o que fazer e mostra o progresso até o próximo nível. Sem dependências.
export type Tier = { n: number; name: "Bronze" | "Prata" | "Ouro" | "Diamante" | "Lenda" };
const T = (a: number, b: number, c: number, d: number, e?: number): Tier[] => [{ n: a, name: "Bronze" }, { n: b, name: "Prata" }, { n: c, name: "Ouro" }, { n: d, name: "Diamante" }, ...(e ? [{ n: e, name: "Lenda" as const }] : [])];
export type Medal = { id: string; title: string; how: (n: number) => string; unit: string; tiers: Tier[] };
export const MEDALS: Medal[] = [
  { id: "livros", title: "Devorador de livros", unit: "livros", how: (n) => `Termine ${n} ${n === 1 ? "livro" : "livros"}`, tiers: T(1, 5, 12, 25, 50) },
  { id: "paginas", title: "Páginas viradas", unit: "páginas", how: (n) => `Leia ${n.toLocaleString("pt-BR")} páginas no total`, tiers: T(300, 1500, 5000, 12000, 30000) },
  { id: "sequencia", title: "Chama da leitura", unit: "dias", how: (n) => `Leia ${n} dias seguidos`, tiers: T(3, 7, 21, 60, 180) },
  { id: "maratona", title: "Maratonista", unit: "páginas num dia", how: (n) => `Leia ${n} páginas em um único dia`, tiers: T(30, 60, 120, 250) },
  { id: "tijolo", title: "Tijolão", unit: "páginas", how: (n) => `Termine um livro com ${n}+ páginas`, tiers: T(250, 400, 600, 900) },
  { id: "anotador", title: "Mente anotadora", unit: "anotações", how: (n) => `Faça ${n} anotações ou destaques`, tiers: T(5, 25, 100, 300) },
  { id: "autores", title: "Muitas vozes", unit: "autores", how: (n) => `Leia livros de ${n} autores diferentes`, tiers: T(3, 8, 20, 50) },
  { id: "semanas", title: "Leitor constante", unit: "semanas", how: (n) => `Leia em ${n} semanas diferentes`, tiers: T(4, 12, 26, 52, 104) },
  { id: "meta", title: "Meta do ano", unit: "% da meta", how: (n) => `Alcance ${n}% da meta anual de livros`, tiers: T(25, 50, 100, 150) },
  { id: "aplicado", title: "Leitor que aplica", unit: "livros", how: (n) => `Registre lições e aplicação em ${n} ${n === 1 ? "livro lido" : "livros lidos"}`, tiers: T(1, 3, 8, 20) },
  { id: "critico", title: "Crítico", unit: "avaliações", how: (n) => `Avalie ${n} livros com estrelas`, tiers: T(3, 10, 25, 60) },
];
export type Stats = Record<string, number>;
type B = { status: string; finished_at: string | null; pages: number | null; authors: string | null; rating: number | null; lessons: string | null; application: string | null };
type S = { date: string; from_page: number; to_page: number };
const prev = (d: string) => new Date(Date.parse(d + "T12:00:00Z") - 864e5).toISOString().slice(0, 10);
const week = (d: string) => { const x = new Date(d + "T12:00:00Z"); const day = (x.getUTCDay() + 6) % 7; x.setUTCDate(x.getUTCDate() - day); return x.toISOString().slice(0, 10); };

export function readingStats(books: B[], sessions: S[], notes: number, goal: number, today: string): Stats {
  const read = books.filter((b) => b.status === "lido");
  const perDay = new Map<string, number>();
  for (const s of sessions) perDay.set(s.date, (perDay.get(s.date) ?? 0) + Math.max(0, s.to_page - s.from_page));
  const days = new Set([...perDay].filter(([, p]) => p > 0).map(([d]) => d));
  let best = 0, run = 0, last = "";
  for (const d of [...days].sort()) { run = last && prev(d) === last ? run + 1 : 1; best = Math.max(best, run); last = d; }
  const year = today.slice(0, 4), readYear = read.filter((b) => b.finished_at?.startsWith(year)).length;
  return {
    livros: read.length,
    paginas: [...perDay.values()].reduce((a, b) => a + b, 0),
    sequencia: best, maratona: Math.max(0, ...perDay.values()), tijolo: Math.max(0, ...read.map((b) => b.pages ?? 0)), anotador: notes,
    autores: new Set(read.flatMap((b) => (b.authors ?? "").split(/[,;&]/).map((a) => a.trim().toLowerCase()).filter(Boolean))).size,
    semanas: new Set([...days].map(week)).size, meta: goal ? Math.round((readYear / goal) * 100) : 0,
    aplicado: read.filter((b) => (b.lessons ?? "").trim() && (b.application ?? "").trim()).length, critico: books.filter((b) => b.rating).length,
  };
}
/** Situação de uma medalha: nível atual, próximo alvo e progresso. */
export function medalState(m: Medal, v: number) {
  const got = m.tiers.filter((t) => v >= t.n), next = m.tiers.find((t) => v < t.n) ?? null;
  const prevN = got.at(-1)?.n ?? 0;
  return { tier: got.at(-1)?.name ?? null, level: got.length, next, value: v, progress: next ? Math.max(0, Math.min(1, (v - prevN) / (next.n - prevN))) : 1, maxed: !next };
}
export const TIER_COLOR: Record<string, string> = { Bronze: "#c8875a", Prata: "#cfd3da", Ouro: "#ffb21e", Diamante: "#7dd3fc", Lenda: "#ff2800" };
