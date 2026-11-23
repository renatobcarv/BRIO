"use server";
// Consulta com especialistas: cria a campanha de treino (periodização) e o plano alimentar a partir das respostas.
import { z } from "zod";
import { buildProgram, dietGoalFor, activityFor, type TrainAnswers } from "@/lib/coach";
import { GOALS, MUSCLES } from "@/lib/training";
import { saveProgram } from "@/app/(app)/corpo/program-actions";
import { generateDietPlan, saveDietPlan, type QuizAnswers } from "@/app/(app)/corpo/diet-actions";

const Train = z.object({
  goal: z.enum(Object.keys(GOALS) as [string, ...string[]]), level: z.enum(["iniciante", "intermediario", "avancado"]),
  days: z.number().int().min(2).max(6), minutes: z.number().int().min(30).max(150), equipment: z.enum(["academia", "halteres", "casa"]),
  weeks: z.number().int().min(4).max(24), priority: z.array(z.enum(Object.keys(MUSCLES) as [string, ...string[]])).max(3),
  injuries: z.string().max(300), sleep: z.number().min(3).max(12), stress: z.enum(["baixo", "medio", "alto"]), start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  focus: z.enum(["geral", "big3", "agachamento", "supino", "terra"]).optional(),
});
const Diet = z.object({
  sex: z.enum(["m", "f"]), age: z.number().int().min(14).max(90), cm: z.number().min(120).max(230), kg: z.number().min(35).max(250),
  meals: z.number().int().min(3).max(6), likes: z.string().max(300), dislikes: z.string().max(300), restrictions: z.string().max(300),
  budget: z.enum(["economico", "normal", "livre"]), cook: z.enum(["pouco", "medio", "muito"]), dietGoal: z.enum(["perder", "manter", "ganhar", "recomp"]).optional(),
});

/** Prévia do treino (não salva). */
export async function previewProgram(t: unknown) {
  const a = Train.safeParse(t);
  if (!a.success) return { error: "Respostas do treino incompletas." };
  return { ...buildProgram(a.data as TrainAnswers) };
}

/** Cria tudo: campanha ativa + plano alimentar. Retorna o que deu certo e o que falhou. */
export async function createFromConsult(t: unknown, d: unknown, withDiet: boolean): Promise<{ programId?: string; diet?: { kcal: number; protein: number; ai: boolean }; error?: string; dietError?: string }> {
  const a = Train.safeParse(t);
  if (!a.success) return { error: "Respostas do treino incompletas." };
  const r = buildProgram(a.data as TrainAnswers);
  let programId: string;
  try { programId = await saveProgram(r.program); }
  catch (e) { return { error: e instanceof Error ? e.message : "Não consegui salvar a campanha." }; }
  if (!withDiet) return { programId };
  const dd = Diet.safeParse(d);
  if (!dd.success) return { programId, dietError: "Respostas da dieta incompletas." };
  const q: QuizAnswers = { sex: dd.data.sex, age: dd.data.age, cm: dd.data.cm, kg: dd.data.kg, activity: activityFor(a.data.days), goal: dd.data.dietGoal ?? dietGoalFor(a.data.goal as TrainAnswers["goal"]),
    meals: dd.data.meals, times: [], likes: dd.data.likes, dislikes: dd.data.dislikes, restrictions: dd.data.restrictions, budget: dd.data.budget, cook: dd.data.cook, supplements: [], meds: [] };
  const g = await generateDietPlan(q);
  if (!g.plan) return { programId, dietError: g.error ?? "Não consegui montar a dieta." };
  const e = await saveDietPlan({ ...g.plan, notes: "Criado na consulta com especialistas." });
  return e ? { programId, dietError: e } : { programId, diet: { kcal: g.plan.kcal, protein: g.plan.protein_g, ai: g.ai } };
}
