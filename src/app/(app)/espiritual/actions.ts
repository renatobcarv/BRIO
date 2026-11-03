"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/date";

const Iso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const done = () => { revalidatePath("/espiritual"); revalidatePath("/"); };

export async function addStudy(input: { date: string; type: string; material: string; minutes: number; takeaway: string }) {
  const p = z.object({ date: Iso, type: z.enum(["biblia", "publicacao", "meio_semana", "sentinela", "pesquisa", "outro"]),
    material: z.string().max(300), minutes: z.number().int().min(0).max(1440), takeaway: z.string().max(2000) }).parse(input);
  const sb = await createClient();
  const { error } = await sb.from("study_entries").insert({ ...p, material: p.material || null, takeaway: p.takeaway || null });
  if (error) throw new Error(error.message);
  done();
}
export async function deleteStudy(id: string) {
  const sb = await createClient(); await sb.from("study_entries").delete().eq("id", z.string().uuid().parse(id)); done();
}

export async function toggleChapter(book: number, chapter: number, read: boolean) {
  const p = z.object({ book: z.number().int().min(1).max(66), chapter: z.number().int().min(1).max(150), read: z.boolean() }).parse({ book, chapter, read });
  const sb = await createClient();
  if (p.read) await sb.from("bible_reading").upsert({ book: p.book, chapter: p.chapter, date_read: todayISO() }, { onConflict: "user_id,book,chapter" });
  else await sb.from("bible_reading").delete().eq("book", p.book).eq("chapter", p.chapter);
  done();
}

export async function addJournal(kind: string, text: string) {
  const p = z.object({ kind: z.enum(["oracao", "gratidao", "reflexao"]), text: z.string().trim().min(1).max(4000) }).parse({ kind, text });
  const sb = await createClient(); await sb.from("journal_entries").insert({ ...p, date: todayISO() }); done();
}
export async function deleteJournal(id: string) {
  const sb = await createClient(); await sb.from("journal_entries").delete().eq("id", z.string().uuid().parse(id)); done();
}
