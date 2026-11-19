"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createPage } from "@/app/(app)/espiritual/pages-actions";
import { BOOKS } from "@/lib/bible";
import { PAGE_KINDS } from "./page-editor";

export type PageCard = { id: string; title: string; kind: keyof typeof PAGE_KINDS; cover: string | null; bible_book: number | null; bible_chapter: number | null; updated_at: string; excerpt: string };

export function NewPageButton({ kind = "estudo", book, chapter, label, className = "btn btn-accent" }: { kind?: keyof typeof PAGE_KINDS; book?: number; chapter?: number; label: string; className?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return <>
    <button className={className} disabled={pending} onClick={() => start(async () => {
      const r = await createPage({ kind, bible_book: book ?? null, bible_chapter: chapter ?? null, title: book ? `${BOOKS[book - 1][0]}${chapter ? ` ${chapter}` : ""}` : undefined }).catch(() => ({ error: "Sem conexão." }) as { id?: string; error?: string });
      if (r.error || !r.id) setErr(r.error ?? "Erro."); else router.push(`/espiritual/pagina/${r.id}`);
    })}>{pending ? "Abrindo…" : label}</button>
    {err && <p className="text-[12px] text-[#ff8a80] mt-1" role="alert">{err}</p>}
  </>;
}

export function PagesGallery({ pages, ready }: { pages: PageCard[]; ready: boolean }) {
  const [kind, setKind] = useState<string>("todas");
  if (!ready) return <p className="hunt-card p-5 text-sm">Rode a migração <code className="text-[#f2dfae]">20261123000000_paginas_espirituais.sql</code> no Supabase para ativar as Páginas.</p>;
  const list = pages.filter((p) => kind === "todas" || p.kind === kind);
  return (
    <section className="span-all">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <NewPageButton kind="estudo" label="+ Página de estudo" />
        <NewPageButton kind="historia" label="+ História com imagens" className="btn" />
        <NewPageButton kind="diario" label="+ Diário" className="btn" />
      </div>
      {pages.length > 0 && <div className="flex gap-1.5 overflow-x-auto mb-3">{[["todas", "Todas"], ...Object.entries(PAGE_KINDS)].map(([k, l]) => <button key={k} className="chip shrink-0" aria-pressed={kind === k} onClick={() => setKind(k)}>{l}</button>)}</div>}
      {list.length === 0 ? (
        <div className="border border-dashed border-white/15 rounded-[10px] p-8 text-center">
          <p className="text-[18px]" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}>Seu caderno espiritual começa aqui.</p>
          <p className="text-[13px] text-white/50 mt-2 max-w-md mx-auto">Crie páginas com capa, títulos, textos bíblicos em destaque e imagens. Conte histórias bíblicas, guarde estudos e ligue cada página a um capítulo lido.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {list.map((p) => (
            <Link key={p.id} href={`/espiritual/pagina/${p.id}`} className="group block border border-white/[.08] rounded-[10px] overflow-hidden bg-[#070a0e] hover:border-[#9fd0f566] transition-colors">
              <div className="relative h-28 sm:h-36" style={!p.cover ? { background: "radial-gradient(70% 90% at 80% 0%, rgba(159,208,245,.3), transparent 70%), radial-gradient(60% 80% at 0% 100%, rgba(242,223,174,.2), transparent 70%), #0a0f15" } : undefined}>
                {p.cover && <img src={p.cover} alt="" className="absolute inset-0 h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-500" loading="lazy" />}
                <span className="absolute left-2 top-2 text-[10px] uppercase tracking-[.14em] px-2 py-1 bg-black/55 backdrop-blur text-white/85">{PAGE_KINDS[p.kind]}</span>
              </div>
              <div className="p-3">
                <p className="text-[16px] leading-snug line-clamp-2" style={{ fontFamily: "var(--font-serif)" }}>{p.title}</p>
                {p.bible_book && <p className="text-[11px] mt-1 text-[#f2dfae]">{BOOKS[p.bible_book - 1][0]}{p.bible_chapter ? ` ${p.bible_chapter}` : ""}</p>}
                {p.excerpt && <p className="text-[12px] text-white/50 mt-1 line-clamp-2">{p.excerpt}</p>}
              </div>
            </Link>))}
        </div>)}
    </section>
  );
}
