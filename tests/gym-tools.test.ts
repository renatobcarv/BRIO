import { test } from "node:test";
import assert from "node:assert/strict";
import { epley, platesFor, warmup } from "../src/lib/gym-tools.ts";
import { allExercises } from "../src/lib/swaps.ts";
test("1RM Epley", () => { assert.equal(epley(100, 1), 100); assert.equal(epley(100, 5), 116.7); });
test("anilhas por lado", () => { const r = platesFor(100); assert.deepEqual(r.perSide, [25, 15]); assert.equal(r.achieved, 100); assert.deepEqual(platesFor(62.5).perSide, [20, 1.25]); });
test("aquecimento sobe até perto da carga", () => { const w = warmup(100); assert.equal(w[0].kg, 20); assert.equal(w.at(-1)!.kg, 90); assert.ok(w.every((x, i) => i === 0 || x.kg > w[i - 1].kg)); });
test("biblioteca", () => { assert.ok(allExercises().length > 60); });
import { warmup as wu } from "../src/lib/gym-tools.ts";
test("aquecimento sobe até ~90% e nunca passa da carga de trabalho", () => {
  const w = wu(120); assert.equal(w[0].kg, 20); assert.ok(w.every((x) => x.kg < 120)); assert.equal(w.at(-1)!.kg, 107.5);
});
