import { test } from "node:test";
import assert from "node:assert/strict";
import { dedupe, parseCSV, parseOFX } from "../src/lib/bank-import.ts";

test("OFX: lê data, valor e descrição", () => {
  const ofx = `<OFX><BANKTRANLIST><STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20261110120000[-3:BRT]<TRNAMT>-45.90<MEMO>IFOOD *RESTAURANTE</STMTTRN><STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20261105<TRNAMT>3500.00<MEMO>SALARIO EMPRESA X</STMTTRN></BANKTRANLIST></OFX>`;
  const r = parseOFX(ofx);
  assert.equal(r.length, 2);
  assert.deepEqual(r[0], { date: "2026-11-10", amount: -45.9, name: "IFOOD *RESTAURANTE", category: "alimentacao", kind: "variavel" });
  assert.equal(r[1].category, "salario");
});
test("CSV no padrão Nubank e no padrão brasileiro com ;", () => {
  const nu = "date,title,amount\n2026-11-03,Uber *Trip,-23.50\n2026-11-04,Netflix,-55.90";
  assert.deepEqual(parseCSV(nu).map((r) => [r.amount, r.category]), [[-23.5, "transporte"], [-55.9, "assinaturas"]]);
  const br = "Data;Histórico;Valor\n05/11/2026;Drogaria São Paulo;-1.234,56\n06/11/2026;Pix recebido;200,00";
  assert.deepEqual(parseCSV(br).map((r) => [r.date, r.amount, r.category]), [["2026-11-05", -1234.56, "saude"], ["2026-11-06", 200, "extra"]]);
});
test("não importa duas vezes", () => {
  const r = parseCSV("date,title,amount\n2026-11-03,Uber,-23.50\n2026-11-03,Uber,-23.50");
  assert.equal(dedupe(r, []).length, 1);
  assert.equal(dedupe(r, [{ date: "2026-11-03", amount: 23.5, name: "uber" }]).length, 0);
});
