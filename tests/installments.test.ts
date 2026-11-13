import { test } from "node:test";
import assert from "node:assert/strict";
import { addMonths, plan, splitCents } from "../src/lib/installments.ts";
test("divide sem perder centavos", () => {
  const p = splitCents(100, 3);
  assert.equal(Math.round(p.reduce((a, b) => a + b, 0) * 100), 10000);
  assert.deepEqual(p, [33.34, 33.33, 33.33]);
});
test("datas mês a mês e fim de mês", () => {
  assert.equal(addMonths("2026-01-31", 1), "2026-02-28");
  assert.equal(addMonths("2026-11-15", 2), "2027-01-15");
  assert.equal(plan({ each: 50, n: 4, first: "2026-11-10" }).at(-1)!.date, "2027-02-10");
});
