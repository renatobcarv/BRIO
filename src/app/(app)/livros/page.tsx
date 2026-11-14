import { Board, PageHeader, Verse } from "@/components/ui";
import { HI } from "@/components/hunt-icons";
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
    <div className="dash-auto">
      <PageHeader eyebrow="Livros" title="Leitura e aprendizado" icon={HI.book} line="Quem lê, enxerga longe." />
      {(() => { const bl = (books.data ?? []) as Book[], y = today.slice(0, 4), read = bl.filter((b) => b.status === "lido" && (b.finished_at ?? "").startsWith(y)).length;
        const ss = (sessions.data ?? []) as Session[], since = addDays(today, -6), pages = ss.filter((x) => x.date >= since).reduce((a, x) => a + Math.max(0, (x.to_page ?? 0) - (x.from_page ?? 0)), 0);
        return <Board icon={HI.trophy} label={`Livros lidos em ${y}`} big={String(read)} unit={`/ ${s.books_goal_year}`} bar={s.books_goal_year ? read / s.books_goal_year : 0}
          stats={[[HI.book, "Lendo", String(bl.filter((b) => b.status === "lendo").length), "agora"], [HI.list, "Páginas", String(pages), "últimos 7 dias"], [HI.pen, "Notas", String(noteList.length), "anotações"]]} />; })()}
      {books.error && <p className="glass p-4 mb-4 text-sm text-[#ff453a]">A tabela de livros ainda não existe. Rode a migração <code>supabase/migrations/20261105000000_livros.sql</code> no SQL Editor do Supabase.</p>}
      <Library books={(books.data ?? []) as Book[]} sessions={(sessions.data ?? []) as Session[]} notes={noteList} goal={s.books_goal_year} today={today} />
      <Verse area="livros" />
    </div>
  );
}
