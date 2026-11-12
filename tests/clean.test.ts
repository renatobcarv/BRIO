import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanStats, type Mark } from "../src/lib/clean.ts";
const L = (d: string): Mark => ({ date: d, kind: "limpo" }), R = (d: string): Mark => ({ date: d, kind: "recaida" });

test("conta dias seguidos até hoje ou ontem", () => {
  const m = [L("2026-11-08"), L("2026-11-09"), L("2026-11-10"), L("2026-11-11")];
  assert.equal(cleanStats(m, "2026-11-11").count, 4); assert.equal(cleanStats(m, "2026-11-12").count, 4);
  assert.equal(cleanStats(m, "2026-11-12").todayDone, false); assert.equal(cleanStats(m, "2026-11-13").count, 0);
});
test("recaída zera e o recorde fica", () => {
  const m = [L("2026-11-01"), L("2026-11-02"), L("2026-11-03"), R("2026-11-04"), L("2026-11-05")];
  const s = cleanStats(m, "2026-11-05"); assert.equal(s.count, 1); assert.equal(s.best, 3); assert.equal(s.total, 4);
});
test("próximo marco", () => { assert.equal(cleanStats([], "2026-11-12").next, 1); assert.equal(cleanStats([L("2026-11-12")], "2026-11-12").next, 3); });
