import { test } from "node:test";
import assert from "node:assert/strict";
import { alternativesFor, equipOf } from "../src/lib/swaps.ts";
test("troca mantém o músculo e filtra por equipamento", () => {
  const alt = alternativesFor("Supino reto com barra");
  assert.ok(alt.length >= 5 && !alt.some((a) => a.name === "Supino reto com barra"));
  assert.ok(alternativesFor("Supino reto com barra", null, "halter").every((a) => a.equip === "halter"));
  assert.ok(alternativesFor("Puxada frontal").some((a) => /remada|barra fixa/i.test(a.name)));
});
test("detecta equipamento pelo nome", () => {
  assert.equal(equipOf("Leg press 45"), "maquina"); assert.equal(equipOf("Rosca alternada com halteres"), "halter"); assert.equal(equipOf("Barra fixa"), "peso_corpo");
});
