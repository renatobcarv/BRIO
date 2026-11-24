"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { SPECIES, STAGES, speciesOf, type PetStage } from "@/lib/pet";
import { HABITATS } from "@/lib/pet-habitats";
import { PetExpedition } from "./expedition";
import { PetPortrait } from "./portrait";

const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  top: `${(i * 19 + 13) % 100}%`,
  "--particle-delay": `-${i * .67}s`,
  "--particle-duration": `${5 + i % 5}s`,
  "--particle-size": `${3 + i % 5}px`,
}) as CSSProperties);

const REACTIONS: Record<string, string> = {
  lobo: "Abaixa as orelhas e encosta o focinho na sua mão.",
  coruja: "Inclina a cabeça e pisca devagar, como se tivesse entendido.",
  urso: "Se espreguiça e deita pesadamente ao seu lado.",
  aguia: "Abre as asas só o bastante para levantar uma corrente de ar.",
  tubarao: "Dá uma volta no aquário e volta para perto do vidro.",
  serpente: "Se enrola no chão aquecido e ergue a cabeça para você.",
  leao: "Estufa a juba e solta um rugido baixinho.",
  pantera: "Se aproxima em silêncio, encosta a testa e ronrona.",
  fenix: "Ergue as penas e espalha um punhado de brasas douradas.",
  kitsune: "Sacode as caudas e aparece do outro lado como num truque.",
  qilin: "Inclina os chifres e deixa um rastro de luz verde.",
  grifo: "Bate as asas e deixa uma pena aos seus pés.",
  genbu: "Põe a cabeça para fora do casco e solta pequenas bolhas.",
  dragao: "Levanta uma sobrancelha e solta uma espiral de fumaça.",
};

const TRICKS: Record<string, string> = {
  lobo: "Uiva três vezes e espera a resposta do vale.",
  coruja: "Abre as asas e apaga a lamparina com uma rajada.",
  urso: "Rola de costas e segura uma pinha entre as patas.",
  aguia: "Mergulha e sobe em espiral junto ao penhasco.",
  tubarao: "Faz um giro completo dentro de um anel de bolhas.",
  serpente: "Traça uma espiral no chão e se recolhe bem no centro.",
  leao: "Salta para o trono e ruge de frente para a savana.",
  pantera: "Some entre as raízes e reaparece com um salto sobre a pedra.",
  fenix: "Gira no ar e desenha um arco de brasas.",
  kitsune: "As lanternas se apagam e acendem uma a uma atrás dela.",
  qilin: "Pisa sobre a água e abre um círculo de luz na superfície.",
  grifo: "Faz uma reverência e lança uma pena acima do ninho.",
  genbu: "Se recolhe no casco e gira entre as bolhas do santuário.",
  dragao: "Lança uma faísca que se parte em sete pequenas estrelas.",
};

type Bond = { days: number; last: string };
type Search = { target: number; tried: number[]; found: boolean };
const EMPTY_BOND: Bond = { days: 0, last: "" };
const BOND_LEVELS = ["Conhecendo você", "Confiança", "Cumplicidade", "Laço lendário"];

