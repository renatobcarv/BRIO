import { cleanXpByDay } from "./clean.ts";
// Progressão do BRIO: XP e conquistas calculados só a partir de registros reais. Sem dependências.

export const ATTRS = {
  forca: { label: "Força", color: "#30d158", hint: "Volume de treino e recordes" },
  vigor: { label: "Vigor", color: "#0a84ff", hint: "Água, sono e cardio" },
  sabedoria: { label: "Sabedoria", color: "#ffb340", hint: "Estudo, Bíblia e livros" },
  servico: { label: "Serviço", color: "#409cff", hint: "Horas de pioneiro" },
  disciplina: { label: "Disciplina", color: "#bf5af2", hint: "Checklist e dias completos" },
  ordem: { label: "Ordem", color: "#3ee6c1", hint: "Finanças em dia" },
} as const;
export type Attr = keyof typeof ATTRS;

/** ASCENSION — The Path of Mastery. Mesmos níveis e XP; só a identidade das faixas. */
export const RANKS = [
  { min: 1, name: "Initiate", pt: "O despertar", color: "#9ea3aa", metal: "silver", meaning: "Aquele que decidiu começar. Rompe a inércia e assume a decisão de mudar sua trajetória.", motto: "Everything begins with a decision." },
  { min: 3, name: "Awakened", pt: "A consciência", color: "#bfc3c9", metal: "silver", meaning: "Despertou para o próprio potencial e compreendeu que suas escolhas moldam seu futuro.", motto: "Awareness precedes transformation." },
  { min: 6, name: "Vanguard", pt: "A iniciativa", color: "#d6d9de", metal: "silver", meaning: "Avança primeiro. Não espera condições perfeitas e aprende a agir diante da incerteza.", motto: "Advance when others hesitate." },
  { min: 10, name: "Warrior", pt: "A resistência", color: "#c93a3a", metal: "red", meaning: "Desenvolveu disciplina, resiliência e autocontrole. Vencer a si mesmo é uma das maiores conquistas.", motto: "Discipline conquers impulse." },
  { min: 15, name: "Elite", pt: "A excelência", color: "#d24545", metal: "red", meaning: "Transformou consistência em padrão. Não depende de motivação para cumprir suas responsabilidades.", motto: "Excellence is never an accident." },
  { min: 21, name: "Sentinel", pt: "A proteção", color: "#e05252", metal: "red", meaning: "Protege o que construiu: seus princípios, sua saúde, seus relacionamentos e suas responsabilidades.", motto: "Protect what matters." },
  { min: 28, name: "Commander", pt: "O domínio", color: "#c6a15b", metal: "gold", meaning: "Aprendeu a comandar a si mesmo. Visão estratégica, responsabilidade e liderança pessoal.", motto: "First, master yourself." },
  { min: 36, name: "Sovereign", pt: "A soberania", color: "#d4af6a", metal: "gold", meaning: "Governa a própria existência. Constrói autonomia e não vive refém de impulsos ou de aprovação externa.", motto: "Be sovereign over your choices." },
  { min: 45, name: "Ascendant", pt: "A transcendência", color: "#e0bd78", metal: "gold", meaning: "Ultrapassa os próprios limites, supera suas versões anteriores e amplia sua capacidade de contribuir.", motto: "Rise beyond who you were." },
  { min: 55, name: "Apex", pt: "O ápice", color: "#f0cf86", metal: "gold", meaning: "A integração entre capacidade, caráter, disciplina e propósito. Não é perfeição nem o fim da evolução: é o nível mais alto conquistado até aqui.", motto: "Build something greater than yourself." },
] as const;
export type Rank = (typeof RANKS)[number];
export const rankIndex = (level: number) => RANKS.reduce((i, r, k) => (level >= r.min ? k : i), 0);
export const ASCENSION_CREED = "You are not competing against others. You are building someone you can respect.";

