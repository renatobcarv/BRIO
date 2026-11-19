import { test } from "node:test";
import assert from "node:assert/strict";
import { hourPlans, pace } from "../src/lib/pioneer.ts";
test("planos para fechar as horas cabem nos dias restantes", () => {
  const r = hourPlans(600, "2026-11-19", "2026-11-30");
  assert.equal(r.daysLeft, 12);
  assert.equal(r.plans.find((p) => p.id === "manha")!.sessions, 3);
  assert.equal(r.perDay, 50);
});
test("ritmo", () => {
  assert.equal(pace(1800, 3000, 15, 30).state, "adiantado");
  assert.equal(pace(1200, 3000, 15, 30).state, "atrasado");
});
