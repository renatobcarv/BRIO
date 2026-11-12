"use server";
import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { accessToken, remove, revoke, upsert } from "@/lib/google";

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
  const { data: row, error } = id
    ? await sb.from("calendar_events").update({ ...p.data, updated_at: new Date().toISOString() }).eq("id", z.string().uuid().parse(id)).select("id,google_id").single()
    : await sb.from("calendar_events").insert(p.data).select("id,google_id").single();
  if (!error && row) await mirror(sb, row.id, p.data, (row as { google_id?: string | null }).google_id ?? null);
  revalidatePath("/agenda"); revalidatePath("/");
  return msg(error);
}

/** Espelha no Google Agenda, se conectado. Falha no Google não impede salvar no BRIO. */
async function mirror(sb: Awaited<ReturnType<typeof createClient>>, id: string, ev: z.infer<typeof Ev>, googleId: string | null) {
  const { data: g } = await sb.from("google_calendar").select("refresh_token,calendar_id").maybeSingle();
  if (!g) return;
  try {
    const gid = await upsert(await accessToken(g.refresh_token), g.calendar_id, ev, googleId);
    if (gid !== googleId) await sb.from("calendar_events").update({ google_id: gid }).eq("id", id);
  } catch { /* fica só no BRIO; a próxima edição tenta de novo */ }
}
export async function deleteEvent(id: string): Promise<string | null> {
  const sb = await createClient();
  const [{ data: ev }, { data: g }] = await Promise.all([
    sb.from("calendar_events").select("google_id").eq("id", z.string().uuid().parse(id)).maybeSingle(),
    sb.from("google_calendar").select("refresh_token,calendar_id").maybeSingle(),
  ]);
  if (g && ev?.google_id) { try { await remove(await accessToken(g.refresh_token), g.calendar_id, ev.google_id); } catch { /* segue */ } }
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

/** Envia ao Google todos os compromissos ainda não espelhados (a partir de hoje). */
export async function syncAllToGoogle(): Promise<string | null> {
  const sb = await createClient();
  const { data: g } = await sb.from("google_calendar").select("refresh_token,calendar_id").maybeSingle();
  if (!g) return "Google não conectado.";
  const today = new Date(Date.now() - 3 * 36e5).toISOString().slice(0, 10);
  const { data: evs } = await sb.from("calendar_events").select("id,title,date,start_time,end_time,category,location,notes,remind_min,google_id").gte("date", today).is("google_id", null).limit(200);
  try {
    const tok = await accessToken(g.refresh_token);
    for (const e of evs ?? []) { const gid = await upsert(tok, g.calendar_id, e as never, null); await sb.from("calendar_events").update({ google_id: gid }).eq("id", e.id); }
  } catch (e) { return e instanceof Error ? e.message : "Falha ao sincronizar."; }
  revalidatePath("/agenda");
  return null;
}
export async function disconnectGoogle(): Promise<string | null> {
  const sb = await createClient();
  const { data: g } = await sb.from("google_calendar").select("refresh_token").maybeSingle();
  if (g) await revoke(g.refresh_token);
  const { error } = await sb.from("google_calendar").delete().not("user_id", "is", null);
  await sb.from("calendar_events").update({ google_id: null }).not("google_id", "is", null);
  revalidatePath("/agenda");
  return msg(error);
}
