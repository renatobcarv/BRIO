"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { plan as planInst } from "@/lib/installments";
import { addMonths } from "@/lib/date";

const Iso = z.string().regex(/^\d{4}-\d{2}-01$/);
const money = z.number().min(-1e10).max(1e10);
const SCHEMAS = {
  finance_items: z.object({ month: Iso, kind: z.enum(["receita", "fixo", "variavel"]), name: z.string().max(80), amount: money }),
  investments: z.object({ name: z.string().max(80), amount: money, rate_aa: z.number().min(-100).max(1000) }),
  savings_boxes: z.object({ name: z.string().max(80), target: money, monthly: money, saved: money, color: z.string().max(20) }),
  net_worth_items: z.object({ month: Iso, kind: z.enum(["ativo", "passivo"]), name: z.string().max(80), amount: money }),
};
type Table = keyof typeof SCHEMAS;
const done = () => { revalidatePath("/financas"); revalidatePath("/"); revalidatePath("/metas"); };

export async function saveRow(table: Table, row: Record<string, unknown>, id?: string) {
  if (!(table in SCHEMAS)) throw new Error("tabela inválida");
  const data = SCHEMAS[table].partial().parse(row);
  const sb = await createClient();
  if (id) await sb.from(table).update(data).eq("id", z.string().uuid().parse(id));
  else { const r = SCHEMAS[table].parse(row); await sb.from(table).insert(r); }
  done();
}
export async function deleteRow(table: Table, id: string) {
  if (!(table in SCHEMAS)) throw new Error("tabela inválida");
  const sb = await createClient();
  await sb.from(table).delete().eq("id", z.string().uuid().parse(id));
  done();
}
/** Copia as linhas do mês anterior (fluxo ou patrimônio) para o mês atual. */
export async function copyPrevMonth(table: "finance_items" | "net_worth_items", month: string) {
  const m = Iso.parse(month);
  const sb = await createClient();
  const { data } = await sb.from(table).select("kind,name,amount").eq("month", addMonths(m, -1));
  if (data?.length) await sb.from(table).insert(data.map((r) => ({ ...r, month: m })));
  else if (table === "finance_items") await sb.from(table).insert({ month: m, kind: "variavel", name: "Ofertas (Congregação)", amount: 0 });
  done();
}

