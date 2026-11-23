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
  const { data: pet, error } = await sb.from("pets").select("equipped,bought,levels,spent").maybeSingle();
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
