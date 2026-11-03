import { PageHeader, Verse } from "@/components/ui";
import { Library } from "@/components/books/library";
import { addDays, todayISO } from "@/lib/date";
import { getSettings } from "@/lib/settings";
import type { Book, BookNote, Session } from "@/lib/books";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Page() {
  const sb = await createClient();
  const today = todayISO();
  const [s, books, sessions, notes] = await Promise.all([
    getSettings(sb),
    sb.from("books").select("*").order("created_at", { ascending: false }),
    sb.from("reading_sessions").select("id,book_id,date,from_page,to_page,minutes").gte("date", addDays(today, -400)),
    sb.from("book_notes").select("id,created_at,book_id,kind,page,text,books(id,title,cover_url,authors)").order("created_at", { ascending: false }).limit(500),
  ]);
  const noteList = (notes.data ?? []).map((x) => { const { books: bk, ...r } = x as unknown as BookNote & { books: Pick<Book, "id" | "title" | "cover_url" | "authors"> }; return { ...r, book: bk }; }).filter((x) => x.book);
  return (
    <>
      <PageHeader eyebrow="Livros" title="Leitura e aprendizado" color="#7fc4bd" />
      {books.error && <p className="glass p-4 mb-4 text-sm text-[#e8a39a]">A tabela de livros ainda não existe. Rode a migração <code>supabase/migrations/20261105000000_livros.sql</code> no SQL Editor do Supabase.</p>}
      <Library books={(books.data ?? []) as Book[]} sessions={(sessions.data ?? []) as Session[]} notes={noteList} goal={s.books_goal_year} today={today} />
      <Verse area="livros" />
    </>
  );
}
