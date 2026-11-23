import { test } from "node:test";
import assert from "node:assert/strict";
import { achievements, levelOf, summarize, xpEvents, xpForLevel, XP_EVENT_CAP, type GameInput } from "../src/lib/game.ts";

const base = (o: Partial<GameInput> = {}): GameInput => ({ today: "2026-11-23", checks: [], fullDays: [], study: [], chapters: [], pioneer: [], workouts: [],
  waterDays: [], waterGoal: 2500, sleep: [], readingPages: [], booksFinished: [], finance: [], weights: [], ...o });

test("levelOf: limites exatos e nunca trava", () => {
  for (let n = 1; n < 200; n++) { assert.equal(levelOf(xpForLevel(n)).level, n); assert.equal(levelOf(xpForLevel(n) - 1).level, Math.max(1, n - 1)); }
  for (const bad of [NaN, -50, Infinity, -Infinity]) { const l = levelOf(bad); assert.equal(l.level, 1); assert.ok(Number.isFinite(l.progress)); }
  assert.ok(levelOf(1e15).level > 1000); // termina rápido
});

test("dados sujos do banco não viram NaN nem XP absurdo", () => {
  const g = base({
    workouts: [{ date: "2026-11-20", cardio: false, sets: [{ exercise: "Supino", kg: "80" as never, reps: null as never }, { exercise: "Agachamento", kg: 99999, reps: 99999 }, { exercise: "Terra", kg: NaN, reps: 5 }] }],
    pioneer: [{ date: "2026-11-20", minutes: -30 }, { date: "data-ruim", minutes: 60 }],
    study: [{ date: "2026-11-20", minutes: NaN }],
    eventBonus: [{ date: "2026-11-20", xp: 1e9, label: "bug", attr: "ordem" }, { date: "2026-11-20", xp: 10, label: "x", attr: "inexistente" as never }],
    finance: [{ month: "2026-10-01", logged: NaN, income: 0, expenses: 100 }],
  });
  const ev = xpEvents(g);
  for (const e of ev) { assert.ok(Number.isInteger(e.xp) && e.xp > 0 && e.xp <= XP_EVENT_CAP, JSON.stringify(e)); assert.match(e.date, /^\d{4}-\d{2}-\d{2}$/); }
  const s = summarize(g);
  assert.ok(Number.isFinite(s.total) && s.total > 0);
  for (const a of s.achievements) assert.ok(Number.isFinite(a.value) && Number.isFinite(a.progress));
});

test("summarize: total = soma dos atributos = soma da semana quando tudo é recente", () => {
  const g = base({ checks: [{ date: "2026-11-22" }, { date: "2026-11-22" }], chapters: [{ date: "2026-11-23" }], sleep: [{ date: "2026-11-21", hours: 8 }] });
  const s = summarize(g);
  assert.equal(s.total, Object.values(s.attrXp).reduce((a, b) => a + b, 0));
  assert.equal(s.total, s.week.reduce((a, d) => a + d.xp, 0));
  assert.equal(s.today, 15);
  assert.equal(s.week.at(-1)!.date, "2026-11-23");
});

test("listas grandes não estouram a pilha", () => {
  const sets = Array.from({ length: 200000 }, (_, i) => ({ exercise: "Supino reto", kg: 60 + (i % 40), reps: 5 }));
  const a = achievements(base({ workouts: [{ date: "2026-11-01", cardio: false, sets }] }));
  assert.ok(a.length > 10);
});

test("vazio é estável", () => { const s = summarize(base()); assert.equal(s.total, 0); assert.equal(s.level, 1); });
