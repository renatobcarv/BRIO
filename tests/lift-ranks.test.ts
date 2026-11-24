import { test } from "node:test";
import assert from "node:assert/strict";
import { bestLifts, overallRank, rankOf } from "../src/lib/lift-ranks.ts";
test("patentes pela força relativa", () => {
  assert.equal(rankOf("supino", 30, 80).tier.name, "Recruta");
  assert.equal(rankOf("supino", 80, 80).tier.name, "Prata");
  assert.equal(rankOf("supino", 160, 80).tier.name, "Mítico");
  assert.equal(rankOf("agachamento", 140, 80).tier.name, "Ouro");
  assert.equal(rankOf("supino", 50, 60, "f").tier.name, "Ouro"); // 0,83× com fator feminino
  const r = rankOf("terra", 150, 80); assert.ok(r.toNext > 0 && r.progress >= 0 && r.progress <= 1);
});
test("melhor 1RM e geral", () => {
  const b = bestLifts([{ exercise: "Supino reto com barra", kg: 100, reps: 5 }, { exercise: "Supino reto com barra", kg: 80, reps: 10 }, { exercise: "Agachamento livre", kg: 120, reps: 3 }, { exercise: "Stiff com barra", kg: 200, reps: 5 }]);
  assert.equal(Math.round(b.supino), 117); assert.equal(b.terra, 0);
  assert.equal(overallRank({ agachamento: { index: 4 }, supino: { index: 4 }, terra: { index: 1 } }).name, "Prata");
});
