"use client";
import Link from "next/link";
import { useMemo, useOptimistic, useState, useTransition } from "react";
import { toggleChapter } from "@/app/(app)/espiritual/actions";
import { BOOKS, TOTAL_CHAPTERS } from "@/lib/bible";
import { NewPageButton } from "./pages";

const SKY = "#9fd0f5", GOLD = "#f2dfae";
// Seções da Bíblia (índices 1-based), cada uma com uma cor suave.
const SECTIONS: { name: string; from: number; to: number; color: string }[] = [
  { name: "Pentateuco", from: 1, to: 5, color: "#f2dfae" },
  { name: "Históricos", from: 6, to: 17, color: "#e8c39e" },
  { name: "Poéticos", from: 18, to: 22, color: "#c9b8f0" },
  { name: "Proféticos", from: 23, to: 39, color: "#9fd0f5" },
  { name: "Evangelhos e Atos", from: 40, to: 44, color: "#a7e3c4" },
  { name: "Cartas", from: 45, to: 65, color: "#f5b5c8" },
  { name: "Apocalipse", from: 66, to: 66, color: "#ffd28a" },
];
const sectionOf = (b: number) => SECTIONS.find((s) => b >= s.from && b <= s.to)!;
/** Link para ler o capítulo na Tradução do Novo Mundo (wol.jw.org). */
const wol = (b: number, c: number) => `https://wol.jw.org/pt/wol/b/r5/lp-t/nwtsty/${b}/${c}`;

