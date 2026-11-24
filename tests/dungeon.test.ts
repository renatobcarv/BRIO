import { test } from "node:test";
import assert from "node:assert/strict";
import { DUNGEONS, fight, petStats, power, recommended, regen, skillsOf } from "../src/lib/dungeon.ts";

test("evolução libera habilidades e aumenta o poder", () => {
  assert.equal(skillsOf(0).length, 1); assert.equal(skillsOf(5).length, 6);
  assert.ok(power(petStats(5, 20000)) > power(petStats(0, 0)) * 3);
});
test("andares fáceis com filhote; difíceis exigem evolução; determinístico", () => {
  const baby = petStats(0, 0), legend = petStats(5, 20000);
  assert.ok(fight(baby, 0, baby.maxHp, DUNGEONS[0], 1).win);
  assert.ok(!fight(baby, 0, baby.maxHp, DUNGEONS[7], 1).win);
  assert.ok(fight(legend, 5, legend.maxHp, DUNGEONS[7], 1).win);
  assert.deepEqual(fight(baby, 0, baby.maxHp, DUNGEONS[1], 42), fight(baby, 0, baby.maxHp, DUNGEONS[1], 42));
  for (let k = 1; k < DUNGEONS.length; k++) assert.ok(recommended(DUNGEONS[k]) > recommended(DUNGEONS[k - 1]));
});
test("vida: derrota zera, regenera 25%/h; sem vida não luta", () => {
  const s = petStats(1, 500), r = fight(s, 1, 1, DUNGEONS[5], 3);
  assert.equal(r.win, false); assert.equal(r.hp, 0); assert.ok(r.gold < DUNGEONS[5].gold);
  assert.equal(regen(0, new Date(Date.now() - 2 * 36e5).toISOString(), 100), 50);
  assert.equal(regen(null, null, 100), 100);
});
