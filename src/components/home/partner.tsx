"use client";
import Image from "next/image";
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
      <figure className="partner-frame glass rise mt-4 overflow-hidden !p-0 relative">
        {src ? (
           
          <img src={src} alt="Maria Luísa" className={`w-full aspect-[4/5] md:aspect-[16/10] object-cover object-[50%_35%] transition-opacity ${pending ? "opacity-60" : ""}`} />
        ) : (
          <button onClick={() => file.current?.click()} className="w-full aspect-[4/3] grid place-items-center bg-white/[.03]">
            <span className="text-center"><span className="block text-4xl text-muted">＋</span><span className="text-sm text-muted">Adicionar foto dela</span></span>
          </button>
        )}
        <figcaption className={`${src ? "partner-caption absolute inset-x-0 bottom-0" : ""} px-5 pb-5 sm:px-7 sm:pb-7`}>
          <p className="flex items-center gap-2 text-sm font-semibold text-[#ffe0a8]">
            <Image src="/painel/tiara.webp" width={29} height={29} alt="" unoptimized className="object-contain" />
            Maria Luísa
          </p>
          <button onClick={() => setEditing(true)} title="Editar frase" className="partner-phrase mt-1 block text-left text-[clamp(1.35rem,2.5vw,2.15rem)] font-semibold leading-tight text-[#fff6e8]">{text}</button>
        </figcaption>
        {src && (
          <button onClick={() => file.current?.click()} disabled={pending} aria-label="Trocar foto"
            className="absolute top-3.5 right-3.5 z-10 flex h-10 items-center gap-2 rounded-full border border-[#ffe0a8]/45 bg-black/65 px-3 text-sm text-[#fff6e8] backdrop-blur-md">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
            {pending ? "Enviando…" : "Trocar foto"}
          </button>
        )}
        {picker}
      </figure>
      {err && <p role="alert" className="text-sm text-[#ff453a] mt-2">{err}</p>}
      <Sheet open={editing} onClose={() => setEditing(false)} title="Frase dela">
        <textarea className="field font-display italic text-lg" value={text} onChange={(e) => setText(e.target.value)} maxLength={300} />
        <button className="btn btn-accent w-full mt-3" disabled={pending || !text.trim()} onClick={savePhrase}>{pending ? "Salvando…" : "Salvar"}</button>
      </Sheet>
    </>
  );
}
