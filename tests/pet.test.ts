import { test } from "node:test";
import assert from "node:assert/strict";
import { petState, stageOf, buffFor, STAGES, seeded } from "../src/lib/pet.ts";
const ev = (date: string, xp: number, attr = "forca") => ({ date, attr, xp, label: "x" });
test("cresce com a essência e não regride", () => {
  assert.equal(stageOf(0).key, "filhote"); assert.equal(stageOf(1500).key, "cacador");
  const s = petState("p1", "2026-11-01", [ev("2026-11-01", 300), ev("2026-11-02", 200)], "2026-11-20");
  assert.equal(s.essence, 500); assert.equal(s.stage.key, "jovem"); assert.equal(s.mood, "faminto");
});
test("eventos antes da adoção não alimentam", () => {
  assert.equal(petState("p", "2026-11-10", [ev("2026-11-01", 999)], "2026-11-10").essence, 0);
});
test("bônus é estável por dia e mais frequente em fases maiores", () => {
  assert.deepEqual(buffFor("p", "2026-11-19", STAGES[2], false), buffFor("p", "2026-11-19", STAGES[2], false));
  const count = (st: number) => Array.from({ length: 2000 }, (_, i) => buffFor("pet", `d${i}`, STAGES[st], false)).filter(Boolean).length;
  assert.ok(count(5) > count(0) * 2); assert.ok(count(0) > 50 && count(0) < 300);
  assert.equal(buffFor("p", "2026-11-19", STAGES[5], true), null);
  assert.ok(seeded("a") >= 0 && seeded("a") < 1);
});
import { roll, SPECIES } from "../src/lib/pet.ts";
test("sorteio: dragão é o mais raro", () => {
  const n = 20000, c: Record<string, number> = {};
  for (let i = 0; i < n; i++) { const s = roll((i + 0.5) / n); c[s.key] = (c[s.key] ?? 0) + 1; }
  assert.equal(Object.keys(c).length, SPECIES.length);
  assert.ok(c.dragao < c.fenix && c.fenix < c.leao && c.leao < c.lobo);
  assert.ok(c.dragao / n > 0.01 && c.dragao / n < 0.02);
});
