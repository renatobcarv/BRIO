import { test } from "node:test";
import assert from "node:assert/strict";
import { GEAR, ITEM_CAP, SLOTS, itemBonus, unlockedGear, validEquipped } from "../src/lib/items.ts";
import type { XpEvent } from "../src/lib/game.ts";

test("catálogo coerente: ids únicos, slot válido, todo slot tem item", () => {
  assert.equal(new Set(GEAR.map((g) => g.id)).size, GEAR.length);
  for (const s of SLOTS) assert.ok(GEAR.some((g) => g.slot === s.slot), s.slot);
});
test("só destrava com a conquista e só equipa no slot certo", () => {
  const un = unlockedGear(["total400", "agua30"]);
  assert.deepEqual(un.map((x) => x.id).sort(), ["cantil", "manopla"]);
  const eq = validEquipped({ forca: { id: "manopla", at: "2026-11-10" }, vigor: { id: "manopla", at: "2026-11-10" }, ordem: { id: "ouro", at: "2026-11-10" }, sabedoria: "lixo" }, un);
  assert.deepEqual(Object.keys(eq), ["forca"]);
});
test("bônus só do atributo, só depois de equipar, nunca acima do teto", () => {
  const ev: XpEvent[] = [{ date: "2026-11-09", attr: "forca", xp: 1000, label: "Treino" }, { date: "2026-11-10", attr: "forca", xp: 1000, label: "Treino" }, { date: "2026-11-10", attr: "vigor", xp: 500, label: "Água" }];
  const b = itemBonus(ev, { forca: { id: "manopla", at: "2026-11-10" } });
  assert.deepEqual(b, [{ date: "2026-11-10", attr: "forca", xp: 60, label: "Bônus · Manopla de Ferro" }]);
  const many: XpEvent[] = [{ date: "2026-11-10", attr: "forca", xp: 100, label: "t" }];
  const all = itemBonus(many, { forca: { id: "cinturao", at: "2026-11-01" } });
  assert.ok(all.reduce((a, e) => a + e.xp, 0) <= 100 * ITEM_CAP);
});
