import { test } from "node:test";
import assert from "node:assert/strict";
import { futureValue, monthlyRate, monthsToTarget, projection, reserveMonths } from "../src/lib/invest.ts";

const close = (a: number, b: number, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} ≈ ${b}`);
test("taxa mensal equivalente", () => { close(monthlyRate(12.6825), 0.01, 1e-5); close(monthlyRate(0), 0); });
test("sem aportes: juros compostos anuais", () => { close(futureValue(1000, 0, 10, 12), 1100); close(futureValue(1000, 0, 10, 24), 1210); });
test("sem juros: soma simples", () => { close(futureValue(1000, 100, 0, 10), 2000); });
test("aportes mensais a 1% a.m.", () => { close(futureValue(0, 100, 12.682503, 12), 1268.25, 0.05); });
test("projeção separa aportado e juros", () => {
  const p = projection(1000, 100, 10, 12);
  assert.equal(p.length, 13); close(p[12].contributed, 2200); close(p[12].total - p[12].contributed, p[12].interest); assert.ok(p[12].interest > 0);
});
test("meses até a meta", () => { assert.equal(monthsToTarget(1000, 100, 0, 2000), 10); assert.equal(monthsToTarget(5000, 0, 0, 1000), 0); assert.equal(monthsToTarget(0, 0, 0, 10), null); });
test("reserva em meses", () => { assert.equal(reserveMonths(6000, 2000), 3); assert.equal(reserveMonths(1000, 0), null); });
