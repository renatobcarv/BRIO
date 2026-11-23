// Sugestão de carga por RPE (autorregulação). Sem dependências.
// Regra: repetições em reserva (RIR) = 10 − RPE; 1RM estimado por Epley com reps + RIR.

export type HistSet = { date: string; kg: number; reps: number; rpe?: number | null };
export const roundPlate = (kg: number, step = 2.5) => Math.round(kg / step) * step;
const epley = (kg: number, totalReps: number) => (totalReps <= 1 ? kg : kg * (1 + totalReps / 30));
/** 1RM estimado de uma série, usando o RPE quando registrado (reps + RIR). */
export const setE1rm = (s: { kg: number; reps: number; rpe?: number | null }) =>
  epley(s.kg, s.reps + (s.rpe && s.rpe >= 6 ? Math.max(0, 10 - s.rpe) : 0));
/** Carga para fazer `reps` repetições no RPE alvo, dado um 1RM estimado. */
export const loadFor = (e1rm: number, reps: number, rpe: number) => e1rm / (1 + (reps + Math.max(0, 10 - rpe)) / 30);
const firstNum = (s: string) => Number((s.match(/\d+(?:[.,]\d+)?/) ?? ["0"])[0].replace(",", "."));

export type Suggestion = { kg: number; e1rm: number; lastTop: number; reason: string; capped: boolean };

/**
 * Sugere a carga da próxima sessão, sempre a partir do 1RM ESTIMADO (nunca copiando o recorde):
 * - 1RM estimado = melhor das últimas 3 sessões (séries de 1–20 reps; Epley com o RIR do RPE);
 * - carga = 1RM ÷ (1 + (reps alvo + RIR)/30), arredondada a 2,5 kg;
 * - progressão: no máximo +5% sobre a última carga de trabalho (ACSM 2009: 2–10% quando as reps sobram);
 * - faixa de repetições nova (±4 reps da última) ou 14+ dias parado: começa 10% abaixo para calibrar;
 * - deload: −15%.
 */
export function suggestLoad(history: HistSet[], target: { reps: string; rpe: number | null }, opts: { deload?: boolean; today?: string } = {}): Suggestion | null {
  const valid = history.filter((s) => s.kg > 0 && s.reps >= 1 && s.reps <= 20);
  if (!valid.length) return null;
  const dates = [...new Set(valid.map((s) => s.date))].sort().slice(-3);
  const recent = valid.filter((s) => dates.includes(s.date));
  const e1rm = Math.max(...recent.map(setE1rm));
  const lastDate = dates.at(-1)!, lastSets = valid.filter((s) => s.date === lastDate);
  const lastTop = Math.max(...lastSets.map((s) => s.kg));
  const lastReps = lastSets.reduce((a, s) => a + s.reps, 0) / lastSets.length;
  const reps = Math.max(1, Math.round(firstNum(target.reps) || 5));
  const rpe = target.rpe ?? 8;
  const notes: string[] = [];
  let kg = loadFor(e1rm, reps, rpe), capped = false;
  if (kg > lastTop * 1.05) { kg = lastTop * 1.05; capped = true; notes.push("limitado a +5% da última carga"); }
  if (Math.abs(reps - lastReps) >= 4) { kg *= 0.9; notes.push(`faixa nova (${Math.round(lastReps)}→${reps} reps): −10% para calibrar`); }
  const away = opts.today ? Math.round((Date.parse(opts.today) - Date.parse(lastDate)) / 864e5) : 0;
  if (away >= 14) { kg *= 0.9; notes.push(`${away} dias sem esse exercício: −10%`); }
  if (opts.deload) { kg *= 0.85; notes.push("semana de deload (−15%)"); }
  kg = Math.max(0, Math.floor(kg / 2.5) * 2.5);
  const reason = `${reps} reps @RPE ${String(rpe).replace(".", ",")} com 1RM estimado de ${Math.round(e1rm)} kg${notes.length ? " · " + notes.join(" · ") : ""}`;
  return { kg, e1rm: Math.round(e1rm), lastTop, reason, capped };
}

// ── Carga série a série ──
/**
 * Plano de cargas por série. Com poucas repetições (≤6, semana de força): 1 série principal no RPE alvo
 * e as demais em recuo (−8%), prática comum de autorregulação por RPE (Helms et al. 2016). Senão, séries retas.
 */
export function setLoads(baseKg: number, sets: number, reps: number) {
  const n = Math.max(1, Math.round(sets));
  if (baseKg <= 0) return Array(n).fill(0) as number[];
  if (reps <= 6 && n >= 3) return [roundPlate(baseKg), ...Array.from({ length: n - 1 }, () => roundPlate(baseKg * 0.92))];
  return Array(n).fill(roundPlate(baseKg)) as number[];
}

/** Ajuste ao vivo: lê a série que acabou (kg, reps, RPE) e recalcula a próxima para o alvo. Sobe no máx. 5%, desce no máx. 10%. */
export function nextSetKg(done: { kg: number; reps: number; rpe: number | null }, target: { reps: number; rpe: number | null }, plannedKg: number) {
  if (!(done.kg > 0) || !(done.reps > 0) || !done.rpe) return plannedKg;
  const want = loadFor(setE1rm(done), Math.max(1, target.reps), target.rpe ?? 8);
  const base = plannedKg > 0 ? plannedKg : done.kg;
  const kg = Math.min(base * 1.05, Math.max(base * 0.9, want));
  if (Math.abs(kg - base) < 1.25) return base;
  // Arredonda para dentro dos limites: subindo, para baixo; descendo, para cima.
  return kg > base ? Math.max(base, Math.floor(kg / 2.5) * 2.5) : Math.min(base, Math.ceil(kg / 2.5) * 2.5);
}

/** Carga inicial sem histórico: fração conservadora do peso corporal para ~8–10 repetições (comece leve, o ajuste ao vivo corrige). */
const STARTER: [RegExp, number, number][] = [
  [/levantamento terra|terra\b/i, 0.7, 2.5], [/agachamento livre|agachamento frontal|hack/i, 0.55, 2.5], [/leg press/i, 1.1, 5],
  [/supino reto com barra|supino máquina/i, 0.45, 2.5], [/supino.*halter/i, 0.16, 1], [/stiff com barra|good morning|elevação pélvica com barra/i, 0.45, 2.5],
  [/remada curvada|remada máquina|remada baixa|puxada|pulldown/i, 0.4, 2.5], [/remada unilateral|stiff com halteres/i, 0.2, 1],
  [/desenvolvimento com barra|desenvolvimento máquina/i, 0.3, 2.5], [/desenvolvimento com halteres|búlgaro|passada|afundo|goblet/i, 0.12, 1],
  [/extensora|flexora|abdução|panturrilha/i, 0.3, 2.5], [/rosca direta|tríceps testa/i, 0.2, 1], [/elevação lateral|elevação frontal|crucifixo inverso/i, 0.06, 1],
  [/rosca|tríceps francês|martelo/i, 0.09, 1], [/polia|corda|crossover|face pull|peck deck|crucifixo/i, 0.2, 2.5],
];
export function starterLoad(name: string, bodyweight: number | null) {
  const bw = bodyweight && bodyweight > 30 ? bodyweight : 75;
  for (const [re, f, step] of STARTER) if (re.test(name)) return Math.max(step, roundPlate(bw * f, step));
  return null;
}
