import { test } from "node:test";
import assert from "node:assert/strict";
import { attrValue, levelOf, rankOf, summarize, xpForLevel, type GameInput } from "../src/lib/game.ts";

const empty: GameInput = { today: "2026-11-12", checks: [], fullDays: [], study: [], chapters: [], pioneer: [], workouts: [], waterDays: [], waterGoal: 3000, sleep: [], readingPages: [], booksFinished: [], finance: [], weights: [] };

test("curva de níveis", () => {
  assert.equal(xpForLevel(1), 0); assert.equal(xpForLevel(2), 100); assert.equal(xpForLevel(10), 4500);
  assert.equal(levelOf(0).level, 1); assert.equal(levelOf(99).level, 1); assert.equal(levelOf(100).level, 2); assert.equal(levelOf(4500).level, 10);
  assert.equal(levelOf(150).into, 50); assert.equal(levelOf(150).need, 200);
});
test("patentes e atributos", () => { assert.equal(rankOf(1).name, "Initiate"); assert.equal(rankOf(2).name, "Initiate"); assert.equal(rankOf(3).name, "Awakened"); assert.equal(rankOf(12).name, "Warrior"); assert.equal(rankOf(55).name, "Apex"); assert.equal(rankOf(99).name, "Apex"); assert.equal(attrValue(0), 1); assert.equal(attrValue(1000), 10); assert.equal(attrValue(1e9), 99); });
test("sem registros, nível 1 e nada inventado", () => { const s = summarize(empty); assert.equal(s.total, 0); assert.equal(s.level, 1); assert.ok(s.achievements.every((a) => !a.done)); });
test("XP por área", () => {
  const s = summarize({ ...empty,
    checks: Array.from({ length: 7 }, () => ({ date: "2026-11-12" })), fullDays: ["2026-11-12"],
    study: [{ date: "2026-11-12", minutes: 30 }], pioneer: [{ date: "2026-11-11", minutes: 120 }],
    waterDays: [{ date: "2026-11-12", ml: 3200 }],
  });
  assert.equal(s.attrXp.disciplina, 120); assert.equal(s.attrXp.sabedoria, 30); assert.equal(s.attrXp.servico, 60); assert.equal(s.attrXp.vigor, 20);
  assert.equal(s.today, 170); assert.equal(s.total, 230);
});
test("recorde só conta quando supera o anterior", () => {
  const w = (date: string, kg: number) => ({ date, cardio: false, sets: [{ exercise: "Agachamento", kg, reps: 5 }] });
  const s = summarize({ ...empty, workouts: [w("2026-11-01", 120), w("2026-11-05", 130), w("2026-11-08", 125)] });
  assert.equal(s.recent.filter((e) => e.label.startsWith("Recorde")).length, 1);
  assert.ok(s.achievements.find((a) => a.id === "total400")!.progress > 0);
});

import { longestRun, neverTwiceRun } from "../src/lib/game.ts";
test("maior sequência de dias", () => { assert.equal(longestRun(["2026-11-01", "2026-11-02", "2026-11-04", "2026-11-05", "2026-11-06"]), 3); assert.equal(longestRun([]), 0); });
test("nunca falhe duas vezes", () => {
  // falha um dia isolado: não quebra; dois seguidos: quebra
  assert.equal(neverTwiceRun(["2026-11-01", "2026-11-02", "2026-11-04", "2026-11-05"], "2026-11-05"), 5);
  assert.equal(neverTwiceRun(["2026-11-01", "2026-11-04", "2026-11-05"], "2026-11-05"), 2);
});

test("cardio com km não vira volume de força", () => {
  const s = summarize({ ...empty, workouts: [{ date: "2026-11-01", cardio: true, sets: [{ exercise: "Bicicleta", kg: 12, reps: 40 }] }] });
  assert.equal(s.attrXp.forca, 0); assert.equal(s.attrXp.vigor, 30);
});
