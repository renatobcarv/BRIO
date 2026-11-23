// Itens do mascote: ganhos por conquistas, saque das feras abatidas ou comprados com Ouro de caça (nunca com dinheiro real).
import type { Attr, XpEvent } from "./game.ts";
import { ANGELS, beastOfWeek, type BeastId } from "./bestiary.ts";

export type Tier = "comum" | "raro" | "epico" | "lendario";
/** source: "conquista" (from = id da conquista) ou "saque" (cai das feras e pode ser comprado na loja). */
export type Gear = { id: string; name: string; slot: Attr; tier: Tier; pct: number; from: string; how: string; lore: string; source: "conquista" | "saque" };
export const TIER: Record<Tier, { label: string; color: string; pct: number }> = {
  comum: { label: "Comum", color: "#9ea3aa", pct: 4 }, raro: { label: "Raro", color: "#f5f5f7", pct: 6 },
  epico: { label: "Épico", color: "#ff9f0a", pct: 8 }, lendario: { label: "Lendário", color: "#ffb21e", pct: 10 },
};
export const SLOTS: { slot: Attr; label: string }[] = [
  { slot: "forca", label: "Garras" }, { slot: "vigor", label: "Coração" }, { slot: "sabedoria", label: "Olhar" },
  { slot: "servico", label: "Patas" }, { slot: "disciplina", label: "Coleira" }, { slot: "ordem", label: "Marca" },
];
const g = (id: string, name: string, slot: Attr, tier: Tier, from: string, how: string, lore: string): Gear => ({ id, name, slot, tier, pct: TIER[tier].pct, from, how, lore, source: "conquista" });
const d = (id: string, name: string, slot: Attr, tier: Tier, lore: string): Gear => ({ id, name, slot, tier, pct: TIER[tier].pct, from: "", how: "Cai das feras ou na loja", lore, source: "saque" });
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
  // Saque das feras (16): caem nas caçadas ou se compram com Ouro.
  d("presa-lobo", "Presa do Lobo", "forca", "comum", "Arrancada na primeira caçada em matilha."),
  d("chifre-javali", "Chifre do Javali", "forca", "raro", "Investida bruta, agora a seu favor."),
  d("punho-golem", "Punho de Pedra", "forca", "epico", "Pesado como o Golem que o carregava."),
  d("escama-croc", "Escama do Crocodilo", "forca", "lendario", "Couraça da fera do rio, quase impenetrável."),
  d("sangue-frio", "Sangue Frio", "vigor", "comum", "Calma no meio da série mais difícil."),
  d("pulmao-grifo", "Fôlego do Grifo", "vigor", "raro", "Ar das alturas em cada respiração."),
  d("coracao-tita", "Coração do Titã", "vigor", "epico", "Bate firme quando o corpo quer parar."),
  d("olho-serpe", "Olho da Serpe", "sabedoria", "comum", "Vê o detalhe que os outros deixam passar."),
  d("pena-grifo", "Pena do Grifo", "sabedoria", "raro", "Escreve com clareza o que aprendeu."),
  d("cristal-sentinela", "Cristal da Sentinela", "sabedoria", "epico", "Guarda a atenção sem cansar."),
  d("botas-trilha", "Botas da Trilha", "servico", "comum", "Feitas para longas manhãs de serviço."),
  d("estandarte", "Estandarte do Guardião", "servico", "raro", "Leva a mensagem adiante, porta a porta."),
  d("corrente-jugg", "Corrente do Juggernaut", "disciplina", "raro", "Sobreviveu à Hell Week, prende o impulso."),
  d("selo-guardiao", "Selo do Guardião", "disciplina", "lendario", "Marca de quem venceu o chefe da campanha."),
  d("moeda-antiga", "Moeda Antiga", "ordem", "comum", "Pequena, mas lembra que o pouco bem guardado cresce."),
  d("cofre-tita", "Cofre do Titã", "ordem", "raro", "Guarda com força o que foi conquistado com suor."),
];
export const gearById = (id: string) => GEAR.find((x) => x.id === id);

// ── Evolução e loja ──
export const MAX_LEVEL = 5;
/** Cada nível acima do 1 soma +1 ponto percentual ao bônus do item. */
export const gearPct = (it: Gear, level = 1) => it.pct + Math.max(0, Math.min(MAX_LEVEL, level) - 1);
export const PRICE: Record<Tier, number> = { comum: 60, raro: 150, epico: 350, lendario: 800 };
/** Custo para subir do nível `level` para o seguinte. */
export const upgradeCost = (it: Gear, level: number) => Math.round(PRICE[it.tier] * 0.5 * level);
/** Só itens de saque vão para a loja; os de conquista têm que ser ganhos. */
export const buyable = (it: Gear) => it.source === "saque";

