"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const PATCH = z.object({
  checklist: z.array(z.object({ key: z.string().min(1).max(60), label: z.string().trim().min(1).max(120), primary: z.boolean().optional() })).min(1).max(25),
  meal_slots: z.array(z.object({ key: z.string().min(1).max(40), label: z.string().trim().min(1).max(60) })).min(1).max(10),
  workout_split: z.array(z.object({ dow: z.number().int().min(0).max(6), label: z.string().max(12), focus: z.string().max(80) })).length(7),
  workout_plan: z.object({
    days: z.record(z.string(), z.array(z.object({ name: z.string().trim().min(1).max(80), sets: z.number().int().min(1).max(20), reps: z.string().max(20), rest: z.number().int().min(0).max(900) })).max(30)),
    prs: z.array(z.string().max(80)).max(10),
  }),
  finance_categories: z.array(z.object({ key: z.string().min(1).max(40), label: z.string().trim().min(1).max(60),
    kind: z.enum(["receita", "fixo", "variavel"]), color: z.string().max(20), budget: z.number().min(0).max(1e9) })).min(1).max(60),
  pioneer_goal_minutes: z.number().int().min(0).max(18000), water_goal_ml: z.number().int().min(500).max(10000),
  kcal_goal: z.number().int().min(800).max(8000), protein_goal_g: z.number().int().min(0).max(600),
  carbs_goal_g: z.number().int().min(0).max(1500), fat_goal_g: z.number().int().min(0).max(500),
  weight_start_kg: z.number().min(20).max(400), weight_goal_kg: z.number().min(20).max(400), weight_rate_kg_week: z.number().min(0).max(3),
  partner_phrase: z.string().max(300),
  books_goal_year: z.number().int().min(0).max(1000),
}).partial();

/** Atualiza qualquer configuração (validada). */
export async function updateSettings(patch: z.infer<typeof PATCH>) {
  const p = PATCH.parse(patch);
  const sb = await createClient();
  const { error } = await sb.from("settings").update(p).not("id", "is", null);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
