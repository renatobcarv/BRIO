// Mascote: cresce com a essência das suas ações (XP real) e às vezes dá bônus. Sem dependências.
// Princípios: cresce só com ação real; nunca morre nem regride (sem punição que faça desistir);
// fica com fome se você some, e volta ao normal quando você age; bônus em esquema de recompensa variável.

export type PetStage = { key: string; name: string; from: number; buffChance: number; buffMax: number; scale: number; aura: string };
export const STAGES: PetStage[] = [
  { key: "filhote", name: "Filhote", from: 0, buffChance: 0.08, buffMax: 0.1, scale: 0.55, aura: "#ff7a5c" },
  { key: "jovem", name: "Jovem", from: 400, buffChance: 0.14, buffMax: 0.15, scale: 0.68, aura: "#ff4d3d" },
  { key: "cacador", name: "Caçador", from: 1500, buffChance: 0.2, buffMax: 0.2, scale: 0.8, aura: "#ff2800" },
  { key: "alfa", name: "Alfa", from: 4000, buffChance: 0.26, buffMax: 0.25, scale: 0.9, aura: "#dc0000" },
  { key: "sombra", name: "Sombra", from: 9000, buffChance: 0.32, buffMax: 0.3, scale: 1, aura: "#ffb21e" },
  { key: "lenda", name: "Lenda", from: 20000, buffChance: 0.38, buffMax: 0.4, scale: 1.06, aura: "#ffffff" },
];
export const stageOf = (essence: number) => [...STAGES].reverse().find((s) => essence >= s.from) ?? STAGES[0];
export const nextStage = (essence: number) => STAGES.find((s) => s.from > essence) ?? null;

export type Ev = { date: string; attr: string; xp: number; label: string };
export type Buff = { date: string; attr: string; pct: number; label: string };

/** Número pseudoaleatório estável por dia (mesmo resultado no servidor e no navegador). */
export function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/** Bônus do dia: sorteado pela fase do mascote naquele dia (não é sempre). */
export function buffFor(petId: string, date: string, stage: PetStage, hungry: boolean): Buff | null {
  if (hungry) return null;
  const r = seeded(`${petId}:${date}`);
  if (r >= stage.buffChance) return null;
  const r3 = seeded(`${petId}:${date}:p`);
  const pct = Math.round((0.05 + r3 * (stage.buffMax - 0.05)) * 100) / 100;
  return { date, attr: "tudo", pct, label: `+${Math.round(pct * 100)}% no XP do dia` };
}

const addDays = (d: string, n: number) => new Date(Date.parse(d + "T12:00:00Z") + n * 864e5).toISOString().slice(0, 10);

/** Estado do mascote a partir dos eventos de XP desde a adoção. */
export function petState(petId: string, adopted: string, events: Ev[], today: string, extraEssence = 0) {
  const own = events.filter((e) => e.date >= adopted && e.date <= today && e.xp > 0);
  const byDay = new Map<string, Ev[]>();
  for (const e of own) byDay.set(e.date, [...(byDay.get(e.date) ?? []), e]);
  // Percorre os dias em ordem para saber a fase em cada dia (o bônus depende da fase daquele dia).
  let essence = extraEssence;
  const bonus: { date: string; attr: string; xp: number; label: string }[] = [], buffs: Buff[] = [];
  for (let d = adopted; d <= today; d = addDays(d, 1)) {
    const evs = byDay.get(d) ?? [];
    const recent = [0, 1, 2].some((k) => (byDay.get(addDays(d, -k)) ?? []).length > 0 || addDays(d, -k) < adopted);
    const b = buffFor(petId, d, stageOf(essence), !recent);
    if (b) {
      buffs.push(b);
      const per = new Map<string, number>();
      for (const e of evs) per.set(e.attr, (per.get(e.attr) ?? 0) + e.xp);
      for (const [attr, base] of per) { const xp = Math.round(base * b.pct); if (xp > 0) bonus.push({ date: d, attr, xp, label: `Mascote: ${b.label}` }); }
    }
    essence += evs.reduce((a, e) => a + e.xp, 0);
  }
  const lastActive = [...byDay.keys()].sort().at(-1) ?? null;
  const idle = lastActive ? Math.round((Date.parse(today) - Date.parse(lastActive)) / 864e5) : Math.round((Date.parse(today) - Date.parse(adopted)) / 864e5);
  const mood = idle <= 0 ? "alimentado" : idle === 1 ? "satisfeito" : idle <= 3 ? "com fome" : "faminto";
  const st = stageOf(essence), nx = nextStage(essence);
  const todayBuff = buffs.find((b) => b.date === today) ?? null;
  const feedToday = (byDay.get(today) ?? []).reduce((a, e) => a + e.xp, 0);
  const fed = [...own].sort((a, b) => b.date.localeCompare(a.date) || b.xp - a.xp).slice(0, 8);
  return { essence, stage: st, next: nx, progress: nx ? (essence - st.from) / (nx.from - st.from) : 1, mood, idle, todayBuff, bonus, buffs: buffs.slice(-10).reverse(), feedToday, fed,
    bonusTotal: bonus.reduce((a, b) => a + b.xp, 0) };
}

