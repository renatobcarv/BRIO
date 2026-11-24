import { test } from "node:test";
import assert from "node:assert/strict";
import { bmr, targets, adjustForPhase } from "../src/lib/diet-plan.ts";
test("TMB Mifflin e metas", () => {
  assert.equal(bmr("m", 80, 180, 30), 1780);
  const t = targets({ sex: "m", kg: 80, cm: 180, age: 30, activity: "moderado", goal: "perder" });
  assert.ok(t.kcal < t.tdee && t.protein === 176 && t.water === 2800);
  assert.ok(Math.abs(t.protein * 4 + t.carbs * 4 + t.fat * 9 - t.kcal) < 20);
});
test("fase muda as calorias pelo carboidrato", () => {
  const b = { kcal: 2500, protein: 180, carbs: 280, fat: 70 };
  const up = adjustForPhase(b, "acumulacao"), down = adjustForPhase(b, "deload");
  assert.ok(up.kcal > 2500 && up.carbs > 280 && up.protein === 180); assert.ok(down.kcal < 2500);
});
import { weightPlan } from "../src/lib/diet-plan.ts";
test("cutting de 89 para 80 kg: déficit pelo ritmo, bem abaixo de 3300 kcal, com piso de segurança", () => {
  const r = weightPlan({ sex: "m", kg: 89, cm: 180, age: 30, activity: "alto", targetKg: 80 });
  assert.equal(r.goal, "perder"); assert.equal(r.phase.label, "Cutting");
  assert.ok(r.kcal < 2700 && r.kcal > 1800, String(r.kcal));
  assert.ok(r.rate >= 0.44 && r.rate <= 0.89); assert.ok(r.weeks >= 10 && r.weeks <= 21);
  const fast = weightPlan({ sex: "m", kg: 89, cm: 180, age: 30, activity: "alto", targetKg: 80, weeks: 3 });
  assert.ok(fast.rate <= 0.89 + 1e-9, "não deixa passar de 1%/semana");
  const bulk = weightPlan({ sex: "m", kg: 70, cm: 175, age: 25, activity: "moderado", targetKg: 76 });
  assert.equal(bulk.goal, "ganhar"); assert.ok(bulk.kcal > bulk.tdee);
});
