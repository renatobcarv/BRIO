"use client";
import { useRef, useState } from "react";
import { Md } from "@/components/study/md";

const TOOLS: [string, string, (sel: string) => string, string?][] = [
  ["T", "Título", (s) => `\n# ${s || "Título"}\n`, "font-bold"],
  ["t", "Subtítulo", (s) => `\n## ${s || "Subtítulo"}\n`, "font-semibold"],
  ["N", "Negrito", (s) => `**${s || "texto"}**`, "font-bold"],
  ["I", "Itálico", (s) => `*${s || "texto"}*`, "italic"],
  ["S", "Sublinhado", (s) => `++${s || "texto"}++`, "underline"],
  ["▮", "Destaque", (s) => `==${s || "texto"}==`],
  ["❝", "Citação ou texto bíblico", (s) => `\n> ${s || "Texto"}\n`],
  ["•", "Lista", (s) => `\n- ${s || "item"}\n`],
  ["1.", "Lista numerada", (s) => `\n1. ${s || "item"}\n`],
];

/** Editor de anotação com formatação simples (título, subtítulo, negrito, itálico, sublinhado, destaque, citação, listas) e pré-visualização. */
export function RichNote({ value, onChange, placeholder, minRows = 6 }: { value: string; onChange: (v: string) => void; placeholder?: string; minRows?: number }) {
  const ta = useRef<HTMLTextAreaElement>(null);
  const [view, setView] = useState(false);
  const apply = (fn: (sel: string) => string) => {
    const el = ta.current; if (!el) return;
    const a = el.selectionStart, b = el.selectionEnd, sel = value.slice(a, b), ins = fn(sel);
    const next = value.slice(0, a) + ins + value.slice(b);
    onChange(next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + ins.length, a + ins.length); });
  };
  return (
    <div className="rich-note border border-white/10 rounded-[8px] overflow-hidden focus-within:border-[var(--accent,#ffb21e)]">
      <div className="flex items-center gap-0.5 overflow-x-auto bg-white/[.03] border-b border-white/[.06] px-1.5 py-1" role="toolbar" aria-label="Formatação">
        {TOOLS.map(([ic, label, fn, cls]) => <button key={label} type="button" title={label} aria-label={label} disabled={view} onClick={() => apply(fn)} className={`shrink-0 h-9 min-w-9 px-2 text-[14px] text-white/75 hover:text-white hover:bg-white/[.06] disabled:opacity-30 ${cls ?? ""}`}>{ic}</button>)}
        <span className="flex-1" />
        <button type="button" onClick={() => setView(!view)} className="shrink-0 h-9 px-3 text-[12px] text-white/70 hover:text-white border-l border-white/[.06]">{view ? "Editar" : "Ver"}</button>
      </div>
      {view ? <div className="p-4 min-h-32 note-read">{value.trim() ? <Md text={value} /> : <p className="text-white/40 text-sm">Nada escrito ainda.</p>}</div>
        : <textarea ref={ta} rows={minRows} className="w-full bg-transparent p-3.5 text-[15px] leading-relaxed outline-none resize-y" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />}
    </div>
  );
}

/** Leitura confortável de uma anotação formatada. */
export function NoteRead({ text, clamp = 0 }: { text: string; clamp?: number }) {
  const [open, setOpen] = useState(false);
  const long = clamp > 0 && text.length > clamp;
  return (
    <div className="note-read">
      <Md text={long && !open ? text.slice(0, clamp).trimEnd() + "…" : text} />
      {long && <button className="text-xs underline mt-2 text-[var(--accent,#ffb21e)]" onClick={() => setOpen(!open)}>{open ? "mostrar menos" : "ler tudo"}</button>}
    </div>
  );
}