/** Títulos extraordinários: concedidos por conquistas que já existem. */
export const TITLES = [
  { id: "phoenix", name: "Phoenix", color: "#e2572b", meaning: "Reconstrução e renascimento: transformar uma queda em recomeço.", requires: ["assuma"], rule: "Chegue a 30 dias limpos depois de um recomeço honesto." },
  { id: "titan", name: "Titan", color: "#bfc3c9", meaning: "Força monumental e capacidade de sustentar grandes responsabilidades. Inspirado nos Titãs da mitologia grega.", requires: ["total600", "treino200"], rule: "Some 600 kg nos três levantamentos ou registre 200 treinos." },
  { id: "archon", name: "Archon", color: "#c6a15b", meaning: "Liderança, sabedoria e autoridade. Do grego árkhōn, aquele que governa.", requires: ["biblia", "livro50"], rule: "Leia a Bíblia inteira ou conclua 50 livros." },
] as const;

/** XP total para chegar ao nível n (nível 1 = 0). Cresce de forma quadrática. */
export const xpForLevel = (n: number) => 50 * (n - 1) * n;
export function levelOf(xp: number) {
  let n = 1; while (xpForLevel(n + 1) <= xp) n++;
  const base = xpForLevel(n), next = xpForLevel(n + 1);
  return { level: n, into: xp - base, need: next - base, progress: (xp - base) / (next - base) };
}
export const rankOf = (level: number): Rank => RANKS[rankIndex(level)];
/** Valor do atributo (1–99) a partir do XP dele. */
export const attrValue = (xp: number) => Math.min(99, Math.max(1, Math.floor(Math.sqrt(xp / 10))));

export type GameInput = {
  today: string;
  checks: { date: string }[];                 // um por item feito
  fullDays: string[];                         // dias 100%
  study: { date: string; minutes: number }[];
  chapters: { date: string }[];
  pioneer: { date: string; minutes: number }[];
  workouts: { date: string; sets: { exercise: string; kg: number; reps: number }[]; cardio: boolean }[];
  waterDays: { date: string; ml: number }[]; waterGoal: number;
  sleep: { date: string; hours: number }[];
  readingPages: { date: string; pages: number }[];
  booksFinished: { date: string; title: string }[];
  finance: { month: string; logged: number; income: number; expenses: number }[];
  weights: { date: string; kg: number }[];
  cleanDays?: string[];
  relapses?: string[];
  morningDays?: string[];        // missão principal concluída antes das 7h
  journalCount?: number;
  weightGoal?: number;
  meals?: { date: string; slots: number; protein: number }[];
  proteinGoal?: number;
  eventBonus?: { date: string; xp: number; label: string; attr: Attr }[];
};
export type XpEvent = { date: string; attr: Attr; xp: number; label: string };

const TIMED = /cardio|bike|bicicleta|caminhada|corrida|esteira|el[ií]ptico|mobilidade|alongamento|remo erg|escada/i;
const MAIN = [{ key: "agachamento", re: /agach|squat/i }, { key: "supino", re: /^supino(?! incl| decl)|bench/i }, { key: "terra", re: /terra|deadlift/i }];

