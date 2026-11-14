// ASCENSION Training System: atributos físicos, medalhas, análises e revisão semanal.
// Tudo calculado a partir dos registros reais. Sem dependências além do núcleo de treino.
import { guessMuscle, MUSCLES, type Muscle } from "./training.ts";

export type WSet = { exercise: string; kg: number; reps: number; rpe?: number | null };
export type WSession = { date: string; sets: WSet[]; duration_min?: number | null; week_no?: number | null };

const DAY = 86_400_000;
const D = (iso: string) => Date.parse(iso + "T12:00:00Z");
const daysAgo = (today: string, iso: string) => Math.round((D(today) - D(iso)) / DAY);
const TIMED = /cardio|bike|bicicleta|caminhada|corrida|esteira|el[ií]ptico|mobilidade|alongamento|remo erg|escada|yoga/i;
const MOBILITY = /mobilidade|alongamento|yoga|flexibilidade/i;
const MAIN = [/agach|squat/i, /^supino(?! incl| decl)|bench/i, /terra|deadlift/i];
export const e1rm = (kg: number, reps: number) => (reps <= 0 ? 0 : reps === 1 ? kg : kg * (1 + Math.min(reps, 12) / 30));
const clamp = (v: number) => Math.max(0, Math.min(99, Math.round(v)));
const isStrength = (s: WSet) => !TIMED.test(s.exercise) && s.kg > 0 && s.reps > 0;
const volumeOf = (w: WSession) => w.sets.filter(isStrength).reduce((a, s) => a + s.kg * s.reps, 0);
const cardioMin = (w: WSession, re = TIMED) => w.sets.filter((s) => re.test(s.exercise)).reduce((a, s) => a + s.reps, 0);
const mondayOf = (iso: string) => { const d = new Date(D(iso)); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); };

export const PHYS = {
  strength: { label: "Strength", pt: "Força", color: "#ff453a", hint: "1RM estimado dos três levantamentos ÷ peso corporal" },
  endurance: { label: "Endurance", pt: "Resistência", color: "#ff5a6e", hint: "Minutos de cardio nos últimos 28 dias" },
  power: { label: "Power", pt: "Potência", color: "#ff4d8a", hint: "Séries pesadas (1–5 reps a 80%+ do seu melhor) em 8 semanas" },
  mobility: { label: "Mobility", pt: "Mobilidade", color: "#f5f5f7", hint: "Minutos de mobilidade e alongamento em 28 dias" },
  conditioning: { label: "Conditioning", pt: "Condicionamento", color: "#30d158", hint: "Sessões de cardio por semana (últimas 4)" },
  consistency: { label: "Consistency", pt: "Consistência", color: "#d12b65", hint: "Treinos feitos ÷ planejados (últimas 4 semanas)" },
} as const;
export type PhysKey = keyof typeof PHYS;

