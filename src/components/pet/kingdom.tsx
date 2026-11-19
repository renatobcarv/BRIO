"use client";

import { useState, type CSSProperties } from "react";
import { SPECIES, STAGES, speciesOf, type PetStage } from "@/lib/pet";
import { HABITATS } from "@/lib/pet-habitats";
import { PetPortrait } from "./portrait";

const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  top: `${(i * 19 + 13) % 100}%`,
  "--particle-delay": `-${i * .67}s`,
  "--particle-duration": `${5 + i % 5}s`,
  "--particle-size": `${3 + i % 5}px`,
}) as CSSProperties);

export function PetKingdom({ pet }: {
  pet: { name: string; species: string; stage: PetStage } | null;
}) {
  const [visit, setVisit] = useState<string | null>(null);
  const [item, setItem] = useState<number | null>(null);
  const home = speciesOf(pet?.species ?? "pantera");
  const species = speciesOf(visit ?? home.key);
  const habitat = HABITATS[species.key];
  const own = pet && species.key === home.key ? pet : null;
  const stage = own?.stage ?? STAGES[0];
  const backdrop = `/mascotes/lares/${species.key}`;

  function visitHome(key: string | null) {
    setVisit(key);
    setItem(null);
  }

  return (
    <section className="hunt-card overflow-hidden" aria-labelledby="pet-kingdom-title">
      <div className="flex flex-wrap items-end justify-between gap-3 p-4 sm:p-6">
        <div>
          <p className="label">Mascotes</p>
          <h1 id="pet-kingdom-title" className="font-display text-4xl">Reino dos Mascotes</h1>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1">
            <span className="text-xs text-muted">Visitar um lar</span>
            <select className="field" value={species.key} onChange={(event) => visitHome(event.target.value)}>
              {SPECIES.map((entry) => <option key={entry.key} value={entry.key}>{entry.name}</option>)}
            </select>
          </label>
          {pet && !own && <button className="btn" type="button" onClick={() => visitHome(null)}>Meu lar</button>}
        </div>
      </div>
      <div key={species.key} data-habitat={habitat.effect}
        className="pet-habitat relative isolate min-h-[380px] overflow-hidden sm:min-h-[480px]"
        style={{ "--habitat-color": habitat.color } as CSSProperties}>
        <img src={`${backdrop}.webp`} alt="" width={960} height={540}
          srcSet={`${backdrop}.webp 960w, ${backdrop}-1600.webp 1600w, ${backdrop}-4k.webp 3840w`}
          sizes="(min-width: 1536px) 1216px, (min-width: 1024px) calc(100vw - 304px), (min-width: 768px) calc(100vw - 272px), calc(100vw - 32px)"
          className="pet-habitat-backdrop absolute inset-0 h-full w-full object-cover object-center" />
        <div className="pet-habitat-wash absolute inset-0" aria-hidden />
        <div className="pet-habitat-particles pointer-events-none absolute inset-0" aria-hidden>
          {PARTICLES.map((style, i) => <i className="pet-habitat-particle" key={i} style={style} />)}
        </div>
        <div className="absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/90 via-black/50 to-transparent p-4 pb-10 sm:p-6 sm:pb-12">
          <p className="text-xs font-semibold" style={{ color: habitat.color }}>
            {own ? `${own.name} · ${stage.name}` : species.name}
          </p>
          <h2 className="font-display text-3xl leading-tight text-white drop-shadow-md sm:text-4xl">{habitat.name}</h2>
          <p className="mt-1 max-w-md text-sm text-white/85">{habitat.description}</p>
        </div>
        <div className="pet-habitat-resident pointer-events-none absolute left-1/2 z-10 -translate-x-1/2">
          <PetPortrait species={species.key} stage={stage} alt={`${own?.name ?? species.name}, ${stage.name}`}
            size={300} className="pet-habitat-animal h-auto w-full" />
        </div>
        <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black via-black/75 to-transparent p-4 pt-10 sm:p-6 sm:pt-12">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Itens do lar">
            {habitat.items.map(([name], i) => (
              <button key={name} type="button" aria-pressed={item === i} onClick={() => setItem(item === i ? null : i)}
                className="rounded-full border border-white/25 bg-black/70 px-3 py-2 text-xs font-medium text-white transition-colors hover:border-white/65 aria-pressed:border-white aria-pressed:bg-white aria-pressed:text-black">
                {name}
              </button>
            ))}
          </div>
          <p aria-live="polite" className="mt-2 min-h-5 text-xs text-white/85">{item == null ? "" : habitat.items[item][1]}</p>
        </div>
      </div>
    </section>
  );
}