/** Converte registros em eventos de XP (regras simples e transparentes). */
export function xpEvents(g: GameInput): XpEvent[] {
  const ev: XpEvent[] = [];
  const byDate = new Map<string, number>();
  for (const c of g.checks) byDate.set(c.date, (byDate.get(c.date) ?? 0) + 1);
  for (const [date, n] of byDate) ev.push({ date, attr: "disciplina", xp: n * 10, label: `${n} itens do checklist` });
  for (const c of cleanXpByDay(g.cleanDays ?? [], g.relapses ?? [])) ev.push({ date: c.date, attr: "disciplina", xp: c.xp, label: `Dia limpo · ${c.day}º seguido` });
  for (const d of g.fullDays) ev.push({ date: d, attr: "disciplina", xp: 50, label: "Dia 100% completo" });
  for (const s of g.study) if (s.minutes > 0) ev.push({ date: s.date, attr: "sabedoria", xp: Math.min(s.minutes, 180), label: `${s.minutes} min de estudo` });
  for (const c of g.chapters) ev.push({ date: c.date, attr: "sabedoria", xp: 15, label: "Capítulo da Bíblia" });
  for (const r of g.readingPages) if (r.pages > 0) ev.push({ date: r.date, attr: "sabedoria", xp: Math.min(150, Math.round(r.pages / 2)), label: `${r.pages} páginas lidas` });
  for (const b of g.booksFinished) ev.push({ date: b.date, attr: "sabedoria", xp: 150, label: `Livro concluído: ${b.title}` });
  for (const p of g.pioneer) ev.push({ date: p.date, attr: "servico", xp: Math.round(p.minutes / 2), label: `${Math.floor(p.minutes / 60)}h${String(p.minutes % 60).padStart(2, "0")} de serviço` });
  // Força: volume (1 XP a cada 100 kg movimentados, até 300 por sessão) + recordes nos levantamentos principais.
  const best: Record<string, number> = {};
  for (const w of [...g.workouts].sort((a, b) => a.date.localeCompare(b.date))) {
    const vol = w.sets.filter((s) => !TIMED.test(s.exercise)).reduce((a, s) => a + s.kg * s.reps, 0);
    if (vol > 0) ev.push({ date: w.date, attr: "forca", xp: Math.min(300, Math.round(vol / 100)), label: `Treino · ${Math.round(vol).toLocaleString("pt-BR")} kg de volume` });
    if (w.cardio) ev.push({ date: w.date, attr: "vigor", xp: 30, label: "Cardio" });
    for (const m of MAIN) {
      const top = Math.max(0, ...w.sets.filter((s) => m.re.test(s.exercise) && !/stiff|romeno|halter/i.test(s.exercise) && s.reps > 0).map((s) => s.kg));
      if (top > 0 && best[m.key] != null && top > best[m.key]) ev.push({ date: w.date, attr: "forca", xp: 100, label: `Recorde no ${m.key}: ${top} kg` });
      if (top > 0) best[m.key] = Math.max(best[m.key] ?? 0, top);
    }
  }
  for (const w of g.waterDays) if (g.waterGoal > 0 && w.ml >= g.waterGoal) ev.push({ date: w.date, attr: "vigor", xp: 20, label: "Meta de água" });
  for (const m of g.meals ?? []) {
    if (m.slots > 0) ev.push({ date: m.date, attr: "vigor", xp: Math.min(5, m.slots) * 10, label: `${m.slots} refeições registradas` });
    if (g.proteinGoal && m.protein >= g.proteinGoal) ev.push({ date: m.date, attr: "vigor", xp: 25, label: "Meta de proteína" });
  }
  for (const b of g.eventBonus ?? []) ev.push({ date: b.date, attr: b.attr, xp: b.xp, label: b.label });
  for (const s of g.sleep) if (s.hours >= 7) ev.push({ date: s.date, attr: "vigor", xp: 15, label: `${s.hours}h de sono` });
  for (const f of g.finance) {
    if (f.logged > 0) ev.push({ date: f.month, attr: "ordem", xp: Math.min(150, f.logged * 5), label: `${f.logged} lançamentos no mês` });
    if (f.month < g.today.slice(0, 7) + "-01" && f.income > 0 && (f.income - f.expenses) / f.income >= 0.1) ev.push({ date: f.month, attr: "ordem", xp: 150, label: "Mês fechado com 10%+ de sobra" });
  }
  return ev;
}

export const RARITY = {
  comum: { label: "Comum", color: "#8e8e93" }, rara: { label: "Rara", color: "#0a84ff" },
  epica: { label: "Épica", color: "#bf5af2" }, lendaria: { label: "Lendária", color: "#ffb340" },
} as const;
export type Rarity = keyof typeof RARITY;
export type Achievement = { id: string; title: string; desc: string; source?: string; attr: Attr; rarity: Rarity; done: boolean; progress: number; value: number; target: number };

