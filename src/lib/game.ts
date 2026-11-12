// Progressão do BRIO: XP e conquistas calculados só a partir de registros reais. Sem dependências.

export const ATTRS = {
  forca: { label: "Força", color: "#8ac295", hint: "Volume de treino e recordes" },
  vigor: { label: "Vigor", color: "#84aed4", hint: "Água, sono e cardio" },
  sabedoria: { label: "Sabedoria", color: "#e0ac53", hint: "Estudo, Bíblia e livros" },
  servico: { label: "Serviço", color: "#7fb3e0", hint: "Horas de pioneiro" },
  disciplina: { label: "Disciplina", color: "#ac8fd6", hint: "Checklist e dias completos" },
  ordem: { label: "Ordem", color: "#d9c49a", hint: "Finanças em dia" },
} as const;
export type Attr = keyof typeof ATTRS;

export const RANKS = [
  { min: 1, name: "Iniciante", color: "#9a978f" }, { min: 5, name: "Constante", color: "#84aed4" },
  { min: 10, name: "Firme", color: "#8ac295" }, { min: 20, name: "Forte", color: "#e0ac53" },
  { min: 35, name: "Inabalável", color: "#e8a39a" }, { min: 50, name: "Lendário", color: "#f3d48a" },
] as const;

/** XP total para chegar ao nível n (nível 1 = 0). Cresce de forma quadrática. */
export const xpForLevel = (n: number) => 50 * (n - 1) * n;
export function levelOf(xp: number) {
  let n = 1; while (xpForLevel(n + 1) <= xp) n++;
  const base = xpForLevel(n), next = xpForLevel(n + 1);
  return { level: n, into: xp - base, need: next - base, progress: (xp - base) / (next - base) };
}
export const rankOf = (level: number) => [...RANKS].reverse().find((r) => level >= r.min)!;
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
};
export type XpEvent = { date: string; attr: Attr; xp: number; label: string };

const MAIN = [{ key: "agachamento", re: /agach|squat/i }, { key: "supino", re: /^supino(?! incl| decl)|bench/i }, { key: "terra", re: /terra|deadlift/i }];

/** Converte registros em eventos de XP (regras simples e transparentes). */
export function xpEvents(g: GameInput): XpEvent[] {
  const ev: XpEvent[] = [];
  const byDate = new Map<string, number>();
  for (const c of g.checks) byDate.set(c.date, (byDate.get(c.date) ?? 0) + 1);
  for (const [date, n] of byDate) ev.push({ date, attr: "disciplina", xp: n * 10, label: `${n} itens do checklist` });
  for (const d of g.fullDays) ev.push({ date: d, attr: "disciplina", xp: 50, label: "Dia 100% completo" });
  for (const s of g.study) if (s.minutes > 0) ev.push({ date: s.date, attr: "sabedoria", xp: Math.min(s.minutes, 180), label: `${s.minutes} min de estudo` });
  for (const c of g.chapters) ev.push({ date: c.date, attr: "sabedoria", xp: 15, label: "Capítulo da Bíblia" });
  for (const r of g.readingPages) if (r.pages > 0) ev.push({ date: r.date, attr: "sabedoria", xp: Math.min(150, Math.round(r.pages / 2)), label: `${r.pages} páginas lidas` });
  for (const b of g.booksFinished) ev.push({ date: b.date, attr: "sabedoria", xp: 150, label: `Livro concluído: ${b.title}` });
  for (const p of g.pioneer) ev.push({ date: p.date, attr: "servico", xp: Math.round(p.minutes / 2), label: `${Math.floor(p.minutes / 60)}h${String(p.minutes % 60).padStart(2, "0")} de serviço` });
  // Força: volume (1 XP a cada 100 kg movimentados, até 300 por sessão) + recordes nos levantamentos principais.
  const best: Record<string, number> = {};
  for (const w of [...g.workouts].sort((a, b) => a.date.localeCompare(b.date))) {
    const vol = w.sets.reduce((a, s) => a + s.kg * s.reps, 0);
    if (vol > 0) ev.push({ date: w.date, attr: "forca", xp: Math.min(300, Math.round(vol / 100)), label: `Treino · ${Math.round(vol).toLocaleString("pt-BR")} kg de volume` });
    if (w.cardio) ev.push({ date: w.date, attr: "vigor", xp: 30, label: "Cardio" });
    for (const m of MAIN) {
      const top = Math.max(0, ...w.sets.filter((s) => m.re.test(s.exercise) && !/stiff|romeno|halter/i.test(s.exercise) && s.reps > 0).map((s) => s.kg));
      if (top > 0 && best[m.key] != null && top > best[m.key]) ev.push({ date: w.date, attr: "forca", xp: 100, label: `Recorde no ${m.key}: ${top} kg` });
      if (top > 0) best[m.key] = Math.max(best[m.key] ?? 0, top);
    }
  }
  for (const w of g.waterDays) if (g.waterGoal > 0 && w.ml >= g.waterGoal) ev.push({ date: w.date, attr: "vigor", xp: 20, label: "Meta de água" });
  for (const s of g.sleep) if (s.hours >= 7) ev.push({ date: s.date, attr: "vigor", xp: 15, label: `${s.hours}h de sono` });
  for (const f of g.finance) {
    if (f.logged > 0) ev.push({ date: f.month, attr: "ordem", xp: Math.min(150, f.logged * 5), label: `${f.logged} lançamentos no mês` });
    if (f.month < g.today.slice(0, 7) + "-01" && f.income > 0 && (f.income - f.expenses) / f.income >= 0.1) ev.push({ date: f.month, attr: "ordem", xp: 150, label: "Mês fechado com 10%+ de sobra" });
  }
  return ev;
}