/** Atributos físicos (0–99). Retorna null quando ainda não há dados para medir. */
export function physicalAttributes(ws: WSession[], today: string, bodyweight: number | null, plannedPerWeek: number) {
  const recent = (days: number) => ws.filter((w) => daysAgo(today, w.date) >= 0 && daysAgo(today, w.date) < days);
  const all = ws.flatMap((w) => w.sets.filter(isStrength).map((s) => ({ ...s, date: w.date })));
  const bestBy = (re: RegExp) => Math.max(0, ...all.filter((s) => re.test(s.exercise) && !/stiff|romeno|halter|incl/i.test(s.exercise)).map((s) => e1rm(s.kg, s.reps)));
  const total = MAIN.reduce((a, re) => a + bestBy(re), 0);
  const strength = total ? clamp(bodyweight ? ((total / bodyweight) / 8) * 99 : total / 7) : null;
  const card28 = recent(28).reduce((a, w) => a + cardioMin(w), 0);
  const mob28 = recent(28).reduce((a, w) => a + cardioMin(w, MOBILITY), 0);
  const bestEx = new Map<string, number>();
  for (const s of all) bestEx.set(s.exercise.toLowerCase(), Math.max(bestEx.get(s.exercise.toLowerCase()) ?? 0, e1rm(s.kg, s.reps)));
  const heavy = recent(56).flatMap((w) => w.sets.filter(isStrength)).filter((s) => s.reps <= 5 && e1rm(s.kg, s.reps) >= 0.8 * (bestEx.get(s.exercise.toLowerCase()) ?? Infinity)).length;
  const cardioSessions = recent(28).filter((w) => cardioMin(w) >= 15).length;
  const done28 = recent(28).length;
  const consistency = plannedPerWeek > 0 && ws.length ? clamp((Math.min(done28, plannedPerWeek * 4) / (plannedPerWeek * 4)) * 99) : null;
  return {
    strength, endurance: ws.length ? clamp(card28 / 6) : null, power: all.length ? clamp(heavy * 1.65) : null,
    mobility: ws.length ? clamp(mob28 / 3) : null, conditioning: ws.length ? clamp((cardioSessions / 16) * 99) : null, consistency,
    detail: { total: Math.round(total), card28, mob28, heavy, cardioSessions, done28 },
  } as Record<PhysKey, number | null> & { detail: Record<string, number> };
}

/** Recordes ao longo do tempo: quantas vezes um exercício superou o melhor 1RM anterior. */
export function prEvents(ws: WSession[]) {
  const best = new Map<string, number>(); const out: { date: string; exercise: string; kg: number; reps: number; e1rm: number }[] = [];
  for (const w of [...ws].sort((a, b) => a.date.localeCompare(b.date))) {
    const top = new Map<string, WSet>();
    for (const s of w.sets.filter(isStrength)) { const k = s.exercise.toLowerCase(), cur = top.get(k); if (!cur || e1rm(s.kg, s.reps) > e1rm(cur.kg, cur.reps)) top.set(k, s); }
    for (const [k, s] of top) { const e = e1rm(s.kg, s.reps), b = best.get(k); if (b != null && e > b + 0.01) out.push({ date: w.date, exercise: s.exercise, kg: s.kg, reps: s.reps, e1rm: Math.round(e) }); best.set(k, Math.max(b ?? 0, e)); }
  }
  return out;
}

export const MEDALS = [
  { id: "iron_will", name: "Iron Will", desc: "Concluir 10 sessões de treino", color: "#bfc3c9" },
  { id: "limit_breaker", name: "Limit Breaker", desc: "Estabelecer um novo recorde pessoal", color: "#ff453a" },
  { id: "unbreakable", name: "Unbreakable", desc: "4 semanas seguidas cumprindo os treinos planejados, com os descansos respeitados", color: "#d12b65" },
  { id: "iron_legacy", name: "Iron Legacy", desc: "Completar 100 sessões de treino", color: "#d12b65" },
  { id: "endurance", name: "Endurance", desc: "10 sessões de cardio de 30 minutos ou mais", color: "#ff5a6e" },
  { id: "perfectionist", name: "Perfectionist", desc: "Concluir um ciclo do programa com 85%+ de aderência e RPE registrado", color: "#30d158" },
] as const;

