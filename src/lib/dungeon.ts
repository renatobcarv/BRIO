// Masmorras: o mascote luta com as habilidades da fase de evolução. Combate em turnos, determinístico pela semente. Puro e testável.
import type { BeastId } from "./bestiary.ts";

export type Stats = { maxHp: number; atk: number; def: number; spd: number; crit: number };
export const STAGE_KEYS = ["filhote", "jovem", "cacador", "alfa", "sombra", "lenda"] as const;
/** Atributos pela fase (índice 0–5) + essência acumulada + nível das feras domadas/itens (bônus em %). */
/** Atributos base pela fase e essência; `gear` soma os atributos dos itens equipados. */
export function petStats(stage: number, essence: number, bonusPct = 0, gear?: { hp: number; atk: number; def: number; spd: number; crit: number }): Stats {
  const s = Math.max(0, Math.min(5, stage)), e = Math.max(0, essence), b = 1 + Math.max(0, Math.min(0.5, bonusPct / 100));
  const g = gear ?? { hp: 0, atk: 0, def: 0, spd: 0, crit: 0 };
  return { maxHp: Math.round((85 + s * 45 + Math.min(300, e / 60)) * b) + g.hp, atk: Math.round((12 + s * 7 + Math.min(40, e / 400)) * b) + g.atk, def: Math.round(3 + s * 3) + g.def, spd: 10 + s * 2 + g.spd, crit: Math.min(0.6, 0.05 + s * 0.02 + g.crit / 100) };
}

export type Skill = { key: string; name: string; stage: number; desc: string };
/** Cada fase libera uma habilidade (não perde as anteriores). */
export const SKILLS: Skill[] = [
  { key: "mordida", name: "Mordida", stage: 0, desc: "Ataque básico." },
  { key: "investida", name: "Investida", stage: 1, desc: "160% de dano. Recarga de 3 turnos." },
  { key: "rugido", name: "Rugido", stage: 2, desc: "O inimigo causa 30% menos dano por 2 turnos. Recarga de 4." },
  { key: "furia", name: "Fúria", stage: 3, desc: "Com menos de 40% de vida, o dano sobe 50%." },
  { key: "sombra", name: "Passo das Sombras", stage: 4, desc: "Esquiva o próximo golpe. Recarga de 4." },
  { key: "lendario", name: "Golpe Lendário", stage: 5, desc: "300% de dano, uma vez por luta." },
];
export const skillsOf = (stage: number) => SKILLS.filter((k) => k.stage <= stage);

export type Foe = { beast: BeastId; name: string; hp: number; atk: number; def: number; spd: number; boss?: boolean };
export type Dungeon = { id: number; name: string; level: number; rooms: Foe[]; gold: number; essence: number };
const F = (beast: BeastId, name: string, lv: number, boss = false): Foe => ({ beast, name, boss, hp: Math.round((15 + lv * 32) * (boss ? 2 : 1) * (lv >= 7 ? 1.5 : lv >= 5 ? 1.2 : 1)), atk: Math.round((2 + lv * 5.5) * (boss ? 1.25 : 1) * (lv >= 7 ? 1.3 : 1)), def: Math.round(lv * 2.2), spd: 8 + lv * 2 });
/** 8 andares: a dificuldade sobe com o nível; o último de cada um é chefe. */
export const DUNGEONS: Dungeon[] = [
  { id: 1, name: "Toca do Golem", level: 1, rooms: [F("golem", "Golem de Brita", 1), F("golem", "Golem", 1, true)], gold: 30, essence: 20 },
  { id: 2, name: "Bosque dos Lobos", level: 2, rooms: [F("lobo", "Lobo Batedor", 2), F("lobo", "Lobo", 2), F("lobo", "Alfa da Matilha", 2, true)], gold: 50, essence: 35 },
  { id: 3, name: "Lamaçal do Javali", level: 3, rooms: [F("javali", "Javali Jovem", 3), F("javali", "Javali de Presas", 3, true)], gold: 70, essence: 50 },
  { id: 4, name: "Fenda da Serpe", level: 4, rooms: [F("serpe", "Serpe Menor", 4), F("serpe", "Serpe", 4), F("serpe", "Serpe de Obsidiana", 4, true)], gold: 100, essence: 70 },
  { id: 5, name: "Rio do Crocodilo", level: 5, rooms: [F("crocodilo", "Crocodilo", 5), F("crocodilo", "Rei do Rio", 5, true)], gold: 140, essence: 95 },
  { id: 6, name: "Ninho do Grifo", level: 6, rooms: [F("grifo", "Grifo Jovem", 6), F("grifo", "Grifo", 6), F("grifo", "Grifo Ancião", 6, true)], gold: 190, essence: 130 },
  { id: 7, name: "Forja do Titã", level: 7, rooms: [F("titan", "Titã de Ferro", 7), F("juggernaut", "Juggernaut", 7, true)], gold: 250, essence: 170 },
  { id: 8, name: "Portão do Guardião", level: 8, rooms: [F("sentinela", "Sentinela", 8), F("titan", "Titã", 8), F("guardiao", "O Último Guardião", 8, true)], gold: 350, essence: 240 },
];
/** Poder do mascote e poder recomendado do andar (para avisar antes de entrar). */
export const power = (s: Stats) => Math.round(s.maxHp * 0.25 + s.atk * 3 + s.def * 2 + s.spd);
export const recommended = (d: Dungeon) => Math.round(d.rooms.reduce((a, f) => a + f.hp * 0.25 + f.atk * 3 + f.def * 2 + f.spd, 0) / d.rooms.length * 1.15);

