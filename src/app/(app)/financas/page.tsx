import Link from "next/link";
import { PageHeader, Verse } from "@/components/ui";
import { Boxes, Investments, NetWorth } from "@/components/finance/finance";
import { Budget, MoneyShell, type Tx } from "@/components/finance/money";
import { addMonths, isoMonthParam, monthLabel } from "@/lib/date";
import { getSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const TABS = [["resumo", "Resumo"], ["lancamentos", "Lançamentos"], ["orcamento", "Orçamento"], ["caixinhas", "Caixinhas"], ["investimentos", "Investimentos"], ["patrimonio", "Patrimônio"]] as const;
const num = <T extends Record<string, unknown>>(r: T, ...keys: string[]) => ({ ...r, ...Object.fromEntries(keys.map((k) => [k, Number(r[k])])) });
const TX = "id,kind,name,amount,category,date,paid,recurring,note,month";

export default async function Page({ searchParams }: { searchParams: Promise<{ aba?: string; m?: string }> }) {
  const sp = await searchParams;
  const tab = sp.aba ?? "resumo";
  const month = isoMonthParam(sp.m);
  const sb = await createClient();
  const s = await getSettings(sb);
  const monthNav = ["resumo", "lancamentos", "orcamento", "patrimonio"].includes(tab);
  const toTx = (r: Record<string, unknown>) => ({ ...num(r, "amount"), paid: r.paid !== false, recurring: !!r.recurring }) as unknown as Tx;

  let content: React.ReactNode;
  if (tab === "resumo" || tab === "lancamentos" || tab === "orcamento") {
    const from = addMonths(month, -5);
    const [cur, range, prevRec] = await Promise.all([
      sb.from("finance_items").select(TX).eq("month", month),
      sb.from("finance_items").select("month,kind,amount").gte("month", from).lte("month", month),
      sb.from("finance_items").select("id").eq("month", addMonths(month, -1)).eq("recurring", true).limit(1),
    ]);
    const txs = (cur.data ?? []).map(toTx);
    const all = (range.data ?? []).map((r) => ({ ...r, amount: Number(r.amount) }));
    const history = Array.from({ length: 6 }, (_, i) => { const m = addMonths(from, i); const l = all.filter((r) => r.month === m);
      return { month: m, income: l.filter((r) => r.kind === "receita").reduce((a, r) => a + r.amount, 0), expense: l.filter((r) => r.kind !== "receita").reduce((a, r) => a + r.amount, 0) }; });
    const prevTxs = all.filter((r) => r.month === addMonths(month, -1)) as unknown as Tx[];
    content = tab === "orcamento" ? <Budget txs={txs} cats={s.finance_categories} />
      : <MoneyShell view={tab} month={month} txs={txs} prevTxs={prevTxs} history={history} cats={s.finance_categories} hasRecurringPrev={(prevRec.data ?? []).length > 0} />;
  } else if (tab === "investimentos") {
    const { data } = await sb.from("investments").select("id,name,amount,rate_aa").order("created_at");
    content = <Investments items={(data ?? []).map((r) => num(r, "amount", "rate_aa"))} />;
  } else if (tab === "caixinhas") {
    const { data } = await sb.from("savings_boxes").select("id,name,target,monthly,saved,color").order("created_at");
    content = <Boxes items={(data ?? []).map((r) => num(r, "target", "monthly", "saved"))} />;
  } else {
    const { data } = await sb.from("net_worth_items").select("id,month,kind,name,amount").order("created_at");
    const all = (data ?? []).map((r) => num(r, "amount"));
    const months = [...new Set(all.map((r) => r.month))].sort();
    const history = months.map((m) => ({ month: m, value: all.filter((r) => r.month === m).reduce((a, r) => a + (r.kind === "ativo" ? r.amount : -r.amount), 0) }));
    content = <NetWorth month={month} items={all.filter((r) => r.month === month)} history={history} />;
  }
  const href = (t: string, m = month) => `/financas?aba=${t}&m=${m.slice(0, 7)}`;

  return (
    <div style={{ ["--accent" as string]: "#d9c49a" }}>
      <PageHeader eyebrow="Finanças" title="Dinheiro com propósito" color="#d9c49a" />
      <div className="sticky top-0 z-30 -mx-4 px-4 py-2 mb-3 bg-base/80 backdrop-blur-xl md:static md:bg-transparent md:backdrop-blur-none md:p-0 md:mx-0">
        <div className="flex p-1 rounded-2xl bg-white/[.04] border border-white/[.06] gap-1 overflow-x-auto" role="tablist">
          {TABS.map(([k, l]) => (
            <Link key={k} href={href(k)} role="tab" aria-selected={tab === k}
              className={`min-h-10 px-4 rounded-xl text-sm whitespace-nowrap grid place-items-center shrink-0 transition-colors ${tab === k ? "bg-white/[.09] text-ink" : "text-muted hover:text-ink"}`}>{l}</Link>
          ))}
        </div>
      </div>
      {monthNav && (
        <nav className="flex items-center justify-between mb-4">
          <Link className="btn" href={href(tab, addMonths(month, -1))} aria-label="Mês anterior">‹</Link>
          <p className="font-display text-xl capitalize">{monthLabel(month)}</p>
          <Link className="btn" href={href(tab, addMonths(month, 1))} aria-label="Próximo mês">›</Link>
        </nav>
      )}
      <div key={tab + month}>{content}</div>
      <Verse area="financas" />
    </div>
  );
}
