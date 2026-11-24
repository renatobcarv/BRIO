"use server";
// Plano alimentar: gerar (IA com plano de reserva), salvar, seguir o planejado e marcar suplementos/remédios.
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { aiJSON } from "@/lib/ai/providers";
import { targets, weightPlan, ACTIVITY, GOALS, type Activity, type Goal, type Sex } from "@/lib/diet-plan";

const MISSING = "Rode a migração 20261124000000_plano_dieta.sql no Supabase.";
const msg = (e: { message: string } | null) => (e ? (/relation|does not exist|schema cache/i.test(e.message) ? MISSING : e.message) : null);
const refresh = () => { revalidatePath("/corpo"); revalidatePath("/"); };

const Item = z.object({ name: z.string().trim().min(1).max(120), qty: z.string().max(60).default(""), kcal: z.number().min(0).max(5000), p: z.number().min(0).max(500), c: z.number().min(0).max(800), g: z.number().min(0).max(400) });
const Meal = z.object({ key: z.string().min(1).max(40), label: z.string().trim().min(1).max(60), time: z.string().max(5).default(""), items: z.array(Item).max(20) });
const Sup = z.object({ name: z.string().trim().min(1).max(120), dose: z.string().max(80).default(""), time: z.string().max(40).default("") });
const Plan = z.object({
  goal: z.enum(["perder", "manter", "ganhar", "recomp"]), profile: z.record(z.string(), z.unknown()).default({}),
  kcal: z.number().int().min(800).max(7000), protein_g: z.number().int().min(20).max(500), carbs_g: z.number().int().min(20).max(900), fat_g: z.number().int().min(15).max(400),
  water_ml: z.number().int().min(500).max(8000), meals: z.array(Meal).max(10), supplements: z.array(Sup.extend({})).max(20), meds: z.array(Sup.extend({ notes: z.string().max(300).default("") })).max(20),
  follow_phase: z.boolean().default(true), notes: z.string().max(4000).nullable().default(null),
});
export type DietPlan = z.infer<typeof Plan>;
export type QuizAnswers = {
  sex: Sex; age: number; cm: number; kg: number; activity: Activity; goal: Goal; meals: number; times: string[];
  likes: string; dislikes: string; restrictions: string; budget: "economico" | "normal" | "livre"; cook: "pouco" | "medio" | "muito";
  supplements: { name: string; dose: string; time: string }[]; meds: { name: string; dose: string; time: string; notes: string }[]; water_ml?: number;
  /** Peso objetivo (e prazo opcional em semanas): define cutting/bulking e o déficit pelo ritmo seguro. */
  targetKg?: number | null; weeks?: number | null;
};

const LABELS = ["Café da manhã", "Lanche da manhã", "Almoço", "Lanche da tarde", "Jantar", "Ceia"];
const pickLabels = (n: number) => (n <= 3 ? ["Café da manhã", "Almoço", "Jantar"] : n === 4 ? ["Café da manhã", "Almoço", "Lanche da tarde", "Jantar"] : n === 5 ? ["Café da manhã", "Lanche da manhã", "Almoço", "Lanche da tarde", "Jantar"] : LABELS);