export function trainingMedals(ws: WSession[], today: string, plannedPerWeek: number, program?: { totalWeeks: number; ended: boolean } | null) {
  const n = ws.length, prs = prEvents(ws).length;
  // Semanas seguidas (até a semana passada) com treinos >= planejado, sem passar de 6 por semana
  const byWeek = new Map<string, number>(); for (const w of ws) byWeek.set(mondayOf(w.date), (byWeek.get(mondayOf(w.date)) ?? 0) + 1);
  let run = 0, best = 0; let m = mondayOf(today); m = new Date(D(m) - 7 * DAY).toISOString().slice(0, 10);
  for (let i = 0; i < 104; i++) { const c = byWeek.get(m) ?? 0; if (plannedPerWeek > 0 && c >= plannedPerWeek && c <= 6) { run++; best = Math.max(best, run); } else run = 0; m = new Date(D(m) - 7 * DAY).toISOString().slice(0, 10); }
  const cardio30 = ws.filter((w) => cardioMin(w) >= 30).length;
  const inProgram = ws.filter((w) => w.week_no != null);
  const adherence = program && program.totalWeeks && plannedPerWeek ? inProgram.length / (program.totalWeeks * plannedPerWeek) : 0;
  const sets = inProgram.flatMap((w) => w.sets.filter(isStrength)), rpeShare = sets.length ? sets.filter((s) => s.rpe).length / sets.length : 0;
  const v = { iron_will: [n, 10], limit_breaker: [prs, 1], unbreakable: [best, 4], iron_legacy: [n, 100], endurance: [cardio30, 10],
    perfectionist: [program?.ended && adherence >= 0.85 && rpeShare >= 0.8 ? 1 : 0, 1] } as Record<string, [number, number]>;
  return MEDALS.map((md) => ({ ...md, value: v[md.id][0], target: v[md.id][1], done: v[md.id][0] >= v[md.id][1], progress: Math.min(1, v[md.id][0] / v[md.id][1]) }));
}

export type Insight = { kind: "progresso" | "atencao" | "info"; title: string; text: string };

