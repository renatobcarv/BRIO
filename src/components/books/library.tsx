"use client";
import { BookStack } from "@/components/meters";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { logReading } from "@/app/(app)/livros/actions";
import { updateSettings } from "@/app/settings-actions";
import { Ring, Empty } from "@/components/ui";
import { Field, LinkBtn, Progress, SectionTitle, Segmented, Sheet, Stat, fmt, n } from "@/components/kit";
import { addDays, diffDays, shortDate, monthLabel } from "@/lib/date";
import { BOOK_COLOR as B, NOTE_KINDS, STATUS, progressOf, type Book, type BookNote, type BookStatus, type NoteKind, type Session } from "@/lib/books";
import { AddBook, Cover, Stars } from "./parts";

type View = "lendo" | "estante" | "notas" | "stats";

/** Ritmo (páginas/dia) dos últimos 14 dias e previsão de término. */
export function pace(book: Book, sessions: Session[], today: string) {
  const recent = sessions.filter((s) => s.book_id === book.id && diffDays(today, s.date) < 14);
  const pages = recent.reduce((a, s) => a + Math.max(0, s.to_page - s.from_page), 0);
  const days = recent.length ? Math.max(1, diffDays(today, recent.map((s) => s.date).sort()[0]) + 1) : 0;
  const perDay = days ? pages / days : 0;
  const left = book.pages ? Math.max(0, book.pages - book.current_page) : 0;
  return { perDay, eta: perDay > 0 && left > 0 ? addDays(today, Math.ceil(left / perDay)) : null, left };
}

function ReadingCard({ b, sessions, today }: { b: Book; sessions: Session[]; today: string }) {
  const [pending, start] = useTransition();
  const [page, setPage] = useState(String(b.current_page || ""));
  const [msg, setMsg] = useState("");
  const pct = progressOf(b), p = pace(b, sessions, today);
  return (
    <article className="glass rise p-4 flex gap-4">
      <Link href={`/livros/${b.id}`} className="shrink-0"><Cover src={b.cover_url} title={b.title} authors={b.authors} className="w-[84px] h-[126px]" /></Link>
      <div className="flex-1 min-w-0 flex flex-col">
        <Link href={`/livros/${b.id}`} className="font-display text-lg leading-snug line-clamp-2">{b.title}</Link>
        <p className="text-sm text-muted truncate">{b.authors}</p>
        <div className="mt-auto pt-2">
          <div className="flex justify-between text-xs text-muted mb-1"><span>{b.pages ? `pág. ${b.current_page} de ${b.pages}` : `pág. ${b.current_page}`}</span><span className="num" style={{ color: B }}>{Math.round(pct * 100)}%</span></div>
          <Progress value={pct} color={B} height={6} />
          <p className="text-[11px] text-faint mt-1">{p.perDay ? `${fmt(p.perDay)} pág/dia${p.eta ? ` · termina ~${shortDate(p.eta)}` : ""}` : "Registre a leitura para ver o ritmo"}</p>
          <div className="flex gap-2 mt-2">
            <input className="field !min-h-10 num" inputMode="numeric" placeholder="Página" value={page} onChange={(e) => setPage(e.target.value)} aria-label="Página atual" />
            <button className="btn !min-h-10" disabled={pending || !n(page) || n(page) === b.current_page}
              onClick={() => start(async () => { const fin = await logReading(b.id, Math.round(n(page)), null); setMsg(fin ? "Livro concluído! 🎉" : ""); })}>Salvar</button>
          </div>
          {msg && <p className="text-sm mt-1" style={{ color: B }}>{msg}</p>}
        </div>
      </div>
    </article>
  );
}

