"use server";
import { createClient } from "@/lib/supabase/server";

/** Resumo da conta criada no onboarding (só leitura; RLS garante que é a sua). */
export async function accountSummary() {
  const sb = await createClient();
  const [goals, prog, diet, pet, dreams, fin, st] = await Promise.all([
    sb.from("goals").select("title").limit(10),
    sb.from("training_programs").select("name").eq("active", true).maybeSingle(),
    sb.from("diet_plans").select("kcal,protein_g").maybeSingle(),
    sb.from("pets").select("name,species").maybeSingle(),
    sb.from("dreams").select("title").limit(10),
    sb.from("finance_items").select("id", { count: "exact", head: true }),
    sb.from("settings").select("partner_name,prefs").maybeSingle(),
  ]);
  const mods = ((st.data?.prefs as { modules?: Record<string, boolean> } | null)?.modules ?? {});
  return {
    goals: (goals.data ?? []).map((g) => g.title as string), program: (prog.data?.name as string) ?? null,
    diet: diet.data ? { kcal: diet.data.kcal as number, protein: diet.data.protein_g as number } : null,
    pet: pet.data ? { name: pet.data.name as string, species: pet.data.species as string } : null,
    dreams: (dreams.data ?? []).map((d) => d.title as string), finance: fin.count ?? 0,
    partner: (st.data?.partner_name as string) ?? null, modules: Object.entries(mods).filter(([, v]) => v).map(([k]) => k),
  };
}
