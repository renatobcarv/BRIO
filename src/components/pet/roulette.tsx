"use client";
import { useEffect, useRef, useState } from "react";
import { PetPortrait } from "./portrait";
import { RARITY, SPECIES, STAGES } from "@/lib/pet";

const W = 128, GAP = 8, WIN = 34; // largura do item, espaço, posição do vencedor na faixa
/** Faixa com sorteio ponderado pela raridade (as raras aparecem menos, como na chance real). */
function reel(result: string) {
  const pool = SPECIES.flatMap((s) => Array(Math.max(1, Math.round(RARITY[s.rarity].weight / 4))).fill(s.key) as string[]);
  const out = Array.from({ length: WIN + 6 }, () => pool[Math.floor(Math.random() * pool.length)]);
  out[WIN] = result;
  // Um "quase" lendário antes do vencedor deixa o final mais tenso.
  const legend = SPECIES.find((s) => s.rarity === "lendario")?.key; if (legend && result !== legend) out[WIN + 1] = legend;
  return out;
}

/** Roleta do sorteio: passa rápido e desacelera até parar no mascote sorteado pelo servidor. */
export function PetRoulette({ result, onDone }: { result: string; onDone: () => void }) {
  const [items] = useState(() => reel(result)), box = useRef<HTMLDivElement>(null), [x, setX] = useState(0), [done, setDone] = useState(false);
  useEffect(() => {
    const w = box.current?.clientWidth ?? 360, jitter = (Math.random() - 0.5) * (W * 0.5);
    const target = WIN * (W + GAP) - w / 2 + W / 2 + jitter;
    const id = requestAnimationFrame(() => setX(target));
    const t = setTimeout(() => { setDone(true); navigator.vibrate?.([20, 40, 60]); setTimeout(onDone, 900); }, 5200);
    return () => { cancelAnimationFrame(id); clearTimeout(t); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div ref={box} className="relative w-full overflow-hidden rounded-[18px] border border-white/10 bg-[#0a0a0b] py-4" aria-label="Roleta do sorteio" role="img">
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-[3px] -translate-x-1/2 bg-[#ffb21e] shadow-[0_0_18px_#ffb21e]" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#0a0a0b] to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#0a0a0b] to-transparent" />
      <div className="flex" style={{ gap: GAP, transform: `translateX(${-x}px)`, transition: x ? "transform 5s cubic-bezier(.08,.6,.12,1)" : "none" }}>
        {items.map((k, i) => { const s = SPECIES.find((y) => y.key === k)!, r = RARITY[s.rarity], win = done && i === WIN; return (
          <div key={i} className="shrink-0 rounded-[14px] border p-2 text-center transition-all duration-500"
            style={{ width: W, borderColor: win ? r.color : r.color + "44", background: `radial-gradient(90% 70% at 50% 30%, ${r.color}${win ? "55" : "22"}, #111 75%)`, transform: win ? "scale(1.06)" : undefined, boxShadow: win ? `0 0 30px -4px ${r.color}` : undefined, opacity: done && !win ? 0.35 : 1 }}>
            <PetPortrait species={k} stage={STAGES[0]} size={96} className="mx-auto" />
            <p className="text-[12px] font-semibold truncate mt-1">{s.name}</p>
            <p className="text-[9.5px] uppercase tracking-wider" style={{ color: r.color }}>{r.label}</p>
          </div>); })}
      </div>
    </div>
  );
}
