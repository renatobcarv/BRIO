"use client";
import { useState, useTransition } from "react";
import { saveDailyReflection, saveDailyText } from "@/app/(app)/home-actions";

/** Texto diário: lido na fonte (wol.jw.org), sem copiar automaticamente. */
export function DailyText({ initial, today, reflected }: { initial: string; today: string; reflected: boolean }) {
  const [edit, setEdit] = useState(false);
  const [text, setText] = useState(initial);
  const [note, setNote] = useState("");
  const [done, setDone] = useState(reflected);
  const [pending, start] = useTransition();
  const [y, m, d] = today.split("-").map(Number);
  const url = `https://wol.jw.org/pt/wol/h/r5/lp-t/${y}/${m}/${d}`;

  return (
    <section className="glass rise p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="label">Texto do dia</p>
        {!edit && <button className="text-sm text-muted min-h-11 px-2" onClick={() => setEdit(true)}>{text ? "Editar trecho" : "Guardar trecho"}</button>}
      </div>

      <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-accent w-full mt-3">Abrir texto do dia ↗</a>

      {edit ? (
        <div className="mt-3 grid gap-3">
          <textarea className="field" rows={4} value={text} onChange={(e) => setText(e.target.value)} autoFocus placeholder="Cole aqui o trecho que quer guardar (opcional)" />
          <div className="flex gap-2 justify-end">
            <button className="btn" onClick={() => { setText(initial); setEdit(false); }}>Cancelar</button>
            <button className="btn btn-accent" disabled={pending} onClick={() => start(async () => { await saveDailyText(text); setEdit(false); })}>Salvar</button>
          </div>
        </div>
      ) : text ? <p className="font-display text-lg leading-relaxed mt-4 whitespace-pre-line">{text}</p> : null}

      <div className="mt-4">
        {done ? (
          <p className="font-display italic text-muted">Reflexão de hoje guardada no diário.</p>
        ) : (
          <>
            <label className="label" htmlFor="reflexao">O que tirei disso hoje</label>
            <textarea id="reflexao" className="field mt-2" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Uma frase basta." />
            <button className="btn w-full mt-2" disabled={pending || !note.trim()}
              onClick={() => start(async () => { await saveDailyReflection(note); setDone(true); setNote(""); })}>Guardar no diário</button>
          </>
        )}
      </div>
    </section>
  );
}