// ── Lançamentos completos (v2) ──
const Tx = z.object({
  kind: z.enum(["receita", "fixo", "variavel"]), name: z.string().trim().min(1).max(120), amount: z.number().min(0).max(1e10),
  category: z.string().max(40), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), paid: z.boolean(), recurring: z.boolean(), note: z.string().max(500),
});
export async function saveTx(input: z.infer<typeof Tx>, id?: string) {
  const p = Tx.parse(input);
  const row = { ...p, month: p.date.slice(0, 7) + "-01", note: p.note || null };
  const sb = await createClient();
  const { error } = id ? await sb.from("finance_items").update(row).eq("id", z.string().uuid().parse(id)) : await sb.from("finance_items").insert(row);
  if (error) throw new Error(error.message);
  done();
}
/** Compra parcelada: cria uma linha por mês ("Nome (k/N)"). Só a 1ª segue o "pago" escolhido; as outras ficam a pagar. */
export async function saveInstallments(input: z.infer<typeof Tx> & { n: number; mode: "total" | "parcela" }) {
  const p = Tx.parse(input), n = z.number().int().min(2).max(72).parse(input.n);
  const parts = planInst(input.mode === "total" ? { total: p.amount, n, first: p.date } : { each: p.amount, n, first: p.date });
  const group = crypto.randomUUID(), base = p.name.replace(/\s*\(\d+\/\d+\)\s*$/, "");
  const rows = parts.map((x) => ({ kind: p.kind, category: p.category, name: `${base} (${x.no}/${n})`, amount: x.amount, date: x.date, month: x.date.slice(0, 7) + "-01",
    paid: x.no === 1 ? p.paid : false, recurring: false, note: p.note || null, inst_group: group, inst_no: x.no, inst_total: n, inst_amount: parts.reduce((a, y) => a + y.amount, 0) }));
  const sb = await createClient();
  const { error } = await sb.from("finance_items").insert(rows);
  if (error) throw new Error(/inst_/.test(error.message) ? "Rode a migração 20261119000000_parcelas.sql no Supabase." : error.message);
  done();
}
/** Apaga as parcelas desta compra a partir de uma (inclusive) — ex.: quitou antes. */
export async function deleteInstallmentsFrom(group: string, fromNo: number) {
  const sb = await createClient();
  const { error } = await sb.from("finance_items").delete().eq("inst_group", z.string().uuid().parse(group)).gte("inst_no", z.number().int().parse(fromNo));
  if (error) throw new Error(error.message);
  done();
}
export async function setPaid(id: string, paid: boolean) {
  const sb = await createClient();
  await sb.from("finance_items").update({ paid: z.boolean().parse(paid) }).eq("id", z.string().uuid().parse(id)); done();
}
/** Traz os lançamentos recorrentes do mês anterior como "a pagar/receber". */
export async function generateRecurring(month: string) {
  const m = Iso.parse(month);
  const sb = await createClient();
  const prev = addMonths(m, -1);
  const [{ data: src }, { data: cur }] = await Promise.all([
    sb.from("finance_items").select("kind,name,amount,category,date,note").eq("month", prev).eq("recurring", true),
    sb.from("finance_items").select("name").eq("month", m),
  ]);
  const have = new Set((cur ?? []).map((r) => r.name.toLowerCase()));
  const last = Number(addMonths(m, 1).slice(8, 10)) || 28;
  const rows = (src ?? []).filter((r) => !have.has(r.name.toLowerCase())).map((r) => {
    const day = Math.min(Number((r.date ?? prev).slice(8, 10)) || 1, last, 28);
    return { ...r, month: m, date: `${m.slice(0, 8)}${String(day).padStart(2, "0")}`, paid: false, recurring: true };
  });
  if (rows.length) await sb.from("finance_items").insert(rows);
  done();
  return rows.length;
}
export async function depositBox(id: string, amount: number) {
  const sb = await createClient();
  const { data } = await sb.from("savings_boxes").select("saved").eq("id", z.string().uuid().parse(id)).single();
  await sb.from("savings_boxes").update({ saved: Number(data?.saved ?? 0) + z.number().min(-1e9).max(1e9).parse(amount) }).eq("id", id);
  done();
}

