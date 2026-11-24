// Plano alimentar: gasto calórico, metas por objetivo, ajuste pela fase do treino e água. Sem dependências.
export type Sex = "m" | "f";
export type Goal = "perder" | "manter" | "ganhar" | "recomp";
export type Activity = "sedentario" | "leve" | "moderado" | "alto" | "atleta";
export const ACTIVITY: Record<Activity, { label: string; f: number }> = {
  sedentario: { label: "Sedentário (pouco movimento)", f: 1.2 }, leve: { label: "Leve (1–2 treinos/sem)", f: 1.375 },
  moderado: { label: "Moderado (3–4 treinos/sem)", f: 1.55 }, alto: { label: "Alto (5–6 treinos/sem)", f: 1.725 }, atleta: { label: "Atleta (2x/dia ou trabalho físico)", f: 1.9 },
};
export const GOALS: Record<Goal, { label: string; delta: number; protPerKg: number }> = {
  perder: { label: "Perder gordura", delta: -0.2, protPerKg: 2.2 }, manter: { label: "Manter", delta: 0, protPerKg: 1.8 },
  ganhar: { label: "Ganhar massa", delta: 0.1, protPerKg: 2 }, recomp: { label: "Recomposição", delta: -0.05, protPerKg: 2.2 },
};
/** Mifflin–St Jeor. */
export function bmr(sex: Sex, kg: number, cm: number, age: number) { return Math.round(10 * kg + 6.25 * cm - 5 * age + (sex === "m" ? 5 : -161)); }
export function targets(p: { sex: Sex; kg: number; cm: number; age: number; activity: Activity; goal: Goal }) {
  const tdee = Math.round(bmr(p.sex, p.kg, p.cm, p.age) * ACTIVITY[p.activity].f);
  const kcal = Math.round((tdee * (1 + GOALS[p.goal].delta)) / 10) * 10;
  const protein = Math.round(p.kg * GOALS[p.goal].protPerKg), fat = Math.round(Math.max(0.7 * p.kg, (kcal * 0.25) / 9));
  const carbs = Math.max(50, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { tdee, kcal, protein, carbs, fat, water: Math.round((p.kg * 35) / 50) * 50 };
}
/** Fase da campanha muda as calorias (carbo absorve a diferença): acumulação come mais, deload come menos. */
export const PHASE_ADJ: Record<string, { pct: number; label: string }> = {
  acumulacao: { pct: 0.05, label: "Acumulação: +5% (mais volume, mais combustível)" },
  intensificacao: { pct: 0, label: "Intensificação: calorias do plano" },
  realizacao: { pct: 0, label: "Pico: calorias do plano" },
  deload: { pct: -0.07, label: "Recuperação: −7% (menos treino)" },
};
/** Em cutting, a fase do treino nunca soma calorias (só o deload reduz); em bulking/manutenção vale o ajuste completo. */
export function adjustForPhase(t: { kcal: number; protein: number; carbs: number; fat: number }, kind?: string | null, goal?: Goal | null) {
  const raw = (kind && PHASE_ADJ[kind]) || null;
  const a = raw && goal === "perder" && raw.pct > 0 ? { pct: 0, label: "Cutting: a fase do treino não soma calorias" } : raw;
  if (!a || !a.pct) return { ...t, note: a?.label ?? null };
  const dk = Math.round((t.kcal * a.pct) / 10) * 10;
  return { kcal: t.kcal + dk, protein: t.protein, fat: t.fat, carbs: Math.max(50, t.carbs + Math.round(dk / 4)), note: a.label };
}

// ── Calorias pelo peso objetivo (cutting / bulking) ──
// 1 kg de gordura ≈ 7.700 kcal. Ritmos seguros (Helms 2014; Iraki 2019): perder 0,5–1% do peso/semana; ganhar 0,25–0,5%.
export const goalFromTarget = (kg: number, target: number): Goal => (target < kg - 0.5 ? "perder" : target > kg + 0.5 ? "ganhar" : "manter");
export type Phase = { key: "cutting" | "bulking" | "recomp" | "manutencao"; label: string };
export const phaseOf = (g: Goal): Phase => (g === "perder" ? { key: "cutting", label: "Cutting" } : g === "ganhar" ? { key: "bulking", label: "Bulking limpo" } : g === "recomp" ? { key: "recomp", label: "Recomposição" } : { key: "manutencao", label: "Manutenção" });
/** Plano por objetivo de peso: ritmo semanal → déficit/superávit diário, com pisos de segurança. */
export function weightPlan(p: { sex: Sex; kg: number; cm: number; age: number; activity: Activity; targetKg: number; weeks?: number | null }) {
  const goal = goalFromTarget(p.kg, p.targetKg), diff = Math.abs(p.kg - p.targetKg);
  // Em cutting, o fator de atividade costuma superestimar o gasto: usa um nível abaixo.
  const order: Activity[] = ["sedentario", "leve", "moderado", "alto", "atleta"];
  const act = goal === "perder" ? order[Math.max(0, order.indexOf(p.activity) - 1)] : p.activity;
  const b = bmr(p.sex, p.kg, p.cm, p.age), tdee = Math.round(b * ACTIVITY[act].f);
  const [lo, hi] = goal === "perder" ? [0.005, 0.01] : goal === "ganhar" ? [0.0025, 0.005] : [0, 0];
  const wanted = p.weeks && p.weeks > 0 ? diff / p.weeks : p.kg * (goal === "perder" ? 0.0075 : 0.0035);
  const rate = goal === "manter" ? 0 : Math.max(p.kg * lo, Math.min(p.kg * hi, wanted)); // kg/semana
  const delta = Math.round((rate * 7700) / 7 / 10) * 10 * (goal === "perder" ? -1 : 1);
  const floor = Math.max(p.sex === "m" ? 1500 : 1200, Math.round(b * 1.05));
  const kcal = Math.max(floor, Math.round((tdee + delta) / 10) * 10);
  const protein = Math.round(p.kg * (goal === "perder" ? 2.2 : 2.0)), fat = Math.round(Math.max(0.7 * p.kg, (kcal * 0.25) / 9));
  const carbs = Math.max(50, Math.round((kcal - protein * 4 - fat * 9) / 4));
  const weeks = rate > 0 ? Math.ceil(diff / rate) : 0;
  return { goal, phase: phaseOf(goal), tdee, kcal, protein, carbs, fat, rate: Math.round(rate * 100) / 100, weeks, floorHit: kcal === floor && tdee + delta < floor };
}