// ── Caçadas: cada treino da semana derrota a fera; anjos (exemplos) dão Ouro, nunca saque ──
type Prog = Parameters<typeof beastOfWeek>[0];
export type Kill = { key: string; date: string; beast: BeastId; threat: number; boss: boolean; angel: boolean };
export function kills(programs: Prog[], sessions: { program_id: string | null; week_no: number | null; date: string }[]): Kill[] {
  const by = new Map(programs.map((p) => [p.id, p])), seen = new Set<string>(), out: Kill[] = [];
  for (const s of [...sessions].sort((a, b) => a.date.localeCompare(b.date))) {
    const p = s.program_id ? by.get(s.program_id) : undefined;
    if (!p || s.week_no == null || seen.has(`${p.id}:${s.week_no}:${s.date}`)) continue;
    seen.add(`${p.id}:${s.week_no}:${s.date}`);
    const b = beastOfWeek(p, s.week_no); if (!b) continue;
    const total = p.phases.reduce((a, f) => a + Math.max(0, f.weeks), 0), lastLen = Math.max(0, p.phases.at(-1)?.weeks ?? 0);
    out.push({ key: `${p.id}:${s.week_no}:${s.date}`, date: s.date, beast: b.id, threat: b.threat, boss: b.threat >= 5 || s.week_no > total - lastLen, angel: ANGELS.includes(b.id) });
  }
  return out;
}
/** Hash estável (FNV-1a) → [0,1): o mesmo abate sempre dá o mesmo resultado, sem precisar guardar nada. */
export const roll = (key: string) => { let h = 2166136261; for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
/** Chance de saque: baixa nas feras fracas, sobe com a ameaça; chefes têm bônus. 1→6%, 3→14%, 5→22%, chefe +15%. */
export const dropChance = (threat: number, boss: boolean) => Math.max(1, Math.min(5, threat)) * 0.04 + 0.02 + (boss ? 0.15 : 0);
const TIER_BY_THREAT = (t: number, boss: boolean, r: number): Tier => {
  const p = boss ? [0.25, 0.4, 0.25, 0.1] : t >= 4 ? [0.45, 0.35, 0.17, 0.03] : t >= 3 ? [0.6, 0.3, 0.1, 0] : [0.8, 0.2, 0, 0];
  const tiers: Tier[] = ["comum", "raro", "epico", "lendario"]; let acc = 0;
  for (let i = 0; i < 4; i++) { acc += p[i]; if (r < acc) return tiers[i]; } return "comum";
};
export const killGold = (k: Kill) => (k.angel ? 25 : 10 + k.threat * 10 + (k.boss ? 50 : 0));
/** Saque de um abate (ou null). */
export function dropOf(k: Kill): Gear | null {
  if (k.angel || roll(k.key + ":drop") >= dropChance(k.threat, k.boss)) return null;
  const tier = TIER_BY_THREAT(k.threat, k.boss, roll(k.key + ":tier"));
  const pool = GEAR.filter((x) => x.source === "saque" && x.tier === tier);
  return pool.length ? pool[Math.floor(roll(k.key + ":item") * pool.length)] : null;
}

export type Wallet = { bought: string[]; levels: Record<string, number>; spent: number };
/** Economia completa: o que você tem, de onde veio, e o Ouro disponível. Repetidos viram Ouro (1/3 do preço). */
export function economy(ks: Kill[], achievementsDone: Iterable<string>, w: Wallet) {
  const owned = new Map<string, "conquista" | "saque" | "loja">();
  for (const it of unlockedGear(achievementsDone)) owned.set(it.id, "conquista");
  let earned = 0; const drops: { date: string; beast: BeastId; item: string; dup: boolean }[] = [];
  for (const k of ks) {
    earned += killGold(k);
    const it = dropOf(k); if (!it) continue;
    const dup = owned.has(it.id); drops.push({ date: k.date, beast: k.beast, item: it.id, dup });
    if (dup) earned += Math.round(PRICE[it.tier] / 3); else owned.set(it.id, "saque");
  }
  for (const id of w.bought ?? []) { const it = gearById(id); if (it && buyable(it) && !owned.has(id)) owned.set(id, "loja"); }
  const levels: Record<string, number> = {};
  for (const [id, lv] of Object.entries(w.levels ?? {})) if (owned.has(id)) levels[id] = Math.max(1, Math.min(MAX_LEVEL, Math.floor(Number(lv) || 1)));
  return { owned, levels, earned, gold: Math.max(0, earned - Math.max(0, Number(w.spent) || 0)), drops: drops.reverse() };
}

/** Teto global: os itens nunca somam mais que 15% do XP base. */
export const ITEM_CAP = 0.15;
export type Equipped = Partial<Record<Attr, { id: string; at: string }>>;

/** Equipamentos destravados a partir das conquistas concluídas. */
export const unlockedGear = (doneAchievements: Iterable<string>) => { const d = new Set(doneAchievements); return GEAR.filter((x) => x.source === "conquista" && d.has(x.from)); };

/** Limpa o que veio do banco: só itens existentes, no slot certo e já destravados. */
export function validEquipped(raw: unknown, unlocked: Gear[] | Iterable<string>): Equipped {
  const ok = new Set([...unlocked].map((x) => (typeof x === "string" ? x : x.id))), out: Equipped = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [slot, v] of Object.entries(raw as Record<string, { id?: string; at?: string }>)) {
    const it = v?.id ? gearById(v.id) : undefined;
    if (it && it.slot === slot && ok.has(it.id) && typeof v.at === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.at)) out[it.slot] = { id: it.id, at: v.at };
  }
  return out;
}

