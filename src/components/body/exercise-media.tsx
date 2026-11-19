"use client";
import { exerciseImage, EX_INFO } from "@/lib/exercise-images";

/** Miniatura do exercício (imagem local). Sem imagem: ícone de halter. */
export function ExerciseThumb({ name, size = 48 }: { name: string; size?: number }) {
  const src = exerciseImage(name);
  return (
    <span className="ex-media shrink-0 grid place-items-center overflow-hidden" style={{ width: size, height: size }} aria-hidden>
      {src ? <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
        : <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none" stroke="#6b6b70" strokeWidth="1.8" strokeLinecap="round"><path d="M3 10v4M21 10v4M6 7v10M18 7v10M6 12h12" /></svg>}
    </span>
  );
}

/** Imagem grande + passos de execução. */
export function ExerciseHero({ name }: { name: string }) {
  const src = exerciseImage(name);
  if (!src) return null;
  const info = EX_INFO[src];
  return (
    <figure className="mt-4">
      <div className="ex-media w-full aspect-[4/3] overflow-hidden"><img src={src} alt={`Execução: ${name}`} className="h-full w-full object-cover" /></div>
      {info?.instr?.length ? (
        <details className="mt-2"><summary className="text-[12px] text-white/55 cursor-pointer min-h-9 flex items-center">Como executar (em inglês)</summary>
          <ol className="grid gap-1.5 text-[12.5px] text-white/65 list-decimal pl-5">{info.instr.map((t, i) => <li key={i}>{t}</li>)}</ol></details>) : null}
      <figcaption className="text-[10px] text-white/35 mt-1">Imagem: free-exercise-db (domínio público)</figcaption>
    </figure>
  );
}
