"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Trip = z.object({ start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).refine((t) => t.end >= t.start, "A volta precisa ser depois da ida.");

export async function saveTrips(trips: unknown): Promise<string | null> {
  const parsed = z.array(Trip).max(50).safeParse(trips);
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Datas inválidas.";
  const sb = await createClient();
  const { error } = await sb.from("settings").update({ travel: parsed.data }).not("id", "is", null);
  if (error) return error.message.includes("travel") ? "Rode a migração 20261115000000_viagem.sql no Supabase." : error.message;
  revalidatePath("/eventos"); revalidatePath("/"); revalidatePath("/corpo");
  return null;
}
