"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const S = z.object({ kind: z.enum(["teste", "treino"]), score: z.number().int().min(50).max(160).nullable(),
  domains: z.record(z.enum(["logico", "numerico", "verbal", "memoria"]), z.number().int().min(50).max(160).nullable()),
  total: z.number().int().min(1).max(60), correct: z.number().int().min(0).max(60) });

/** Salva uma sessão da Mente. O XP vem dela (ver game-data). */
export async function saveMindSession(input: z.infer<typeof S>): Promise<string | null> {
  const p = S.safeParse(input); if (!p.success) return "Sessão inválida.";
  if (p.data.correct > p.data.total) return "Sessão inválida.";
  const sb = await createClient();
  const { error } = await sb.from("mind_sessions").insert({ ...p.data, date: new Date(Date.now() - 3 * 36e5).toISOString().slice(0, 10) });
  if (error) return /relation|schema cache/i.test(error.message) ? "Rode o SQL 20261129000000_mente.sql no Supabase." : error.message;
  revalidatePath("/status"); revalidatePath("/");
  return null;
}
