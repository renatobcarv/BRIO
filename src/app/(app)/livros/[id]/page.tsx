import { notFound } from "next/navigation";
import { Verse } from "@/components/ui";
import { BookDetail } from "@/components/books/detail";
import { todayISO } from "@/lib/date";
import type { Book, BookNote, Session } from "@/lib/books";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const sb = await createClient();
  const [book, notes, sessions] = await Promise.all([
    sb.from("books").select("*").eq("id", id).maybeSingle(),
    sb.from("book_notes").select("*").eq("book_id", id).order("page", { nullsFirst: false }).order("created_at"),
    sb.from("reading_sessions").select("id,book_id,date,from_page,to_page,minutes").eq("book_id", id).order("date", { ascending: false }).order("created_at", { ascending: false }),
  ]);
  if (!book.data) notFound();
  return (
    <>
      <BookDetail key={id} book={book.data as Book} notes={(notes.data ?? []) as BookNote[]} sessions={(sessions.data ?? []) as Session[]} today={todayISO()} />
      <Verse area="livros" />
    </>
  );
}
