import { test } from "node:test";
import assert from "node:assert/strict";
import { loadFor, roundPlate, setE1rm, suggestLoad } from "../src/lib/progression.ts";

test("RPE entra no 1RM estimado como repetições em reserva", () => {
  assert.equal(Math.round(setE1rm({ kg: 100, reps: 5 })), 117);          // Epley puro
  assert.equal(Math.round(setE1rm({ kg: 100, reps: 5, rpe: 8 })), 123);  // 5 + 2 RIR
  assert.equal(setE1rm({ kg: 200, reps: 1 }), 200);
});
test("carga para reps e RPE alvo", () => { assert.equal(roundPlate(loadFor(150, 5, 8)), 122.5); assert.equal(roundPlate(103.7), 102.5); assert.equal(roundPlate(104), 105); });
test("sem histórico não sugere nada", () => assert.equal(suggestLoad([], { reps: "5", rpe: 8 }), null));
test("sugestão limitada a +5% da última carga", () => {
  const h = [{ date: "2026-11-01", kg: 100, reps: 10, rpe: 9 }]; // 1RM ~140
  const s = suggestLoad(h, { reps: "3", rpe: 9 })!;
  assert.equal(s.kg, 105); assert.equal(s.capped, true);
});
test("faixa de reps usa o menor valor e deload reduz 15%", () => {
  const h = [{ date: "2026-11-01", kg: 120, reps: 5, rpe: 8 }, { date: "2026-11-05", kg: 125, reps: 5, rpe: 8 }];
  const n = suggestLoad(h, { reps: "6-8", rpe: 7 })!; const d = suggestLoad(h, { reps: "6-8", rpe: 7 }, { deload: true })!;
  assert.ok(n.kg <= 125 * 1.05); assert.ok(d.kg < n.kg); assert.ok(d.kg <= n.kg * 0.9);
});
