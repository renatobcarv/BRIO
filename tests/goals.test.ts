import assert from "node:assert/strict";
import { test } from "node:test";
import { goalMilestones, parseGoalValue, type GoalRow } from "../src/lib/goals.ts";

const today = "2026-11-20";
const base: GoalRow = {
  id: "meta", objective_id: null, title: "Meta", area: "pessoal", unit: "",
  target: 100, current: 50, start_value: 0, deadline: null, featured: false,
  auto_source: null, auto_ref: null, created_at: today,
};

test("marcos refletem os valores reais em metas crescentes e decrescentes", () => {
  const increasing = goalMilestones(base, today);
  assert.deepEqual(increasing.map((m) => m.value), [25, 50, 75, 100]);
  assert.deepEqual(increasing.map((m) => m.reached), [true, true, false, false]);
  const decreasing = goalMilestones({ ...base, start_value: 90, target: 70, current: 74 }, today);
  assert.deepEqual(decreasing.map((m) => m.value), [85, 80, 75, 70]);
  assert.deepEqual(decreasing.map((m) => m.reached), [true, true, true, false]);
});

test("valor da meta aceita decimais sem trocar milhares por unidades", () => {
  assert.equal(parseGoalValue("1234,56"), 1234.56);
  assert.equal(parseGoalValue("1.234,56"), 1234.56);
  assert.equal(parseGoalValue("1234.56"), 1234.56);
  assert.equal(parseGoalValue(""), null);
  assert.equal(parseGoalValue("abc"), null);
});
