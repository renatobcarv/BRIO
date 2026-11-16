import { test } from "node:test";
import assert from "node:assert/strict";
import { nextReview, masteryFromEvidence, masteryFromLevel, evidenceXp } from "../src/lib/learning.ts";
import { contextWindow, systemPrompt, MODES } from "../src/lib/ai/pedagogy.ts";

const s0 = { interval_days: 0, ease: 2.5, hits: 0, misses: 0 };
test("acerto amplia o intervalo progressivamente", () => {
  const a = nextReview(s0, 4, "2026-11-16"); assert.equal(a.interval_days, 1); assert.equal(a.review_at, "2026-11-17");
  const b = nextReview(a, 4, "2026-11-17"); assert.equal(b.interval_days, 3);
  const c = nextReview(b, 5, "2026-11-20"); assert.ok(c.interval_days > 3);
});
test("erro volta para 1 dia, reduz a facilidade e marca revisar", () => {
  const r = nextReview({ interval_days: 20, ease: 2.5, hits: 5, misses: 0 }, 1, "2026-11-16");
  assert.equal(r.interval_days, 1); assert.ok(r.ease < 2.5); assert.equal(r.misses, 1); assert.equal(r.mastery, "revisar");
});
test("domínio exige acertos consistentes em intervalos longos", () => {
  assert.equal(nextReview({ interval_days: 10, ease: 2.5, hits: 3, misses: 0 }, 5, "2026-11-16").mastery, "dominado");
  assert.equal(nextReview(s0, 5, "2026-11-16").mastery, "compreensao");
});
test("domínio por evidência: erro recente pede revisão", () => {
  assert.equal(masteryFromEvidence([]), "nao_estudado");
  assert.equal(masteryFromEvidence([{ date: "2026-11-10", level: 5, score: 90 }, { date: "2026-11-15", level: 3, score: 30 }]), "revisar");
  assert.equal(masteryFromLevel(2), "compreensao"); assert.equal(masteryFromLevel(5), "dominado");
});
test("XP vem de evidência e cresce com a qualidade", () => {
  assert.ok(evidenceXp({ kind: "avaliacao", level: 5, score: 100 }) > evidenceXp({ kind: "avaliacao", level: 1, score: 20 }));
  assert.ok(evidenceXp({ kind: "projeto", level: 4, score: 80 }) > evidenceXp({ kind: "revisao", level: 4, score: 80 }));
});
test("janela de contexto respeita orçamento e começa pelo aluno", () => {
  const msgs = Array.from({ length: 40 }, (_, i) => ({ role: (i % 2 ? "assistant" : "user") as "user" | "assistant", content: "x".repeat(2000) }));
  const { kept, dropped } = contextWindow(msgs, 10000);
  assert.ok(kept.length <= 6 && kept.length >= 2); assert.equal(kept[0].role, "user"); assert.equal(dropped, 40 - kept.length);
});
test("o modo muda a instrução pedagógica", () => {
  const a = systemPrompt({ title: "Recursão", mode: "socratico" }), b = systemPrompt({ title: "Recursão", mode: "praticar" });
  assert.ok(a.includes(MODES.socratico.rule) && !a.includes(MODES.praticar.rule)); assert.ok(b.includes(MODES.praticar.rule));
});
