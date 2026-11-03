"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
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