/** Gera o plano: metas por fórmula; cardápio pela IA (ou modelo simples sem IA). Não salva: o usuário revisa. */
export async function generateDietPlan(input: QuizAnswers): Promise<{ plan?: DietPlan; error?: string; ai: boolean }> {
  let a = input;
  const wp = a.targetKg && a.targetKg > 30 && a.goal !== "recomp" ? weightPlan({ sex: a.sex, kg: a.kg, cm: a.cm, age: a.age, activity: a.activity, targetKg: a.targetKg, weeks: a.weeks }) : null;
  if (wp) a = { ...a, goal: wp.goal };
  const t = wp ? { tdee: wp.tdee, kcal: wp.kcal, protein: wp.protein, carbs: wp.carbs, fat: wp.fat, water: Math.round((a.kg * 35) / 50) * 50 } : targets({ sex: a.sex, kg: a.kg, cm: a.cm, age: a.age, activity: a.activity, goal: a.goal });
  const labels = pickLabels(Math.min(6, Math.max(3, a.meals)));
  const base = { goal: a.goal, profile: { sex: a.sex, age: a.age, cm: a.cm, kg: a.kg, activity: a.activity, targetKg: a.targetKg ?? null, rate: wp?.rate ?? null, weeks: wp?.weeks ?? null, likes: a.likes, dislikes: a.dislikes, restrictions: a.restrictions, budget: a.budget, cook: a.cook, tdee: t.tdee },
    kcal: t.kcal, protein_g: t.protein, carbs_g: t.carbs, fat_g: t.fat, water_ml: a.water_ml || t.water, supplements: a.supplements, meds: a.meds, follow_phase: true, notes: null };
  const r = await aiJSON<{ meals: { label: string; time: string; items: { name: string; qty: string; kcal: number; p: number; c: number; g: number }[] }[] }>(null,
    `Você é nutricionista esportivo brasileiro. Monte um cardápio diário com comida brasileira comum, realista e repetível. Respeite EXATAMENTE as refeições pedidas. Some aproximadamente ${t.kcal} kcal, ${t.protein} g de proteína, ${t.carbs} g de carboidrato e ${t.fat} g de gordura no dia (tolerância 5%). Use quantidades caseiras + gramas (ex.: "150 g (1 escumadeira)"). Valores nutricionais realistas (tabela TACO). Respeite restrições e o que a pessoa não gosta; prefira o que ela gosta. Orçamento: ${a.budget}. Tempo de cozinha: ${a.cook}. Não prescreva suplementos nem remédios.`,
    `Refeições e horários: ${labels.map((l, i) => `${l}${a.times[i] ? ` às ${a.times[i]}` : ""}`).join("; ")}\nGosta: ${a.likes || "-"}\nNão gosta: ${a.dislikes || "-"}\nRestrições/alergias: ${a.restrictions || "nenhuma"}\nObjetivo: ${GOALS[a.goal].label}. Atividade: ${ACTIVITY[a.activity].label}.`,
    { type: "object", properties: { meals: { type: "array", items: { type: "object", properties: { label: { type: "string" }, time: { type: "string" }, items: { type: "array", items: { type: "object", properties: { name: { type: "string" }, qty: { type: "string" }, kcal: { type: "number" }, p: { type: "number" }, c: { type: "number" }, g: { type: "number" } }, required: ["name", "qty", "kcal", "p", "c", "g"] } } }, required: ["label", "time", "items"] } } }, required: ["meals"] });
  let meals: DietPlan["meals"];
  let ai = true;
  if ("error" in r) {
    ai = false;
    // Sem IA: modelo simples proporcional, para editar depois.
    const share = labels.map((l) => (/almo|jant/i.test(l) ? 0.3 : /caf/i.test(l) ? 0.2 : 0.1));
    const tot = share.reduce((x, y) => x + y, 0);
    meals = labels.map((l, i) => { const k = share[i] / tot, kc = Math.round(t.kcal * k);
      const items = /almo|jant/i.test(l) ? [{ name: "Arroz branco cozido", qty: `${Math.round(kc * 0.35 / 1.28)} g`, kcal: Math.round(kc * 0.35), p: Math.round(kc * 0.35 / 1.28 * 0.025), c: Math.round(kc * 0.35 / 1.28 * 0.28), g: 0 }, { name: "Feijão carioca", qty: "140 g (1 concha)", kcal: 106, p: 7, c: 19, g: 1 }, { name: "Peito de frango grelhado", qty: `${Math.round(t.protein * k * 0.8 / 0.32)} g`, kcal: Math.round(t.protein * k * 0.8 / 0.32 * 1.59), p: Math.round(t.protein * k * 0.8), c: 0, g: 3 }, { name: "Salada e legumes à vontade", qty: "1 prato raso", kcal: 40, p: 2, c: 6, g: 0 }]
        : /caf/i.test(l) ? [{ name: "Ovos mexidos", qty: "3 ovos", kcal: 220, p: 19, c: 2, g: 15 }, { name: "Pão francês", qty: "1 unidade (50 g)", kcal: 150, p: 4, c: 29, g: 2 }, { name: "Fruta", qty: "1 unidade", kcal: 80, p: 1, c: 20, g: 0 }]
        : [{ name: "Iogurte natural", qty: "170 g", kcal: 90, p: 7, c: 4, g: 5 }, { name: "Banana", qty: "1 unidade", kcal: 90, p: 1, c: 23, g: 0 }, { name: "Aveia", qty: "30 g", kcal: 118, p: 4, c: 20, g: 3 }];
      return { key: `m${i + 1}`, label: l, time: a.times[i] ?? "", items }; });
  } else {
    meals = r.meals.slice(0, labels.length).map((m, i) => ({ key: `m${i + 1}`, label: labels[i] ?? m.label, time: a.times[i] || m.time || "", items: m.items.slice(0, 12).map((x) => ({ name: x.name.slice(0, 120), qty: String(x.qty ?? "").slice(0, 60), kcal: Math.max(0, Math.round(x.kcal)), p: Math.max(0, Math.round(x.p)), c: Math.max(0, Math.round(x.c)), g: Math.max(0, Math.round(x.g)) })) }));
  }
  const p = Plan.safeParse({ ...base, meals });
  return p.success ? { plan: p.data, ai } : { error: "Não consegui montar o plano. Confira os dados.", ai };
}

