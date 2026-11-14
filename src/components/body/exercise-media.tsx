"use client";
import { useEffect, useState } from "react";

type Media = { img: string | null; thumb?: string | null; name?: string; url?: string; category?: string | null };
const cache = new Map<string, Promise<Media>>();
function load(name: string) {
  const k = name.toLowerCase().trim();
  if (!cache.has(k)) cache.set(k, fetch(`/api/exercicio?n=${encodeURIComponent(name)}`).then((r) => (r.ok ? r.json() : { img: null })).catch(() => ({ img: null })));
  return cache.get(k)!;
}
export function useExercise(name: string | undefined) {
  const [m, setM] = useState<Media | null>(null);
  useEffect(() => { let on = true; setM(null); if (name) load(name).then((x) => on && setM(x)); return () => { on = false; }; }, [name]);
  return m;
}

/** Miniatura do exercício (ilustração do wger). Sem imagem: ícone de halter. */
export function ExerciseThumb({ name, size = 48 }: { name: string; size?: number }) {
  const m = useExercise(name);
  return (
    <span className="ex-media shrink-0 grid place-items-center overflow-hidden" style={{ width: size, height: size }} aria-hidden>
      {m?.thumb || m?.img ? <img src={(m.thumb || m.img)!} alt="" loading="lazy" className="h-full w-full object-contain" />
        : <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none" stroke="#6b6b70" strokeWidth="1.8" strokeLinecap="round"><path d="M3 10v4M21 10v4M6 7v10M18 7v10M6 12h12" /></svg>}
    </span>
  );
}

/** Painel grande para o treino guiado: ilustração + link para a ficha completa. */
export function ExerciseHero({ name }: { name: string }) {
  const m = useExercise(name);
  if (!m?.img) return null;
  return (
    <figure className="mt-4">
      <div className="ex-media w-full h-48 grid place-items-center overflow-hidden"><img src={m.img} alt={`Execução: ${name}`} className="h-full w-full object-contain" /></div>
      <figcaption className="flex justify-between mt-1.5 text-[10px] text-white/45 font-mono"><span>{m.name}{m.category ? ` · ${m.category}` : ""}</span>{m.url && <a href={m.url} target="_blank" rel="noopener noreferrer" className="underline">ver execução · wger</a>}</figcaption>
    </figure>
  );
}
