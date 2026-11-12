import { test } from "node:test";
import assert from "node:assert/strict";
import { physicalAttributes, prEvents, trainingInsights, trainingMedals, weeklyReview, type WSession } from "../src/lib/physical.ts";

const day = (n: number) => new Date(Date.parse("2026-11-12T12:00:00Z") - n * 864e5).toISOString().slice(0, 10);
const sq = (date: string, kg: number, reps = 5): WSession => ({ date, sets: [{ exercise: "Agachamento", kg, reps }, { exercise: "Supino", kg: kg * 0.7, reps }, { exercise: "Levantamento terra", kg: kg * 1.2, reps: 3 }] });

test("sem dados, atributos ficam vazios (nada inventado)", () => {
  const a = physicalAttributes([], "2026-11-12", 84, 4);
  assert.equal(a.strength, null); assert.equal(a.endurance, null); assert.equal(a.consistency, null);
});
test("força relativa ao peso corporal e cardio separado", () => {
  const ws = [sq(day(3), 140), { date: day(2), sets: [{ exercise: "Bicicleta", kg: 10, reps: 60 }] }];
  const a = physicalAttributes(ws, "2026-11-12", 84, 4);
  assert.ok(a.strength! > 50 && a.strength! < 99); assert.equal(a.endurance, 10); assert.equal(a.detail.card28, 60);
});
test("recordes só quando superam o melhor anterior", () => {
  const p = prEvents([sq(day(20), 130), sq(day(10), 140), sq(day(5), 135)]);
  assert.equal(p.filter((x) => x.exercise === "Agachamento").length, 1);
});
test("medalhas", () => {
  const ws = Array.from({ length: 12 }, (_, i) => sq(day(i * 2), 131 - i));
  const m = trainingMedals(ws, "2026-11-12", 3);
  assert.equal(m.find((x) => x.id === "iron_will")!.done, true); assert.equal(m.find((x) => x.id === "limit_breaker")!.done, true); assert.equal(m.find((x) => x.id === "iron_legacy")!.done, false);
});
test("análise: tendência de carga e estagnação", () => {
  const old = Array.from({ length: 6 }, (_, i) => sq(day(80 - i * 6), 120));
  const recent = Array.from({ length: 6 }, (_, i) => sq(day(40 - i * 6), 130));
  const ins = trainingInsights([...old, ...recent], "2026-11-12");
  assert.ok(ins.some((x) => x.title === "Carga de trabalho em alta"));
  const flat = Array.from({ length: 8 }, (_, i) => sq(day(60 - i * 7), i < 4 ? 120 + i * 5 : 130));
  assert.ok(trainingInsights(flat, "2026-11-12").some((x) => x.title.includes("estagnado")));
});
test("revisão semanal", () => {
  const r = weeklyReview([sq("2026-11-10", 140), sq("2026-11-04", 130)], "2026-11-12");
  assert.equal(r.current.sessions, 1); assert.equal(r.previous.sessions, 1); assert.ok(r.current.volume > r.previous.volume);
});
