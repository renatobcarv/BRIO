import { test } from "node:test";
import assert from "node:assert/strict";
import { beastFor } from "../src/lib/bestiary.ts";

test("ameaça cresce com a semana e a fase", () => {
  assert.equal(beastFor("acumulacao", 1).id, "vigia");
  assert.equal(beastFor("acumulacao", 3).id, "guerreiro");
  assert.equal(beastFor("outro", 1).id, "golem");
  assert.ok(beastFor("intensificacao", 3).threat > beastFor("acumulacao", 1).threat);
  assert.equal(beastFor("intensificacao", 1, { hell: true }).id, "juggernaut");
  assert.equal(beastFor("deload", 1).threat, 1);
});
