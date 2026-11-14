"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addBook } from "@/app/(app)/livros/actions";
import { Field, Segmented, n } from "@/components/kit";
import { BOOK_COLOR, FORMATS, STATUS, type BookFormat, type BookStatus, type SearchHit } from "@/lib/books";

/** Capa do livro; sem imagem, gera uma capa tipográfica. */
export function Cover({ src, title, authors, className = "", rounded = "rounded-lg" }: { src: string | null; title: string; authors?: string | null; className?: string; rounded?: string }) {
  const [err, setErr] = useState(false);
  const hue = [...title].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  if (src && !err) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={`Capa de ${title}`} loading="lazy" onError={() => setErr(true)} className={`${rounded} object-cover bg-white/5 shadow-[0_10px_30px_-12px_rgba(0,0,0,.8)] ${className}`} />;
  }
  return (
    <div className={`${rounded} p-2.5 flex flex-col justify-between overflow-hidden shadow-[0_10px_30px_-12px_rgba(0,0,0,.8)] ${className}`}
      style={{ background: `linear-gradient(160deg, hsl(${hue} 28% 26%), hsl(${(hue + 40) % 360} 30% 14%))` }} aria-label={`Capa de ${title}`}>
      <span className="font-display text-[13px] leading-tight text-white/90 line-clamp-4">{title}</span>
      {authors && <span className="text-[9px] uppercase tracking-wider text-white/55 line-clamp-2">{authors}</span>}
    </div>
  );
}

export function Stars({ value, onChange, size = 22 }: { value: number | null; onChange?: (v: number | null) => void; size?: number }) {
  const [hover, setHover] = useState(0);
  const v = hover || value || 0;
  return (
    <div className="inline-flex" role={onChange ? "radiogroup" : undefined} aria-label={`Nota ${value ?? 0} de 5`} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => {
        const star = <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"
          fill={i <= v ? "#ff4d8a" : "none"} stroke={i <= v ? "#ff4d8a" : "rgba(255,255,255,.25)"} strokeWidth="1.4" strokeLinejoin="round" /></svg>;
        return onChange ? (
          <button key={i} role="radio" aria-checked={value === i} aria-label={`${i} estrela${i > 1 ? "s" : ""}`} className="p-1 min-h-11 min-w-9 grid place-items-center"
            onMouseEnter={() => setHover(i)} onClick={() => onChange(value === i ? null : i)}>{star}</button>
        ) : <span key={i}>{star}</span>;
      })}
    </div>
  );
}

export function StatusPill({ status }: { status: BookStatus }) {
  return <span className="tag" style={{ color: STATUS[status].color }}><i className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS[status].color }} />{STATUS[status].label}</span>;
}

