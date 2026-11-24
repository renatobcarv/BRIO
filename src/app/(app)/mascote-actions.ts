"use server";
// Mascote: sorteio (5 por mês, primeiro grátis), coleção e escolha do mascote ativo.
import { revalidatePath } from "next/cache";
import { randomInt } from "node:crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/date";
import { MAX_LEVEL, PRICE, SLOTS, buyable, gearById, upgradeCost } from "@/lib/items";
import { loadGame } from "@/lib/game-data";
import { getSettings } from "@/lib/settings";
import { DRAWS_PER_MONTH, DUPLICATE_ESSENCE, roll, SPECIES } from "@/lib/pet";

const MISSING = "Rode a migração 20261125000000_mascote.sql no Supabase.";
const err = (e: { message: string } | null) => (e ? (/relation|does not exist|schema cache|column/i.test(e.message) ? MISSING : e.message) : null);

export async function drawPet(): Promise<{ species?: string; duplicate?: boolean; left?: number; error?: string }> {
  const sb = await createClient();
  const month = todayISO().slice(0, 7);
  const [all, mine] = await Promise.all([
    sb.from("pet_draws").select("species,free,month"),
    sb.from("pets").select("user_id,bonus_essence").maybeSingle(),
  ]);
  if (all.error) return { error: err(all.error)! };
  const draws = all.data ?? [];
  const free = draws.length === 0; // o primeiro sorteio da vida é grátis
  const used = draws.filter((d) => d.month === month && !d.free).length;
  if (!free && used >= DRAWS_PER_MONTH) return { error: `Você já usou os ${DRAWS_PER_MONTH} sorteios deste mês. Volta no mês que vem.` };
  const s = roll(randomInt(0, 1_000_000) / 1_000_000);
  const duplicate = draws.some((d) => d.species === s.key);
  const { error } = await sb.from("pet_draws").insert({ month, species: s.key, duplicate, free });
  if (error) return { error: err(error)! };
  if (duplicate && mine.data) await sb.from("pets").update({ bonus_essence: (mine.data.bonus_essence ?? 0) + DUPLICATE_ESSENCE }).not("user_id", "is", null);
  revalidatePath("/mascote"); revalidatePath("/");
  return { species: s.key, duplicate, left: free ? DRAWS_PER_MONTH : DRAWS_PER_MONTH - used - 1 };
}

/** Escolhe (ou troca) o mascote ativo entre os que você já tirou. A essência é do vínculo, não da espécie. */
export async function choosePet(species: string, name: string): Promise<string | null> {
  const p = z.object({ species: z.enum(SPECIES.map((s) => s.key) as [string, ...string[]]), name: z.string().trim().min(1, "Dê um nome.").max(30) }).safeParse({ species, name });
  if (!p.success) return p.error.issues[0]?.message ?? "Dados inválidos.";
  const sb = await createClient();
  const { data: owned } = await sb.from("pet_draws").select("id").eq("species", p.data.species).limit(1);
  if (!owned?.length) return "Você ainda não tirou esse mascote no sorteio.";
  const { data: cur } = await sb.from("pets").select("user_id").maybeSingle();
  const { error } = cur ? await sb.from("pets").update(p.data).not("user_id", "is", null) : await sb.from("pets").insert({ ...p.data, adopted_on: todayISO() });
  revalidatePath("/", "layout");
  return err(error);
}

export async function renamePet(name: string): Promise<string | null> {
  const n = z.string().trim().min(1).max(30).safeParse(name);
  if (!n.success) return "Nome inválido.";
  const sb = await createClient();
  const { error } = await sb.from("pets").update({ name: n.data }).not("user_id", "is", null);
  revalidatePath("/", "layout"); return err(error);
}

async function walletState() {
  const sb = await createClient();
  const { data: pet, error } = await sb.from("pets").select("equipped,bought,levels,spent,active_beast,tame_tries").maybeSingle();
  if (error) return { sb, err: "Rode o SQL dos itens (20261127000000_itens.sql) no Supabase." } as const;
  if (!pet) return { sb, err: "Adote um mascote primeiro." } as const;
  const g = await loadGame(sb, await getSettings(sb), todayISO());
  return { sb, pet, items: g.items } as const;
}
const doneItems = () => { revalidatePath("/mascote"); revalidatePath("/"); revalidatePath("/status"); return null; };

/** Equipa (ou tira) um item. O servidor confere se o item é mesmo seu. */
export async function equipItem(slot: string, id: string | null): Promise<string | null> {
  if (!SLOTS.some((s) => s.slot === slot)) return "Espaço inválido.";
  const w = await walletState(); if ("err" in w) return w.err!;
  const eq = { ...((w.pet.equipped ?? {}) as Record<string, unknown>) };
  if (id === null) delete eq[slot];
  else {
    const it = gearById(id);
    if (!it || it.slot !== slot) return "Item inválido para este espaço.";
    if (!w.items.owned[id]) return "Você ainda não tem este item.";
    eq[slot] = { id, at: todayISO() };
  }
  const { error } = await w.sb.from("pets").update({ equipped: eq }).not("user_id", "is", null);
  return error ? error.message : doneItems();
}

