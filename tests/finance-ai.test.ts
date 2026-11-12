import { test } from "node:test";
import assert from "node:assert/strict";
import { anomalies, forecast, monthOverview, subscriptions, type Item } from "../src/lib/finance-ai/analysis.ts";

let n = 0;
const it = (date: string, kind: Item["kind"], name: string, amount: number, category: string | null = null, extra: Partial<Item> = {}): Item =>
  ({ id: String(++n), date, month: date.slice(0, 8) + "01", kind, name, amount, category, paid: true, recurring: false, ...extra });

test("resumo do mês", () => {
  const ov = monthOverview([it("2026-11-05", "receita", "Salário", 4000), it("2026-11-06", "fixo", "Aluguel", 1000, "moradia"), it("2026-11-07", "variavel", "Mercado", 500, "alimentacao", { paid: false })]);
  assert.equal(ov.balance, 2500); assert.equal(ov.expenses_pending, 500); assert.equal(ov.savings_rate, 0.63); assert.equal(ov.top_categories[0].category, "moradia");
});
test("previsão usa a média de variáveis quando é maior que o já gasto", () => {
  const cur = [it("2026-11-01", "receita", "Salário", 4000), it("2026-11-02", "fixo", "Aluguel", 1000), it("2026-11-03", "variavel", "Mercado", 300)];
  const prev = [[it("2026-10-10", "variavel", "Mercado", 1200)], [it("2026-09-10", "variavel", "Mercado", 800)]];
  const f = forecast(cur, prev, "2026-11-10", "2026-11-01");
  assert.equal(f.variable_expected, 1000); assert.equal(f.projected_balance, 2000); assert.equal(f.status, "ok");
  assert.equal(forecast(cur, prev, "2026-11-10", "2026-11-01", 2500).status, "vermelho");
});
test("previsão sem histórico usa o ritmo", () => {
  const f = forecast([it("2026-11-01", "receita", "S", 3000), it("2026-11-05", "variavel", "X", 500)], [], "2026-11-10", "2026-11-01");
  assert.equal(f.variable_expected, 1500); assert.equal(f.months_of_history, 0);
});
test("assinaturas: recorrência por padrão e mudança de preço", () => {
  const l = [it("2026-09-08", "variavel", "Netflix 0912", 39.9), it("2026-10-08", "variavel", "NETFLIX 1012", 39.9), it("2026-11-08", "variavel", "Netflix 1112", 44.9), it("2026-11-02", "variavel", "Mercado", 300)];
  const s = subscriptions(l, "2026-11-01");
  assert.equal(s.length, 1); assert.equal(s[0].months, 3); assert.equal(s[0].price_change, 5);
});
test("alertas: duplicada, teto e vencida", () => {
  const l = [it("2026-11-09", "variavel", "Uber", 25, "transporte"), it("2026-11-09", "variavel", "Uber", 25, "transporte"),
    it("2026-11-03", "variavel", "Restaurante", 900, "lazer"), it("2026-11-01", "fixo", "Luz", 180, "contas", { paid: false })];
  const a = anomalies(l, "2026-11-12", { lazer: 600 });
  assert.ok(a.some((x) => x.kind === "duplicada")); assert.ok(a.some((x) => x.kind === "teto_estourado")); assert.ok(a.some((x) => x.kind === "conta_vencida"));
  assert.equal(a[0].severity, "alta");
});
