"use server";
// Páginas espirituais: criar, editar, capa e imagens no bucket privado.
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const MISSING = "Rode a migração 20261123000000_paginas_espirituais.sql no Supabase.";
const msg = (e: { message: string } | null) => (e ? (/relation|does not exist|schema cache/i.test(e.message) ? MISSING : e.message) : null);
const refresh = () => { revalidatePath("/espiritual"); revalidatePath("/espiritual/pagina", "layout"); };

export async function createPage(input: { kind?: string; bible_book?: number | null; bible_chapter?: number | null; title?: string }): Promise<{ id?: string; error?: string }> {
  const p = z.object({ kind: z.enum(["estudo", "historia", "capitulo", "diario", "pregacao"]).default("estudo"), bible_book: z.number().int().min(1).max(66).nullable().optional(), bible_chapter: z.number().int().min(1).max(150).nullable().optional(), title: z.string().trim().max(200).optional() }).safeParse(input);
  if (!p.success) return { error: "Dados inválidos." };
  const sb = await createClient();
  const { data, error } = await sb.from("spirit_pages").insert({ kind: p.data.kind, bible_book: p.data.bible_book ?? null, bible_chapter: p.data.bible_chapter ?? null, title: p.data.title || "Sem título" }).select("id").single();
  refresh();
  return error ? { error: msg(error)! } : { id: data.id };
}

const Patch = z.object({ title: z.string().trim().min(1).max(200), content: z.string().max(100000), kind: z.enum(["estudo", "historia", "capitulo", "diario", "pregacao"]), bible_book: z.number().int().min(1).max(66).nullable(), bible_chapter: z.number().int().min(1).max(150).nullable(), pinned: z.boolean() }).partial();
export async function savePage(id: string, patch: z.input<typeof Patch>): Promise<string | null> {
  const p = Patch.safeParse(patch);
  if (!p.success) return "Dados inválidos.";
  const sb = await createClient();
  const { error } = await sb.from("spirit_pages").update({ ...p.data, updated_at: new Date().toISOString() }).eq("id", z.string().uuid().parse(id));
  refresh(); return msg(error);
}

export async function deletePage(id: string): Promise<string | null> {
  const sb = await createClient();
  const pid = z.string().uuid().parse(id);
  const { data } = await sb.from("spirit_pages").select("cover_path,content").eq("id", pid).maybeSingle();
  const { error } = await sb.from("spirit_pages").delete().eq("id", pid);
  if (!error && data) {
    const paths = [data.cover_path, ...[...(data.content as string).matchAll(/\(img:([^)\s]+)\)/g)].map((m) => m[1])].filter(Boolean) as string[];
    if (paths.length) await sb.storage.from("privado").remove(paths);
  }
  refresh(); return msg(error);
}

/** Envia imagem (capa ou corpo). Devolve o caminho privado e uma URL temporária para mostrar já. */
export async function uploadPageImage(fd: FormData): Promise<{ path?: string; url?: string; error?: string }> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Entre de novo." };
  const file = fd.get("file"), pageId = String(fd.get("page") ?? ""), cover = fd.get("cover") === "1";
  if (!(file instanceof File) || !file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) return { error: "Use uma imagem de até 8 MB." };
  if (!/^[0-9a-f-]{36}$/.test(pageId)) return { error: "Página inválida." };
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
  const path = `${user.id}/paginas/${pageId}/${Date.now()}.${ext}`;
  const up = await sb.storage.from("privado").upload(path, file, { contentType: file.type, upsert: false });
  if (up.error) return { error: "Não consegui enviar a imagem." };
  if (cover) {
    const { data: old } = await sb.from("spirit_pages").select("cover_path").eq("id", pageId).maybeSingle();
    const { error } = await sb.from("spirit_pages").update({ cover_path: path, updated_at: new Date().toISOString() }).eq("id", pageId);
    if (error) return { error: msg(error)! };
    if (old?.cover_path) await sb.storage.from("privado").remove([old.cover_path]);
    refresh();
  }
  const { data: s } = await sb.storage.from("privado").createSignedUrl(path, 3600);
  return { path, url: s?.signedUrl };
}
