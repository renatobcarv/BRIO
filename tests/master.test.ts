import { test } from "node:test";
import assert from "node:assert/strict";
import { masterWeek, shiftReps, waveOf } from "../src/lib/master.ts";
import type { PlannedEx } from "../src/lib/training.ts";

const E = (name: string, muscle: string, sets = 3): PlannedEx => ({ name, muscle: muscle as never, sets, reps: "8-12", kg: null, rpe: 8, rir: 2, rest: 90, notes: "" });
const base = { "1": [E("Supino reto com barra", "peito"), E("Crucifixo na máquina (peck deck)", "peito"), E("Rosca direta com barra", "biceps")] };
const ctx = (week: number, kind = "acumulacao", weekInPhase = week) => ({ programId: "p", kind, week, weekInPhase });

test("faixas de repetições deslocam com piso", () => { assert.equal(shiftReps("8-12", -2), "6-10"); assert.equal(shiftReps("4-6", -2), "3-4"); assert.equal(shiftReps("10", 4), "14"); });
test("semanas seguidas são diferentes (onda)", () => {
  const a = masterWeek(base, [], ctx(1)).days["1"], b = masterWeek(base, [], ctx(2)).days["1"], c = masterWeek(base, [], ctx(3)).days["1"];
  assert.notEqual(a[0].reps, b[0].reps); assert.notEqual(b[0].reps, c[0].reps);
  assert.equal(waveOf(4).key, waveOf(1).key);
});
test("troca acessórios a cada 2 semanas, nunca o principal", () => {
  const w3 = masterWeek(base, [], ctx(3)).days["1"], w1 = masterWeek(base, [], ctx(1)).days["1"];
  assert.equal(w3[0].name, "Supino reto com barra");
  assert.notEqual(w3[1].name, w1[1].name);
});
test("feedback: folga sobe, fadiga desce, sem registro mantém", () => {
  const sets = (rpe: number) => Array.from({ length: 9 }, (_, i) => ({ exercise: i < 6 ? (i < 3 ? "Supino reto com barra" : "Crucifixo na máquina (peck deck)") : "Rosca direta com barra", kg: 50, reps: 10, rpe }));
  const easy = masterWeek(base, [{ date: "2026-11-02", week_no: 1, program_id: "p", sets: sets(6) }], ctx(2, "intensificacao", 1));
  assert.equal(easy.days["1"][0].sets, 4);
  const hard = masterWeek(base, [{ date: "2026-11-02", week_no: 1, program_id: "p", sets: sets(9.5) }], ctx(2, "intensificacao", 1));
  assert.equal(hard.days["1"][0].sets, 2);
  const none = masterWeek(base, [], ctx(2, "intensificacao", 1));
  assert.equal(none.days["1"][0].sets, 3); assert.ok(none.changes.some((c) => /sem registro/.test(c.text)));
});
test("deload e pico ficam intactos", () => {
  const d = masterWeek(base, [], ctx(5, "deload", 1)).days["1"];
  assert.deepEqual(d.map((e) => [e.name, e.reps]), base["1"].map((e) => [e.name, e.reps]));
});
import { weekNutrition, weightRate } from "../src/lib/master.ts";
test("nutrição: ajusta pelo ritmo real do peso", () => {
  const w = (d: string, kg: number) => ({ date: d, kg });
  const fast = [w("2026-11-10", 82), w("2026-11-12", 82), w("2026-11-18", 80.6), w("2026-11-20", 80.5)];
  const r = weightRate(fast, "2026-11-22")!; assert.ok(r < -1.5);
  assert.ok(weekNutrition("perder", "acumulacao", null, r, 2200).adj > 0);
  assert.equal(weekNutrition("perder", "acumulacao", null, -0.7, 2200).adj, 0);
  assert.ok(weekNutrition("ganhar", "acumulacao", null, 1, 3000).adj < 0);
  assert.equal(weightRate([w("2026-11-20", 80)], "2026-11-22"), null);
});
import { applyPreset, moveDay, totalSets } from "../src/lib/master.ts";
test("atalhos da semana e mover dia", () => {
  const d = { "1": [E("Supino reto com barra", "peito", 4), E("Crucifixo na máquina (peck deck)", "peito", 3)], "3": [E("Rosca direta com barra", "biceps", 3)] };
  assert.ok(totalSets(applyPreset(d, "corrida")) <= totalSets(d) * 0.8);
  assert.equal(totalSets(applyPreset(d, "destruido")), 2 + 2 + 2);
  assert.equal(applyPreset(d, "voando")["1"][0].sets, 5);
  assert.deepEqual(Object.keys(moveDay(d, "3", "5")).sort(), ["1", "5"]);
  const sw = moveDay(d, "1", "3"); assert.equal(sw["3"][0].name, "Supino reto com barra"); assert.equal(sw["1"][0].name, "Rosca direta com barra");
});
import { suggestAdjustments } from "../src/lib/master.ts";
test("sugestões automáticas: fadiga, ausência, mover dia, troca habitual só com o dia treinado", () => {
  const days = { "1": [E("Supino reto com barra", "peito", 4), E("Crucifixo na máquina (peck deck)", "peito", 3)], "3": [E("Rosca direta com barra", "biceps", 3), E("Cadeira extensora", "quadriceps", 3), E("Leg press", "quadriceps", 3)] };
  const c = { programId: "p", kind: "acumulacao", week: 3, weekInPhase: 3, today: "2026-11-23" };
  const heavy = [{ date: "2026-11-16", week_no: 2, program_id: "p", sets: Array.from({ length: 10 }, () => ({ exercise: "Supino reto com barra", kg: 80, reps: 5, rpe: 9.8 })) }];
  assert.ok(suggestAdjustments(days, heavy, c).some((s) => s.id === "deload"));
  assert.ok(suggestAdjustments(days, [], c).some((s) => s.id === "deload"));
  // Faltou ao dia: nada de "trocar".
  const onlyMon = (d: string) => ({ date: d, week_no: 2, program_id: "p", sets: [{ exercise: "Supino reto com barra", kg: 80, reps: 5, rpe: 8 }] });
  assert.ok(!suggestAdjustments(days, [onlyMon("2026-11-09"), onlyMon("2026-11-16")], c).some((s) => s.id.startsWith("troca-")));
  // Treinou o dia e trocou de verdade, 2×: sugere. Principal nunca.
  const wed = (d: string) => ({ date: d, week_no: 2, program_id: "p", sets: [{ exercise: "Rosca direta com barra", kg: 30, reps: 10, rpe: 8 }, { exercise: "Cadeira extensora", kg: 40, reps: 12, rpe: 8 }, { exercise: "Agachamento goblet", kg: 24, reps: 10, rpe: 8 }] });
  const s = suggestAdjustments(days, [wed("2026-11-11"), wed("2026-11-18"), onlyMon("2026-11-16")], c);
  const tr = s.find((x) => x.id === "troca-Leg press"); assert.ok(tr, JSON.stringify(s.map((x) => x.id)));
  assert.equal(tr!.apply(days)["3"][2].name, "Agachamento goblet");
  assert.ok(!s.some((x) => x.id === "troca-Supino reto com barra"));
  // Mover dia: treina terças, nunca segunda.
  const tue = (d: string) => ({ date: d, week_no: 2, program_id: "p", sets: [{ exercise: "Supino reto com barra", kg: 80, reps: 5, rpe: 8 }] });
  assert.ok(suggestAdjustments(days, [tue("2026-11-04"), tue("2026-11-11"), tue("2026-11-18"), wed("2026-11-19")], c).some((x) => x.id.startsWith("mover-1-")));
});

test("rotação protege carga fixa e reduz o volume sem trocar exercícios em grupos fatigados", () => {
  const fixed = { ...base["1"][1], kg: 45 };
  const plan = { "1": [base["1"][0], fixed] };
  assert.equal(masterWeek(plan, [], ctx(3)).days["1"][1].name, fixed.name);

  const tired = [{ date: "2026-11-09", week_no: 2, program_id: "p", sets: [
    { exercise: base["1"][0].name, kg: 80, reps: 8, rpe: 10 },
  ] }];
  const week = masterWeek(base, tired, ctx(3));
  assert.equal(week.days["1"][0].sets, 2);
  assert.equal(week.days["1"][1].name, base["1"][1].name);
});
