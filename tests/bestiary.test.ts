import { test } from "node:test";
import assert from "node:assert/strict";
import { beastFor, bestiaryRecord } from "../src/lib/bestiary.ts";

test("ameaça cresce e anjos se revezam na acumulação", () => {
  assert.equal(beastFor("acumulacao", 1, { week: 1 }).id, "vigilante");
  assert.equal(beastFor("acumulacao", 2, { week: 2 }).id, "mensageiro");
  assert.equal(beastFor("acumulacao", 1, { week: 7 }).id, "vigilante");
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
  assert.equal(r.vigilante.won, 1);
  assert.equal(r.mensageiro.met, 1);
  assert.equal(r.mensageiro.won, 0);
});
