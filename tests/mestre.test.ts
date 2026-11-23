import { test } from "node:test";
import assert from "node:assert/strict";
import { absence, briefing, reactSet, restLine, verdict, RPE_HINT } from "../src/lib/mestre.ts";

test("briefing cita a semana e o principal", () => {
  const b = briefing({ wave: "Semana de força", label: "Inferior", main: { name: "Agachamento livre", kg: 100, sets: 4, reps: "3-6" }, beast: "Golem", seed: "x" });
  assert.match(b, /força/); assert.match(b, /100 kg/); assert.match(b, /Golem/);
});
test("reação às séries segue o RPE", () => {
  const base = { reps: 8, targetReps: 8, targetRpe: 8, pr: false, curKg: 80, last: false, seed: "s" };
  assert.match(reactSet({ ...base, rpe: 6, nextKg: 82.5 }), /82,5/);
  assert.match(reactSet({ ...base, rpe: 9.5, reps: 5, nextKg: 75 }), /75/);
  assert.match(reactSet({ ...base, rpe: null, nextKg: null }), /RPE/);
  assert.match(reactSet({ ...base, rpe: 8, pr: true, nextKg: null }), /./);
});
test("descanso dá dica do próximo exercício; veredito e ausência", () => {
  assert.match(restLine("Supino reto com barra", "a"), /Supino/);
  assert.match(verdict({ done: 10, total: 10, prs: 1, volume: 5000, beast: "Lobo" }), /Lobo caiu/);
  assert.equal(absence(1), null); assert.match(absence(4)!, /duas vezes/);
  assert.equal(Object.keys(RPE_HINT).length, 5);
});
