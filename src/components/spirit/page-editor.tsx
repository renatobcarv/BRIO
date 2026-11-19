"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { deletePage, savePage, uploadPageImage } from "@/app/(app)/espiritual/pages-actions";
import { BOOKS } from "@/lib/bible";
import { NoteRead, RichNote } from "@/components/rich-note";

export const PAGE_KINDS = { estudo: "Estudo", historia: "História", capitulo: "Capítulo lido", diario: "Diário", pregacao: "Ministério" } as const;
type Page = { id: string; title: string; kind: keyof typeof PAGE_KINDS; cover_path: string | null; content: string; bible_book: number | null; bible_chapter: number | null; updated_at: string };

export function PageEditor({ page, images: img0 }: { page: Page; images: Record<string, string> }) {
  const [images, setImages] = useState(img0);
  const router = useRouter();
  const [p, setP] = useState(page);
  const [cover, setCover] = useState(page.cover_path ? img0[page.cover_path] ?? null : null);
  const [reading, setReading] = useState(!!page.content.trim());
  const [state, setState] = useState<"salvo" | "salvando" | "alterado" | "erro">("salvo");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const coverRef = useRef<HTMLInputElement>(null);
  const first = useRef(true);

  // Salvamento automático (1,2 s depois de parar de digitar).
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setState("alterado");
    const t = setTimeout(async () => {
      setState("salvando");
      const e = await savePage(p.id, { title: p.title.trim() || "Sem título", content: p.content, kind: p.kind, bible_book: p.bible_book, bible_chapter: p.bible_chapter }).catch(() => "Sem conexão.");
      if (e) { setErr(e); setState("erro"); } else { setErr(null); setState("salvo"); }
    }, 1200);
    return () => clearTimeout(t);
  }, [p.title, p.content, p.kind, p.bible_book, p.bible_chapter, p.id]);

  const upload = async (f: File, isCover = false) => {
    const fd = new FormData(); fd.set("file", f); fd.set("page", p.id); if (isCover) fd.set("cover", "1");
    const r = await uploadPageImage(fd);
    if (r.path && r.url) setImages((m) => ({ ...m, [r.path!]: r.url! }));
    return r;
  };
  const ref = p.bible_book ? `${BOOKS[p.bible_book - 1][0]}${p.bible_chapter ? ` ${p.bible_chapter}` : ""}` : null;

  return (
    <article className="max-w-3xl mx-auto -mt-4 md:-mt-6">
      <div className="relative h-44 sm:h-60 -mx-4 md:mx-0 md:rounded-[10px] overflow-hidden border-b border-white/[.06] group" style={!cover ? { background: "radial-gradient(70% 90% at 80% 0%, rgba(159,208,245,.35), transparent 70%), radial-gradient(60% 80% at 0% 100%, rgba(242,223,174,.22), transparent 70%), #0a0f15" } : undefined}>
        {cover && <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#05080c] via-transparent to-transparent" />
        <div className="absolute top-3 left-3 right-3 flex justify-between">
          <Link href="/espiritual?aba=paginas" className="btn !min-h-9 !px-3 bg-black/50 backdrop-blur">‹ Páginas</Link>
          <button className="btn !min-h-9 !px-3 bg-black/50 backdrop-blur" disabled={pending} onClick={() => coverRef.current?.click()}>{cover ? "Trocar capa" : "Adicionar capa"}</button>
          <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) start(async () => { const r = await upload(f, true); if (r.error) setErr(r.error); else if (r.url) setCover(r.url); }); }} />
        </div>
      </div>

      <div className="pt-5">
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <select className="field !min-h-9 !w-auto text-[12px]" value={p.kind} onChange={(e) => setP({ ...p, kind: e.target.value as Page["kind"] })} aria-label="Tipo">{Object.entries(PAGE_KINDS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <select className="field !min-h-9 !w-auto text-[12px]" value={p.bible_book ?? ""} onChange={(e) => setP({ ...p, bible_book: e.target.value ? Number(e.target.value) : null, bible_chapter: null })} aria-label="Livro da Bíblia"><option value="">Sem texto bíblico</option>{BOOKS.map(([n], i) => <option key={n} value={i + 1}>{n}</option>)}</select>
          {p.bible_book && <select className="field !min-h-9 !w-auto text-[12px]" value={p.bible_chapter ?? ""} onChange={(e) => setP({ ...p, bible_chapter: e.target.value ? Number(e.target.value) : null })} aria-label="Capítulo"><option value="">Livro todo</option>{Array.from({ length: BOOKS[p.bible_book - 1][1] }, (_, i) => <option key={i} value={i + 1}>Capítulo {i + 1}</option>)}</select>}
          <span className="ml-auto font-mono text-white/40" aria-live="polite">{state === "salvando" ? "salvando…" : state === "alterado" ? "editando" : state === "erro" ? "não salvo" : "salvo"}</span>
        </div>
        <input className="w-full bg-transparent outline-none mt-4 !text-[34px] sm:!text-[42px] !leading-tight text-white" style={{ fontFamily: "var(--font-serif)" }} value={p.title} placeholder="Sem título" onChange={(e) => setP({ ...p, title: e.target.value })} aria-label="Título" />
        {ref && <p className="label !text-[10px] mt-1" style={{ color: "#f2dfae" }}>{ref}</p>}
        {err && <p className="text-[12.5px] text-[#ff8a80] mt-2" role="alert">{err}</p>}

        <div className="flex gap-px bg-white/[.06] border border-white/[.06] w-fit mt-5 rounded-[6px] overflow-hidden">
          {(["Ler", "Escrever"] as const).map((l, i) => <button key={l} aria-pressed={reading === (i === 0)} onClick={() => setReading(i === 0)} className={`px-4 min-h-9 text-[12px] ${reading === (i === 0) ? "bg-[#0f1a24] text-white" : "bg-[#070a0e] text-white/50"}`}>{l}</button>)}
        </div>
        <div className="mt-4">
          {reading ? (p.content.trim() ? <NoteRead text={p.content} images={images} /> : <p className="text-white/45">Página vazia. Toque em Escrever.</p>)
            : <RichNote value={p.content} onChange={(v) => setP({ ...p, content: v })} minRows={16} images={images} onImage={(f) => upload(f)} placeholder="Conte a história, escreva o estudo, cole o texto bíblico com ❝, insira imagens…" />}
        </div>

        <div className="flex justify-between items-center mt-10 pt-4 border-t border-white/[.06]">
          <span className="text-[11px] text-white/35">Atualizado {new Date(p.updated_at).toLocaleDateString("pt-BR")}</span>
          <button className="text-[12px] text-white/45 hover:text-[#ff8a80] min-h-9" disabled={pending} onClick={() => { if (confirm("Apagar esta página e as imagens?")) start(async () => { const e = await deletePage(p.id); if (e) setErr(e); else router.push("/espiritual?aba=paginas"); }); }}>Apagar página</button>
        </div>
      </div>
    </article>
  );
}