export type Achievement = { id: string; title: string; desc: string; attr: Attr; done: boolean; progress: number };

export function achievements(g: GameInput): Achievement[] {
  const pioneerByMonth = new Map<string, number>();
  for (const p of g.pioneer) pioneerByMonth.set(p.date.slice(0, 7), (pioneerByMonth.get(p.date.slice(0, 7)) ?? 0) + p.minutes);
  const bestMonth = Math.max(0, ...pioneerByMonth.values());
  const sets = g.workouts.flatMap((w) => w.sets);
  const top = (re: RegExp) => Math.max(0, ...sets.filter((s) => re.test(s.exercise) && !/stiff|romeno|halter|incl/i.test(s.exercise) && s.reps > 0).map((s) => s.kg));
  const total = top(/agach|squat/i) + top(/^supino|bench/i) + top(/terra|deadlift/i);
  const streak = (() => { const set = new Set(g.fullDays); let best = 0, cur = 0; for (const d of [...set].sort()) { const prev = new Date(Date.parse(d) - 864e5).toISOString().slice(0, 10); cur = set.has(prev) ? cur + 1 : 1; best = Math.max(best, cur); } return best; })();
  const studyDays = new Set(g.study.map((s) => s.date)).size;
  const lost = g.weights.length ? Math.max(0, Math.max(...g.weights.map((w) => w.kg)) - g.weights.at(-1)!.kg) : 0;
  const a = (id: string, title: string, desc: string, attr: Attr, value: number, target: number): Achievement => ({ id, title, desc, attr, done: value >= target, progress: Math.min(1, value / target) });
  return [
    a("dia1", "Primeiro passo", "Complete um dia inteiro do checklist", "disciplina", g.fullDays.length, 1),
    a("seq7", "Semana firme", "7 dias seguidos 100%", "disciplina", streak, 7),
    a("seq30", "Mês inabalável", "30 dias seguidos 100%", "disciplina", streak, 30),
    a("estudo30", "Raiz profunda", "Estude em 30 dias diferentes", "sabedoria", studyDays, 30),
    a("biblia100", "Cem capítulos", "Leia 100 capítulos da Bíblia", "sabedoria", g.chapters.length, 100),
    a("biblia", "A Bíblia inteira", "Leia os 1.189 capítulos", "sabedoria", g.chapters.length, 1189),
    a("livro1", "Leitor", "Termine um livro", "sabedoria", g.booksFinished.length, 1),
    a("livro12", "Biblioteca viva", "Termine 12 livros", "sabedoria", g.booksFinished.length, 12),
    a("campo50", "Mês pleno", "50 horas de serviço num mês", "servico", bestMonth / 60, 50),
    a("campo600", "Ano de serviço", "600 horas no total", "servico", g.pioneer.reduce((s, p) => s + p.minutes, 0) / 60, 600),
    a("treino50", "Cinquenta sessões", "Registre 50 treinos", "forca", g.workouts.length, 50),
    a("total400", "Total 400", "Agachamento + supino + terra somando 400 kg", "forca", total, 400),
    a("total500", "Total 500", "Somando 500 kg nos três levantamentos", "forca", total, 500),
    a("agua30", "Bem hidratado", "Bata a meta de água em 30 dias", "vigor", g.waterDays.filter((w) => w.ml >= g.waterGoal).length, 30),
    a("peso5", "Cinco a menos", "Perca 5 kg desde o maior registro", "vigor", lost, 5),
    a("sobra3", "Mordomo fiel", "3 meses com 10%+ de sobra", "ordem", g.finance.filter((f) => f.income > 0 && (f.income - f.expenses) / f.income >= 0.1).length, 3),
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
    today, week, recent: [...ev].sort((a, b) => b.date.localeCompare(a.date) || b.xp - a.xp).slice(0, 12), achievements: achievements(g) };
}