export function PetKingdom({ pet, today }: {
  pet: { id: string; name: string; species: string; stage: PetStage } | null;
  today: string;
}) {
  const [visit, setVisit] = useState<string | null>(null);
  const [item, setItem] = useState<number | null>(null);
  const [reaction, setReaction] = useState<{ id: number; kind: "greet" | "seek" | "found"; line: string } | null>(null);
  const [away, setAway] = useState(false);
  const [search, setSearch] = useState<Search | null>(null);
  const [bond, setBond] = useState(EMPTY_BOND);
  const home = speciesOf(pet?.species ?? "pantera");
  const species = speciesOf(visit ?? home.key);
  const habitat = HABITATS[species.key];
  const own = pet && species.key === home.key ? pet : null;
  const stage = own?.stage ?? STAGES[0];
  const exploring = Boolean(own && away);
  const backdrop = `/mascotes/lares/${species.key}`;

  const storageKey = pet ? `brio:mascote:vinculo:${pet.id}` : null;
  useEffect(() => {
    if (!storageKey) return;
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) ?? "null") as Bond | null;
      if (value && Number.isSafeInteger(value.days) && value.days >= 0 && typeof value.last === "string") setBond(value);
    } catch {}
  }, [storageKey]);

  function react(kind: "greet" | "seek" | "found", line: string) {
    setReaction((previous) => ({ id: (previous?.id ?? 0) + 1, kind, line }));
  }

  function startSearch() {
    if (!own) return;
    const dayNumber = Math.floor(Date.parse(today) / 864e5);
    const target = (dayNumber + species.key.length) % habitat.items.length;
    setSearch({ target, tried: [], found: false });
    react("seek", `${own.name} escondeu uma relíquia. Siga a pista!`);
  }

  function inspect(position: number) {
    if (!search || search.found || search.tried.includes(position) || !own) return;
    const found = position === search.target;
    setSearch({ ...search, found, tried: [...search.tried, position] });
    if (!found) {
      react("seek", `${own.name} faz sinal para você tentar em outro lugar.`);
      return;
    }
    react("found", `${own.name} comemora com você. Relíquia encontrada!`);
    if (bond.last !== today) {
      const updated = { days: bond.days + 1, last: today };
      setBond(updated);
      if (storageKey) try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch {}
    }
  }

  function visitHome(key: string | null) {
    setVisit(key);
    setAway(false);
    setItem(null);
    setSearch(null);
    setReaction(null);
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
        <button type="button" disabled={exploring} data-away={exploring}
          className="pet-habitat-resident absolute left-1/2 z-10 -translate-x-1/2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          aria-label={`Cumprimentar ${own?.name ?? species.name}`} onClick={() => react("greet", REACTIONS[species.key])}>
          <span key={reaction?.id ?? 0} data-pet-reaction={reaction?.kind} className="pet-play-motion relative block">
            <PetPortrait species={species.key} stage={stage} alt="" size={300} className="pet-habitat-animal h-auto w-full" />
            {reaction && <span className="pet-play-sparks pointer-events-none absolute inset-0" aria-hidden="true">
              {PARTICLES.slice(0, 7).map((style, i) => <i key={i} style={style} />)}
            </span>}
          </span>
        </button>
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
      <div className="grid gap-3 border-t border-white/10 bg-[#101013] p-4 sm:p-6" style={{ "--habitat-color": habitat.color } as CSSProperties}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-display text-xl text-white">{own ? `Brinque com ${own.name}` : "Conheça o morador"}</p>
            {own && <p className="mt-0.5 text-xs text-white/70">Vínculo · {BOND_LEVELS[bond.days >= 14 ? 3 : bond.days >= 7 ? 2 : bond.days >= 3 ? 1 : 0]} · {bond.days} {bond.days === 1 ? "dia de brincadeira" : "dias de brincadeira"}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn" disabled={exploring} onClick={() => react("greet", REACTIONS[species.key])}>Cumprimentar</button>
            {own && bond.days > 0 && <button type="button" className="btn" disabled={exploring} onClick={() => react("found", TRICKS[species.key])}>Mostrar truque</button>}
          </div>
        </div>
        <p role="status" className="min-h-5 rounded-lg border border-white/10 bg-white/[.04] p-3 text-sm text-white/85">
          {reaction?.line ?? "Toque no mascote para ver como ele reage."}
        </p>
        {own && <PetExpedition id={own.id} name={own.name} species={species.key} today={today}
          onDepart={(line) => react("seek", line)} onReturn={(line) => react("found", line)} onTravelChange={setAway} />}
        {own && (
          <div className="rounded-xl border border-white/10 p-3 sm:p-4">
            <p className="font-semibold text-white">Relíquia escondida</p>
            {!search ? (
              <>
                <p className="mt-1 text-xs text-white/70">{bond.last === today ? "Vocês já brincaram hoje. Dá para procurar a relíquia de novo." : "Use a pista para encontrar o esconderijo. A primeira descoberta libera um truque."}</p>
                <button type="button" className="btn mt-3 !min-h-10" disabled={exploring} onClick={startSearch}>Procurar relíquia</button>
              </>
            ) : search.found ? (
              <>
                <p className="mt-1 text-sm text-[var(--habitat-color)]">Encontrada em {habitat.items[search.target][0]}.</p>
                <button type="button" className="btn mt-3 !min-h-10" onClick={() => setSearch(null)}>Voltar ao lar</button>
              </>
            ) : (
              <>
                <p className="mt-1 text-sm text-white/80"><strong>Pista:</strong> {habitat.items[search.target][1]}</p>
                <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Esconderijos da relíquia">
                  {habitat.items.map(([label], i) => (
                    <button key={label} type="button" className="btn !min-h-10" disabled={exploring || search.tried.includes(i)} onClick={() => inspect(i)}>{label}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
