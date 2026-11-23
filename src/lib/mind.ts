// Mente: questões cognitivas geradas (infinitas, sem repetir), adaptativas e com explicação. Puro e testável.
// Índice ESTIMADO (não é QI clínico): serve para acompanhar evolução e apontar pontos fortes e fracos.
export type Domain = "logico" | "numerico" | "verbal" | "memoria";
export const DOMAINS: Record<Domain, { label: string; skill: string; hint: string }> = {
  logico: { label: "Raciocínio lógico", skill: "Encontrar padrões e regras", hint: "Matrizes: descubra a regra das linhas e colunas." },
  numerico: { label: "Raciocínio numérico", skill: "Pensar com números", hint: "Sequências: ache a relação entre os termos." },
  verbal: { label: "Raciocínio verbal", skill: "Relações entre ideias e palavras", hint: "Analogias: a relação do primeiro par vale para o segundo." },
  memoria: { label: "Memória de trabalho", skill: "Segurar e manipular informação", hint: "Guarde a sequência e responda na ordem pedida." },
};
export type Shape = "circulo" | "quadrado" | "triangulo";
export type Cell = { shape: Shape; n: number; fill: boolean };
export type Item =
  | { kind: "serie"; domain: "numerico"; d: number; seq: number[]; opts: number[]; answer: number; why: string }
  | { kind: "matriz"; domain: "logico"; d: number; grid: (Cell | null)[]; opts: Cell[]; answer: number; why: string }
  | { kind: "analogia"; domain: "verbal"; d: number; q: string; opts: string[]; answer: number; why: string }
  | { kind: "memoria"; domain: "memoria"; d: number; digits: number[]; reverse: boolean; why: string };

