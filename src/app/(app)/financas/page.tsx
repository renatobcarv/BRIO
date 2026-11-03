import Link from "next/link";
import { PageHeader, Verse } from "@/components/ui";
import { Boxes, Flow, Investments, NetWorth } from "@/components/finance/finance";
import { addMonths, isoMonthParam, monthLabel } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const TABS = [["fluxo", "Fluxo"], ["investimentos", "Investimentos"], ["caixinhas", "Caixinhas"], ["patrimonio", "Patrimônio"]] as const;
const n = <T extends Record<string, unknown>>(r: T, ...keys: string[]) => ({ ...r, ...Object.fromEntries(keys.map((k) => [k, Number(r[k])])) });

export default async function Page({ searchParams }: { searchParams: Promise<{ aba?: string; m?: string }> }) {
  const sp = await searchParams;
  const tab = sp.aba ?? "fluxo";
  const month = isoMonthParam(sp.m);
  const sb = await createClient();
  const monthNav = tab === "fluxo" || tab === "patrimonio";

  let content: React.ReactNode;
  if (tab === "investimentos") {
    const { data } = await sb.from("investments").select("id,name,amount,rate_aa").order("created_at");
    content = <Investments items={(data ?? []).map((r) => n(r, "amount", "rate_aa"))} />;
  } else if (tab === "caixinhas") {
    const { data } = await sb.from("savings_boxes").select("id,name,target,monthly,saved,color").order("created_at");
    content = <Boxes items={(data ?? []).map((r) => n(r, "target", "monthly", "saved"))} />;
  } else if (tab === "patrimonio") {
    const { data } = await sb.from("net_worth_items").select("id,month,kind,name,amount").order("created_at");
    const all = (data ?? []).map((r) => n(r, "amount"));
    const months = [...new Set(all.map((r) => r.month))].sort();
    const history = months.map((m) => ({ month: m, value: all.filter((r) => r.month === m).reduce((a, r) => a + (r.kind === "ativo" ? r.amount : -r.amount), 0) }));
    content = <NetWorth month={month} items={all.filter((r) => r.month === month)} history={history} />;
  } else {
    const { data } = await sb.from("finance_items").select("id,kind,name,amount").eq("month", month).order("created_at");
    content = <Flow month={month} items={(data ?? []).map((r) => n(r, "amount"))} />;
  }
  const q = (extra: string) => `/financas?aba=${tab}${extra}`;

  return (
    <div style={{ ["--accent" as string]: "#d9c49a" }}>
      <PageHeader eyebrow="Finanças" title="Fluxo e patrimônio" color="#d9c49a" />
      <div className="flex gap-2 mb-4 overflow-x-auto rise" role="tablist">
        {TABS.map(([k, l]) => <Link key={k} href={`/financas?aba=${k}&m=${month.slice(0, 7)}`} role="tab" aria-selected={tab === k} aria-pressed={tab === k} className="chip !min-h-11 !px-4 shrink-0">{l}</Link>)}
      </div>
      {monthNav && (
        <nav className="flex items-center justify-between mb-4">
          <Link className="btn" href={q(`&m=${addMonths(month, -1).slice(0, 7)}`)} aria-label="Mês anterior">‹</Link>
          <p className="font-display text-xl capitalize">{monthLabel(month)}</p>
          <Link className="btn" href={q(`&m=${addMonths(month, 1).slice(0, 7)}`)} aria-label="Próximo mês">›</Link>
        </nav>
      )}
      <div key={tab + month}>{content}</div>
      <Verse area="financas" />
    </div>
  );
}