/** Bônus de XP dos itens: só sobre eventos do atributo do item, a partir do dia em que foi equipado (sem retroativo). */
export type BonusSource = { attr: Attr; pct: number; at: string; name: string };
/** Fontes de bônus equipadas: um item por atributo. */
export const gearSources = (eq: Equipped, levels: Record<string, number> = {}): BonusSource[] =>
  Object.values(eq).flatMap((s) => { const it = s && gearById(s.id); return it && s ? [{ attr: it.slot, pct: gearPct(it, levels[it.id]), at: s.at, name: it.name }] : []; });

/** Bônus de XP (itens + fera domada ativa): só no atributo da fonte, a partir do dia em que foi ativada. Teto global de 15%. */
export function itemBonus(events: XpEvent[], eq: Equipped, levels: Record<string, number> = {}, extra: BonusSource[] = []): XpEvent[] {
  const sources = [...gearSources(eq, levels), ...extra];
  const base = events.reduce((a, e) => a + e.xp, 0), byDay = new Map<string, number>();
  for (const e of events) {
    if (e.label.startsWith("Bônus")) continue;
    for (const src of sources) {
      if (src.attr !== e.attr || e.date < src.at) continue;
      const k = `${e.date}|${e.attr}|${src.name}`;
      byDay.set(k, (byDay.get(k) ?? 0) + e.xp * src.pct / 100);
    }
  }
  let out = [...byDay].map(([k, v]) => { const [date, attr, name] = k.split("|"); return { date, attr: attr as Attr, xp: Math.round(v), label: `Bônus · ${name}` }; }).filter((e) => e.xp > 0);
  const sum = out.reduce((a, e) => a + e.xp, 0), cap = Math.floor(base * ITEM_CAP);
  if (sum > cap) { const f = cap / sum; out = out.map((e) => ({ ...e, xp: Math.floor(e.xp * f) })).filter((e) => e.xp > 0); }
  return out;
}

// ── Domar feras (estilo "levante-se"): a fera derrotada pode virar sua aliada ──
/** Atributo que cada fera domada fortalece quando está ativa. */
export const BEAST_ATTR: Partial<Record<BeastId, Attr>> = {
  golem: "forca", javali: "forca", lobo: "disciplina", juggernaut: "disciplina", serpe: "sabedoria", grifo: "sabedoria",
  titan: "vigor", crocodilo: "vigor", sentinela: "ordem", guardiao: "servico",
};
/** Chance de domar: rara nas fracas, maior nas fortes; chefes +12%. 1→5%, 3→11%, 5→17%, chefe 29%. */
export const tameChance = (threat: number, boss: boolean) => 0.02 + Math.max(1, Math.min(5, threat)) * 0.03 + (boss ? 0.12 : 0);
export const MAX_STARS = 5;
export type Tamed = { id: BeastId; since: string; stars: number; attempts: number };
/** Domados a partir dos abates. O 1º sucesso doma; os seguintes dão estrelas (até 5). */
export function tamed(ks: Kill[]): Tamed[] {
  const m = new Map<BeastId, Tamed>();
  for (const k of ks) {
    if (k.angel || !BEAST_ATTR[k.beast]) continue;
    const cur = m.get(k.beast);
    if (cur) cur.attempts++;
    if (roll(k.key + ":tame") >= tameChance(k.threat, k.boss)) { if (!cur) m.set(k.beast, { id: k.beast, since: "", stars: 0, attempts: 1 }); continue; }
    if (!cur || !cur.since) m.set(k.beast, { id: k.beast, since: k.date, stars: 1, attempts: cur?.attempts ?? 1 });
    else cur.stars = Math.min(MAX_STARS, cur.stars + 1);
  }
  return [...m.values()].filter((t) => t.since);
}
/** Nível da fera domada: cresce com o XP que você ganha depois de domá-la. */
export const tamedLevel = (xpSince: number) => Math.min(99, 1 + Math.floor(Math.sqrt(Math.max(0, xpSince) / 150)));
/** Bônus da fera ativa: 2% + 1% por estrela (máx. 7%), no atributo dela. */
export const tamedPct = (stars: number) => 2 + Math.max(1, Math.min(MAX_STARS, stars));

/** Troféus: um por fera abatida (sem bônus, pura honra). */
export const trophyName = (beast: string) => `Troféu: ${beast}`;
