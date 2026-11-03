import type { SupabaseClient } from "@supabase/supabase-js";

export type ChecklistItem = { key: string; label: string; primary?: boolean };
export type SplitDay = { dow: number; label: string; focus: string };
export type MealSlot = { key: string; label: string };
export type PlanExercise = { name: string; sets: number; reps: string; rest: number };
export type WorkoutPlan = { days: Record<string, PlanExercise[]>; prs: string[] };
export type FinCategory = { key: string; label: string; kind: "receita" | "fixo" | "variavel"; color: string; budget: number };

export type Settings = {
  id: string;
  pioneer_goal_minutes: number; water_goal_ml: number; kcal_goal: number; protein_goal_g: number;
  weight_start_kg: number; weight_goal_kg: number; weight_rate_kg_week: number;
  checklist: ChecklistItem[]; workout_split: SplitDay[];
  partner_phrase: string | null; partner_photo_path: string | null;
  daily_text: string | null; daily_text_date: string | null;
  meal_slots: MealSlot[]; carbs_goal_g: number; fat_goal_g: number;
  workout_plan: WorkoutPlan; finance_categories: FinCategory[];
};

export const DEFAULT_MEALS: MealSlot[] = [
  { key: "cafe", label: "Café da manhã" }, { key: "almoco", label: "Almoço" },
  { key: "lanche", label: "Lanche" }, { key: "jantar", label: "Jantar" },
];
const ex = (name: string, sets: number, reps: string, rest = 90): PlanExercise => ({ name, sets, reps, rest });
export const DEFAULT_PLAN: WorkoutPlan = {
  prs: ["Agachamento", "Supino", "Levantamento terra"],
  days: {
    "1": [ex("Puxada frontal", 4, "8-10"), ex("Remada curvada", 4, "8", 120), ex("Remada baixa", 3, "10"), ex("Desenvolvimento", 4, "8", 120), ex("Elevação lateral", 3, "12", 60), ex("Abdominal", 3, "15", 45)],
    "2": [ex("Agachamento", 4, "5", 180), ex("Leg press", 3, "10", 120), ex("Cadeira extensora", 3, "12", 60), ex("Mesa flexora", 3, "12", 60), ex("Stiff", 3, "10", 90), ex("Panturrilha", 4, "15", 45)],
    "3": [ex("Cardio", 1, "25 min", 0)],
    "4": [ex("Levantamento terra", 3, "5", 180), ex("Barra fixa", 4, "8", 120), ex("Remada unilateral", 3, "10"), ex("Desenvolvimento militar", 4, "6", 120), ex("Elevação lateral", 3, "15", 60), ex("Prancha", 3, "45 s", 45)],
    "5": [ex("Cardio", 1, "25 min", 0)],
    "6": [ex("Supino", 4, "5", 180), ex("Supino inclinado halteres", 3, "10", 90), ex("Crucifixo", 3, "12", 60), ex("Tríceps testa", 3, "10", 60), ex("Tríceps corda", 3, "12", 60), ex("Abdominal infra", 3, "15", 45)],
    "0": [],
  },
};
const cat = (key: string, label: string, kind: FinCategory["kind"], color: string, budget = 0): FinCategory => ({ key, label, kind, color, budget });
export const DEFAULT_CATEGORIES: FinCategory[] = [
  cat("salario", "Salário", "receita", "#8ac295"), cat("extra", "Renda extra", "receita", "#a8d4b1"),
  cat("moradia", "Moradia", "fixo", "#84aed4"), cat("contas", "Contas da casa", "fixo", "#6f9cc4"),
  cat("transporte", "Transporte", "fixo", "#9bbfe0"), cat("faculdade", "Faculdade", "fixo", "#5f86ad"),
  cat("assinaturas", "Assinaturas", "fixo", "#b3cce4"),
  cat("alimentacao", "Alimentação", "variavel", "#d9c49a"), cat("ofertas", "Ofertas (Congregação)", "variavel", "#e0ac53"),
  cat("saude", "Saúde", "variavel", "#ac8fd6"), cat("lazer", "Lazer", "variavel", "#c7a8e6"),
  cat("roupas", "Roupas", "variavel", "#e6b8a2"), cat("outros", "Outros", "variavel", "#9a978f"),
];

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { key: "oracao_estudo", label: "Oração da manhã + estudo pessoal (30 min)", primary: true },
  { key: "biblia", label: "Leitura da Bíblia" },
  { key: "faculdade", label: "Faculdade" },
  { key: "treino", label: "Treino ou cardio feito" },
  { key: "agua", label: "Meta de água batida" },
  { key: "refeicoes", label: "4 refeições / proteína batida" },
  { key: "sono", label: "Dormi 7h+" },
];
export const DEFAULT_SPLIT: SplitDay[] = [
  { dow: 1, label: "D1", focus: "Costas / Ombro / Abs" },
  { dow: 2, label: "D2", focus: "Perna" },
  { dow: 3, label: "Off", focus: "Cardio 20–30 min" },
  { dow: 4, label: "D3", focus: "Costas / Ombro / Abs" },
  { dow: 5, label: "Off", focus: "Cardio 20–30 min" },
  { dow: 6, label: "D4", focus: "Peito / Tríceps / Abs" },
  { dow: 0, label: "Off", focus: "Descanso total" },
];

/** Lê as configurações; cria a linha com padrões se ainda não existir. */
export async function getSettings(sb: SupabaseClient): Promise<Settings> {
  let { data } = await sb.from("settings").select("*").maybeSingle();
  if (!data) {
    const ins = await sb.from("settings")
      .insert({ checklist: DEFAULT_CHECKLIST, workout_split: DEFAULT_SPLIT }).select("*").single();
    data = ins.data;
  }
  const s = data as Settings;
  if (!Array.isArray(s.checklist) || !s.checklist.length) s.checklist = DEFAULT_CHECKLIST;
  if (!Array.isArray(s.workout_split) || !s.workout_split.length) s.workout_split = DEFAULT_SPLIT;
  s.weight_start_kg = Number(s.weight_start_kg); s.weight_goal_kg = Number(s.weight_goal_kg);
  s.weight_rate_kg_week = Number(s.weight_rate_kg_week);
  if (!Array.isArray(s.meal_slots) || !s.meal_slots.length) s.meal_slots = DEFAULT_MEALS;
  s.carbs_goal_g ??= 250; s.fat_goal_g ??= 70;
  if (!s.workout_plan?.days) s.workout_plan = DEFAULT_PLAN;
  s.workout_plan.prs ??= DEFAULT_PLAN.prs;
  if (!Array.isArray(s.finance_categories) || !s.finance_categories.length) s.finance_categories = DEFAULT_CATEGORIES;
  if (!s.partner_phrase || s.partner_phrase === "Escreva aqui a frase dela.") s.partner_phrase = "Tijolo por tijolinho";
  return s;
}
