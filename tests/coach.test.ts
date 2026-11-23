import { test } from "node:test";
import assert from "node:assert/strict";
import { blocks, buildProgram, campaignMilestones, split, weeklySets, REFS, type TrainAnswers } from "../src/lib/coach.ts";

const A = (o: Partial<TrainAnswers> = {}): TrainAnswers => ({ goal: "hipertrofia", level: "intermediario", days: 4, minutes: 60, equipment: "academia", weeks: 12, priority: [], injuries: "", sleep: 7.5, stress: "medio", start: "2026-11-30", ...o });

test("cada músculo pelo menos 2×/semana em 2 a 6 dias", () => {
  for (let d = 2; d <= 6; d++) { const sp = split(d); assert.equal(sp.length, d);
    for (const m of ["peito", "costas", "quadriceps"] as const) assert.ok(sp.filter((x) => x.muscles.includes(m)).length >= 2, `${d}d ${m}`); }
});
test("blocos somam as semanas pedidas, têm deload e pico só em força", () => {
  for (const w of [4, 8, 12, 16]) for (const g of ["hipertrofia", "forca"] as const) {
    const b = blocks(g, w, "intermediario");
    assert.equal(b.reduce((s, x) => s + x.weeks, 0), w, `${g} ${w}`);
    assert.equal(b.at(-1)!.kind === "realizacao", g === "forca");
    if (w >= 8) assert.ok(b.some((x) => x.kind === "deload"));
  }
});
test("volume: prioridade sobe, sono ruim desce, avançado > iniciante", () => {
  assert.ok(weeklySets(A({ priority: ["peito"] }), "peito") > weeklySets(A(), "peito"));
  assert.ok(weeklySets(A({ sleep: 5 }), "peito") < weeklySets(A(), "peito"));
  assert.ok(weeklySets(A({ level: "avancado" }), "costas") > weeklySets(A({ level: "iniciante" }), "costas"));
});
test("programa completo: dias certos, tempo respeitado, big 3 em força, toda justificativa citada", () => {
  const r = buildProgram(A({ goal: "forca", days: 5, minutes: 45 }));
  assert.equal(r.program.phases[0].days["1"].length > 0, true);
  assert.deepEqual(Object.keys(r.program.phases[0].days), ["1", "2", "3", "4", "5"]);
  for (const ph of r.program.phases) for (const l of Object.values(ph.days)) assert.ok(l.reduce((s, e) => s + e.sets, 0) <= 18 + 2);
  const names = Object.values(r.program.phases[0].days).flat().map((e) => e.name);
  assert.ok(names.includes("Agachamento livre") && names.includes("Supino reto com barra"));
  for (const w of r.why) assert.ok(REFS[w.ref]);
  const home = buildProgram(A({ equipment: "casa", days: 3 }));
  assert.ok(!Object.values(home.program.phases[0].days).flat().some((e) => /barra$|máquina|polia/i.test(e.name) && !/Barra fixa/.test(e.name)));
});
test("marcos: semana cumprida, fase e campanha só com treinos reais", () => {
  const p = { id: "p", start_date: "2026-11-02", phases: [{ kind: "acumulacao", weeks: 2, days: { 1: [1], 3: [1] } }, { kind: "deload", weeks: 1, days: { 1: [1] } }] };
  const s = (w: number, d: string) => ({ program_id: "p", week_no: w, date: d });
  const half = campaignMilestones([p] as never, [s(1, "2026-11-02"), s(1, "2026-11-04"), s(2, "2026-11-09")]);
  assert.deepEqual(half.map((m) => m.xp), [120]);
  const all = campaignMilestones([p] as never, [s(1, "2026-11-02"), s(1, "2026-11-04"), s(2, "2026-11-09"), s(2, "2026-11-11"), s(3, "2026-11-16")]);
  assert.deepEqual(all.map((m) => m.xp), [120, 120, 400, 120, 400, 1000]);
});
import { ISOLATION } from "../src/lib/coach.ts";
import { masterWeek } from "../src/lib/master.ts";
test("isolados nunca abaixo de 8 repetições, em nenhuma fase ou onda", () => {
  const r = buildProgram(A({ goal: "powerbuilding", days: 5 }));
  for (const ph of r.program.phases) for (let w = 1; w <= 3; w++) {
    const m = masterWeek(ph.days, [], { programId: "p", kind: ph.kind, week: w, weekInPhase: w });
    for (const e of Object.values(m.days).flat()) if (ISOLATION.test(e.name)) assert.ok(Number(e.reps.split("-")[0]) >= 8, `${ph.kind} s${w} ${e.name} ${e.reps}`);
  }
});
import { liftSchedule } from "../src/lib/coach.ts";
test("especialização: frequência certa e sem agachamento+terra pesados no mesmo dia", () => {
  for (let d = 3; d <= 6; d++) for (const f of ["big3", "agachamento", "supino", "terra"] as const) {
    const s = liftSchedule(f, d), count = (l: string) => s.flat().filter((x) => x.lift === l).length;
    if (f !== "big3") assert.equal(count(f), 3, `${f} ${d}d`);
    else { assert.equal(count("supino"), 3); assert.equal(count("agachamento"), 2); }
    for (const day of s) assert.ok(!(day.some((x) => x.lift === "agachamento" && x.kind === 0) && day.some((x) => x.lift === "terra" && x.kind === 0)), `${f} ${d}d`);
  }
});
test("programa com foco no supino: supino 3×, protegido do corte de tempo, com pico no fim", () => {
  const r = buildProgram(A({ goal: "hipertrofia", focus: "supino", days: 3, minutes: 45 })); // corpo inteiro: 3 dias com peito
  const ph = r.program.phases[0], names = Object.values(ph.days).flat().map((e) => e.name);
  assert.equal(names.filter((n) => /^Supino (reto com barra|com pausa)$/.test(n)).length, 3);
  const four = Object.values(buildProgram(A({ focus: "supino", days: 4 })).program.phases[0].days).flat().filter((e) => /^Supino (reto com barra|com pausa)$/.test(e.name)).length;
  assert.equal(four, 2); // superior/inferior: só nos 2 dias de superior
  assert.equal(r.program.phases.at(-1)!.kind, "realizacao");
  assert.ok(r.why.some((w) => w.ref === "spec"));
});
import { exerciseCap } from "../src/lib/coach.ts";
test("sessões de treinador: 2+ séries, poucos exercícios, básico no dia certo", () => {
  for (const days of [2, 3, 4, 5, 6]) for (const minutes of [45, 60, 75, 90]) for (const focus of ["geral", "big3", "supino", "agachamento", "terra"] as const) for (const goal of ["hipertrofia", "powerbuilding"] as const) {
    const r = buildProgram(A({ goal, focus, days, minutes }));
    for (const ph of r.program.phases) for (const [d, l] of Object.entries(ph.days)) {
      const tag = `${goal} ${focus} ${days}d ${minutes}min ${ph.kind} ${ph.dayNames?.[d]}`;
      assert.ok(l.length <= exerciseCap(minutes) + 2, `${tag}: ${l.length} exercícios`); // +2 só quando há superset
      for (const e of l) assert.ok(e.sets >= 2, `${tag}: ${e.name} com ${e.sets} série`);
      const nm = ph.dayNames?.[d] ?? "";
      if (/Inferior|Pernas/.test(nm)) assert.ok(!l.some((e) => /^Supino/.test(e.name)), `${tag}: supino no dia de pernas`);
      if (/Superior|Empurrar|Puxar/.test(nm)) assert.ok(!l.some((e) => /^Agachamento|^Levantamento terra/.test(e.name)), `${tag}: agachamento/terra no superior`);
    }
  }
});
test("técnicas só se necessárias: sem pressa de tempo = séries tradicionais; pouco tempo = superset de antagonistas", () => {
  const calm = Object.values(buildProgram(A({ days: 6, minutes: 90 })).program.phases[0].days).flat();
  assert.ok(!calm.some((e) => /Superset|drop set/.test(e.notes)), "não deveria ter técnica");
  const rushed = Object.values(buildProgram(A({ days: 3, minutes: 45, level: "avancado" })).program.phases[0].days).flat();
  const ss = rushed.filter((e) => e.notes.startsWith("Superset com"));
  assert.ok(ss.length > 0);
  for (const e of ss) assert.ok(!/drop/.test(e.notes));
});
