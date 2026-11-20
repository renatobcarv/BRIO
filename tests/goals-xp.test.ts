import { test } from "node:test";
import assert from "node:assert/strict";
import { goalsXp } from "../src/lib/goals.ts";
const g = (current: number, target: number) => ({ id: "x", objective_id: null, title: "t", area: "pessoal" as const, unit: "", target, current, start_value: 0, deadline: null, featured: false, auto_source: null, auto_ref: null, created_at: "2026-01-01T00:00:00Z" });
test("XP de metas por marcos e conclusão", () => {
  const r = goalsXp([g(5, 10), g(10, 10), g(1, 10)], "2026-11-20");
  assert.equal(r.marks, 2 + 4 + 0); assert.equal(r.done, 1); assert.equal(r.xp, (50 + 100 + 10) * 10 + 6 * 50 + 300); assert.ok(r.level >= 2);
});
