import Link from "next/link";
import { PageHeader, Verse } from "@/components/ui";
import { Boxes, NetWorth } from "@/components/finance/finance";
import { Investments, type Inv, type Move } from "@/components/finance/invest";
import { todayISO } from "@/lib/date";
import { Budget, MoneyShell, type Tx } from "@/components/finance/money";
import { FinanceChat } from "@/components/finance/chat";
import { addMonths, isoMonthParam, monthLabel } from "@/lib/date";
import { getSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const TABS = [["conversar", "Conversar"], ["resumo", "Resumo"], ["lancamentos", "Lançamentos"], ["orcamento", "Orçamento"], ["caixinhas", "Caixinhas"], ["investimentos", "Investimentos"], ["patrimonio", "Patrimônio"]] as const;
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
  if (tab === "conversar") {
    const [m, p] = await Promise.all([
      sb.from("finance_chat_messages").select("role,content").order("created_at", { ascending: false }).limit(50),
      sb.from("finance_chat_proposals").select("id,kind,summary,status").eq("status", "pending").order("created_at"),
    ]);
    content = m.error
      ? <p className="glass p-5 text-sm text-[#ff453a]">Rode a migração <code>supabase/migrations/20261112000000_assistente.sql</code> no Supabase para usar o assistente.</p>
      : <FinanceChat initial={(m.data ?? []).reverse() as { role: "user" | "assistant"; content: string }[]} pending={p.data ?? []} />;
  } else if (tab === "resumo" || tab === "lancamentos" || tab === "orcamento") {
    const from = addMonths(month, -5);
    const [curI, range, prevRec, instQ] = await Promise.all([
      sb.from("finance_items").select(TX + ",inst_group,inst_no,inst_total").eq("month", month),
      sb.from("finance_items").select("month,kind,amount").gte("month", from).lte("month", month),
      sb.from("finance_items").select("id").eq("month", addMonths(month, -1)).eq("recurring", true).limit(1),
      sb.from("finance_items").select("inst_group,inst_no,inst_total,amount,name,date,paid").not("inst_group", "is", null).limit(3000),
    ]);
    // Sem a migração de parcelas: lê as colunas antigas.
    const cur = curI.error ? await sb.from("finance_items").select(TX).eq("month", month) : curI;
    const txs = ((cur.data ?? []) as unknown as Record<string, unknown>[]).map(toTx);
    const groups = new Map<string, { name: string; total: number; n: number; paidN: number; left: number; next: string | null; last: string }>();
    for (const r of (instQ.error ? [] : instQ.data ?? []) as { inst_group: string; inst_no: number; inst_total: number; amount: number; name: string; date: string; paid: boolean }[]) {
      const g = groups.get(r.inst_group) ?? { name: r.name.replace(/\s*\(\d+\/\d+\)\s*$/, ""), total: 0, n: r.inst_total, paidN: 0, left: 0, next: null, last: r.date };
      g.total += Number(r.amount); if (r.paid) g.paidN++; else { g.left += Number(r.amount); if (!g.next || r.date < g.next) g.next = r.date; }
      if (r.date > g.last) g.last = r.date; groups.set(r.inst_group, g);
    }
    const installments = [...groups].map(([id, g]) => ({ id, ...g })).filter((g) => g.left > 0).sort((a, b) => (a.next ?? "").localeCompare(b.next ?? ""));
    const all = (range.data ?? []).map((r) => ({ ...r, amount: Number(r.amount) }));
    const history = Array.from({ length: 6 }, (_, i) => { const m = addMonths(from, i); const l = all.filter((r) => r.month === m);
      return { month: m, income: l.filter((r) => r.kind === "receita").reduce((a, r) => a + r.amount, 0), expense: l.filter((r) => r.kind !== "receita").reduce((a, r) => a + r.amount, 0) }; });
    const prevTxs = all.filter((r) => r.month === addMonths(month, -1)) as unknown as Tx[];
    content = tab === "orcamento" ? <Budget txs={txs} cats={s.finance_categories} />
      : <MoneyShell view={tab} month={month} txs={txs} prevTxs={prevTxs} history={history} cats={s.finance_categories} hasRecurringPrev={(prevRec.data ?? []).length > 0} installments={installments} />;
  } else if (tab === "investimentos") {
    const today = todayISO();
    const [inv, mv, exp] = await Promise.all([
      sb.from("investments").select("*").order("created_at"),
      sb.from("investment_moves").select("id,investment_id,date,kind,amount,balance_after").gte("date", addMonths(today.slice(0, 7) + "-01", -12)),
      sb.from("finance_items").select("month,kind,amount").gte("month", addMonths(today.slice(0, 7) + "-01", -3)).lt("month", today.slice(0, 7) + "-01").neq("kind", "receita"),
    ]);
    const items = (inv.data ?? []).map((r) => ({ ...r, amount: Number(r.amount), invested: Number(r.invested ?? r.amount), rate_aa: Number(r.rate_aa), monthly: Number(r.monthly ?? 0),
      type: r.type ?? "renda_fixa", liquidity: r.liquidity ?? "diaria", is_reserve: !!r.is_reserve })) as Inv[];
    const moves = (mv.data ?? []).map((m) => ({ ...m, amount: Number(m.amount), balance_after: Number(m.balance_after) })) as Move[];
    const expMonths = new Set((exp.data ?? []).map((e) => e.month)).size;
    const monthlyCost = expMonths ? (exp.data ?? []).reduce((a, e) => a + Number(e.amount), 0) / expMonths : 0;
    content = <>
      {mv.error && <p className="glass p-4 mb-4 text-sm text-[#ff453a]">Para aportes, resgates e histórico, rode a migração <code>supabase/migrations/20261107000000_investimentos.sql</code> no Supabase.</p>}
      <Investments items={items} moves={moves} monthlyCost={monthlyCost} today={today} />
    </>;
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
    <div style={{ ["--accent" as string]: "#3ee6c1" }}>
      <PageHeader eyebrow="Finanças" title="Dinheiro com propósito" color="#3ee6c1" />
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
