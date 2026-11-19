import { test } from "node:test";
import assert from "node:assert/strict";
import { pace, speed, kcalOf, kindOf, cardioSummary } from "../src/lib/cardio.ts";
test("ritmo, velocidade e calorias", () => {
  assert.equal(pace(5, 27.5), "5:30"); assert.equal(speed(10, 60), 10); assert.equal(pace(0, 30), null);
  assert.equal(kindOf("Corrida leve"), "corrida"); assert.equal(kindOf("Bicicleta ergométrica"), "bike");
  assert.equal(kcalOf("corrida", 30, 80), 392);
});
test("resumo de corridas", () => {
  const s = cardioSummary([{ date: "2026-11-18", name: "Corrida", km: 5, min: 30 }, { date: "2026-11-10", name: "Corrida", km: 10, min: 55 }], "2026-11-19");
  assert.equal(s.weekKm, 5); assert.equal(s.best?.km, 10); assert.equal(s.longest?.km, 10);
});