/** RNG determinístico (mulberry32): mesma semente, mesma questão. */
export function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const int = (r: () => number, a: number, b: number) => a + Math.floor(r() * (b - a + 1));
const shuffle = <T,>(r: () => number, l: T[]) => { const x = [...l]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
function withOpts<T>(r: () => number, right: T, wrong: T[], eq: (a: T, b: T) => boolean) {
  const uniq: T[] = []; for (const w of wrong) if (!eq(w, right) && !uniq.some((u) => eq(u, w))) uniq.push(w);
  const opts = shuffle(r, [right, ...uniq.slice(0, 3)]);
  return { opts, answer: opts.findIndex((o) => eq(o, right)) };
}

export function serie(seed: number, d: number): Item {
  const r = rng(seed), a = int(r, 1, 9);
  let seq: number[] = [], why = "";
  if (d <= 1) { const k = int(r, 2, 9); seq = Array.from({ length: 6 }, (_, i) => a + k * i); why = `Soma ${k} a cada termo.`; }
  else if (d === 2) { const k = int(r, 2, 3); seq = Array.from({ length: 6 }, (_, i) => a * k ** i); why = `Multiplica por ${k} a cada termo.`; }
  else if (d === 3) { const p = int(r, 2, 6), q = int(r, 7, 12); seq = [a]; for (let i = 1; i < 7; i++) seq.push(seq[i - 1] + (i % 2 ? p : q)); why = `Alterna +${p} e +${q}.`; }
  else if (d === 4) { const s = int(r, 1, 4); seq = [a]; for (let i = 1; i < 6; i++) seq.push(seq[i - 1] + s + (i - 1) * 2); why = `As diferenças crescem de 2 em 2 (${s}, ${s + 2}, ${s + 4}…).`; }
  else { const b = int(r, 1, 5); seq = [a, b]; for (let i = 2; i < 7; i++) seq.push(seq[i - 1] + seq[i - 2]); why = "Cada termo é a soma dos dois anteriores (tipo Fibonacci)."; }
  const answer = seq.pop()!, shown = seq;
  const last = shown[shown.length - 1], diff = last - shown[shown.length - 2];
  const o = withOpts(r, answer, [answer + 1, answer - 1, last + diff, answer + diff, answer * 2, answer - 2], (x, y) => x === y);
  return { kind: "serie", domain: "numerico", d, seq: shown, opts: o.opts, answer: o.answer, why };
}

const SHAPES: Shape[] = ["circulo", "quadrado", "triangulo"];
export function matriz(seed: number, d: number): Item {
  const r = rng(seed), sh = shuffle(r, SHAPES), base = int(r, 1, 2);
  // Regras por dificuldade: linha muda a forma; coluna muda a quantidade; (d≥3) diagonal alterna o preenchimento; (d≥5) quantidade depende de linha+coluna.
  const cell = (row: number, col: number): Cell => ({
    shape: d >= 4 ? sh[(row + col) % 3] : sh[row],
    n: d >= 5 ? ((row + col) % 3) + 1 : col + base,
    fill: d >= 3 ? (row + col) % 2 === 0 : d >= 2 ? col % 2 === 0 : true,
  });
  const grid: (Cell | null)[] = []; for (let i = 0; i < 9; i++) grid.push(cell(Math.floor(i / 3), i % 3));
  const right = grid[8]!; grid[8] = null;
  const wrong: Cell[] = [{ ...right, n: right.n === 1 ? 2 : right.n - 1 }, { ...right, fill: !right.fill }, { ...right, shape: SHAPES.find((s) => s !== right.shape)! }, { ...right, n: right.n + 1, fill: !right.fill }];
  const o = withOpts(r, right, wrong, (a, b) => a.shape === b.shape && a.n === b.n && a.fill === b.fill);
  const why = [d >= 4 ? "A forma muda na diagonal" : "A forma é a mesma em cada linha", d >= 5 ? "a quantidade depende da linha + coluna" : "a quantidade cresce da esquerda para a direita", d >= 3 ? "o preenchimento alterna como um tabuleiro de xadrez" : d >= 2 ? "o preenchimento alterna por coluna" : ""].filter(Boolean).join(", ") + ".";
  return { kind: "matriz", domain: "logico", d, grid, opts: o.opts, answer: o.answer, why };
}

// Analogias: [pergunta, certa, erradas, por quê, dificuldade]
const ANALOGIAS: [string, string, string[], string, number][] = [
  ["Pássaro está para ninho assim como abelha está para…", "colmeia", ["flor", "mel", "ferrão"], "É o lugar onde o animal vive.", 1],
  ["Frio está para quente assim como escuro está para…", "claro", ["noite", "sombra", "cinza"], "São opostos.", 1],
  ["Pé está para sapato assim como mão está para…", "luva", ["anel", "braço", "dedo"], "É o que veste a parte do corpo.", 1],
  ["Livro está para ler assim como música está para…", "ouvir", ["cantar", "tocar", "nota"], "É o uso principal de cada coisa.", 1],
  ["Semente está para árvore assim como ovo está para…", "pássaro", ["ninho", "casca", "gema"], "O primeiro dá origem ao segundo.", 2],
  ["Médico está para hospital assim como professor está para…", "escola", ["aluno", "aula", "livro"], "É o lugar onde a pessoa trabalha.", 2],
  ["Sede está para água assim como cansaço está para…", "descanso", ["sono", "trabalho", "cama"], "É o que satisfaz a necessidade.", 2],
  ["Pincel está para pintor assim como bisturi está para…", "cirurgião", ["hospital", "corte", "enfermeiro"], "É a ferramenta do profissional.", 2],
  ["Gota está para oceano assim como grão está para…", "deserto", ["areia", "praia", "pedra"], "Uma unidade mínima e o todo imenso que ela forma.", 3],
  ["Prólogo está para livro assim como prelúdio está para…", "sinfonia", ["piano", "nota", "final"], "É a parte que abre a obra.", 3],
  ["Termômetro está para temperatura assim como balança está para…", "massa", ["peso corporal", "equilíbrio", "comida"], "É a grandeza que o instrumento mede.", 3],
  ["Covarde está para coragem assim como avarento está para…", "generosidade", ["dinheiro", "riqueza", "economia"], "É a virtude que falta a quem tem o defeito.", 3],
  ["Erosão está para rocha assim como ferrugem está para…", "ferro", ["água", "tempo", "laranja"], "Um processo lento que desgasta o material.", 4],
  ["Hipótese está para teoria assim como rascunho está para…", "texto final", ["caneta", "ideia", "erro"], "A versão inicial que, testada e refinada, vira a definitiva.", 4],
  ["Efêmero está para duradouro assim como trivial está para…", "essencial", ["simples", "comum", "rápido"], "São antônimos.", 4],
  ["Arquipélago está para ilha assim como constelação está para…", "estrela", ["céu", "galáxia", "planeta"], "O conjunto e o elemento que o forma.", 4],
  ["Premissa está para conclusão assim como causa está para…", "efeito", ["motivo", "razão", "origem"], "A segunda decorre da primeira.", 5],
  ["Anacronismo está para tempo assim como incongruência está para…", "coerência", ["época", "erro", "lugar"], "É a quebra do que deveria se encaixar.", 5],
  ["Paradoxo está para lógica assim como dissonância está para…", "harmonia", ["música", "som", "ruído"], "Algo que parece violar a ordem do próprio sistema.", 5],
  ["Catalisador está para reação assim como mentor está para…", "aprendizado", ["aluno", "professor", "escola"], "Acelera o processo sem ser consumido por ele.", 5],
];
export function analogia(seed: number, d: number): Item {
  const r = rng(seed), pool = ANALOGIAS.filter((x) => Math.abs(x[4] - d) <= 0), list = pool.length ? pool : ANALOGIAS;
  const [q, right, wrong, why, dd] = list[Math.floor(r() * list.length)];
  const o = withOpts(r, right, wrong, (a, b) => a === b);
  return { kind: "analogia", domain: "verbal", d: dd, q, opts: o.opts, answer: o.answer, why };
}

export function memoria(seed: number, d: number): Item {
  const r = rng(seed), len = 3 + d, reverse = d >= 3;
  const digits = Array.from({ length: len }, () => int(r, 0, 9));
  return { kind: "memoria", domain: "memoria", d, digits, reverse, why: reverse ? "Dica: agrupe em blocos de 2–3 e leia de trás pra frente na cabeça." : "Dica: repita baixinho em blocos de 3, como um telefone." };
}
export const make = (domain: Domain, seed: number, d: number): Item =>
  domain === "numerico" ? serie(seed, d) : domain === "logico" ? matriz(seed, d) : domain === "verbal" ? analogia(seed, d) : memoria(seed, d);
export const correctMemory = (it: Extract<Item, { kind: "memoria" }>, typed: string) =>
  typed.replace(/\D/g, "") === (it.reverse ? [...it.digits].reverse() : it.digits).join("");

/** Escada adaptativa: acertou sobe, errou desce (1–5). */
export const nextLevel = (d: number, ok: boolean) => Math.max(1, Math.min(5, d + (ok ? 1 : -1)));
/** Habilidade por área: média de (dificuldade ± 0,5) das respostas. */
export function ability(ans: { domain: Domain; d: number; ok: boolean }[]) {
  const out = {} as Record<Domain, number | null>;
  for (const k of Object.keys(DOMAINS) as Domain[]) { const l = ans.filter((a) => a.domain === k); out[k] = l.length ? l.reduce((s, a) => s + a.d + (a.ok ? 0.5 : -0.5), 0) / l.length : null; }
  return out;
}
/** Índice estimado (70–145, média 100): só uma escala de acompanhamento, não QI clínico. */
export function indexOf(ab: Record<Domain, number | null>) {
  const v = Object.values(ab).filter((x): x is number => x != null);
  if (!v.length) return null;
  const th = v.reduce((a, b) => a + b, 0) / v.length;
  return Math.max(70, Math.min(145, Math.round(100 + 15 * ((th - 3) / 1.2))));
}
export const domainIndex = (x: number | null) => (x == null ? null : Math.max(70, Math.min(145, Math.round(100 + 15 * ((x - 3) / 1.2)))));
/** XP de uma sessão: esforço e acertos contam; o teste completo vale mais. */
export const mindXp = (kind: "teste" | "treino", correct: number, total: number) => (kind === "teste" ? 80 : 25) + correct * 5 + (total && correct === total ? 20 : 0);
