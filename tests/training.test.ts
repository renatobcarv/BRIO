import { test } from "node:test";
import assert from "node:assert/strict";
import { guessMuscle, isMainLift, plannedSetsByMuscle, programPosition, templateFromPlan, totalWeeks, phaseRanges } from "../src/lib/training.ts";

const phases = templateFromPlan({ "2": [{ name: "Agachamento", sets: 4, reps: "5", rest: 180 }, { name: "Cadeira extensora", sets: 3, reps: "12", rest: 60 }] });
const prog = { start_date: "2026-11-02", phases };

test("modelo tem 4 fases e 12 semanas", () => { assert.equal(phases.length, 4); assert.equal(totalWeeks(prog), 12); });
test("semana e fase atuais", () => {
  assert.deepEqual([programPosition(prog, "2026-11-02").week, programPosition(prog, "2026-11-02").phaseIndex], [1, 0]);
  assert.equal(programPosition(prog, "2026-11-08").week, 1);
  assert.equal(programPosition(prog, "2026-11-09").week, 2);
  const p5 = programPosition(prog, "2026-11-30"); assert.equal(p5.week, 5); assert.equal(p5.phaseIndex, 1); assert.equal(p5.weekInPhase, 1);
  const last = programPosition(prog, "2027-01-24"); assert.equal(last.week, 12); assert.equal(last.phaseIndex, 3);
  assert.equal(programPosition(prog, "2027-01-25").status, "concluido");
  const fut = programPosition(prog, "2026-10-30"); assert.equal(fut.status, "futuro"); assert.equal(fut.startsIn, 3);
});
test("intervalos das fases", () => { const r = phaseRanges(prog); assert.equal(r[0].start, "2026-11-02"); assert.equal(r[0].end, "2026-11-29"); assert.equal(r[1].start, "2026-11-30"); });
test("grupos musculares", () => {
  assert.equal(guessMuscle("Agachamento livre"), "quadriceps");
  assert.equal(guessMuscle("Levantamento terra"), "posteriores");
  assert.equal(guessMuscle("Supino inclinado halteres"), "peito");
  assert.equal(guessMuscle("Elevação lateral"), "ombro_lateral");
  assert.equal(guessMuscle("Tríceps corda"), "triceps");
  assert.equal(guessMuscle("Rosca direta"), "biceps");
  assert.equal(guessMuscle("Puxada frontal"), "costas");
  assert.equal(guessMuscle("Exercício estranho"), "outro");
  assert.equal(guessMuscle("Exercício estranho", { "exercício estranho": "gluteos" }), "gluteos");
});
test("levantamentos principais", () => {
  assert.ok(isMainLift("Supino")); assert.ok(isMainLift("Agachamento livre")); assert.ok(isMainLift("Levantamento terra"));
  assert.ok(!isMainLift("Supino inclinado halteres")); assert.ok(!isMainLift("Stiff"));
});
test("deload corta o volume pela metade", () => {
  const acc = plannedSetsByMuscle(phases[0]), del = plannedSetsByMuscle(phases[3]);
  assert.equal(acc.quadriceps, 7); assert.equal(del.quadriceps, 4);
  assert.equal(phases[0].days["2"][0].reps, "5-6"); assert.equal(phases[2].days["2"][0].reps, "1-3");
});
