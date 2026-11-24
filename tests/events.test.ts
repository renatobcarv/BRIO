import { test } from "node:test";
import assert from "node:assert/strict";
import { computeEvents, type EvInput } from "../src/lib/events.ts";

const days = { "1": [1], "2": [1], "4": [1], "6": [1], "0": [] } as Record<string, unknown[]>;
const prog = { id: "p", name: "Ciclo", start_date: "2026-10-05", phases: [
  { kind: "acumulacao", name: "Acumulação", weeks: 4, days }, { kind: "intensificacao", name: "Intensificação", weeks: 4, days },
  { kind: "realizacao", name: "Realização", weeks: 3, days }, { kind: "deload", name: "Deload", weeks: 1, days } ] };
const base: EvInput = { today: "2026-10-26", programs: [prog], workouts: [], meals: [], proteinGoal: 200, sleep: [] };
const w = (date: string, rpe: number | null = 8) => ({ date, sets: [{ exercise: "Agachamento", kg: 140, reps: 5, rpe }] });

test("Hell Week em contagem regressiva na semana anterior", () => {
  const hw = computeEvents(base).find((e) => e.type === "hell_week")!;
  assert.equal(hw.start, "2026-11-02"); assert.equal(hw.stage, "contagem"); assert.equal(hw.daysToStart, 7);
});
test("Hell Week vencida: missões, RPE e descanso → glória e bônus", () => {
  const ws = ["2026-11-02", "2026-11-03", "2026-11-05", "2026-11-07"].map((d) => w(d));
  const hw = computeEvents({ ...base, today: "2026-11-10", workouts: ws }).find((e) => e.type === "hell_week")!;
  assert.equal(hw.stage, "vitoria");
  assert.ok(hw.bonusXp.some((b) => b.xp === 500)); assert.equal(hw.bonusXp.filter((b) => b.label.includes("×2")).length, 4);
});
test("Hell Week sem RPE registrado → cicatriz", () => {
  const ws = ["2026-11-02", "2026-11-03", "2026-11-05", "2026-11-07"].map((d) => w(d, null));
  const hw = computeEvents({ ...base, today: "2026-11-10", workouts: ws }).find((e) => e.type === "hell_week")!;
  assert.equal(hw.stage, "falha"); assert.ok(!hw.bonusXp.some((b) => b.xp === 500));
});
test("treinar 7 dias seguidos reprova por segurança", () => {
  const ws = Array.from({ length: 7 }, (_, i) => w(`2026-11-0${i + 2}`.replace("0-", "")));
  const hw = computeEvents({ ...base, today: "2026-11-10", workouts: ws.map((x, i) => ({ ...x, date: new Date(Date.parse("2026-11-02") + i * 864e5).toISOString().slice(0, 10) })) }).find((e) => e.type === "hell_week")!;
  assert.equal(hw.objectives.find((o) => o.safety)!.done, false); assert.equal(hw.stage, "falha");
});
test("eventos distantes não aparecem", () => {
  const ev = computeEvents({ ...base, today: "2026-09-01" });
  assert.equal(ev.length, 0);
});

import { computeEvents as ce } from "../src/lib/events.ts";
test("campanhas sobrepostas não duplicam eventos: vale a ativa", () => {
  const ph = [{ kind: "acumulacao", name: "Acumulação", weeks: 3, days: { 1: [1] } }, { kind: "intensificacao", name: "Int", weeks: 2, days: { 1: [1] } }];
  const base = { today: "2026-11-24", workouts: [], meals: [], proteinGoal: 150, sleep: [] };
  const evs = ce({ ...base, programs: [{ id: "a", name: "Velho", start_date: "2026-11-30", phases: ph, active: false }, { id: "b", name: "Novo", start_date: "2026-11-23", phases: ph, active: true }] } as never);
  const gen = evs.filter((e) => e.type === "genesis");
  assert.equal(gen.length, 1); assert.equal(gen[0].program, "Novo");
  const dup = ce({ ...base, programs: [{ id: "a", name: "A", start_date: "2026-11-23", phases: ph }, { id: "b", name: "B", start_date: "2026-11-23", phases: ph }] } as never);
  assert.equal(dup.filter((e) => e.type === "genesis").length, 1);
});