function Ring({ pct, color, size = 44, children }: { pct: number; color: string; size?: number; children?: React.ReactNode }) {
  const r = (size - 6) / 2, c = 2 * Math.PI * r;
  return (
    <span className="relative grid place-items-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 absolute inset-0" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="3" />
        {pct > 0 && <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${c * Math.min(1, pct)} ${c}`} />}
      </svg>
      {children}
    </span>
  );
}

export function BibleTab({ read, streak, notes = [] }: { read: { book: number; chapter: number; date_read?: string | null }[]; streak: number; notes?: { id: string; title: string; book: number; chapter: number | null }[] }) {
  const [, start] = useTransition();
  const [set, toggle] = useOptimistic(new Set(read.map((r) => `${r.book}:${r.chapter}`)),
    (s: Set<string>, k: { key: string; on: boolean }) => { const n = new Set(s); if (k.on) n.add(k.key); else n.delete(k.key); return n; });
  const [open, setOpen] = useState<number | null>(null);
  const [part, setPart] = useState<"hebraicas" | "gregas">("hebraicas");
  const total = set.size;
  const doneIn = (b: number) => Array.from({ length: BOOKS[b - 1][1] }, (_, c) => set.has(`${b}:${c + 1}`)).filter(Boolean).length;
  const noted = useMemo(() => new Set(notes.filter((n) => n.chapter).map((n) => `${n.book}:${n.chapter}`)), [notes]);

  // Continuar: o próximo capítulo depois do último lido (por data); sem histórico, Gênesis 1.
  const next = useMemo(() => {
    const last = [...read].sort((a, b) => (b.date_read ?? "").localeCompare(a.date_read ?? "") || b.book - a.book || b.chapter - a.chapter)[0];
    let b = last ? last.book : 1, c = last ? last.chapter + 1 : 1;
    for (let guard = 0; guard < TOTAL_CHAPTERS; guard++) {
      if (c > BOOKS[b - 1][1]) { b = b === 66 ? 1 : b + 1; c = 1; }
      if (!set.has(`${b}:${c}`)) return { b, c };
      c++;
    }
    return null;
  }, [read, set]);

  const mark = (b: number, c: number, on: boolean) => start(async () => { toggle({ key: `${b}:${c}`, on }); await toggleChapter(b, c, on); });
  const pct = total / TOTAL_CHAPTERS;
  const range = part === "hebraicas" ? [1, 39] : [40, 66];

  if (open) {
    const [name, n] = BOOKS[open - 1], sec = sectionOf(open), d = doneIn(open);
    const bookNotes = notes.filter((x) => x.book === open).sort((a, b) => (a.chapter ?? 0) - (b.chapter ?? 0));
    return (
      <section className="span-all">
        <button className="text-[13px] text-white/55 hover:text-white min-h-10" onClick={() => setOpen(null)}>‹ Todos os livros</button>
        <div className="hunt-card p-6 mt-2 flex items-center gap-5">
          <Ring pct={d / n} color={sec.color} size={72}><span className="text-[15px] font-semibold">{Math.round((d / n) * 100)}%</span></Ring>
          <div className="min-w-0">
            <p className="text-[12px]" style={{ color: sec.color }}>{sec.name}</p>
            <h2 className="text-[34px] leading-tight mt-0.5" style={{ fontFamily: "var(--font-serif)" }}>{name}</h2>
            <p className="text-[13px] text-white/55">{d} de {n} capítulos lidos</p>
          </div>
        </div>
        <p className="text-[12.5px] text-white/50 mt-5 mb-2">Toque para marcar como lido. Toque de novo para desmarcar.</p>
        <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-12 gap-2">
          {Array.from({ length: n }, (_, i) => {
            const c = i + 1, on = set.has(`${open}:${c}`), hasNote = noted.has(`${open}:${c}`);
            return (
              <button key={c} aria-pressed={on} aria-label={`${name} ${c}${on ? ", lido" : ""}`} onClick={() => mark(open, c, !on)}
                className="relative aspect-square rounded-[14px] text-[15px] font-semibold transition-colors"
                style={{ background: on ? sec.color : "rgba(255,255,255,.05)", color: on ? "#06121d" : "rgba(255,255,255,.85)" }}>
                {c}{hasNote && <i className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full" style={{ background: on ? "#06121d" : GOLD }} />}
              </button>);
          })}
        </div>
        <div className="flex flex-wrap gap-4 mt-3 text-[12px] text-white/50">
          <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded" style={{ background: sec.color }} />lido</span>
          <span className="flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full" style={{ background: GOLD }} />tem anotação</span>
        </div>

        <div className="hunt-card p-5 mt-5">
          <p className="label">Anotações de {name}</p>
          {bookNotes.length === 0 ? <p className="text-[13px] text-white/50 mt-2">Nenhuma ainda. Depois de ler, anote o que aprendeu.</p> : (
            <ul className="mt-2 divide-y divide-white/[.06]">{bookNotes.map((x) => (
              <li key={x.id}><Link href={`/espiritual/pagina/${x.id}`} className="flex items-center gap-3 min-h-12"><span className="text-[12px] w-14" style={{ color: GOLD }}>{x.chapter ? `cap. ${x.chapter}` : "livro"}</span><span className="flex-1 truncate" style={{ fontFamily: "var(--font-serif)" }}>{x.title}</span><span className="text-white/30">›</span></Link></li>))}</ul>)}
          <div className="mt-3"><NewPageButton kind="capitulo" book={open} label={`+ Nova anotação em ${name}`} className="btn" /></div>
        </div>
      </section>);
  }

  return (
    <section className="span-all grid gap-4">
      {/* Continuar lendo */}
      {next && (
        <div className="hunt-card p-6 relative overflow-hidden">
          <div aria-hidden className="absolute -right-10 -top-10 h-48 w-48 rounded-full" style={{ background: `radial-gradient(circle, ${SKY}33, transparent 70%)` }} />
          <p className="label">{total ? "Continue de onde parou" : "Comece por aqui"}</p>
          <p className="text-[40px] leading-tight mt-1" style={{ fontFamily: "var(--font-serif)" }}>{BOOKS[next.b - 1][0]} {next.c}</p>
          <p className="text-[13px] text-white/55">{sectionOf(next.b).name} · {doneIn(next.b)} de {BOOKS[next.b - 1][1]} capítulos deste livro</p>
          <div className="flex flex-wrap gap-2 mt-5">
            <a className="btn" href={wol(next.b, next.c)} target="_blank" rel="noopener noreferrer">Ler na Bíblia ↗</a>
            <button className="btn btn-accent" onClick={() => mark(next.b, next.c, true)}>Marcar como lido</button>
            <NewPageButton kind="capitulo" book={next.b} chapter={next.c} label="Anotar" className="btn" />
          </div>
        </div>)}

      {/* Progresso geral */}
      <div className="hunt-card p-5 flex items-center gap-5">
        <Ring pct={pct} color={SKY} size={76}><span className="text-[14px] font-semibold">{(pct * 100).toFixed(pct < 0.1 ? 1 : 0).replace(".", ",")}%</span></Ring>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold">Bíblia inteira</p>
          <p className="text-[13px] text-white/55">{total} de {TOTAL_CHAPTERS} capítulos · {(() => { const k = BOOKS.filter((_, i) => doneIn(i + 1) === BOOKS[i][1]).length; return `${k} ${k === 1 ? "livro completo" : "livros completos"}`; })()}</p>
          <p className="text-[13px] mt-1" style={{ color: GOLD }}>{streak ? `${streak} ${streak === 1 ? "dia" : "dias"} seguidos de leitura` : "Leia um capítulo hoje para começar a sequência"}</p>
        </div>
      </div>

      {/* Escolher a parte */}
      <div className="grid grid-cols-2 gap-1 p-1 rounded-[14px] bg-white/[.05]" role="tablist">
        {([["hebraicas", "Escrituras Hebraicas", "Gênesis a Malaquias"], ["gregas", "Escrituras Gregas", "Mateus a Apocalipse"]] as const).map(([k, l, sub]) => (
          <button key={k} role="tab" aria-selected={part === k} onClick={() => setPart(k)} className={`rounded-[11px] py-2.5 px-3 text-left transition-colors ${part === k ? "bg-[#f5f5f7] text-black" : "text-white/70"}`}>
            <span className="block text-[14px] font-semibold">{l}</span><span className={`block text-[11px] ${part === k ? "text-black/55" : "text-white/40"}`}>{sub}</span></button>))}
      </div>

      {/* Livros por seção */}
      {SECTIONS.filter((s) => s.from >= range[0] && s.to <= range[1]).map((s) => (
        <div key={s.name}>
          <p className="text-[13px] font-semibold mb-2 flex items-center gap-2"><i className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.name}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {Array.from({ length: s.to - s.from + 1 }, (_, i) => s.from + i).map((b) => {
              const [name, n] = BOOKS[b - 1], d = doneIn(b), full = d === n;
              return (
                <button key={b} onClick={() => setOpen(b)} className="flex items-center gap-3 text-left rounded-[14px] p-3 bg-white/[.04] hover:bg-white/[.07] transition-colors">
                  <Ring pct={d / n} color={s.color} size={40}>{full ? <span style={{ color: s.color }}>✓</span> : <span className="text-[10px] text-white/50">{d ? Math.round((d / n) * 100) : ""}</span>}</Ring>
                  <span className="min-w-0"><span className="block text-[14px] font-medium truncate">{name}</span><span className="block text-[11px] text-white/45">{d}/{n} capítulos</span></span>
                </button>);
            })}
          </div>
        </div>))}
    </section>
  );
}
