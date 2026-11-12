"use server";
import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Ev = z.object({
  title: z.string().trim().min(1).max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  category: z.enum(["pessoal", "espiritual", "campo", "treino", "financas", "trabalho", "familia"]),
  location: z.string().max(200).nullable(),
  notes: z.string().max(2000).nullable(),
  remind_min: z.number().int().min(0).max(10080).nullable(),
});
const msg = (e: { message: string } | null) => (e ? (e.message.includes("calendar") ? "Rode a migração 20261116000000_agenda.sql no Supabase." : e.message) : null);

export async function saveEvent(input: z.input<typeof Ev>, id?: string): Promise<string | null> {
  const p = Ev.safeParse(input);
  if (!p.success) return p.error.issues[0]?.message ?? "Dados inválidos.";
  if (p.data.start_time && p.data.end_time && p.data.end_time <= p.data.start_time) return "O fim precisa ser depois do início.";
  const sb = await createClient();
  const { error } = id
    ? await sb.from("calendar_events").update({ ...p.data, updated_at: new Date().toISOString() }).eq("id", z.string().uuid().parse(id))
    : await sb.from("calendar_events").insert(p.data);
  revalidatePath("/agenda"); revalidatePath("/");
  return msg(error);
}
export async function deleteEvent(id: string): Promise<string | null> {
  const sb = await createClient();
  const { error } = await sb.from("calendar_events").delete().eq("id", z.string().uuid().parse(id));
  revalidatePath("/agenda"); revalidatePath("/");
  return msg(error);
}
/** Gera (ou troca) o link secreto. O antigo para de funcionar na hora. */
export async function rotateCalendarToken(): Promise<string | null> {
  const sb = await createClient();
  const { error } = await sb.from("settings").update({ calendar_token: randomBytes(24).toString("hex") }).not("id", "is", null);
  revalidatePath("/agenda");
  return msg(error);
}
export async function disableCalendarToken(): Promise<string | null> {
  const sb = await createClient();
  const { error } = await sb.from("settings").update({ calendar_token: null }).not("id", "is", null);
  revalidatePath("/agenda");
  return msg(error);
}