// ── Investimentos (v5) ──
const InvS = z.object({
  name: z.string().trim().min(1).max(100), type: z.enum(["reserva", "renda_fixa", "tesouro", "acoes", "fiis", "etf", "cripto", "previdencia", "outro"]),
  institution: z.string().max(80).nullable(), amount: money, invested: money, rate_aa: z.number().min(-100).max(1000), monthly: money,
  liquidity: z.enum(["diaria", "d30", "vencimento", "variavel"]), maturity: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  notes: z.string().max(1000).nullable(), is_reserve: z.boolean(),
});
export async function saveInvestment(input: z.infer<typeof InvS>, id?: string) {
  const p = InvS.parse(input);
  const sb = await createClient();
  if (id) { const { error } = await sb.from("investments").update(p).eq("id", z.string().uuid().parse(id)); if (error) throw new Error(error.message); }
  else {
    const { data, error } = await sb.from("investments").insert(p).select("id").single();
    if (error) throw new Error(error.message);
    if (p.amount > 0) await sb.from("investment_moves").insert({ investment_id: data.id, date: new Date().toISOString().slice(0, 10), kind: "aporte", amount: p.amount, balance_after: p.amount });
  }
  done();
}
/** Aporte, resgate ou atualização de saldo (rendimento). */
export async function moveInvestment(id: string, kind: "aporte" | "resgate" | "atualizacao", value: number, date: string) {
  const p = z.object({ id: z.string().uuid(), kind: z.enum(["aporte", "resgate", "atualizacao"]), value: z.number().min(0).max(1e10), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse({ id, kind, value, date });
  const sb = await createClient();
  const { data: inv, error } = await sb.from("investments").select("amount,invested").eq("id", p.id).single();
  if (error || !inv) throw new Error("Investimento não encontrado");
  const amount = Number(inv.amount), invested = Number(inv.invested ?? inv.amount);
  let newAmount = amount, newInvested = invested, moveAmount = p.value;
  if (p.kind === "aporte") { newAmount = amount + p.value; newInvested = invested + p.value; }
  if (p.kind === "resgate") { const v = Math.min(p.value, amount); newAmount = amount - v; newInvested = Math.max(0, invested - (amount ? (invested * v) / amount : 0)); moveAmount = v; }
  if (p.kind === "atualizacao") { moveAmount = p.value - amount; newAmount = p.value; }
  await sb.from("investments").update({ amount: newAmount, invested: newInvested }).eq("id", p.id);
  await sb.from("investment_moves").insert({ investment_id: p.id, date: p.date, kind: p.kind, amount: moveAmount, balance_after: newAmount });
  done();
}
export async function deleteInvestment(id: string) {
  const sb = await createClient(); await sb.from("investments").delete().eq("id", z.string().uuid().parse(id)); done();
}

// ── Assistente: aplica uma proposta só quando o Renato confirma ──
export async function resolveProposal(id: string, confirm: boolean) {
  const pid = z.string().uuid().parse(id);
  const sb = await createClient();
  const { data: p } = await sb.from("finance_chat_proposals").select("*").eq("id", pid).eq("status", "pending").maybeSingle();
  if (!p) throw new Error("Proposta não encontrada ou já resolvida.");
  if (!confirm) { await sb.from("finance_chat_proposals").update({ status: "cancelled" }).eq("id", pid); done(); return "cancelada"; }
  const pl = p.payload as Record<string, unknown>;
  if (p.kind === "budget") {
    const { data: s } = await sb.from("settings").select("id,finance_categories").maybeSingle();
    const cats = ((s?.finance_categories as { key: string; budget: number }[] | null) ?? []);
    if (!cats.some((c) => c.key === pl.key)) throw new Error("Categoria não existe mais.");
    await sb.from("settings").update({ finance_categories: cats.map((c) => (c.key === pl.key ? { ...c, budget: z.number().min(0).parse(pl.monthly_limit) } : c)) }).not("id", "is", null);
  } else if (p.kind === "goal") {
    const name = z.string().min(1).max(200).parse(pl.name), target = z.number().min(0).parse(pl.target);
    const deadline = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().parse(pl.deadline ?? null), current = z.number().min(0).nullable().parse(pl.current ?? null);
    const { data: g } = await sb.from("goals").select("id").eq("area", "financeira").ilike("title", name).maybeSingle();
    const row: Record<string, unknown> = { target, ...(deadline ? { deadline } : {}), ...(current != null ? { current } : {}) };
    if (g) await sb.from("goals").update(row).eq("id", g.id);
    else await sb.from("goals").insert({ title: name, area: "financeira", unit: "R$", start_value: 0, current: current ?? 0, target, deadline, featured: false, auto_source: null, auto_ref: null });
    revalidatePath("/metas");
  } else if (p.kind === "recategorize") {
    const kind = z.enum(["receita", "fixo", "variavel"]).parse(pl.kind);
    await sb.from("finance_items").update({ category: z.string().max(40).parse(pl.key), kind }).eq("id", z.string().uuid().parse(pl.id));
  }
  await sb.from("finance_chat_proposals").update({ status: "confirmed" }).eq("id", pid);
  done();
  return "confirmada";
}
export async function clearChat() {
  const sb = await createClient();
  await sb.from("finance_chat_messages").delete().not("id", "is", null);
  await sb.from("finance_chat_proposals").update({ status: "cancelled" }).eq("status", "pending");
  done();
}
