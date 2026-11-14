"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const CATS = ["familia", "casa", "viagem", "carreira", "espiritual", "saude", "financas", "experiencia"] as const;
const msg = (m: string) => (/dreams/.test(m) ? "Rode a migração 20261120000000_sonhos.sql no Supabase." : m);
const done = () => { revalidatePath("/sonhos"); revalidatePath("/"); };

/** Cria ou edita um sonho; a imagem vai para o bucket privado (mesmo padrão da foto da Maria). */
export async function saveDream(form: FormData): Promise<string | null> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return "Entre de novo.";
  const r = z.object({ id: z.string().uuid().optional(), title: z.string().trim().min(1, "Dê um nome ao sonho.").max(120), why: z.string().max(1000),
    category: z.enum(CATS), target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")) }).safeParse({
    id: form.get("id") || undefined, title: form.get("title"), why: form.get("why") ?? "", category: form.get("category") ?? "experiencia", target_date: form.get("target_date") ?? "" });
  if (!r.success) return r.error.issues[0]?.message ?? "Confira os campos.";
  const row: Record<string, unknown> = { title: r.data.title, why: r.data.why || null, category: r.data.category, target_date: r.data.target_date || null };
  const file = form.get("image");
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) return "Use uma imagem de até 8 MB.";
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${user.id}/sonhos/${Date.now()}.${ext}`;
    const up = await sb.storage.from("privado").upload(path, file, { contentType: file.type, upsert: true });
    if (up.error) return up.error.message;
    if (r.data.id) { const { data: old } = await sb.from("dreams").select("image_path").eq("id", r.data.id).maybeSingle(); if (old?.image_path) await sb.storage.from("privado").remove([old.image_path]); }
    row.image_path = path;
  }
  const { error } = r.data.id ? await sb.from("dreams").update(row).eq("id", r.data.id) : await sb.from("dreams").insert(row);
  done(); return error ? msg(error.message) : null;
}
export async function setDreamDone(id: string, isDone: boolean): Promise<string | null> {
  const sb = await createClient();
  const { error } = await sb.from("dreams").update({ done_at: isDone ? new Date(Date.now() - 3 * 36e5).toISOString().slice(0, 10) : null }).eq("id", z.string().uuid().parse(id));
  done(); return error ? msg(error.message) : null;
}
export async function deleteDream(id: string): Promise<string | null> {
  const sb = await createClient();
  const { data: old } = await sb.from("dreams").select("image_path").eq("id", z.string().uuid().parse(id)).maybeSingle();
  if (old?.image_path) await sb.storage.from("privado").remove([old.image_path]);
  const { error } = await sb.from("dreams").delete().eq("id", id);
  done(); return error ? msg(error.message) : null;
}
