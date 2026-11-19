import Image from "next/image";
import Link from "next/link";
import { Board, PageHeader, Verse } from "@/components/ui";
import { HI } from "@/components/hunt-icons";
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
  const art = TABS.find(([key]) => key === tab)?.[0] ?? "patrimonio";
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

  const sumQ = await sb.from("finance_items").select("kind,amount,paid").eq("month", month);
  const sumL = (sumQ.data ?? []).map((r) => ({ ...r, amount: Number(r.amount) }));
  const inc = sumL.filter((r) => r.kind === "receita").reduce((a, r) => a + r.amount, 0), exp = sumL.filter((r) => r.kind !== "receita").reduce((a, r) => a + r.amount, 0);
  const toPay = sumL.filter((r) => r.kind !== "receita" && !r.paid).reduce((a, r) => a + r.amount, 0);
  const brl0 = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

  return (
    <div className="dash-auto" style={{ ["--accent" as string]: "#ff2800" }}>
      <PageHeader eyebrow="Finanças" title="Dinheiro com propósito" icon={HI.coin} line="Dinheiro é ferramenta. Ordem antes de conforto." />
      <Board icon={HI.coin} art={<Image src={`/financas/${art === "resumo" ? "saldo" : art}.webp`} alt="" width={320} height={320} unoptimized
        className="pointer-events-none absolute -right-6 -top-10 -z-10 h-auto w-[54%] max-w-[285px] opacity-30 [mask-image:linear-gradient(110deg,transparent,#000_54%)] md:opacity-40" />}
        label={`Saldo de ${monthLabel(month)}`} big={brl0(inc - exp)} bar={inc ? Math.min(1, exp / inc) : exp ? 1 : 0}
        sub={inc ? `${Math.round((exp / inc) * 100)}% da renda já comprometida` : "Lance as entradas do mês para ver o saldo."}
        stats={[[HI.up, "Entradas", brl0(inc)], [HI.down, "Saídas", brl0(exp)], [HI.clock, "A pagar", brl0(toPay)]]} />
      <nav aria-label="Seções de finanças" className="sticky top-0 z-30 -mx-4 px-4 py-2 mb-4 bg-[#050505]/90 backdrop-blur-xl md:static md:mx-0 md:px-0 md:bg-transparent md:backdrop-blur-none">
        <div className="flex gap-px bg-white/[.06] border border-white/[.06] rounded-[8px] overflow-x-auto">
          {TABS.map(([k, l]) => { const on = tab === k; return (
            <Link key={k} href={href(k)} aria-current={on ? "page" : undefined}
              className={`relative flex-1 min-w-[88px] min-h-[70px] px-3 py-2 flex flex-col items-center justify-center gap-1 text-[11px] uppercase tracking-[.14em] whitespace-nowrap transition-colors ${on ? "bg-[#140303] text-white" : "bg-[#080808] text-white/55 hover:text-white"}`}>
              {on && <span aria-hidden className="absolute inset-x-0 top-0 h-[2px] bg-[#ff2800]" style={{ boxShadow: "0 0 12px #ff2800" }} />}
              <Image src={`/financas/${k}.webp`} alt="" width={32} height={32} unoptimized className={on ? "object-contain" : "object-contain opacity-75"} />
              {l}</Link>); })}
        </div>
      </nav>
      {monthNav && (
        <nav className="flex items-stretch gap-px mb-4 border border-white/[.06] rounded-[8px] overflow-hidden bg-white/[.06]" aria-label="Mês">
          <Link className="grid place-items-center w-12 bg-[#080808] text-lg" href={href(tab, addMonths(month, -1))} aria-label="Mês anterior">‹</Link>
          <p className="flex-1 bg-[#080808] py-2.5 text-center num text-xl capitalize">{monthLabel(month)}</p>
          <Link className="grid place-items-center w-12 bg-[#080808] text-lg" href={href(tab, addMonths(month, 1))} aria-label="Próximo mês">›</Link>
        </nav>
      )}
      <div key={tab + month} className="contents">{content}</div>
      <Verse area="financas" />
    </div>
  );
}
