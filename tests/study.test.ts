import { test } from "node:test";
import assert from "node:assert/strict";
import { nextStep, progress, review, studyStreak, type SItem } from "../src/lib/study.ts";
const it = (p: Partial<SItem>): SItem => ({ id: String(Math.random()), track_id: "t", module: "M", title: "x", position: 0, est_min: 30, status: "afazer", weak: false, confidence: null, link: null, notes: null, review_at: null, review_step: 0, done_at: null, ...p });
test("próximo passo prioriza revisão vencida e fraqueza", () => {
  const a = it({ id: "a", position: 1 }), w = it({ id: "w", position: 2, weak: true }), r = it({ id: "r", status: "dominado", review_at: "2026-11-10" });
  assert.equal(nextStep([a, w, r], "2026-11-13")!.id, "r");
  assert.equal(nextStep([a, w], "2026-11-13")!.id, "w");
});
test("revisão espaçada e progresso", () => {
  assert.equal(review({ review_step: 0 }, true, "2026-11-13").review_at, "2026-11-16");
  assert.equal(review({ review_step: 3 }, false, "2026-11-13").review_step, 0);
  assert.equal(progress([it({ status: "dominado" }), it({})]), 0.5);
  assert.equal(studyStreak([{ date: "2026-11-12", track_id: null, item_id: null, minutes: 10, kind: "estudo" }, { date: "2026-11-11", track_id: null, item_id: null, minutes: 10, kind: "estudo" }], "2026-11-13"), 2);
});