/** ASCENSION Intelligence: leitura dos dados, nunca prescrição. */
export function trainingInsights(ws: WSession[], today: string, overrides: Record<string, Muscle> = {}): Insight[] {
  const out: Insight[] = [];
  const weekVol = (from: number, to: number) => ws.filter((w) => daysAgo(today, w.date) >= from && daysAgo(today, w.date) < to).reduce((a, w) => a + volumeOf(w), 0);
  // 1. Tendência de carga de trabalho (6 semanas vs 6 anteriores)
  const a = weekVol(0, 42), b = weekVol(42, 84);
  if (a > 0 && b > 0) {
    const ch = (a - b) / b;
    if (ch >= 0.03) out.push({ kind: "progresso", title: "Carga de trabalho em alta", text: `Você aumentou sua carga de trabalho em ${Math.round(ch * 100)}% nas últimas seis semanas. Sua consistência está produzindo resultados.` });
    else if (ch <= -0.15) out.push({ kind: "info", title: "Volume menor", text: `Seu volume caiu ${Math.round(-ch * 100)}% em relação às seis semanas anteriores. Se não foi planejado (deload, viagem, recuperação), vale revisar a rotina.` });
  }
  // 2. Exercícios estagnados e 3. evolução sem aumento de carga
  const byEx = new Map<string, { date: string; top: WSet }[]>();
  for (const w of [...ws].sort((x, y) => x.date.localeCompare(y.date))) {
    const tops = new Map<string, WSet>();
    for (const s of w.sets.filter(isStrength)) { const cur = tops.get(s.exercise); if (!cur || e1rm(s.kg, s.reps) > e1rm(cur.kg, cur.reps)) tops.set(s.exercise, s); }
    for (const [ex, s] of tops) byEx.set(ex, [...(byEx.get(ex) ?? []), { date: w.date, top: s }]);
  }
  for (const [ex, hist] of byEx) {
    if (hist.length < 6) continue;
    const last4 = hist.slice(-4), before = hist.slice(0, -4);
    const bestBefore = Math.max(...before.map((h) => e1rm(h.top.kg, h.top.reps))), bestNow = Math.max(...last4.map((h) => e1rm(h.top.kg, h.top.reps)));
    const span = daysAgo(last4[3].date, last4[0].date);
    if (bestNow <= bestBefore && span >= 21 && daysAgo(today, last4[3].date) <= 21) out.push({ kind: "atencao", title: `${ex}: estagnado`, text: `Sem superar seu melhor nas últimas 4 sessões (${span} dias). Considere variar repetições, revisar a técnica ou a recuperação antes de forçar mais carga.` });
    const l = hist.at(-1)!.top, p = hist.at(-2)!.top;
    if (l.kg === p.kg && l.reps > p.reps && daysAgo(today, hist.at(-1)!.date) <= 10) out.push({ kind: "progresso", title: `${ex}: mais repetições`, text: `Mesma carga (${l.kg} kg), ${l.reps - p.reps} repetição(ões) a mais que da última vez. Isso também é progresso.` });
  }
  // 4. Grupos pouco trabalhados (últimos 14 dias)
  const sets14 = new Map<Muscle, number>();
  for (const w of ws.filter((w) => daysAgo(today, w.date) < 14)) for (const s of w.sets.filter(isStrength)) { const m = guessMuscle(s.exercise, overrides); sets14.set(m, (sets14.get(m) ?? 0) + 1); }
  if ([...sets14.values()].reduce((x, y) => x + y, 0) >= 30) {
    const key: Muscle[] = ["peito", "costas", "quadriceps", "posteriores", "ombro_lateral", "triceps", "biceps", "gluteos"];
    const low = key.filter((m) => (sets14.get(m) ?? 0) / 2 < 4);
    if (low.length) out.push({ kind: "info", title: "Grupos pouco trabalhados", text: `Menos de 4 séries diretas por semana em: ${low.map((m) => MUSCLES[m]).join(", ")}. Se for intencional, tudo bem; senão, ajuste o plano.` });
  }
  // 5. Queda de desempenho em membros inferiores
  const legs = ws.filter((w) => w.sets.some((s) => isStrength(s) && ["quadriceps", "posteriores", "gluteos"].includes(guessMuscle(s.exercise, overrides)))).sort((x, y) => x.date.localeCompare(y.date));
  if (legs.length >= 6) {
    const score = (w: WSession) => Math.max(0, ...w.sets.filter((s) => isStrength(s) && ["quadriceps", "posteriores"].includes(guessMuscle(s.exercise, overrides))).map((s) => e1rm(s.kg, s.reps)));
    const r = legs.slice(-3).map(score), pr = legs.slice(-6, -3).map(score);
    const avg = (l: number[]) => l.reduce((x, y) => x + y, 0) / l.length;
    if (avg(pr) > 0 && avg(r) < avg(pr) * 0.95) out.push({ kind: "atencao", title: "Queda em membros inferiores", text: "Seu desempenho nos últimos treinos de pernas caiu. Considere revisar o volume, o sono e a recuperação antes de aumentar a intensidade." });
  }
  // 6. Frequência excessiva
  const last7 = ws.filter((w) => daysAgo(today, w.date) < 7);
  if (new Set(last7.map((w) => w.date)).size >= 7) out.push({ kind: "atencao", title: "Sem dia de descanso", text: "Você treinou os últimos 7 dias seguidos. Descanso faz parte do treino: é nele que a adaptação acontece." });
  return out;
}

/** Revisão da semana atual (seg–dom) comparada com a anterior. */
export function weeklyReview(ws: WSession[], today: string) {
  const mon = mondayOf(today), prevMon = new Date(D(mon) - 7 * DAY).toISOString().slice(0, 10);
  const inW = (from: string, to: string) => ws.filter((w) => w.date >= from && w.date < to);
  const next = new Date(D(mon) + 7 * DAY).toISOString().slice(0, 10);
  const cur = inW(mon, next), prev = inW(prevMon, mon);
  const prs = prEvents(ws).filter((p) => p.date >= mon);
  const sum = (l: WSession[]) => ({ sessions: l.length, volume: Math.round(l.reduce((a, w) => a + volumeOf(w), 0)), cardio: l.reduce((a, w) => a + cardioMin(w), 0) });
  return { from: mon, current: sum(cur), previous: sum(prev), prs };
}
