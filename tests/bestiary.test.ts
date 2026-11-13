import { test } from "node:test";
import assert from "node:assert/strict";
import { beastFor, bestiaryRecord } from "../src/lib/bestiary.ts";

test("ameaça cresce e anjos se revezam na acumulação", () => {
  assert.equal(beastFor("acumulacao", 1, { week: 1 }).id, "aureo");
  assert.equal(beastFor("acumulacao", 2, { week: 2 }).id, "alcion");
  assert.equal(beastFor("acumulacao", 1, { week: 7 }).id, "aureo");
  assert.ok(beastFor("intensificacao", 3).threat > beastFor("acumulacao", 1).threat);
  assert.equal(beastFor("intensificacao", 1, { hell: true }).id, "juggernaut");
  assert.equal(beastFor("deload", 1).threat, 1);
});

test("vitória só com todas as sessões da semana", () => {
  const p = { id: "p", start_date: "2026-11-09", phases: [{ kind: "acumulacao", weeks: 2, days: { "1": [1], "3": [1] } }] };
  const r = bestiaryRecord([p], [
    { program_id: "p", week_no: 1, date: "2026-11-09" }, { program_id: "p", week_no: 1, date: "2026-11-11" },
    { program_id: "p", week_no: 2, date: "2026-11-16" },
  ]);
  assert.equal(r.aureo.won, 1);
  assert.equal(r.alcion.met, 1);
  assert.equal(r.alcion.won, 0);
});
import { computeEvents } from "../src/lib/events.ts";
test("viagem parcial reduz a meta em vez de pausar", () => {
  const p = { id: "p", name: "X", start_date: "2026-11-09", phases: [{ kind: "acumulacao", name: "A", weeks: 4, days: { "1": [1], "2": [1], "3": [1], "4": [1], "5": [1], "6": [1] } }] };
  const ws = ["2026-11-09", "2026-11-10", "2026-11-11"].map((date) => ({ date, sets: [] }));
  const g = computeEvents({ today: "2026-11-13", programs: [p] as never, workouts: ws as never, meals: [], proteinGoal: 180, sleep: [], travel: [{ start: "2026-11-12", end: "2026-11-13" }] });
  const gen = g.find((e) => e.type === "genesis")!;
  assert.equal(gen.stage, "ativo");
  assert.ok(gen.objectives[0].target < 6);
});
