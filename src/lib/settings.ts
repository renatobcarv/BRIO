import type { SupabaseClient } from "@supabase/supabase-js";

export type ChecklistItem = { key: string; label: string; primary?: boolean };
export type SplitDay = { dow: number; label: string; focus: string };
export type Settings = {
  id: string;
  pioneer_goal_minutes: number; water_goal_ml: number; kcal_goal: number; protein_goal_g: number;
  weight_start_kg: number; weight_goal_kg: number; weight_rate_kg_week: number;
  checklist: ChecklistItem[]; workout_split: SplitDay[];
  partner_phrase: string | null; partner_photo_path: string | null;
  daily_text: string | null; daily_text_date: string | null;
};

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
  return s;
}
