"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { SINGLETONS, TABLES } from "@/lib/tables";

const all = () => revalidatePath("/", "layout");

export async function saveChecklist(items: { key: string; label: string; primary?: boolean }[]) {
  const list = z.array(z.object({ key: z.string().min(1).max(60), label: z.string().trim().min(1).max(120), primary: z.boolean().optional() })).min(1).max(20).parse(items);
  const sb = await createClient();
  await sb.from("settings").update({ checklist: list }).not("id", "is", null); all();
}

export async function saveDefaults(input: Record<string, number>) {
  const p = z.object({
    pioneer_goal_minutes: z.number().int().min(0).max(300 * 60), water_goal_ml: z.number().int().min(500).max(10000),
    kcal_goal: z.number().int().min(800).max(8000), protein_goal_g: z.number().int().min(0).max(600),
    weight_start_kg: z.number().min(20).max(400), weight_goal_kg: z.number().min(20).max(400), weight_rate_kg_week: z.number().min(0).max(3),
  }).parse(input);
  const sb = await createClient();
  await sb.from("settings").update(p).not("id", "is", null); all();
}

export async function saveSplit(split: { dow: number; label: string; focus: string }[]) {
  const p = z.array(z.object({ dow: z.number().int().min(0).max(6), label: z.string().max(10), focus: z.string().max(80) })).length(7).parse(split);
  const sb = await createClient();
  await sb.from("settings").update({ workout_split: p }).not("id", "is", null); all();
}

export async function savePartner(form: FormData) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("não autenticado");
  const phrase = z.string().max(300).parse(form.get("phrase") ?? "");
  const patch: Record<string, string | null> = { partner_phrase: phrase || null };
  const file = form.get("photo");
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) throw new Error("Use uma imagem de até 5 MB.");
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${user.id}/maria-luisa-${Date.now()}.${ext}`;
    const { error } = await sb.storage.from("privado").upload(path, file, { contentType: file.type, upsert: true });
    if (error) throw new Error(error.message);
    const { data: old } = await sb.from("settings").select("partner_photo_path").maybeSingle();
    if (old?.partner_photo_path) await sb.storage.from("privado").remove([old.partner_photo_path]);
    patch.partner_photo_path = path;
  }
  await sb.from("settings").update(patch).not("id", "is", null); all();
}

/** Importa um backup do Brio. Linhas existentes com o mesmo id são atualizadas; nada é apagado. */
export async function importBackup(json: string) {
  const parsed = z.object({ app: z.literal("brio"), data: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))) }).parse(JSON.parse(json));
  const sb = await createClient();
  const report: string[] = [];
  for (const t of TABLES) {
    const rows = (parsed.data[t] ?? []).map(({ user_id: _u, ...r }) => r);
    if (!rows.length) continue;
    let error: { message: string } | null = null;
    if (SINGLETONS.has(t)) {
      // A foto mora no Storage do projeto de origem: o caminho não vale aqui.
      ({ error } = await sb.from(t).upsert(rows.slice(0, 1).map(({ id: _i, created_at: _c, partner_photo_path: _p, ...r }) => r), { onConflict: "user_id" }));
    } else {
      for (let i = 0; i < rows.length && !error; i += 500) ({ error } = await sb.from(t).upsert(rows.slice(i, i + 500), { onConflict: "id" }));
    }
    report.push(`${t}: ${error ? "erro – " + error.message : rows.length}`);
  }
  all();
  return report;
}
