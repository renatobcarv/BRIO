"use server";
// Certificados externos: cadastro com arquivo (PDF/imagem) no bucket privado.
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const s = (n: number) => z.string().trim().max(n).transform((v) => v || null);
const Cert = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, "Dê um nome ao certificado.").max(200),
  issuer: s(160), issued_at: s(10), expires_at: s(10), hours: z.string().trim().max(8).transform((v) => (v ? Number(v.replace(",", ".")) || null : null)),
  credential_id: s(160), url: s(500).refine((v) => !v || /^https?:\/\//i.test(v), "O link deve começar com http:// ou https://"), skills: s(500), notes: s(2000),
  kind: z.enum(["curso", "graduacao", "pos", "idioma", "evento", "certificacao", "outro"]).default("curso"),
  track_id: z.string().transform((v) => v || null),
});

export async function saveCertificate(fd: FormData): Promise<string | null> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return "Entre de novo.";
  const raw = Object.fromEntries(["id", "title", "issuer", "issued_at", "expires_at", "hours", "credential_id", "url", "skills", "notes", "kind", "track_id"].map((k) => [k, String(fd.get(k) ?? "")]));
  if (!raw.id) delete (raw as Record<string, string>).id;
  const p = Cert.safeParse(raw);
  if (!p.success) return p.error.issues[0]?.message ?? "Dados inválidos.";
  const { id, ...row } = p.data;
  let file_path: string | undefined;
  const file = fd.get("file");
  if (file instanceof File && file.size > 0) {
    if (!/^(application\/pdf|image\/)/.test(file.type) || file.size > 10 * 1024 * 1024) return "Envie PDF ou imagem de até 10 MB.";
    const ext = file.type === "application/pdf" ? "pdf" : (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5);
    file_path = `${user.id}/certificados/${Date.now()}.${ext}`;
    const up = await sb.storage.from("privado").upload(file_path, file, { contentType: file.type, upsert: true });
    if (up.error) return "Não consegui enviar o arquivo.";
    if (id) { const { data: old } = await sb.from("study_certificates").select("file_path").eq("id", id).maybeSingle(); if (old?.file_path) await sb.storage.from("privado").remove([old.file_path]); }
  }
  const data = { ...row, ...(file_path ? { file_path } : {}) };
  const { error } = id ? await sb.from("study_certificates").update(data).eq("id", id) : await sb.from("study_certificates").insert(data);
  revalidatePath("/estudos/conquistas");
  return error ? (/relation|does not exist|schema cache/i.test(error.message) ? "Rode a migração 20261122000000_certificados.sql no Supabase." : error.message) : null;
}

export async function deleteCertificate(id: string): Promise<string | null> {
  const sb = await createClient();
  const cid = z.string().uuid().parse(id);
  const { data: old } = await sb.from("study_certificates").select("file_path").eq("id", cid).maybeSingle();
  const { error } = await sb.from("study_certificates").delete().eq("id", cid);
  if (!error && old?.file_path) await sb.storage.from("privado").remove([old.file_path]);
  revalidatePath("/estudos/conquistas");
  return error?.message ?? null;
}
