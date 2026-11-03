"use client";
import { useState, useTransition } from "react";
import { saveDailyText } from "@/app/(app)/home-actions";

export function DailyText({ initial }: { initial: string }) {
  const [edit, setEdit] = useState(false);
  const [text, setText] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <section className="glass rise p-5">
      <div className="flex items-center justify-between">
        <p className="label">Texto do dia</p>
        {!edit && <button className="text-sm text-muted min-h-11 px-2" onClick={() => setEdit(true)}>{text ? "Editar" : "Colar"}</button>}
      </div>
      {edit ? (
        <div className="mt-3 grid gap-3">
          <textarea className="field" rows={5} value={text} onChange={(e) => setText(e.target.value)} autoFocus placeholder="Cole aqui o texto diário" />
          <div className="flex gap-2 justify-end">
            <button className="btn" onClick={() => { setText(initial); setEdit(false); }}>Cancelar</button>
            <button className="btn btn-accent" disabled={pending}
              onClick={() => start(async () => { await saveDailyText(text); setEdit(false); })}>Salvar</button>
          </div>
        </div>
      ) : text ? (
        <p className="font-display text-lg leading-relaxed mt-3 whitespace-pre-line">{text}</p>
      ) : (
        <p className="font-display italic text-muted text-lg mt-3">Cole aqui o texto de hoje.</p>
      )}
    </section>
  );
}
