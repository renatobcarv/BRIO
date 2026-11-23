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
  const h = [{ date: "2026-11-01", kg: 100, reps: 5, rpe: 6 }]; // sobrou força: 1RM ~130
  const s = suggestLoad(h, { reps: "5", rpe: 8 })!;
  assert.equal(s.kg, 105); assert.equal(s.capped, true);
});
test("faixa de reps usa o menor valor e deload reduz 15%", () => {
  const h = [{ date: "2026-11-01", kg: 120, reps: 5, rpe: 8 }, { date: "2026-11-05", kg: 125, reps: 5, rpe: 8 }];
  const n = suggestLoad(h, { reps: "6-8", rpe: 7 })!; const d = suggestLoad(h, { reps: "6-8", rpe: 7 }, { deload: true })!;
  assert.ok(n.kg <= 125 * 1.05); assert.ok(d.kg < n.kg); assert.ok(d.kg <= n.kg * 0.9);
});

import { nextSetKg, setLoads, starterLoad } from "../src/lib/progression.ts";
test("cargas por série: força = principal + recuo; volume = retas", () => {
  assert.deepEqual(setLoads(100, 4, 5), [100, 92.5, 92.5, 92.5]);
  assert.deepEqual(setLoads(60, 3, 10), [60, 60, 60]);
});
test("ajuste ao vivo: fácil sobe (até 5%), pesado desce (até 10%), sem RPE mantém", () => {
  assert.ok(nextSetKg({ kg: 80, reps: 8, rpe: 6 }, { reps: 8, rpe: 8 }, 80) > 80);
  assert.ok(nextSetKg({ kg: 80, reps: 8, rpe: 6 }, { reps: 8, rpe: 8 }, 80) <= 84);
  assert.ok(nextSetKg({ kg: 80, reps: 5, rpe: 10 }, { reps: 8, rpe: 8 }, 80) < 80);
  assert.ok(nextSetKg({ kg: 80, reps: 5, rpe: 10 }, { reps: 8, rpe: 8 }, 80) >= 72);
  assert.equal(nextSetKg({ kg: 80, reps: 8, rpe: null }, { reps: 8, rpe: 8 }, 80), 80);
  assert.equal(nextSetKg({ kg: 80, reps: 8, rpe: 8 }, { reps: 8, rpe: 8 }, 80), 80);
});
test("carga inicial estimada pelo peso corporal", () => {
  assert.equal(starterLoad("Agachamento livre", 80), 45);
  assert.equal(starterLoad("Elevação lateral com halteres", 80), 5);
  assert.equal(starterLoad("Exercício inventado", 80), null);
});

test("faixa de reps muito diferente: calibra 10% abaixo (nunca copia o recorde)", () => {
  const h = [{ date: "2026-11-01", kg: 82.5, reps: 6, rpe: 9 }];
  const s = suggestLoad(h, { reps: "12-16", rpe: 8 })!;
  assert.ok(s.kg <= 82.5 * 0.8, String(s.kg)); assert.match(s.reason, /calibrar/);
});
test("muito tempo parado: −10%", () => {
  const h = [{ date: "2026-10-01", kg: 100, reps: 5, rpe: 8 }];
  assert.ok(suggestLoad(h, { reps: "5", rpe: 8 }, { today: "2026-11-01" })!.kg < suggestLoad(h, { reps: "5", rpe: 8 })!.kg);
});
