import { test } from "node:test";
import assert from "node:assert/strict";
import { GREET, reactTo } from "../src/lib/consult-talk.ts";
test("cada objetivo e foco tem resposta; opcionais vazios seguem direto", () => {
  for (const g of ["powerbuilding", "forca", "hipertrofia", "recomposicao", "emagrecimento", "condicionamento"]) assert.ok(reactTo("goal", g));
  for (const f of ["geral", "big3", "supino"]) assert.ok(reactTo("focus", f));
  assert.equal(reactTo("injuries", ""), null); assert.ok(reactTo("injuries", "joelho"));
  assert.match(reactTo("days", 3)!, /corpo inteiro/);
  assert.ok(GREET.treino && GREET.dieta);
});