const dayBefore = (d: string) => new Date(Date.parse(d + "T12:00:00Z") - 864e5).toISOString().slice(0, 10);
/** Maior sequência de dias consecutivos num conjunto de datas. */
export function longestRun(dates: string[]) { let b = 0, r = 0, last = ""; for (const d of [...new Set(dates)].sort()) { r = last && dayBefore(d) === last ? r + 1 : 1; b = Math.max(b, r); last = d; } return b; }
/** "Nunca falhe duas vezes": maior trecho (em dias) sem dois dias seguidos em branco. */
export function neverTwiceRun(active: string[], today: string) {
  const set = new Set(active); if (!set.size) return 0;
  let d = [...set].sort()[0], best = 0, run = 0, misses = 0;
  while (d <= today) { if (set.has(d)) { misses = 0; run++; } else { misses++; if (misses >= 2) { run = 0; } else run++; } best = Math.max(best, run); d = new Date(Date.parse(d + "T12:00:00Z") + 864e5).toISOString().slice(0, 10); }
  return best;
}

export function achievements(g: GameInput): Achievement[] {
  const pioneerByMonth = new Map<string, number>();
  for (const p of g.pioneer) pioneerByMonth.set(p.date.slice(0, 7), (pioneerByMonth.get(p.date.slice(0, 7)) ?? 0) + p.minutes);
  const pioneerDaysByMonth = new Map<string, Set<string>>();
  for (const p of g.pioneer) { const k = p.date.slice(0, 7); if (!pioneerDaysByMonth.has(k)) pioneerDaysByMonth.set(k, new Set()); pioneerDaysByMonth.get(k)!.add(p.date); }
  const bestMonth = Math.max(0, ...pioneerByMonth.values()) / 60;
  const months50 = [...pioneerByMonth.values()].filter((m) => m >= 3000).length;
  const sets = g.workouts.flatMap((w) => w.sets);
  const top = (re: RegExp) => Math.max(0, ...sets.filter((s) => re.test(s.exercise) && !/stiff|romeno|halter|incl/i.test(s.exercise) && s.reps > 0).map((s) => s.kg));
  const total = top(/agach|squat/i) + top(/^supino|bench/i) + top(/terra|deadlift/i);
  const prs = xpEvents(g).filter((e) => e.label.startsWith("Recorde")).length;
  const vols = g.workouts.map((w) => w.sets.filter((s) => !TIMED.test(s.exercise)).reduce((a, s) => a + s.kg * s.reps, 0)).filter((v) => v > 0);
  const avgVol = vols.length ? vols.reduce((a, b) => a + b, 0) / vols.length : 0;
  const beastSessions = vols.length >= 5 ? vols.filter((v) => v >= avgVol * 1.5).length : 0;
  const fullRun = longestRun(g.fullDays);
  const activeDays = [...new Set([...g.checks.map((c) => c.date)])];
  const studyDays = new Set(g.study.map((s) => s.date)).size;
  const deep = g.study.filter((s) => s.minutes >= 90).length;
  const primaryDays = (() => { const m = new Map<string, number>(); for (const c of g.checks) m.set(c.date, (m.get(c.date) ?? 0) + 1); return [...m.keys()]; })();
  const bibleRun = longestRun(g.chapters.map((c) => c.date));
  const cleanRun = longestRun(g.cleanDays ?? []);
  const comeback = (() => { const r = [...(g.relapses ?? [])].sort().at(0); if (!r) return 0; return longestRun((g.cleanDays ?? []).filter((d) => d > r)); })();
  const saved10 = g.finance.filter((f) => f.income > 0 && (f.income - f.expenses) / f.income >= 0.1).length;
  const lost = g.weights.length ? Math.max(0, Math.max(...g.weights.map((w) => w.kg)) - g.weights.at(-1)!.kg) : 0;
  const atGoal = g.weightGoal && g.weights.length ? (g.weights.at(-1)!.kg <= g.weightGoal ? 1 : 0) : 0;
  const bigReadDays = g.readingPages.filter((r) => r.pages >= 50).length;
  const sleep30 = g.sleep.filter((s) => s.hours >= 7).length;
  const water = g.waterDays.filter((w) => w.ml >= g.waterGoal).length;
  const totalXp = xpEvents(g).reduce((s, e) => s + e.xp, 0);
  const a = (id: string, title: string, desc: string, attr: Attr, rarity: Rarity, value: number, target: number, source?: string): Achievement =>
    ({ id, title, desc, attr, rarity, source, value, target, done: value >= target, progress: Math.min(1, value / target) });
  return [
    // Disciplina
    a("dia1", "Primeiro passo", "Complete todas as missões de um dia", "disciplina", "comum", g.fullDays.length, 1),
    a("seq7", "Semana firme", "7 dias seguidos 100%", "disciplina", "rara", fullRun, 7),
    a("seq30", "Mês inabalável", "30 dias seguidos 100%", "disciplina", "epica", fullRun, 30),
    a("nunca2", "Nunca falhe duas vezes", "30 dias sem dois dias seguidos em branco", "disciplina", "rara", neverTwiceRun(activeDays, g.today), 30, "Hábitos Atômicos"),
    a("66dias", "66 dias", "Cumpra missões em 66 dias diferentes: o tempo médio para um hábito se firmar", "disciplina", "epica", primaryDays.length, 66, "Hábitos Atômicos"),
    a("manha", "Antes do sol", "Missão principal feita antes das 7h em 30 dias", "disciplina", "epica", (g.morningDays ?? []).length, 30, "O Milagre da Manhã"),
    a("limpo7", "Sete dias limpos", "7 dias limpos seguidos", "disciplina", "comum", cleanRun, 7),
    a("limpo30", "Trinta dias limpos", "30 dias limpos seguidos", "disciplina", "rara", cleanRun, 30),
    a("limpo90", "Reinício completo", "90 dias limpos seguidos", "disciplina", "epica", cleanRun, 90),
    a("limpo365", "Um ano livre", "365 dias limpos seguidos", "disciplina", "lendaria", cleanRun, 365),
    a("assuma", "Assuma e volte", "Depois de um recomeço honesto, chegue a 30 dias limpos de novo", "disciplina", "epica", comeback, 30, "Liderança Extrema"),
    a("composto", "Efeito composto", "Acumule 50.000 XP", "disciplina", "lendaria", totalXp, 50000, "O Efeito Composto"),
    // Sabedoria
    a("formiga", "Como a formiga", "Leia a Bíblia 30 dias seguidos", "sabedoria", "rara", bibleRun, 30, "Provérbios 6:6"),
    a("biblia100", "Cem capítulos", "Leia 100 capítulos da Bíblia", "sabedoria", "comum", g.chapters.length, 100),
    a("biblia", "A Bíblia inteira", "Leia os 1.189 capítulos", "sabedoria", "lendaria", g.chapters.length, 1189),
    a("estudo30", "Raiz profunda", "Estude em 30 dias diferentes", "sabedoria", "rara", studyDays, 30),
    a("deep", "Trabalho focado", "10 estudos de 90 minutos ou mais", "sabedoria", "epica", deep, 10, "Trabalho Focado"),
    a("diario", "Diário estoico", "Escreva 30 entradas no diário", "sabedoria", "rara", g.journalCount ?? 0, 30, "Meditações"),
    a("livro1", "Leitor", "Termine um livro", "sabedoria", "comum", g.booksFinished.length, 1),
    a("livro12", "Um por mês", "Termine 12 livros", "sabedoria", "epica", g.booksFinished.length, 12),
    a("livro50", "Biblioteca viva", "Termine 50 livros", "sabedoria", "lendaria", g.booksFinished.length, 50),
    a("maratona", "Maratona de páginas", "Leia 50 páginas ou mais num dia, 5 vezes", "sabedoria", "rara", bigReadDays, 5),
    // Serviço
    a("campo50", "Mês pleno", "50 horas de serviço num mês", "servico", "rara", bestMonth, 50),
    a("campo20d", "Sem dia parado", "Saia ao campo em 20 dias de um mesmo mês", "servico", "epica", Math.max(0, ...[...pioneerDaysByMonth.values()].map((s) => s.size)), 20),
    a("campo12", "Ano de zelo", "12 meses com 50 horas ou mais", "servico", "lendaria", months50, 12),
    a("campo600", "Seiscentas horas", "600 horas no total", "servico", "epica", g.pioneer.reduce((s, p) => s + p.minutes, 0) / 60, 600),
    // Força
    a("treino50", "Cinquenta sessões", "Registre 50 treinos", "forca", "rara", g.workouts.length, 50),
    a("treino200", "Ferro diário", "Registre 200 treinos", "forca", "epica", g.workouts.length, 200),
    a("biscoitos", "Pote de biscoitos", "Acumule 10 recordes para lembrar nos dias duros", "forca", "epica", prs, 10, "Nada Pode Me Ferir"),
    a("40", "A regra dos 40%", "5 sessões com volume 50% acima da sua média", "forca", "rara", beastSessions, 5, "Nada Pode Me Ferir"),
    a("total400", "Total 400", "Agachamento + supino + terra somando 400 kg", "forca", "rara", total, 400),
    a("total500", "Total 500", "Somando 500 kg nos três levantamentos", "forca", "epica", total, 500),
    a("total600", "Clube dos 600", "Somando 600 kg nos três levantamentos", "forca", "lendaria", total, 600),
    // Vigor
    a("proteina30", "Construtor", "Bata a meta de proteína em 30 dias", "vigor", "rara", (g.meals ?? []).filter((m) => g.proteinGoal && m.protein >= g.proteinGoal).length, 30),
    a("agua30", "Bem hidratado", "Meta de água em 30 dias", "vigor", "comum", water, 30),
    a("agua100", "Fonte constante", "Meta de água em 100 dias", "vigor", "rara", water, 100),
    a("sono30", "Guardião do sono", "30 noites com 7h ou mais", "vigor", "rara", sleep30, 30, "Por Que Nós Dormimos"),
    a("peso5", "Cinco a menos", "Perca 5 kg desde o maior registro", "vigor", "rara", lost, 5),
    a("pesometa", "Na meta", "Chegue ao seu peso-alvo", "vigor", "epica", atGoal, 1),
    // Ordem
    a("sobra3", "Mordomo fiel", "3 meses com 10%+ de sobra", "ordem", "comum", saved10, 3),
    a("babilonia", "Pague-se primeiro", "6 meses guardando 10% ou mais da renda", "ordem", "epica", saved10, 6, "O Homem Mais Rico da Babilônia"),
    a("babilonia12", "Ouro que trabalha", "12 meses guardando 10% ou mais", "ordem", "lendaria", saved10, 12, "O Homem Mais Rico da Babilônia"),
  ];
}

