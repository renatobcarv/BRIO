import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanDays, cleanStats, type Mark } from "../src/lib/clean.ts";
const L = (d: string): Mark => ({ date: d, kind: "limpo" }), R = (d: string): Mark => ({ date: d, kind: "recaida" });

const N = (d: string) => Date.parse(d + "T23:00:00-03:00");
test("dias sem marcar continuam contando: só a recaída quebra", () => {
  const m = [L("2026-11-08")];
  assert.equal(cleanStats(m, "2026-11-08", N("2026-11-08")).count, 0); // ainda não fez 24h
  assert.equal(cleanStats(m, "2026-11-09", N("2026-11-09")).count, 1);
  assert.equal(cleanStats(m, "2026-11-13", N("2026-11-13")).count, 5);
  assert.equal(cleanStats([], "2026-11-13").count, 0);
});
test("depois da recaída recomeça e o recorde fica", () => {
  const m = [L("2026-11-01"), R("2026-11-04")];
  assert.equal(cleanStats(m, "2026-11-04", N("2026-11-04")).count, 0);
  assert.equal(cleanStats(m, "2026-11-06", N("2026-11-06")).count, 1);
  assert.equal(cleanStats(m, "2026-11-06", N("2026-11-06")).best, 3);
});
test("próximo marco", () => { assert.equal(cleanStats([], "2026-11-12").next, 1); });

test("dias limpos só contam após 24h completas do recomeço", () => {
  const at = "2026-11-20T22:00:00-03:00", rel = [{ date: "2026-11-15", kind: "limpo" as const }, { date: "2026-11-20", kind: "recaida" as const, at }];
  assert.equal(cleanStats(rel, "2026-11-21", Date.parse("2026-11-21T21:59:00-03:00")).count, 0);
  assert.equal(cleanStats(rel, "2026-11-21", Date.parse("2026-11-21T22:00:00-03:00")).count, 1);
  assert.equal(cleanStats(rel, "2026-11-23", Date.parse("2026-11-23T23:00:00-03:00")).count, 3);
});
test("semana/XP seguem as 24h", () => {
  const m: Mark[] = [L("2026-11-01"), { date: "2026-11-04", kind: "recaida", at: "2026-11-04T22:00:00-03:00" }];
  const d = cleanDays(m, "2026-11-06", Date.parse("2026-11-06T10:00:00-03:00"));
  assert.deepEqual(d, ["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-05"]);
});
