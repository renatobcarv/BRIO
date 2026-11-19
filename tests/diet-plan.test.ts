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
