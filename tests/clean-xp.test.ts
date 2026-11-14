import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanXp, cleanXpByDay, fireTier } from "../src/lib/clean.ts";

test("XP do dia limpo cresce e estabiliza", () => {
  assert.equal(cleanXp(1), 10);
  assert.ok(cleanXp(7) > cleanXp(3) && cleanXp(3) > cleanXp(1));
  assert.ok(cleanXp(365) <= 30 && cleanXp(60) >= 29);
});
test("lacuna reinicia a sequência", () => {
  const r = cleanXpByDay(["2026-11-01", "2026-11-02", "2026-11-04"]);
  assert.deepEqual(r.map((x) => x.day), [1, 2, 1]);
});
test("fogo por faixa", () => {
  assert.equal(fireTier(0).name, "Apagado");
  assert.equal(fireTier(7).name, "Fogueira");
  assert.equal(fireTier(120).name, "Rubi");
  assert.equal(fireTier(40).name, "Fogo branco");
});
