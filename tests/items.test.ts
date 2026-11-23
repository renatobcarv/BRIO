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

import { PRICE, dropChance, dropOf, economy, gearPct, kills, roll, upgradeCost, GEAR as ALLG } from "../src/lib/items.ts";
test("32 equipamentos: 16 de conquista, 16 de saque", () => {
  assert.equal(ALLG.length, 32); assert.equal(ALLG.filter((g) => g.source === "saque").length, 16);
});
test("chance de saque sobe com a ameaça e chefe dá mais", () => {
  assert.ok(dropChance(1, false) < dropChance(3, false) && dropChance(3, false) < dropChance(5, false) && dropChance(5, false) < dropChance(5, true));
  assert.ok(dropChance(1, false) <= 0.07);
  const r = Array.from({ length: 4000 }, (_, i) => roll("k" + i)); assert.ok(Math.abs(r.reduce((a, b) => a + b, 0) / r.length - 0.5) < 0.03);
});
test("abates, saques estáveis, repetido vira Ouro, compra e nível validados", () => {
  const p = { id: "p1", start_date: "2026-11-01", phases: [{ kind: "base", weeks: 2, days: { 1: [1], 3: [1] } }, { kind: "realizacao", weeks: 1, days: { 1: [1] } }] };
  const s = Array.from({ length: 30 }, (_, i) => ({ program_id: "p1", week_no: 1 + (i % 3), date: `2026-11-${String(1 + i).padStart(2, "0")}` }));
  const ks = kills([p] as never, s);
  assert.equal(ks.length, 30); assert.ok(ks.filter((k) => k.boss).length === 10);
  assert.deepEqual(ks.map(dropOf), ks.map(dropOf)); // determinístico
  const e = economy(ks, [], { bought: ["presa-lobo", "manopla"], levels: { "presa-lobo": 9, fantasma: 3 }, spent: 100 });
  assert.equal(e.owned.get("manopla"), undefined); // conquista não se compra
  assert.equal(e.levels["presa-lobo"], 5); assert.equal(e.levels.fantasma, undefined);
  assert.equal(e.gold, e.earned - 100);
});
test("evolução: +1 ponto por nível e custo crescente", () => {
  const it = ALLG.find((g) => g.id === "presa-lobo")!;
  assert.equal(gearPct(it, 1), 4); assert.equal(gearPct(it, 5), 8);
  assert.ok(upgradeCost(it, 1) < upgradeCost(it, 4)); assert.equal(PRICE.comum, 60);
});

import { BEAST_ATTR, tameChance, tamed, tamedLevel, tamedPct, itemBonus as ib } from "../src/lib/items.ts";
import { tameOpportunities, sealDifficulty } from "../src/lib/items.ts";
test("domar é raríssimo e exige vencer o minigame; anjos nunca", () => {
  assert.ok(tameChance(1, false) <= 0.011 && tameChance(5, true) <= 0.07);
  const ks = Array.from({ length: 3000 }, (_, i) => ({ key: "k" + i, date: "2026-11-10", beast: (i % 2 ? "guardiao" : "aureo") as never, threat: 5, boss: true, angel: i % 2 === 0 }));
  const ops = tameOpportunities(ks);
  assert.ok(ops.length > 20 && ops.length < 160, String(ops.length)); // ~6% de 1500
  assert.equal(tamed(ks).length, 0); // sem minigame, nada
  const tries = { [ops[0].key]: "falha" as const, [ops[1].key]: "ok" as const, [ops[2].key]: "ok" as const };
  const t = tamed(ks, tries);
  assert.equal(t.length, 1); assert.equal(t[0].stars, 2); assert.equal(t[0].attempts, 3);
  assert.equal(tameOpportunities(ks, tries).length, ops.length - 3);
  assert.equal(Object.keys(BEAST_ATTR).length, 10);
  assert.ok(sealDifficulty(5, true).zoneDeg < sealDifficulty(1, false).zoneDeg);
});
test("fera ativa dá bônus no atributo dela, dentro do teto", () => {
  assert.equal(tamedPct(1), 3); assert.equal(tamedPct(9), 7); assert.equal(tamedLevel(0), 1);
  const b = ib([{ date: "2026-11-10", attr: "servico", xp: 1000, label: "campo" }], {}, {}, [{ attr: "servico", pct: 5, at: "2026-11-01", name: "Guardião" }]);
  assert.deepEqual(b, [{ date: "2026-11-10", attr: "servico", xp: 50, label: "Bônus · Guardião" }]);
});