export async function saveDietPlan(plan: DietPlan): Promise<string | null> {
  const p = Plan.safeParse(plan);
  if (!p.success) return "Plano inválido: " + (p.error.issues[0]?.path.join(".") ?? "");
  const sb = await createClient();
  const { error } = await sb.from("diet_plans").upsert({ ...p.data, updated_at: new Date().toISOString() });
  if (error) return msg(error);
  // As metas do dia e as refeições da tela de Dieta passam a seguir o plano.
  await sb.from("settings").update({ kcal_goal: p.data.kcal, protein_goal_g: p.data.protein_g, carbs_goal_g: p.data.carbs_g, fat_goal_g: p.data.fat_g, water_goal_ml: p.data.water_ml,
    meal_slots: p.data.meals.map((m) => ({ key: m.key, label: m.time ? `${m.label} · ${m.time}` : m.label })) }).not("id", "is", null);
  refresh(); return null;
}

export async function deleteDietPlan(): Promise<string | null> {
  const sb = await createClient();
  const { error } = await sb.from("diet_plans").delete().not("user_id", "is", null);
  refresh(); return msg(error);
}

/** "Comi o planejado": lança os itens da refeição do plano e marca a refeição como feita. */
export async function eatPlannedMeal(date: string, key: string): Promise<string | null> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "Data inválida.";
  const sb = await createClient();
  const { data: plan, error } = await sb.from("diet_plans").select("meals").maybeSingle();
  if (error || !plan) return msg(error) ?? "Sem plano.";
  const m = (plan.meals as DietPlan["meals"]).find((x) => x.key === key);
  if (!m) return "Refeição não encontrada.";
  const { count } = await sb.from("meal_items").select("id", { count: "exact", head: true }).eq("date", date).eq("slot", key);
  if (!count) {
    const { error: e2 } = await sb.from("meal_items").insert(m.items.map((x) => ({ date, slot: key, name: x.qty ? `${x.name} (${x.qty})` : x.name, kcal: x.kcal, protein_g: x.p, carbs_g: x.c, fat_g: x.g })));
    if (e2) return msg(e2);
  }
  const { error: e3 } = await sb.from("meals").upsert({ date, slot: key, done: true }, { onConflict: "user_id,date,slot" });
  refresh(); return msg(e3);
}

export async function toggleIntake(date: string, kind: "suplemento" | "remedio", name: string, on: boolean): Promise<string | null> {
  const sb = await createClient();
  const { error } = on ? await sb.from("diet_intakes").upsert({ date, kind, name: name.slice(0, 120) }, { onConflict: "user_id,date,kind,name" })
    : await sb.from("diet_intakes").delete().eq("date", date).eq("kind", kind).eq("name", name);
  refresh(); return msg(error);
}


