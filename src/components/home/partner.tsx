"use client";
import { useRef, useState, useTransition } from "react";
import { savePartner } from "@/app/(app)/configuracoes/actions";
import { Sheet } from "@/components/kit";

/** Cartão da Maria Luisa: foto e frase trocáveis ali mesmo. */
export function Partner({ photo, phrase }: { photo: string | null; phrase: string }) {
  const [pending, start] = useTransition();
  const [src, setSrc] = useState(photo);
  const [text, setText] = useState(phrase);
  const [editing, setEditing] = useState(false);
  const [err, setErr] = useState("");
  const file = useRef<HTMLInputElement>(null);

  const upload = (f: File) => {
    setErr("");
    if (!f.type.startsWith("image/")) return setErr("Escolha uma imagem.");
    if (f.size > 5 * 1024 * 1024) return setErr("A foto precisa ter até 5 MB.");
    const prev = src;
    setSrc(URL.createObjectURL(f));
    const fd = new FormData(); fd.set("photo", f); fd.set("phrase", text);
    start(async () => { try { await savePartner(fd); } catch (e) { setSrc(prev); setErr((e as Error).message); } });
  };
  const savePhrase = () => {
    const fd = new FormData(); fd.set("phrase", text);
    start(async () => { await savePartner(fd); setEditing(false); });
  };

  const picker = <input ref={file} type="file" accept="image/*" className="sr-only" aria-label="Escolher foto"
    onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />;

  return (
    <>
      <figure className="glass rise mt-4 overflow-hidden !p-0 relative">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="Maria Luisa" className={`w-full aspect-[4/5] md:aspect-[16/10] object-cover object-[50%_35%] transition-opacity ${pending ? "opacity-60" : ""}`} />
        ) : (
          <button onClick={() => file.current?.click()} className="w-full aspect-[4/3] grid place-items-center bg-white/[.03]">
            <span className="text-center"><span className="block text-4xl text-muted">＋</span><span className="text-sm text-muted">Adicionar foto dela</span></span>
          </button>
        )}
        <figcaption className={`${src ? "absolute inset-x-0 bottom-0 pt-24 bg-gradient-to-t from-black/85 via-black/40 to-transparent" : ""} p-6`}>
          <p className="label text-white/70">Maria Luisa</p>
          <button onClick={() => setEditing(true)} className="text-left font-display italic text-3xl md:text-4xl text-white mt-1 leading-tight">{text}</button>
        </figcaption>
        {src && (
          <button onClick={() => file.current?.click()} disabled={pending} aria-label="Trocar foto"
            className="absolute top-3 right-3 h-11 px-4 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-white text-sm flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
            {pending ? "Enviando…" : "Trocar foto"}
          </button>
        )}
        {picker}
      </figure>
      {err && <p role="alert" className="text-sm text-[#e8a39a] mt-2">{err}</p>}
      <Sheet open={editing} onClose={() => setEditing(false)} title="Frase dela">
        <textarea className="field font-display italic text-lg" value={text} onChange={(e) => setText(e.target.value)} maxLength={300} />
        <button className="btn btn-accent w-full mt-3" disabled={pending || !text.trim()} onClick={savePhrase}>{pending ? "Salvando…" : "Salvar"}</button>
      </Sheet>
    </>
  );
}
