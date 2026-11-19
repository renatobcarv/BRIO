import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { petState, stageOf, buffFor, STAGES, SPECIES, seeded, roll } from "../src/lib/pet.ts";
import { HABITATS } from "../src/lib/pet-habitats.ts";
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
test("sorteio: dragão é o mais raro", () => {
  const n = 20000, c: Record<string, number> = {};
  for (let i = 0; i < n; i++) { const s = roll((i + 0.5) / n); c[s.key] = (c[s.key] ?? 0) + 1; }
  assert.equal(Object.keys(c).length, SPECIES.length);
  assert.ok(c.dragao < c.fenix && c.fenix < c.leao && c.leao < c.lobo);
  assert.ok(c.dragao / n > 0.01 && c.dragao / n < 0.02);
});


test("todas as espécies têm arte para cada fase, inclusive Lenda", () => {
  const phases = STAGES.map(({ key }) => `${key}.webp`).sort();
  for (const { key } of SPECIES) {
    const folder = new URL(`../public/mascotes/${key}/`, import.meta.url);
    assert.deepEqual(readdirSync(folder).sort(), phases, key);
  }
});


test("cada espécie tem um lar ilustrado e todos os novos mascotes podem ser adotados", () => {
  const keys = SPECIES.map(({ key }) => key).sort();
  assert.deepEqual(Object.keys(HABITATS).sort(), keys);
  assert.deepEqual(readdirSync(new URL("../public/mascotes/lares/", import.meta.url)).sort(), keys.flatMap((key) => [`${key}.webp`, `${key}-1600.webp`, `${key}-4k.webp`]).sort());
  const migration = readFileSync(new URL("../supabase/migrations/20261126000000_reino_dos_mascotes.sql", import.meta.url), "utf8");
  for (const key of [...keys, "onca"]) assert.ok(migration.includes(`'${key}'`), key);
});