export function Library({ books, sessions, notes, goal, today }: { books: Book[]; sessions: Session[]; notes: (BookNote & { book: Pick<Book, "id" | "title" | "cover_url" | "authors"> })[]; goal: number; today: string }) {
  const [view, setView] = useState<View>("lendo");
  const [adding, setAdding] = useState(false);
  const [goalSheet, setGoalSheet] = useState(false);
  const [goalVal, setGoalVal] = useState(String(goal));
  const [pending, start] = useTransition();
  // Estante
  const [q, setQ] = useState("");
  const [st, setSt] = useState<BookStatus | "todos" | "favoritos">("todos");
  const [sort, setSort] = useState("recentes");
  const [tag, setTag] = useState("");
  // Notas
  const [nq, setNq] = useState("");
  const [nk, setNk] = useState<NoteKind | "">("");

  const reading = books.filter((b) => b.status === "lendo");
  const next = books.filter((b) => b.status === "quero_ler").slice(0, 10);
  const year = today.slice(0, 4);
  const readYear = books.filter((b) => b.status === "lido" && b.finished_at?.startsWith(year));
  const allTags = [...new Set(books.flatMap((b) => b.tags))].sort();

  const shelf = useMemo(() => {
    const l = books.filter((b) => (st === "todos" || (st === "favoritos" ? b.favorite : b.status === st)) && (!tag || b.tags.includes(tag))
      && (!q || `${b.title} ${b.authors ?? ""}`.toLowerCase().includes(q.toLowerCase())));
    const by: Record<string, (a: Book, b: Book) => number> = {
      recentes: (a, b) => b.created_at.localeCompare(a.created_at), titulo: (a, b) => a.title.localeCompare(b.title),
      autor: (a, b) => (a.authors ?? "").localeCompare(b.authors ?? ""), nota: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
      concluidos: (a, b) => (b.finished_at ?? "").localeCompare(a.finished_at ?? ""),
    };
    return [...l].sort(by[sort]);
  }, [books, st, tag, q, sort]);

  // Estatísticas
  const sessPages = (from: string) => sessions.filter((s) => s.date >= from).reduce((a, s) => a + Math.max(0, s.to_page - s.from_page), 0);
  const days = new Set(sessions.map((s) => s.date));
  let streak = 0; for (let d = days.has(today) ? today : addDays(today, -1); days.has(d); d = addDays(d, -1)) streak++;
  const rated = books.filter((b) => b.rating);
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
  const perMonth = months.map((m) => readYear.filter((b) => b.finished_at?.startsWith(m)).length);
  const last30 = Array.from({ length: 30 }, (_, i) => addDays(today, i - 29));
  const pagesDay = last30.map((d) => sessions.filter((s) => s.date === d).reduce((a, s) => a + Math.max(0, s.to_page - s.from_page), 0));
  const authors = new Map<string, number>(); for (const b of books.filter((b) => b.status === "lido")) for (const a of (b.authors ?? "").split(",").map((x) => x.trim()).filter(Boolean)) authors.set(a, (authors.get(a) ?? 0) + 1);
  const dayOfYear = diffDays(today, `${year}-01-01`) + 1;
  const expected = goal ? Math.floor((goal * dayOfYear) / 365) : 0;

  const filteredNotes = notes.filter((x) => (!nk || x.kind === nk) && (!nq || `${x.text} ${x.book.title}`.toLowerCase().includes(nq.toLowerCase())));

  return (
    <div style={{ ["--accent" as string]: B }}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Segmented value={view} onChange={setView} options={[["lendo", "Lendo"], ["estante", "Estante"], ["notas", "Anotações"], ["stats", "Números"]]} />
        <button className="btn btn-accent ml-auto" onClick={() => setAdding(true)}>+ Livro</button>
      </div>

      {view === "lendo" && (
        <>
          <section className="glass rise p-5 flex items-center gap-5">
            <span className="flex flex-col items-center shrink-0"><BookStack done={readYear.length} total={goal} size={72} color={B} /><span className="num text-lg mt-1">{readYear.length}/{goal}</span></span>
            <div className="flex-1">
              <div className="flex justify-between"><p className="label">Meta de {year}</p><LinkBtn onClick={() => setGoalSheet(true)}>Editar</LinkBtn></div>
              <p className="font-display text-xl">{readYear.length} de {goal} livros</p>
              <p className="text-sm text-muted">{readYear.length >= expected ? "No ritmo ou à frente." : `${expected - readYear.length} atrás do ritmo ideal.`}</p>
            </div>
          </section>
          <div className="grid gap-3 mt-4">
            {reading.length === 0 ? (
              <section className="glass p-5"><Empty>Nenhuma leitura em andamento.</Empty>
                {next.length > 0 && <p className="text-sm text-muted text-center -mt-4">Escolha um da lista abaixo e marque como “Lendo”.</p>}</section>
            ) : reading.map((b) => <ReadingCard key={b.id} b={b} sessions={sessions} today={today} />)}
          </div>
          {next.length > 0 && (
            <section className="mt-6">
              <SectionTitle>Próximos da fila</SectionTitle>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
                {next.map((b) => (
                  <Link key={b.id} href={`/livros/${b.id}`} className="shrink-0 w-24">
                    <Cover src={b.cover_url} title={b.title} authors={b.authors} className="w-24 h-36" />
                    <p className="text-xs mt-1.5 line-clamp-2 leading-snug">{b.title}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {view === "estante" && (
        <>
          <div className="grid gap-2">
            <input className="field" placeholder="Buscar por título ou autor…" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="flex gap-2 overflow-x-auto pb-1">
              {([["todos", "Todos"], ["lendo", "Lendo"], ["quero_ler", "Quero ler"], ["lido", "Lidos"], ["abandonado", "Abandonados"], ["favoritos", "♥ Favoritos"]] as const).map(([k, l]) =>
                <button key={k} className="chip shrink-0" aria-pressed={st === k} onClick={() => setSt(k)}>{l} <span className="ml-1 opacity-60">{k === "todos" ? books.length : k === "favoritos" ? books.filter((b) => b.favorite).length : books.filter((b) => b.status === k).length}</span></button>)}
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <select className="field !w-auto !min-h-9 text-sm !rounded-full" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Ordenar">
                <option value="recentes">Adicionados recentemente</option><option value="titulo">Título</option><option value="autor">Autor</option><option value="nota">Melhor nota</option><option value="concluidos">Concluídos recentemente</option>
              </select>
              {allTags.map((t) => <button key={t} className="chip !min-h-9 text-xs" aria-pressed={tag === t} onClick={() => setTag(tag === t ? "" : t)}>#{t}</button>)}
            </div>
          </div>
          {shelf.length === 0 ? <section className="glass p-5 mt-4"><Empty>{books.length ? "Nenhum livro com esses filtros." : "Sua estante começa com o primeiro livro."}</Empty></section> : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-x-3 gap-y-5 mt-4">
              {shelf.map((b) => (
                <Link key={b.id} href={`/livros/${b.id}`} className="group rise">
                  <div className="relative">
                    <Cover src={b.cover_url} title={b.title} authors={b.authors} className="w-full aspect-[2/3] transition-transform group-hover:-translate-y-1" />
                    <span className="absolute top-1.5 left-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-black/40" style={{ background: STATUS[b.status].color }} title={STATUS[b.status].label} />
                    {b.favorite && <span className="absolute top-1 right-1.5 text-sm" aria-label="Favorito">♥</span>}
                    {b.status === "lendo" && <div className="absolute inset-x-1.5 bottom-1.5"><Progress value={progressOf(b)} color={B} height={3} /></div>}
                  </div>
                  <p className="text-[13px] mt-2 leading-snug line-clamp-2">{b.title}</p>
                  <p className="text-[11px] text-muted truncate">{b.authors}</p>
                  {b.rating && <Stars value={b.rating} size={11} />}
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {view === "notas" && (
        <>
          <div className="grid gap-2">
            <input className="field" placeholder="Buscar nas anotações…" value={nq} onChange={(e) => setNq(e.target.value)} />
            <div className="flex gap-2">
              <button className="chip" aria-pressed={!nk} onClick={() => setNk("")}>Todas</button>
              {(Object.keys(NOTE_KINDS) as NoteKind[]).map((k) => <button key={k} className="chip" aria-pressed={nk === k} onClick={() => setNk(k)}>{NOTE_KINDS[k]}</button>)}
            </div>
          </div>
          {filteredNotes.length === 0 ? <section className="glass p-5 mt-4"><Empty>As frases que marcam você vão morar aqui.</Empty></section> : (
            <ul className="grid gap-3 mt-4">
              {filteredNotes.map((x) => (
                <li key={x.id}><Link href={`/livros/${x.book_id}#anotacoes`} className="glass rise p-4 flex gap-3">
                  <Cover src={x.book.cover_url} title={x.book.title} className="w-10 h-[60px] shrink-0" rounded="rounded" />
                  <div className="min-w-0 flex-1">
                    <p className="label">{NOTE_KINDS[x.kind]}{x.page ? ` · pág. ${x.page}` : ""} · {x.book.title}</p>
                    <p className={`mt-1 whitespace-pre-line ${x.kind === "citacao" ? "font-display italic text-[17px]" : "text-[15px]"}`}>{x.kind === "citacao" ? `“${x.text}”` : x.text}</p>
                  </div>
                </Link></li>
              ))}
            </ul>
          )}
        </>
      )}

      {view === "stats" && (
        <>
          <section className="glass rise p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Stat big label={`Lidos em ${year}`} value={readYear.length} sub={`meta ${goal}`} color={B} />
              <Stat big label="Páginas no mês" value={sessPages(today.slice(0, 8) + "01").toLocaleString("pt-BR")} sub={`${sessPages(addDays(today, -6))} nos últimos 7 dias`} />
              <Stat big label="Sequência" value={`${streak} d`} sub="dias seguidos lendo" />
              <Stat big label="Nota média" value={rated.length ? fmt(rated.reduce((a, b) => a + (b.rating ?? 0), 0) / rated.length) : "—"} sub={`${books.filter((b) => b.status === "lido").length} lidos no total`} />
            </div>
          </section>
          <section className="glass rise p-5 mt-4">
            <SectionTitle>Livros concluídos por mês</SectionTitle>
            <div className="flex items-end gap-1.5 h-32">
              {perMonth.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end" title={`${v} livro(s)`}>
                  {v > 0 && <span className="text-[10px] num">{v}</span>}
                  <div className="w-full rounded-md" style={{ height: `${(v / Math.max(1, ...perMonth)) * 85}%`, minHeight: 2, background: months[i] === today.slice(0, 7) ? B : B + "55" }} />
                  <span className="text-[10px] text-muted capitalize">{monthLabel(months[i] + "-01").slice(0, 3)}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="glass rise p-5 mt-4">
            <SectionTitle>Páginas por dia · 30 dias</SectionTitle>
            <div className="flex items-end gap-[3px] h-24">
              {pagesDay.map((v, i) => <div key={i} className="flex-1 rounded-sm" title={`${shortDate(last30[i])}: ${v} páginas`} style={{ height: `${(v / Math.max(1, ...pagesDay)) * 100}%`, minHeight: 2, background: v ? B : "rgba(255,255,255,.06)" }} />)}
            </div>
            <p className="text-xs text-muted mt-2">Média: {fmt(pagesDay.reduce((a, b) => a + b, 0) / 30)} páginas por dia</p>
          </section>
          {authors.size > 0 && (
            <section className="glass rise p-5 mt-4">
              <SectionTitle>Autores mais lidos</SectionTitle>
              <ul className="grid gap-2">{[...authors].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([a, c]) => <li key={a} className="flex justify-between text-sm"><span>{a}</span><span className="num text-muted">{c}</span></li>)}</ul>
            </section>
          )}
        </>
      )}

      <Sheet accent={B} open={adding} onClose={() => setAdding(false)} title="Adicionar livro"><AddBook onDone={() => setAdding(false)} /></Sheet>
      <Sheet accent={B} open={goalSheet} onClose={() => setGoalSheet(false)} title={`Meta de leitura ${year}`}>
        <Field label="Livros no ano" hint={`${fmt(n(goalVal) / 12)} por mês · cerca de ${Math.round(365 / Math.max(1, n(goalVal)))} dias por livro`}>
          <input className="field num text-lg" inputMode="numeric" value={goalVal} onChange={(e) => setGoalVal(e.target.value)} /></Field>
        <button className="btn btn-accent w-full mt-4" disabled={pending} onClick={() => start(async () => { await updateSettings({ books_goal_year: Math.round(n(goalVal)) }); setGoalSheet(false); })}>Salvar</button>
      </Sheet>
    </div>
  );
}