/** Escala o plano para novas calorias: proteína fica; carboidrato e gordura acompanham a diferença. */
function rescale(plan: { kcal: number; protein_g: number; carbs_g: number; fat_g: number; meals: { items: { kcal: number; p: number; c: number; g: number; qty: string }[] }[] }, kcal: number) {
  const nonP = Math.max(1, plan.kcal - plan.protein_g * 4), f = Math.max(0.5, Math.min(1.5, (kcal - plan.protein_g * 4) / nonP));
  const pct = Math.round((f - 1) * 100);
  return { kcal, carbs_g: Math.max(50, Math.round(plan.carbs_g * f)), fat_g: Math.max(30, Math.round(plan.fat_g * f)),
    meals: plan.meals.map((m) => ({ ...m, items: m.items.map((x) => ({ ...x, kcal: Math.round(x.kcal - x.p * 4 + (x.kcal - x.p * 4) * (f - 1) + x.p * 4), c: Math.round(x.c * f), g: Math.round(x.g * f),
      qty: pct && (x.c > 5 || x.g > 5) ? `${x.qty.replace(/ · [−+]\d+%$/, "")} · ${pct > 0 ? "+" : "−"}${Math.abs(pct)}%` : x.qty })) })) };
}
async function updatePlan(kcal: number, extra: Record<string, unknown> = {}): Promise<string | null> {
  const sb = await createClient();
  const { data: plan, error } = await sb.from("diet_plans").select("*").maybeSingle();
  if (error) return msg(error); if (!plan) return "Crie um plano alimentar primeiro.";
  const r = rescale(plan as never, Math.round(kcal / 10) * 10);
  const { error: e2 } = await sb.from("diet_plans").update({ ...r, ...extra, updated_at: new Date().toISOString() }).not("user_id", "is", null);
  if (e2) return msg(e2);
  await sb.from("settings").update({ kcal_goal: r.kcal, carbs_goal_g: r.carbs_g, fat_goal_g: r.fat_g, ...(extra.protein_g ? { protein_goal_g: extra.protein_g } : {}) }).not("id", "is", null);
  refresh(); revalidatePath("/dieta"); return null;
}
/** Recalcula o plano pelo peso objetivo (cutting/bulking com ritmo seguro). */
export async function recalcForTarget(targetKg: number, weeks: number | null): Promise<string | null> {
  const t = z.number().min(30).max(250).safeParse(targetKg); if (!t.success) return "Peso objetivo inválido.";
  const sb = await createClient();
  const [{ data: plan }, { data: w }] = await Promise.all([sb.from("diet_plans").select("profile").maybeSingle(), sb.from("weight_logs").select("kg").order("date", { ascending: false }).limit(1).maybeSingle()]);
  const pr = (plan?.profile ?? {}) as { sex?: Sex; age?: number; cm?: number; kg?: number; activity?: Activity };
  if (!plan || !pr.sex || !pr.age || !pr.cm) return "Crie o plano pela consulta (com peso, altura e idade) antes de recalcular.";
  const kg = Number(w?.kg ?? pr.kg);
  const wp = weightPlan({ sex: pr.sex, kg, cm: pr.cm, age: pr.age, activity: pr.activity ?? "moderado", targetKg: t.data, weeks });
  return updatePlan(wp.kcal, { goal: wp.goal, protein_g: wp.protein, profile: { ...pr, kg, targetKg: t.data, rate: wp.rate, weeks: wp.weeks } });
}
/** Aplica o ajuste semanal sugerido (± kcal) pela tendência do peso. */
export async function applyDietAdjust(adj: number): Promise<string | null> {
  const a = z.number().int().min(-400).max(400).safeParse(adj); if (!a.success || !a.data) return "Ajuste inválido.";
  const sb = await createClient(); const { data: plan } = await sb.from("diet_plans").select("kcal").maybeSingle();
  if (!plan) return "Crie um plano alimentar primeiro.";
  return updatePlan(Number(plan.kcal) + a.data);
}

/** Prévia da dieta feita na conversa com a nutricionista (não salva até ativar). */
export async function previewDiet(d: { sex: Sex; age: number; cm: number; kg: number; meals: number; likes: string; dislikes: string; restrictions: string;
  budget: "economico" | "normal" | "livre"; cook: "pouco" | "medio" | "muito"; dietGoal?: Goal; targetKg?: number; weeks?: number; trainDays?: number }) {
  const days = Math.max(0, Math.min(7, Math.round(d.trainDays ?? 3)));
  const activity: Activity = days === 0 ? "sedentario" : days <= 2 ? "leve" : days <= 4 ? "moderado" : "alto";
  const g = await generateDietPlan({ sex: d.sex, age: d.age, cm: d.cm, kg: d.kg, activity, goal: d.dietGoal ?? "manter", meals: d.meals, times: [], likes: d.likes, dislikes: d.dislikes,
    restrictions: d.restrictions, budget: d.budget, cook: d.cook, supplements: [], meds: [], targetKg: d.targetKg ?? null, weeks: d.weeks ?? null });
  return g;
}
