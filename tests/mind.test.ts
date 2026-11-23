import { test } from "node:test";
import assert from "node:assert/strict";
import { ability, correctMemory, indexOf, make, matriz, nextLevel, serie, type Domain } from "../src/lib/mind.ts";

test("questões determinísticas, resposta entre as opções, opções únicas", () => {
  for (const dom of ["numerico", "logico", "verbal"] as Domain[]) for (let d = 1; d <= 5; d++) for (let s = 1; s < 60; s++) {
    const a = make(dom, s, d), b = make(dom, s, d);
    assert.deepEqual(a, b);
    if ("opts" in a) { assert.ok(a.answer >= 0 && a.answer < a.opts.length, `${dom} d${d} s${s}`); assert.equal(new Set(a.opts.map((o) => JSON.stringify(o))).size, a.opts.length); assert.ok(a.opts.length >= 3); }
  }
});
test("série: a resposta segue a regra explicada", () => {
  const it = serie(7, 1); if (it.kind !== "serie") throw 0;
  const k = it.seq[1] - it.seq[0]; assert.equal(it.opts[it.answer], it.seq.at(-1)! + k);
});
test("matriz difícil tem regras combinadas; memória reversa", () => {
  const m = matriz(3, 5); assert.equal(m.kind, "matriz"); assert.match(m.why, /linha \+ coluna/);
  const mem = make("memoria", 5, 4); if (mem.kind !== "memoria") throw 0;
  assert.ok(mem.reverse); assert.ok(correctMemory(mem, [...mem.digits].reverse().join(" "))); assert.ok(!correctMemory(mem, mem.digits.join("")) || mem.digits.join("") === [...mem.digits].reverse().join(""));
});
test("escada adaptativa e índice estimado", () => {
  assert.equal(nextLevel(5, true), 5); assert.equal(nextLevel(1, false), 1);
  const top = ability([{ domain: "logico", d: 5, ok: true }, { domain: "numerico", d: 5, ok: true }]);
  const low = ability([{ domain: "logico", d: 1, ok: false }]);
  assert.ok(indexOf(top)! > 115 && indexOf(low)! < 85);
  assert.equal(indexOf(ability([{ domain: "verbal", d: 3, ok: true }, { domain: "verbal", d: 3, ok: false }])), 100);
});