/* ───────── Adicionar livro: busca nas APIs ou manual ───────── */
export function AddBook({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<"busca" | "manual">("busca");
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [pick, setPick] = useState<SearchHit | null>(null);
  const [status, setStatus] = useState<BookStatus>("quero_ler");
  const [format, setFormat] = useState<BookFormat>("fisico");
  const [pending, start] = useTransition();
  const [m, setM] = useState({ title: "", authors: "", pages: "", cover_url: "", isbn: "", publisher: "", year: "" });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (mode !== "busca" || q.trim().length < 3) { setHits(null); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true); setErr("");
      try { const r = await fetch(`/api/livros/busca?q=${encodeURIComponent(q)}`); const j = await r.json(); setHits(j.results ?? []); }
      catch { setErr("Não foi possível buscar agora. Tente de novo ou cadastre manualmente."); }
      finally { setLoading(false); }
    }, 450);
    return () => clearTimeout(timer.current);
  }, [q, mode]);

  const save = (h: SearchHit | null) => start(async () => {
    setErr("");
    try {
      const base = h ?? { source_id: null, title: m.title, authors: m.authors, cover_url: m.cover_url || null, isbn: m.isbn || null, publisher: m.publisher || null,
        year: m.year ? Math.round(n(m.year)) : null, pages: m.pages ? Math.round(n(m.pages)) : null, description: null, categories: [] };
      const id = await addBook({ ...base, authors: base.authors || null, tags: [], status, format, source_id: base.source_id ?? null });
      onDone(); router.push(`/livros/${id}`);
    } catch (e) { setErr((e as Error).message); }
  });

  const options = (
    <div className="grid gap-3">
      <Field label="Status"><Segmented value={status} onChange={setStatus} options={[["quero_ler", "Quero ler"], ["lendo", "Lendo"], ["lido", "Lido"]]} /></Field>
      <Field label="Formato"><Segmented value={format} onChange={setFormat} options={Object.entries(FORMATS) as [BookFormat, string][]} /></Field>
    </div>
  );

  if (pick) return (
    <div className="grid gap-4">
      <div className="flex gap-4">
        <Cover src={pick.cover_url} title={pick.title} authors={pick.authors} className="w-24 h-36 shrink-0" />
        <div className="min-w-0">
          <p className="font-display text-xl leading-snug">{pick.title}</p>
          <p className="text-sm text-muted mt-1">{pick.authors}</p>
          <p className="text-xs text-faint mt-1">{[pick.publisher, pick.year, pick.pages && `${pick.pages} páginas`].filter(Boolean).join(" · ")}</p>
        </div>
      </div>
      {pick.description && <p className="text-sm text-muted line-clamp-5">{pick.description}</p>}
      {options}
      {err && <p role="alert" className="text-sm text-[#ff453a]">{err}</p>}
      <div className="flex gap-2"><button className="btn" onClick={() => setPick(null)}>Voltar</button>
        <button className="btn btn-accent flex-1" disabled={pending} onClick={() => save(pick)}>{pending ? "Adicionando…" : "Adicionar à estante"}</button></div>
    </div>
  );

  return (
    <div className="grid gap-4">
      <Segmented value={mode} onChange={setMode} options={[["busca", "Buscar"], ["manual", "Manual"]]} />
      {mode === "busca" ? (
        <>
          <input className="field" placeholder="Título, autor ou ISBN" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
          {loading && <p className="text-sm text-muted">Buscando…</p>}
          {err && <p role="alert" className="text-sm text-[#ff453a]">{err}</p>}
          {hits && hits.length === 0 && !loading && <p className="font-display italic text-muted">Nada encontrado. Tente outro termo ou cadastre manualmente.</p>}
          <ul className="grid gap-1">
            {(hits ?? []).map((h) => (
              <li key={h.source_id}><button className="row-hover w-full flex gap-3 p-2 text-left" onClick={() => setPick(h)}>
                <Cover src={h.cover_url} title={h.title} authors={h.authors} className="w-12 h-[72px] shrink-0" rounded="rounded-md" />
                <span className="min-w-0"><span className="block font-medium leading-snug line-clamp-2">{h.title}</span>
                  <span className="block text-sm text-muted truncate">{h.authors || "Autor desconhecido"}</span>
                  <span className="text-xs text-faint">{[h.year, h.pages && `${h.pages} p.`].filter(Boolean).join(" · ")}</span></span>
              </button></li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <Field label="Título"><input className="field" value={m.title} onChange={(e) => setM({ ...m, title: e.target.value })} /></Field>
          <Field label="Autor(es)"><input className="field" value={m.authors} onChange={(e) => setM({ ...m, authors: e.target.value })} /></Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Páginas"><input className="field num" inputMode="numeric" value={m.pages} onChange={(e) => setM({ ...m, pages: e.target.value })} /></Field>
            <Field label="Ano"><input className="field num" inputMode="numeric" value={m.year} onChange={(e) => setM({ ...m, year: e.target.value })} /></Field>
            <Field label="ISBN"><input className="field" value={m.isbn} onChange={(e) => setM({ ...m, isbn: e.target.value })} /></Field>
          </div>
          <Field label="Editora"><input className="field" value={m.publisher} onChange={(e) => setM({ ...m, publisher: e.target.value })} /></Field>
          <Field label="Link da capa (opcional)"><input className="field" placeholder="https://…" value={m.cover_url} onChange={(e) => setM({ ...m, cover_url: e.target.value })} /></Field>
          {options}
          {err && <p role="alert" className="text-sm text-[#ff453a]">{err}</p>}
          <button className="btn btn-accent" disabled={pending || !m.title.trim()} onClick={() => save(null)}>{pending ? "Adicionando…" : "Adicionar à estante"}</button>
        </>
      )}
    </div>
  );
}
export { BOOK_COLOR };
