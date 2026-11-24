// Ranking de força nos três básicos: patente por força relativa (1RM estimado ÷ peso corporal). Sem dependências.
// Faixas aproximadas de treino natural (padrões de força populares); servem para metas, não para rotular.
export type Lift = "agachamento" | "supino" | "terra";
export const LIFTS: Record<Lift, { label: string; re: RegExp }> = {
  agachamento: { label: "Agachamento", re: /^agachamento livre|^agachamento pausado|^back squat/i },
  supino: { label: "Supino", re: /^supino reto com barra|^supino com pausa|^bench/i },
  terra: { label: "Levantamento terra", re: /^levantamento terra|^deadlift/i },
};
export const TIERS = [
  { key: "recruta", name: "Recruta", color: "#8e8e93" },
  { key: "ferro", name: "Ferro", color: "#a1a1aa" },
  { key: "bronze", name: "Bronze", color: "#cd7f32" },
  { key: "prata", name: "Prata", color: "#d7dbe0" },
  { key: "ouro", name: "Ouro", color: "#ffcc4d" },
  { key: "epico", name: "Épico", color: "#ff9f0a" },
  { key: "lendario", name: "Lendário", color: "#ffb21e" },
  { key: "mitico", name: "Mítico", color: "#ff5a36" },
] as const;
// Limites (× peso corporal) para subir de Recruta → Ferro → … → Mítico (homens). Mulheres: fator abaixo.
const LIMITS: Record<Lift, number[]> = {
  supino: [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0],
  agachamento: [0.75, 1.0, 1.4, 1.75, 2.1, 2.5, 2.85],
  terra: [1.0, 1.25, 1.7, 2.0, 2.4, 2.85, 3.2],
};
const WOMEN: Record<Lift, number> = { supino: 0.62, agachamento: 0.78, terra: 0.8 };
export const e1rm = (kg: number, reps: number) => (reps <= 1 ? kg : kg * (1 + Math.min(12, reps) / 30));

/** Melhor 1RM estimado por levantamento (séries de 1–12 reps). */
export function bestLifts(sets: { exercise: string; kg: number; reps: number }[]) {
  const out = { agachamento: 0, supino: 0, terra: 0 } as Record<Lift, number>;
  for (const s of sets) for (const k of Object.keys(LIFTS) as Lift[])
    if (LIFTS[k].re.test(s.exercise) && s.kg > 0 && s.reps >= 1 && s.reps <= 12) out[k] = Math.max(out[k], e1rm(s.kg, s.reps));
  return out;
}
/** Patente de um levantamento + quanto falta (kg de 1RM) para a próxima. */
export function rankOf(lift: Lift, oneRm: number, bodyweight: number, sex: "m" | "f" = "m") {
  const f = sex === "f" ? WOMEN[lift] : 1, lim = LIMITS[lift].map((x) => x * f), rel = bodyweight > 0 ? oneRm / bodyweight : 0;
  let i = 0; while (i < lim.length && rel >= lim[i]) i++;
  const next = i < lim.length ? lim[i] * bodyweight : null, prev = i > 0 ? lim[i - 1] * bodyweight : 0;
  return { tier: TIERS[i], index: i, rel, toNext: next ? Math.max(0, Math.ceil(next - oneRm)) : 0, nextTier: i < lim.length ? TIERS[i + 1] : null,
    progress: next ? Math.min(1, Math.max(0, (oneRm - prev) / (next - prev))) : 1 };
}
/** Patente geral: a média dos três (o mais fraco puxa para baixo: força completa). */
export function overallRank(r: Record<Lift, { index: number }>) {
  const idx = Math.floor((r.agachamento.index + r.supino.index + r.terra.index) / 3);
  return TIERS[Math.max(0, Math.min(TIERS.length - 1, idx))];
}