function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export type Line = { t: string; who: "pet" | "foe" | "info"; petHp: number; foeHp: number; foe: number };
/** Luta o andar inteiro, sala a sala, começando com `hp`. Vitória = derrotar o chefe. */
export function fight(stats: Stats, stage: number, hp: number, d: Dungeon, seed: number) {
  const r = rng(seed), log: Line[] = [], sk = new Set(skillsOf(stage).map((k) => k.key));
  let cur = Math.max(0, Math.min(stats.maxHp, hp)), cleared = 0;
  for (let fi = 0; fi < d.rooms.length && cur > 0; fi++) {
    const f = d.rooms[fi]; let fh = f.hp, cdI = 0, cdR = 0, cdS = 0, weak = 0, dodge = false, legend = sk.has("lendario");
    log.push({ t: `${f.boss ? "Chefe: " : ""}${f.name} aparece.`, who: "info", petHp: cur, foeHp: fh, foe: fi });
    for (let turn = 0; turn < 40 && fh > 0 && cur > 0; turn++) {
      // Mascote age
      let mult = 1, name = "Mordida";
      if (legend && fh > f.hp * 0.5 && f.boss) { mult = 3; name = "Golpe Lendário"; legend = false; }
      else if (sk.has("investida") && cdI === 0) { mult = 1.6; name = "Investida"; cdI = 3; }
      else if (sk.has("rugido") && cdR === 0 && weak === 0) { mult = 0.6; name = "Rugido"; cdR = 4; weak = 2; }
      else if (sk.has("sombra") && cdS === 0 && fh > f.atk * 2) { mult = 0.8; name = "Passo das Sombras"; cdS = 4; dodge = true; }
      if (sk.has("furia") && cur < stats.maxHp * 0.4) mult *= 1.5;
      const crit = r() < stats.crit, dmg = Math.max(1, Math.round((stats.atk * mult * (0.9 + r() * 0.2) - f.def * 0.5) * (crit ? 1.7 : 1)));
      fh = Math.max(0, fh - dmg);
      log.push({ t: `${name}${crit ? " crítico" : ""}: ${dmg} de dano.`, who: "pet", petHp: cur, foeHp: fh, foe: fi });
      cdI = Math.max(0, cdI - 1); cdR = Math.max(0, cdR - 1); cdS = Math.max(0, cdS - 1);
      if (fh <= 0) break;
      // Inimigo age
      if (dodge) { dodge = false; log.push({ t: `${f.name} ataca, mas o mascote se esquiva.`, who: "foe", petHp: cur, foeHp: fh, foe: fi }); continue; }
      const hit = Math.max(1, Math.round((f.atk * (weak > 0 ? 0.7 : 1) * (0.85 + r() * 0.3) - stats.def * 0.6)));
      weak = Math.max(0, weak - 1); cur = Math.max(0, cur - hit);
      log.push({ t: `${f.name} acerta ${hit}.`, who: "foe", petHp: cur, foeHp: fh, foe: fi });
    }
    if (fh <= 0) { cleared++; log.push({ t: `${f.name} foi derrotado!`, who: "info", petHp: cur, foeHp: 0, foe: fi }); }
  }
  const win = cleared === d.rooms.length;
  // Derrota rende só uma parte (o que foi conquistado até cair).
  const share = win ? 1 : cleared / d.rooms.length / 2;
  return { win, cleared, hp: cur, log, gold: Math.round(d.gold * share), essence: Math.round(d.essence * share) };
}

/** Vida regenera 25% da máxima por hora; nas lutas, não passa da máxima. */
export const regen = (hp: number | null, at: string | null, maxHp: number, now = Date.now()) =>
  hp == null || !at ? maxHp : Math.min(maxHp, Math.round(hp + ((now - Date.parse(at)) / 36e5) * maxHp * 0.25));
export const RUNS_PER_DAY = 3;
