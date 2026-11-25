import { test } from "node:test";
import assert from "node:assert/strict";
import { fieldTitle, grassVigor, plantStage, wilted } from "../src/lib/garden.ts";
test("planta cresce com o progresso; murcha só com prazo vencido", () => {
  assert.deepEqual([0, 0.1, 0.3, 0.6, 0.8, 1].map(plantStage), [0, 1, 2, 3, 4, 5]);
  assert.equal(wilted(0.5, "2026-11-01", "2026-11-25"), true); assert.equal(wilted(1, "2026-11-01", "2026-11-25"), false); assert.equal(wilted(0.5, null, "2026-11-25"), false);
});
test("grama cresce com estudo e constância", () => {
  assert.equal(grassVigor(0, 0), 0); assert.equal(grassVigor(1800, 30), 1); assert.ok(grassVigor(900, 15) > 0.4 && grassVigor(900, 15) < 0.6);
  assert.equal(fieldTitle(0.9, 3, 3), "Campo lendário"); assert.equal(fieldTitle(0, 0, 2), "Terra preparada");
});
