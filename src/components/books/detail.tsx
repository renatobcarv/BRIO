"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteBook, deleteNote, deleteSession, logReading, saveNote, setStatus, updateBook } from "@/app/(app)/livros/actions";
import { Empty } from "@/components/ui";
import { Field, Progress, SectionTitle, Segmented, Sheet, fmt, n } from "@/components/kit";
import { shortDate } from "@/lib/date";
import { BOOK_COLOR as B, FORMATS, NOTE_KINDS, STATUS, progressOf, type Book, type BookFormat, type BookNote, type BookStatus, type NoteKind, type Session } from "@/lib/books";
import { Cover, Stars } from "./parts";
import { pace } from "./library";

/** Texto longo que salva sozinho ao sair do campo. */
function AutoText({ id, field, initial, placeholder, rows = 6, display }: { id: string; field: "summary" | "lessons" | "application"; initial: string; placeholder: string; rows?: number; display?: boolean }) {
  const [v, setV] = useState(initial);
  const [saved, setSaved] = useState<"" | "salvando" | "salvo">("");
  const [, start] = useTransition();
  return (
    <div>
      <textarea className={`field leading-relaxed ${display ? "font-display text-[17px]" : ""}`} rows={rows} value={v} placeholder={placeholder}
        onChange={(e) => { setV(e.target.value); setSaved(""); }}
        onBlur={() => { if (v === initial && saved === "") return; setSaved("salvando"); start(async () => { await updateBook(id, { [field]: v.trim() || null }); setSaved("salvo"); }); }} />
      <p className="text-xs h-4 mt-1" style={{ color: saved === "salvo" ? "#30d158" : "#5d5b56" }}>{saved === "salvando" ? "Salvando…" : saved === "salvo" ? "Salvo ✓" : "Salva automaticamente ao sair do campo"}</p>
    </div>
  );
}

function NoteForm({ bookId, note, onDone }: { bookId: string; note?: BookNote; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [f, setF] = useState({ kind: (note?.kind ?? "citacao") as NoteKind, page: note?.page != null ? String(note.page) : "", text: note?.text ?? "" });
  return (
    <div className="grid gap-3">
      <Segmented value={f.kind} onChange={(k) => setF({ ...f, kind: k })} options={Object.entries(NOTE_KINDS) as [NoteKind, string][]} />
      <textarea className={`field ${f.kind === "citacao" ? "font-display italic text-[17px]" : ""}`} rows={6} autoFocus value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })}
        placeholder={f.kind === "citacao" ? "Copie o trecho exatamente como está no livro" : f.kind === "reflexao" ? "O que isso muda em você?" : "Sua anotação"} />
      <Field label="Página (opcional)"><input className="field num !w-32" inputMode="numeric" value={f.page} onChange={(e) => setF({ ...f, page: e.target.value })} /></Field>
      <div className="flex gap-2">
        {note && <button className="btn text-muted" disabled={pending} onClick={() => { if (confirm("Excluir anotação?")) start(async () => { await deleteNote(note.id, bookId); onDone(); }); }}>Excluir</button>}
        <button className="btn btn-accent flex-1" disabled={pending || !f.text.trim()} onClick={() => start(async () => {
          await saveNote(bookId, { kind: f.kind, page: f.page ? Math.round(n(f.page)) : null, text: f.text }, note?.id); onDone();
        })}>{pending ? "Salvando…" : "Salvar"}</button>
      </div>
    </div>
  );
}

