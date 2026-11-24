"use server";
// Consulta com especialistas: cria a campanha de treino (periodização) e o plano alimentar a partir das respostas.
import { z } from "zod";
import { assessLevel, parseLift, buildProgram, dietGoalFor, activityFor, type Level, type TrainAnswers } from "@/lib/coach";
import { createClient } from "@/lib/supabase/server";
import { GOALS, MUSCLES } from "@/lib/training";
import { saveProgram } from "@/app/(app)/corpo/program-actions";
import { generateDietPlan, saveDietPlan, type QuizAnswers } from "@/app/(app)/corpo/diet-actions";

const Train = z.object({
  goal: z.enum(Object.keys(GOALS) as [string, ...string[]]), level: z.enum(["iniciante", "intermediario", "avancado"]),
  days: z.number().int().min(2).max(6), minutes: z.number().int().min(25).max(150), equipment: z.enum(["academia", "halteres", "casa"]),
  weeks: z.number().int().min(4).max(24), priority: z.array(z.enum(Object.keys(MUSCLES) as [string, ...string[]])).max(14),
  injuries: z.string().max(300), sleep: z.number().min(3).max(12), stress: z.enum(["baixo", "medio", "alto"]), start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  focus: z.enum(["geral", "big3", "agachamento", "supino", "terra"]).optional(),
  bench: z.string().max(30).optional(), squat: z.string().max(30).optional(), deadlift: z.string().max(30).optional(),
  style: z.enum(["moderno", "oldschool"]).optional(), runs: z.number().int().min(1).max(5).optional(), runGoal: z.enum(["saude", "5k", "10k", "21k"]).optional(),
});
const Diet = z.object({
  sex: z.enum(["m", "f"]), age: z.number().int().min(14).max(90), cm: z.number().min(120).max(230), kg: z.number().min(35).max(250),
  meals: z.number().int().min(3).max(6), likes: z.string().max(300), dislikes: z.string().max(300), restrictions: z.string().max(300),
  budget: z.enum(["economico", "normal", "livre"]), cook: z.enum(["pouco", "medio", "muito"]), dietGoal: z.enum(["perder", "manter", "ganhar", "recomp"]).optional(),
  targetKg: z.number().min(30).max(250).optional(), weeks: z.number().int().min(1).max(104).optional(),
});

/** Nível honesto: números de força digitados ou, se não houver, o melhor dos seus treinos registrados. */
async function honestLevel(t: z.infer<typeof Train>, d: unknown) {
  const dd = Diet.partial().safeParse(d ?? {});
  let bench = t.bench, squat = t.squat;
  if (!bench || !squat) {
    const sb = await createClient();
    const { data } = await sb.from("workout_sets").select("exercise,kg,reps").or("exercise.ilike.supino reto%,exercise.ilike.agachamento livre%").gt("kg", 0).limit(500);
    const best = (re: RegExp) => (data ?? []).filter((x) => re.test(String(x.exercise)) && Number(x.reps) >= 1 && Number(x.reps) <= 12)
      .sort((a, b) => Number(b.kg) * (1 + Number(b.reps) / 30) - Number(a.kg) * (1 + Number(a.reps) / 30))[0];
    const bb = best(/^supino reto/i), sq = best(/^agachamento livre/i);
    bench ||= bb ? `${bb.kg}x${bb.reps}` : undefined; squat ||= sq ? `${sq.kg}x${sq.reps}` : undefined;
  }
  return assessLevel({ self: t.level as Level, sex: dd.success ? dd.data.sex : undefined, bodyweight: dd.success ? dd.data.kg : undefined, bench, squat, deadlift: t.deadlift });
}

/** Prévia do treino (não salva), com a avaliação sincera do nível. */
export async function previewProgram(t: unknown, d?: unknown) {
  const a = Train.safeParse(t);
  if (!a.success) return { error: "Respostas do treino incompletas." };
  const lv = await honestLevel(a.data, d);
  return { ...buildProgram({ ...(a.data as TrainAnswers), level: lv.level }), assessment: lv };
}

/** Cria tudo: campanha ativa + plano alimentar. Retorna o que deu certo e o que falhou. */
export async function createFromConsult(t: unknown, d: unknown, withDiet: boolean): Promise<{ programId?: string; diet?: { kcal: number; protein: number; ai: boolean }; error?: string; dietError?: string }> {
  const a = Train.safeParse(t);
  if (!a.success) return { error: "Respostas do treino incompletas." };
  const lv = await honestLevel(a.data, d);
  const r = buildProgram({ ...(a.data as TrainAnswers), level: lv.level });
  // Máximos informados viram as primeiras cargas (enquanto não houver histórico desses exercícios).
  const maxes = Object.fromEntries(([["supino", a.data.bench], ["agachamento", a.data.squat], ["terra", a.data.deadlift]] as const)
    .map(([k, v]) => { const p = v ? parseLift(v) : null; return [k, p ? Math.round(p.reps <= 1 ? p.kg : p.kg * (1 + Math.min(12, p.reps) / 30)) : null]; }).filter(([, v]) => v));
  if (Object.keys(maxes).length) {
    const sb = await createClient(); const { data: st } = await sb.from("settings").select("prefs").maybeSingle();
    if (st) await sb.from("settings").update({ prefs: { ...((st.prefs ?? {}) as object), maxes } }).not("id", "is", null);
  }
  let programId: string;
  try { programId = await saveProgram(r.program); }
  catch (e) { return { error: e instanceof Error ? e.message : "Não consegui salvar a campanha." }; }
  if (!withDiet) return { programId };
  const dd = Diet.safeParse(d);
  if (!dd.success) return { programId, dietError: "Respostas da dieta incompletas." };
  const q: QuizAnswers = { sex: dd.data.sex, age: dd.data.age, cm: dd.data.cm, kg: dd.data.kg, activity: activityFor(a.data.days + (a.data.goal === "hibrido" ? Math.ceil((a.data.runs ?? 3) / 2) : 0)), goal: dd.data.dietGoal ?? dietGoalFor(a.data.goal as TrainAnswers["goal"]),
    meals: dd.data.meals, times: [], likes: dd.data.likes, dislikes: dd.data.dislikes, restrictions: dd.data.restrictions, budget: dd.data.budget, cook: dd.data.cook, supplements: [], meds: [], targetKg: dd.data.targetKg ?? null, weeks: dd.data.weeks ?? null };
  const g = await generateDietPlan(q);
  if (!g.plan) return { programId, dietError: g.error ?? "Não consegui montar a dieta." };
  const e = await saveDietPlan({ ...g.plan, notes: "Criado na consulta com especialistas." });
  return e ? { programId, dietError: e } : { programId, diet: { kcal: g.plan.kcal, protein: g.plan.protein_g, ai: g.ai } };
}