/** Compra um item de saque com Ouro de caça. */
export async function buyItem(id: string): Promise<string | null> {
  const it = gearById(id); if (!it || !buyable(it)) return "Este item não está à venda.";
  const w = await walletState(); if ("err" in w) return w.err!;
  if (w.items.owned[id]) return "Você já tem este item.";
  if (w.items.gold < PRICE[it.tier]) return "Ouro insuficiente. Cace mais feras no Treino.";
  const bought = [...new Set([...((w.pet.bought as string[]) ?? []), id])];
  const { error } = await w.sb.from("pets").update({ bought, spent: Number(w.pet.spent ?? 0) + PRICE[it.tier] }).not("user_id", "is", null);
  return error ? error.message : doneItems();
}

/** Evolui um item (até o nível 5): +1 ponto percentual de bônus por nível. */
export async function upgradeItem(id: string): Promise<string | null> {
  const it = gearById(id); if (!it) return "Item inválido.";
  const w = await walletState(); if ("err" in w) return w.err!;
  if (!w.items.owned[id]) return "Você ainda não tem este item.";
  const lv = w.items.levels[id] ?? 1; if (lv >= MAX_LEVEL) return "Este item já está no nível máximo.";
  const cost = upgradeCost(it, lv); if (w.items.gold < cost) return "Ouro insuficiente para evoluir.";
  const levels = { ...((w.pet.levels ?? {}) as Record<string, number>), [id]: lv + 1 };
  const { error } = await w.sb.from("pets").update({ levels, spent: Number(w.pet.spent ?? 0) + cost }).not("user_id", "is", null);
  return error ? error.message : doneItems();
}

/** Escolhe a fera domada que acompanha você (ou nenhuma). O servidor confere se ela foi mesmo domada. */
export async function setActiveBeast(id: string | null): Promise<string | null> {
  const w = await walletState(); if ("err" in w) return w.err!;
  if (id !== null && !w.items.army.some((t) => t.id === id)) return "Você ainda não domou esta fera.";
  const { error } = await w.sb.from("pets").update({ active_beast: id }).not("user_id", "is", null);
  return error ? error.message : doneItems();
}

/** Registra o resultado do minigame de domar. Uma tentativa por oportunidade; o servidor confere se ela existe e está aberta. */
export async function attemptTame(key: string, ok: boolean): Promise<string | null> {
  const w = await walletState(); if ("err" in w) return w.err!;
  if (!w.items.pending.some((p) => p.key === key)) return "Esta fera não está mais ao seu alcance.";
  const tries = { ...((w.pet.tame_tries ?? {}) as Record<string, string>), [key]: ok ? "ok" : "falha" };
  const { error } = await w.sb.from("pets").update({ tame_tries: tries }).not("user_id", "is", null);
  return error ? error.message : doneItems();
}

/** Envia o mascote para uma masmorra. Tudo é calculado no servidor (atributos, vida, limite diário e luta). */
export async function runDungeon(id: number) {
  const { DUNGEONS, RUNS_PER_DAY, fight } = await import("@/lib/dungeon");
  const d = DUNGEONS.find((x) => x.id === id); if (!d) return { error: "Masmorra inválida." };
  const sb = await createClient();
  const g = await loadGame(sb, await getSettings(sb), todayISO());
  if (!g.dungeon || !g.pet) return { error: "Adote um mascote primeiro." };
  if (!g.dungeon.ready) return { error: "Rode o SQL 20261203000000_masmorras.sql no Supabase." };
  if (g.dungeon.runsToday >= RUNS_PER_DAY) return { error: `O mascote já entrou ${RUNS_PER_DAY} vezes hoje. Ele volta amanhã.` };
  if (d.id > g.dungeon.best + 1) return { error: "Vença o andar anterior primeiro." };
  if (g.dungeon.hp < g.dungeon.stats.maxHp * 0.2) return { error: "Vida baixa demais. Deixe o mascote descansar (regenera 25% por hora)." };
  const r = fight(g.dungeon.stats, g.dungeon.stage, g.dungeon.hp, d, randomInt(1, 2 ** 31 - 1));
  r.gold = Math.round(r.gold * (1 + (g.dungeon.gear?.gold ?? 0) / 100)); // itens de Ordem: mais Ouro
  const { data: cur } = await sb.from("pets").select("dungeon_gold,dungeon_best,dungeon_runs,bonus_essence").maybeSingle();
  const runs = { ...((cur?.dungeon_runs ?? {}) as Record<string, number>), [todayISO()]: g.dungeon.runsToday + 1 };
  const { error } = await sb.from("pets").update({ hp: r.hp, hp_at: new Date().toISOString(), dungeon_runs: runs,
    dungeon_gold: Number(cur?.dungeon_gold ?? 0) + r.gold, bonus_essence: Number(cur?.bonus_essence ?? 0) + r.essence,
    dungeon_best: Math.max(Number(cur?.dungeon_best ?? 0), r.win ? d.id : 0) }).not("user_id", "is", null);
  if (error) return { error: error.message };
  revalidatePath("/mascote");
  return { result: r, dungeon: d.name };
}