// ── Espécies e sorteio ──
export type Rarity = "comum" | "incomum" | "raro" | "epico" | "lendario";
export const RARITY: Record<Rarity, { label: string; color: string; weight: number }> = {
  comum: { label: "Comum", color: "#a1a1a6", weight: 52 }, incomum: { label: "Incomum", color: "#5ac8fa", weight: 28 }, raro: { label: "Raro", color: "#ffb21e", weight: 13 },
  epico: { label: "Épico", color: "#ff2d55", weight: 5.5 }, lendario: { label: "Lendário", color: "#ff2800", weight: 1.5 },
};
export const SPECIES: { key: string; name: string; glyph: string; rarity: Rarity; trait: string }[] = [
  { key: "lobo", name: "Lobo", glyph: "🐺", rarity: "comum", trait: "Leal à matilha: constância diária." },
  { key: "coruja", name: "Coruja", glyph: "🦉", rarity: "comum", trait: "Sabedoria noturna: ama estudo." },
  { key: "urso", name: "Urso", glyph: "🐻", rarity: "comum", trait: "Força bruta e paciência." },
  { key: "aguia", name: "Águia", glyph: "🦅", rarity: "incomum", trait: "Visão de longe: metas e foco." },
  { key: "tubarao", name: "Tubarão", glyph: "🦈", rarity: "incomum", trait: "Nunca para de nadar." },
  { key: "serpente", name: "Serpente", glyph: "🐍", rarity: "incomum", trait: "Prudência e paciência." },
  { key: "leao", name: "Leão", glyph: "🦁", rarity: "raro", trait: "Coragem e liderança." },
  { key: "pantera", name: "Pantera", glyph: "🐆", rarity: "raro", trait: "Instinto de caçador. O símbolo do BRIO." },
  { key: "fenix", name: "Fênix", glyph: "🐦‍🔥", rarity: "epico", trait: "Renasce depois de cada queda." },
  { key: "dragao", name: "Dragão", glyph: "🐉", rarity: "lendario", trait: "O mais raro. Poder acumulado." },
];
export const speciesOf = (k: string) => SPECIES.find((s) => s.key === k) ?? SPECIES.find((s) => s.key === "pantera")!;
export const DRAWS_PER_MONTH = 5;
/** Sorteio ponderado pela raridade (r em [0,1)). */
export function roll(r: number) {
  const total = SPECIES.reduce((a, s) => a + RARITY[s.rarity].weight / SPECIES.filter((x) => x.rarity === s.rarity).length, 0);
  let acc = 0;
  for (const s of SPECIES) { acc += RARITY[s.rarity].weight / SPECIES.filter((x) => x.rarity === s.rarity).length / total; if (r < acc) return s; }
  return SPECIES[SPECIES.length - 1];
}
export const DUPLICATE_ESSENCE = 150;
