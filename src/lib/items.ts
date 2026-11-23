// Itens do mascote: ganhos só por esforço real (conquistas e feras abatidas). Sem loja, sem sorte. Sem dependências.
import type { Attr, XpEvent } from "./game.ts";

export type Tier = "comum" | "raro" | "epico" | "lendario";
export type Gear = { id: string; name: string; slot: Attr; tier: Tier; pct: number; from: string; how: string; lore: string };
export const TIER: Record<Tier, { label: string; color: string; pct: number }> = {
  comum: { label: "Comum", color: "#9ea3aa", pct: 4 }, raro: { label: "Raro", color: "#f5f5f7", pct: 6 },
  epico: { label: "Épico", color: "#ff9f0a", pct: 8 }, lendario: { label: "Lendário", color: "#ffb21e", pct: 10 },
};
export const SLOTS: { slot: Attr; label: string }[] = [
  { slot: "forca", label: "Garras" }, { slot: "vigor", label: "Coração" }, { slot: "sabedoria", label: "Olhar" },
  { slot: "servico", label: "Patas" }, { slot: "disciplina", label: "Coleira" }, { slot: "ordem", label: "Marca" },
];
const g = (id: string, name: string, slot: Attr, tier: Tier, from: string, how: string, lore: string): Gear => ({ id, name, slot, tier, pct: TIER[tier].pct, from, how, lore });
/** Equipamentos: cada um destravado por uma conquista (id de achievements). */
export const GEAR: Gear[] = [
  g("braceletes", "Braceletes do Covil", "forca", "comum", "treino50", "Registre 50 treinos", "Forjados no ferro de cinquenta sessões."),
  g("manopla", "Manopla de Ferro", "forca", "raro", "total400", "Some 400 kg no agachamento, supino e terra", "Quem a veste já levantou o que muitos só imaginam."),
  g("cinturao", "Cinturão do Titã", "forca", "lendario", "total600", "Some 600 kg nos três levantamentos", "Reservado ao Clube dos 600."),
  g("cantil", "Cantil da Fonte", "vigor", "comum", "agua30", "Bata a meta de água em 30 dias", "Nunca seca para quem é constante."),
  g("manto", "Manto do Sono", "vigor", "raro", "sono30", "30 noites com 7h ou mais", "Descanso é parte do treino."),
  g("coracao", "Coração de Leão", "vigor", "raro", "proteina30", "Bata a proteína em 30 dias", "Construído refeição por refeição."),
  g("lamparina", "Lamparina da Formiga", "sabedoria", "raro", "formiga", "Leia a Bíblia 30 dias seguidos", "Provérbios 6:6: aprenda com a constância da formiga."),
  g("tomo", "Tomo Vivo", "sabedoria", "epico", "livro12", "Termine 12 livros", "Cada página virou parte de quem você é."),
  g("pergaminho", "Pergaminho Completo", "sabedoria", "lendario", "biblia", "Leia os 1.189 capítulos", "A Palavra inteira, do começo ao fim."),
  g("sandalias", "Sandálias do Caminho", "servico", "raro", "campo50", "50 horas de serviço num mês", "Gastas pelas ruas do território."),
  g("bolsa", "Bolsa do Semeador", "servico", "epico", "campo600", "600 horas de serviço no total", "Semeou com generosidade, colhe com alegria."),
  g("pedra", "Pedra dos Sete", "disciplina", "comum", "limpo7", "7 dias limpos seguidos", "Pequena, mas não se quebra."),
  g("colar", "Colar da Semana Firme", "disciplina", "raro", "seq7", "7 dias seguidos 100%", "Sete elos, nenhum solto."),
  g("elmo", "Elmo Inabalável", "disciplina", "epico", "seq30", "30 dias seguidos 100%", "Protege a mente nos dias sem vontade."),
  g("balanca", "Balança Fiel", "ordem", "comum", "sobra3", "3 meses com 10%+ de sobra", "Mordomo fiel no pouco."),
  g("ouro", "Ouro da Babilônia", "ordem", "epico", "babilonia", "6 meses guardando 10% ou mais", "Ouro que trabalha para quem o guarda."),
];
export const gearById = (id: string) => GEAR.find((x) => x.id === id);

/** Teto global: os itens nunca somam mais que 15% do XP base. */
export const ITEM_CAP = 0.15;
export type Equipped = Partial<Record<Attr, { id: string; at: string }>>;

/** Equipamentos destravados a partir das conquistas concluídas. */
export const unlockedGear = (doneAchievements: Iterable<string>) => { const d = new Set(doneAchievements); return GEAR.filter((x) => d.has(x.from)); };

/** Limpa o que veio do banco: só itens existentes, no slot certo e já destravados. */
export function validEquipped(raw: unknown, unlocked: Gear[]): Equipped {
  const ok = new Set(unlocked.map((x) => x.id)), out: Equipped = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [slot, v] of Object.entries(raw as Record<string, { id?: string; at?: string }>)) {
    const it = v?.id ? gearById(v.id) : undefined;
    if (it && it.slot === slot && ok.has(it.id) && typeof v.at === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.at)) out[it.slot] = { id: it.id, at: v.at };
  }
  return out;
}

/** Bônus de XP dos itens: só sobre eventos do atributo do item, a partir do dia em que foi equipado (sem retroativo). */
export function itemBonus(events: XpEvent[], eq: Equipped): XpEvent[] {
  const base = events.reduce((a, e) => a + e.xp, 0), byDay = new Map<string, number>();
  for (const e of events) {
    const s = eq[e.attr], it = s && gearById(s.id);
    if (!it || e.date < s.at || e.label.startsWith("Bônus")) continue;
    byDay.set(`${e.date}|${e.attr}|${it.name}`, (byDay.get(`${e.date}|${e.attr}|${it.name}`) ?? 0) + e.xp * it.pct / 100);
  }
  let out = [...byDay].map(([k, v]) => { const [date, attr, name] = k.split("|"); return { date, attr: attr as Attr, xp: Math.round(v), label: `Bônus · ${name}` }; }).filter((e) => e.xp > 0);
  const sum = out.reduce((a, e) => a + e.xp, 0), cap = Math.floor(base * ITEM_CAP);
  if (sum > cap) { const f = cap / sum; out = out.map((e) => ({ ...e, xp: Math.floor(e.xp * f) })).filter((e) => e.xp > 0); }
  return out;
}

/** Troféus: um por fera abatida (sem bônus, pura honra). */
export const trophyName = (beast: string) => `Troféu: ${beast}`;
