"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/date";

const Id = z.string().uuid();
const Iso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Status = z.enum(["quero_ler", "lendo", "lido", "abandonado"]);
const ok = async (p: PromiseLike<{ error: { message: string } | null }>) => { const { error } = await p; if (error) throw new Error(error.message); };
const done = (id?: string) => { revalidatePath("/livros"); if (id) revalidatePath(`/livros/${id}`); revalidatePath("/"); revalidatePath("/metas"); };

const BookInput = z.object({
  title: z.string().trim().min(1).max(300), authors: z.string().max(300).nullable(), cover_url: z.string().url().max(1000).nullable().or(z.literal("").transform(() => null)),
  isbn: z.string().max(20).nullable(), publisher: z.string().max(200).nullable(), year: z.number().int().min(0).max(3000).nullable(),
  pages: z.number().int().min(0).max(100000).nullable(), description: z.string().max(10000).nullable(), categories: z.array(z.string().max(80)).max(10),
  tags: z.array(z.string().trim().min(1).max(40)).max(20), status: Status, format: z.enum(["fisico", "ebook", "audio"]), source_id: z.string().max(200).nullable(),
});

export async function addBook(input: z.input<typeof BookInput>) {
  const p = BookInput.parse(input);
  const sb = await createClient();
  const today = todayISO();
  const { data, error } = await sb.from("books").insert({
    ...p, started_at: p.status === "lendo" || p.status === "lido" ? today : null, finished_at: p.status === "lido" ? today : null,
    current_page: p.status === "lido" ? p.pages ?? 0 : 0,
  }).select("id").single();
  if (error) throw new Error(error.message);
  done();
  return data.id as string;
}

export async function updateBook(id: string, patch: Partial<z.input<typeof BookInput>> & {
  rating?: number | null; favorite?: boolean; current_page?: number; started_at?: string | null; finished_at?: string | null;
  summary?: string | null; lessons?: string | null; application?: string | null;
}) {
  const p = BookInput.partial().extend({
    rating: z.number().int().min(1).max(5).nullable().optional(), favorite: z.boolean().optional(), current_page: z.number().int().min(0).max(100000).optional(),
    started_at: Iso.nullable().optional(), finished_at: Iso.nullable().optional(),
    summary: z.string().max(50000).nullable().optional(), lessons: z.string().max(20000).nullable().optional(), application: z.string().max(20000).nullable().optional(),
  }).parse(patch);
  const sb = await createClient();
  await ok(sb.from("books").update(p).eq("id", Id.parse(id)));
  done(id);
}

/** Muda o status preenchendo as datas de forma coerente. */
export async function setStatus(id: string, status: z.infer<typeof Status>) {
  const s = Status.parse(status);
  const sb = await createClient();
  const { data: b } = await sb.from("books").select("pages,current_page,started_at").eq("id", Id.parse(id)).single();
  const today = todayISO();
  const patch: Record<string, unknown> = { status: s };
  if (s === "lendo") { patch.started_at = b?.started_at ?? today; patch.finished_at = null; }
  if (s === "lido") { patch.started_at = b?.started_at ?? today; patch.finished_at = today; if (b?.pages) patch.current_page = b.pages; }
  if (s === "quero_ler") { patch.finished_at = null; }
  await ok(sb.from("books").update(patch).eq("id", id));
  done(id);
}

export async function deleteBook(id: string) {
  const sb = await createClient(); await ok(sb.from("books").delete().eq("id", Id.parse(id))); done();
}

/** Registra páginas lidas: atualiza a página atual e cria a sessão. */
export async function logReading(id: string, toPage: number, minutes: number | null, date?: string) {
  const p = z.object({ to: z.number().int().min(0).max(100000), min: z.number().int().min(0).max(1440).nullable(), date: Iso }).parse({ to: toPage, min: minutes, date: date ?? todayISO() });
  const sb = await createClient();
  const { data: b, error } = await sb.from("books").select("current_page,pages,status,started_at").eq("id", Id.parse(id)).single();
  if (error || !b) throw new Error("Livro não encontrado");
  const to = b.pages ? Math.min(p.to, b.pages) : p.to;
  if (to !== b.current_page) await ok(sb.from("reading_sessions").insert({ book_id: id, date: p.date, from_page: b.current_page, to_page: to, minutes: p.min }));
  const patch: Record<string, unknown> = { current_page: to };
  if (b.status === "quero_ler") { patch.status = "lendo"; patch.started_at = b.started_at ?? p.date; }
  const finished = !!b.pages && to >= b.pages;
  if (finished) { patch.status = "lido"; patch.finished_at = p.date; }
  await ok(sb.from("books").update(patch).eq("id", id));
  done(id);
  return finished;
}
export async function deleteSession(id: string, bookId: string) {
  const sb = await createClient(); await ok(sb.from("reading_sessions").delete().eq("id", Id.parse(id))); done(bookId);
}

const Note = z.object({ kind: z.enum(["citacao", "anotacao", "reflexao"]), page: z.number().int().min(0).max(100000).nullable(), text: z.string().trim().min(1).max(10000) });
export async function saveNote(bookId: string, input: z.infer<typeof Note>, id?: string) {
  const p = Note.parse(input);
  const sb = await createClient();
  if (id) await ok(sb.from("book_notes").update(p).eq("id", Id.parse(id)));
  else await ok(sb.from("book_notes").insert({ ...p, book_id: Id.parse(bookId) }));
  done(bookId);
}
export async function deleteNote(id: string, bookId: string) {
  const sb = await createClient(); await ok(sb.from("book_notes").delete().eq("id", Id.parse(id))); done(bookId);
}