function EditBook({ b, onDone }: { b: Book; onDone: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [f, setF] = useState({ title: b.title, authors: b.authors ?? "", cover_url: b.cover_url ?? "", pages: b.pages != null ? String(b.pages) : "", isbn: b.isbn ?? "",
    publisher: b.publisher ?? "", year: b.year != null ? String(b.year) : "", tags: b.tags.join(", "), started_at: b.started_at ?? "", finished_at: b.finished_at ?? "", format: b.format });
  const set = (p: Partial<typeof f>) => setF({ ...f, ...p });
  return (
    <div className="grid gap-3">
      <Field label="Título"><input className="field" value={f.title} onChange={(e) => set({ title: e.target.value })} /></Field>
      <Field label="Autor(es)"><input className="field" value={f.authors} onChange={(e) => set({ authors: e.target.value })} /></Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Páginas"><input className="field num" inputMode="numeric" value={f.pages} onChange={(e) => set({ pages: e.target.value })} /></Field>
        <Field label="Ano"><input className="field num" inputMode="numeric" value={f.year} onChange={(e) => set({ year: e.target.value })} /></Field>
        <Field label="ISBN"><input className="field" value={f.isbn} onChange={(e) => set({ isbn: e.target.value })} /></Field>
      </div>
      <Field label="Editora"><input className="field" value={f.publisher} onChange={(e) => set({ publisher: e.target.value })} /></Field>
      <Field label="Etiquetas" hint="Separe por vírgula. Ex.: espiritual, finanças, liderança"><input className="field" value={f.tags} onChange={(e) => set({ tags: e.target.value })} /></Field>
      <Field label="Formato"><Segmented value={f.format} onChange={(v) => set({ format: v })} options={Object.entries(FORMATS) as [BookFormat, string][]} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Começou em"><input type="date" className="field" value={f.started_at} onChange={(e) => set({ started_at: e.target.value })} /></Field>
        <Field label="Terminou em"><input type="date" className="field" value={f.finished_at} onChange={(e) => set({ finished_at: e.target.value })} /></Field>
      </div>
      <Field label="Link da capa"><input className="field" value={f.cover_url} onChange={(e) => set({ cover_url: e.target.value })} placeholder="https://…" /></Field>
      <div className="flex gap-2 mt-1">
        <button className="btn text-muted" disabled={pending} onClick={() => { if (confirm(`Excluir “${b.title}” e todas as anotações?`)) start(async () => { await deleteBook(b.id); router.push("/livros"); }); }}>Excluir livro</button>
        <button className="btn btn-accent flex-1" disabled={pending || !f.title.trim()} onClick={() => start(async () => {
          await updateBook(b.id, { title: f.title, authors: f.authors || null, cover_url: f.cover_url || null, pages: f.pages ? Math.round(n(f.pages)) : null, isbn: f.isbn || null,
            publisher: f.publisher || null, year: f.year ? Math.round(n(f.year)) : null, tags: f.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
            started_at: f.started_at || null, finished_at: f.finished_at || null, format: f.format });
          onDone();
        })}>{pending ? "Salvando…" : "Salvar"}</button>
      </div>
    </div>
  );
}

export function BookDetail({ book: b, notes, sessions, today }: { book: Book; notes: BookNote[]; sessions: Session[]; today: string }) {
  const [pending, start] = useTransition();
  const [sheet, setSheet] = useState<null | "edit" | "note" | BookNote>(null);
  const [page, setPage] = useState(String(b.current_page || ""));
  const [mins, setMins] = useState("");
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState<"resumo" | "licoes" | "aplicar" | "sobre">("resumo");
  const [more, setMore] = useState(false);
  const pct = progressOf(b), p = pace(b, sessions, today);
  const totalMin = sessions.reduce((a, s) => a + (s.minutes ?? 0), 0);
  const close = () => setSheet(null);

  return (
    <div style={{ ["--accent" as string]: B }}>
      <Link href="/livros" className="text-sm text-muted inline-flex items-center min-h-11 -mt-2 mb-2">‹ Livros</Link>

      <header className="rise flex gap-5 items-start">
        <Cover src={b.cover_url} title={b.title} authors={b.authors} className="w-28 sm:w-36 aspect-[2/3] shrink-0" rounded="rounded-xl" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl sm:text-3xl leading-tight">{b.title}</h1>
          <p className="text-muted mt-1">{b.authors}</p>
          <p className="text-xs text-faint mt-1">{[b.publisher, b.year, b.pages && `${b.pages} páginas`, FORMATS[b.format]].filter(Boolean).join(" · ")}</p>
          <div className="flex items-center gap-1 mt-2 -ml-1 flex-wrap">
            <Stars value={b.rating} onChange={(v) => start(() => updateBook(b.id, { rating: v }))} />
            <button className="min-h-11 min-w-11 text-xl" aria-pressed={b.favorite} aria-label={b.favorite ? "Remover dos favoritos" : "Favoritar"}
              onClick={() => start(() => updateBook(b.id, { favorite: !b.favorite }))} style={{ color: b.favorite ? "#ff453a" : "#5d5b56" }}>{b.favorite ? "♥" : "♡"}</button>
          </div>
          {b.tags.length > 0 && <div className="flex flex-wrap gap-1.5 mt-1">{b.tags.map((t) => <span key={t} className="tag">#{t}</span>)}</div>}
          <button className="text-sm text-muted mt-2 min-h-9" onClick={() => setSheet("edit")}>Editar dados</button>
        </div>
      </header>

      <div className="mt-5 rise"><Segmented value={b.status} onChange={(s: BookStatus) => start(() => setStatus(b.id, s))} options={(Object.keys(STATUS) as BookStatus[]).map((k) => [k, STATUS[k].label])} /></div>

      {b.status !== "quero_ler" && (
        <section className="glass rise p-5 mt-4">
          <SectionTitle>Progresso</SectionTitle>
          <div className="flex justify-between text-sm mb-1.5"><span className="text-muted">{b.pages ? `Página ${b.current_page} de ${b.pages}` : `Página ${b.current_page}`}</span><span className="num" style={{ color: B }}>{Math.round(pct * 100)}%</span></div>
          <Progress value={pct} color={B} />
          <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
            <div><p className="label">Ritmo</p><p className="num text-lg">{p.perDay ? `${fmt(p.perDay)} p/dia` : "—"}</p></div>
            <div><p className="label">Previsão</p><p className="num text-lg">{b.status === "lido" ? "concluído" : p.eta ? shortDate(p.eta) : "—"}</p></div>
            <div><p className="label">Tempo lendo</p><p className="num text-lg">{totalMin ? `${Math.floor(totalMin / 60)}h${String(totalMin % 60).padStart(2, "0")}` : "—"}</p></div>
          </div>
          {b.status !== "lido" && (
            <div className="grid grid-cols-[1fr_6rem_auto] gap-2 mt-4 items-end">
              <Field label="Estou na página"><input className="field num" inputMode="numeric" value={page} onChange={(e) => setPage(e.target.value)} /></Field>
              <Field label="Minutos"><input className="field num" inputMode="numeric" placeholder="opc." value={mins} onChange={(e) => setMins(e.target.value)} /></Field>
              <button className="btn btn-accent" disabled={pending || !n(page) || n(page) === b.current_page} onClick={() => start(async () => {
                const fin = await logReading(b.id, Math.round(n(page)), mins ? Math.round(n(mins)) : null); setMins(""); setMsg(fin ? "Livro concluído! Que tal escrever o resumo agora?" : "Leitura registrada.");
              })}>Salvar</button>
            </div>
          )}
          {msg && <p className="text-sm mt-2" style={{ color: B }}>{msg}</p>}
          <p className="text-xs text-faint mt-3">{b.started_at && `Começou em ${shortDate(b.started_at)} ${b.started_at.slice(0, 4)}`}{b.finished_at && ` · terminou em ${shortDate(b.finished_at)} ${b.finished_at.slice(0, 4)}`}</p>
          {sessions.length > 0 && (
            <details className="mt-3">
              <summary className="text-sm text-muted cursor-pointer min-h-9 flex items-center">Sessões de leitura ({sessions.length})</summary>
              <ul className="mt-2">
                {sessions.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 text-sm min-h-10">
                    <span className="text-muted w-16">{shortDate(s.date)}</span>
                    <span className="flex-1">pág. {s.from_page} → {s.to_page} <span className="text-faint">(+{s.to_page - s.from_page})</span></span>
                    {s.minutes && <span className="text-muted">{s.minutes} min</span>}
                    <button className="btn !min-h-8 !px-2 text-muted" aria-label="Excluir sessão" onClick={() => start(() => deleteSession(s.id, b.id))}>✕</button>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
      )}

      <section className="glass rise p-5 mt-4">
        <Segmented value={tab} onChange={setTab} options={[["resumo", "Resumo"], ["licoes", "Lições"], ["aplicar", "Aplicar"], ["sobre", "Sobre"]]} />
        <div className="mt-4">
          {tab === "resumo" && <AutoText key="s" id={b.id} field="summary" initial={b.summary ?? ""} rows={10} display placeholder="Do que o livro trata, em suas palavras. Escrever o resumo é o que fixa o aprendizado." />}
          {tab === "licoes" && <AutoText key="l" id={b.id} field="lessons" initial={b.lessons ?? ""} rows={8} placeholder={"As ideias principais, uma por linha:\n• …\n• …"} />}
          {tab === "aplicar" && <AutoText key="a" id={b.id} field="application" initial={b.application ?? ""} rows={6} placeholder="O que vou fazer de diferente a partir deste livro? Seja concreto: o quê, quando, como." />}
          {tab === "sobre" && (b.description ? (
            <div><p className={`text-[15px] text-muted leading-relaxed whitespace-pre-line ${more ? "" : "line-clamp-6"}`}>{b.description}</p>
              <button className="text-sm mt-1 min-h-9" style={{ color: B }} onClick={() => setMore(!more)}>{more ? "Ver menos" : "Ver mais"}</button>
              {b.categories.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2">{b.categories.map((c) => <span key={c} className="tag">{c}</span>)}</div>}
              {b.isbn && <p className="text-xs text-faint mt-3">ISBN {b.isbn}</p>}</div>
          ) : <p className="font-display italic text-muted">Sem sinopse. Edite os dados para completar.</p>)}
        </div>
      </section>

      <section id="anotacoes" className="glass rise p-5 mt-4 scroll-mt-4">
        <SectionTitle action={<button className="btn !min-h-9 text-sm" onClick={() => setSheet("note")}>+ Anotação</button>}>Anotações · {notes.length}</SectionTitle>
        {notes.length === 0 ? <Empty>Marque as frases que valem guardar.</Empty> : (
          <ul className="grid gap-3">
            {notes.map((x) => (
              <li key={x.id}><button className="w-full text-left rounded-2xl bg-white/[.03] hover:bg-white/[.05] transition-colors p-4 border-l-2" style={{ borderColor: x.kind === "citacao" ? B : x.kind === "reflexao" ? "#ffb340" : "#0a84ff" }} onClick={() => setSheet(x)}>
                <p className="label">{NOTE_KINDS[x.kind]}{x.page != null ? ` · pág. ${x.page}` : ""}</p>
                <p className={`mt-1.5 whitespace-pre-line ${x.kind === "citacao" ? "font-display italic text-[17px] leading-relaxed" : "text-[15px]"}`}>{x.kind === "citacao" ? `“${x.text}”` : x.text}</p>
              </button></li>
            ))}
          </ul>
        )}
      </section>

      <Sheet accent={B} open={sheet === "edit"} onClose={close} title="Editar livro">{sheet === "edit" && <EditBook b={b} onDone={close} />}</Sheet>
      <Sheet accent={B} open={sheet === "note" || (!!sheet && typeof sheet === "object")} onClose={close} title={typeof sheet === "object" && sheet ? "Editar anotação" : "Nova anotação"}>
        {sheet === "note" && <NoteForm bookId={b.id} onDone={close} />}
        {sheet && typeof sheet === "object" && <NoteForm key={sheet.id} bookId={b.id} note={sheet} onDone={close} />}
      </Sheet>
    </div>
  );
}