export function summarize(g: GameInput) {
  const ev = xpEvents(g);
  const total = ev.reduce((s, e) => s + e.xp, 0);
  const attrXp = Object.fromEntries((Object.keys(ATTRS) as Attr[]).map((k) => [k, ev.filter((e) => e.attr === k).reduce((s, e) => s + e.xp, 0)])) as Record<Attr, number>;
  const lv = levelOf(total);
  const today = ev.filter((e) => e.date === g.today).reduce((s, e) => s + e.xp, 0);
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(Date.parse(g.today) - (6 - i) * 864e5).toISOString().slice(0, 10); return { date: d, xp: ev.filter((e) => e.date === d).reduce((s, e) => s + e.xp, 0) }; });
  return { total, ...lv, rank: rankOf(lv.level), attrXp, attrs: Object.fromEntries((Object.keys(attrXp) as Attr[]).map((k) => [k, attrValue(attrXp[k])])) as Record<Attr, number>,
    today, week, recent: [...ev].sort((a, b) => b.date.localeCompare(a.date) || b.xp - a.xp).slice(0, 12), achievements: achievements(g),
    titles: (() => { const done = new Set(achievements(g).filter((a) => a.done).map((a) => a.id)); return TITLES.map((t) => ({ id: t.id, earned: t.requires.some((r) => done.has(r)) })); })() };
}
