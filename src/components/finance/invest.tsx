"use client";
import { useMemo, useState, useTransition } from "react";
import { deleteInvestment, moveInvestment, saveInvestment } from "@/app/(app)/financas/actions";
import { Empty } from "@/components/ui";
import { Field, Progress, SectionTitle, Segmented, Sheet, Stat, fmt, n } from "@/components/kit";
import { brl, monthLabel, shortDate } from "@/lib/date";
import { INV_TYPES, LIQUIDITY, monthsToTarget, projection, reserveMonths, type InvType, type Liquidity } from "@/lib/invest";

const A = "#d9c49a", UP = "#8ac295", DOWN = "#e8a39a";
export type Inv = { id: string; name: string; type: InvType; institution: string | null; amount: number; invested: number; rate_aa: number; monthly: number;
  liquidity: Liquidity; maturity: string | null; notes: string | null; is_reserve: boolean };
export type Move = { id: string; investment_id: string; date: string; kind: "aporte" | "resgate" | "atualizacao"; amount: number; balance_after: number };
const money = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (v: number) => `${v >= 0 ? "+" : ""}${fmt(v * 100)}%`;
const brlShort = (v: number) => (Math.abs(v) >= 1e6 ? `R$ ${fmt(v / 1e6)} mi` : Math.abs(v) >= 1e4 ? `R$ ${fmt(v / 1e3, 0)} mil` : brl(v));

function Donut({ parts }: { parts: { key: string; value: number; color: string }[] }) {
  const total = parts.reduce((a, p) => a + p.value, 0), r = 62, c = 2 * Math.PI * r; let off = 0;
  return (
    <svg width="156" height="156" viewBox="0 0 156 156" className="-rotate-90 shrink-0" role="img" aria-label="Distribuição da carteira">
      <circle cx="78" cy="78" r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="18" />
      {total > 0 && parts.map((p) => { const len = (p.value / total) * c; const el = <circle key={p.key} cx="78" cy="78" r={r} fill="none" stroke={p.color} strokeWidth="18" strokeDasharray={`${Math.max(0, len - 2)} ${c}`} strokeDashoffset={-off} />; off += len; return el; })}
    </svg>
  );
}

function InvForm({ inv, onDone }: { inv?: Inv; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const [f, setF] = useState({
    name: inv?.name ?? "", type: (inv?.type ?? "renda_fixa") as InvType, institution: inv?.institution ?? "",
    amount: inv ? money(inv.amount) : "", invested: inv ? money(inv.invested) : "", rate: inv ? fmt(inv.rate_aa, 2) : "",
    monthly: inv ? money(inv.monthly) : "", liquidity: (inv?.liquidity ?? "diaria") as Liquidity, maturity: inv?.maturity ?? "", notes: inv?.notes ?? "", is_reserve: inv?.is_reserve ?? false,
  });
  const set = (p: Partial<typeof f>) => setF({ ...f, ...p });
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
      <Field label="Nome"><input className="field" placeholder="Ex.: CDB Nubank 110% CDI" value={f.name} onChange={(e) => set({ name: e.target.value })} autoFocus={!inv} /></Field>
      <div>
        <p className="label mb-2">Tipo</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(INV_TYPES) as InvType[]).map((t) => (
            <button key={t} className="chip" aria-pressed={f.type === t} onClick={() => set({ type: t, is_reserve: t === "reserva" ? true : f.is_reserve, liquidity: ["acoes", "fiis", "etf", "cripto"].includes(t) ? "variavel" : f.liquidity })}
              style={f.type === t ? { background: INV_TYPES[t].color } : undefined}>{INV_TYPES[t].label}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Valor atual (R$)"><input className="field num" inputMode="decimal" value={f.amount} onChange={(e) => set({ amount: e.target.value })} /></Field>
        <Field label="Total aplicado (R$)" hint="Quanto saiu do seu bolso"><input className="field num" inputMode="decimal" placeholder={f.amount || "igual ao atual"} value={f.invested} onChange={(e) => set({ invested: e.target.value })} /></Field>
        <Field label="Rentabilidade (% a.a.)" hint="Esperada. Ex.: 11,5"><input className="field num" inputMode="decimal" value={f.rate} onChange={(e) => set({ rate: e.target.value })} /></Field>
        <Field label="Aporte mensal (R$)"><input className="field num" inputMode="decimal" value={f.monthly} onChange={(e) => set({ monthly: e.target.value })} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Instituição"><input className="field" placeholder="Ex.: Nubank" value={f.institution} onChange={(e) => set({ institution: e.target.value })} /></Field>
        <Field label="Liquidez"><select className="field" value={f.liquidity} onChange={(e) => set({ liquidity: e.target.value as Liquidity })}>
          {(Object.keys(LIQUIDITY) as Liquidity[]).map((l) => <option key={l} value={l}>{LIQUIDITY[l]}</option>)}</select></Field>
      </div>
      <Field label="Vencimento (opcional)"><input type="date" className="field" value={f.maturity} onChange={(e) => set({ maturity: e.target.value })} /></Field>
      <label className="flex items-center gap-3 min-h-11"><input type="checkbox" className="h-5 w-5 accent-[#8ac295]" checked={f.is_reserve} onChange={(e) => set({ is_reserve: e.target.checked })} />Conta como reserva de emergência</label>
      <Field label="Observações"><input className="field" value={f.notes} onChange={(e) => set({ notes: e.target.value })} /></Field>
      {err && <p role="alert" className="text-sm text-[#e8a39a]">{err}</p>}
      <div className="flex gap-2">
        {inv && <button className="btn text-muted" disabled={pending} onClick={() => { if (confirm(`Excluir “${inv.name}” e o histórico?`)) start(async () => { await deleteInvestment(inv.id); onDone(); }); }}>Excluir</button>}
        <button className="btn btn-accent flex-1" disabled={pending || !f.name.trim()} onClick={() => start(async () => {
          setErr("");
          try {
            await saveInvestment({ name: f.name, type: f.type, institution: f.institution || null, amount: n(f.amount), invested: f.invested ? n(f.invested) : n(f.amount),
              rate_aa: n(f.rate), monthly: n(f.monthly), liquidity: f.liquidity, maturity: f.maturity || null, notes: f.notes || null, is_reserve: f.is_reserve }, inv?.id);
            onDone();
          } catch { setErr("Não foi possível salvar. Rode a migração de investimentos no Supabase."); }
        })}>{pending ? "Salvando…" : inv ? "Salvar" : "Adicionar"}</button>
      </div>
    </div>
  );
}

function InvDetail({ inv, moves, today, onEdit, onDone }: { inv: Inv; moves: Move[]; today: string; onEdit: () => void; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [kind, setKind] = useState<"aporte" | "resgate" | "atualizacao">("aporte");
  const [v, setV] = useState("");
  const [date, setDate] = useState(today);
  const gain = inv.amount - inv.invested, gp = inv.invested ? gain / inv.invested : 0;
  const t = INV_TYPES[inv.type];
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      <div>
        <p className="label" style={{ color: t.color }}>{t.label}{inv.institution ? ` · ${inv.institution}` : ""}</p>
        <p className="num text-4xl mt-1">{brl(inv.amount)}</p>
        <p className="text-sm mt-1" style={{ color: gain >= 0 ? UP : DOWN }}>{gain >= 0 ? "▲" : "▼"} {brl(Math.abs(gain))} ({pct(gp)}) sobre {brl(inv.invested)} aplicados</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="tag">{fmt(inv.rate_aa, 2)}% a.a.</span><span className="tag">liquidez {LIQUIDITY[inv.liquidity].toLowerCase()}</span>
          {inv.maturity && <span className="tag">vence {shortDate(inv.maturity)} {inv.maturity.slice(0, 4)}</span>}
          {inv.monthly > 0 && <span className="tag">aporte {brl(inv.monthly)}/mês</span>}
          {inv.is_reserve && <span className="tag" style={{ color: UP }}>reserva</span>}
        </div>
      </div>
      <div className="rounded-2xl bg-white/[.03] p-4 grid gap-3">
        <Segmented value={kind} onChange={setKind} options={[["aporte", "Aportar"], ["resgate", "Resgatar"], ["atualizacao", "Atualizar saldo"]]} />
        <div className="grid grid-cols-[minmax(0,1fr)_9.5rem] gap-2">
          <Field label={kind === "atualizacao" ? "Saldo atual na corretora" : "Valor (R$)"}>
            <input className="field num text-lg" inputMode="decimal" placeholder={kind === "aporte" && inv.monthly ? money(inv.monthly) : "0,00"} value={v} onChange={(e) => setV(e.target.value)} /></Field>
          <Field label="Data"><input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        </div>
        {kind === "atualizacao" && <p className="text-xs text-faint">Use para registrar rendimentos: informe o saldo que aparece no banco hoje.</p>}
        <button className="btn btn-accent" disabled={pending || (!n(v) && !(kind === "aporte" && inv.monthly))} onClick={() => start(async () => {
          await moveInvestment(inv.id, kind, n(v) || inv.monthly, date); setV("");
        })}>{pending ? "Salvando…" : kind === "aporte" ? "Registrar aporte" : kind === "resgate" ? "Registrar resgate" : "Atualizar saldo"}</button>
      </div>
      <div>
        <p className="label mb-2">Movimentações</p>
        {moves.length === 0 ? <p className="text-sm text-muted">Nenhuma ainda.</p> : (
          <ul className="grid gap-1">
            {moves.map((m) => (
              <li key={m.id} className="flex items-center gap-3 text-sm min-h-10">
                <span className="text-muted w-16 shrink-0">{shortDate(m.date)}</span>
                <span className="flex-1">{m.kind === "aporte" ? "Aporte" : m.kind === "resgate" ? "Resgate" : "Rendimento"}</span>
                <span className="num" style={{ color: m.kind === "resgate" || m.amount < 0 ? DOWN : UP }}>{m.kind === "resgate" ? "−" : m.amount >= 0 ? "+" : "−"}{brl(Math.abs(m.amount))}</span>
                <span className="num text-faint w-24 text-right">{brl(m.balance_after)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {inv.notes && <p className="text-sm text-muted">{inv.notes}</p>}
      <div className="flex gap-2"><button className="btn flex-1" onClick={onEdit}>Editar dados</button><button className="btn" onClick={onDone}>Fechar</button></div>
    </div>
  );
}

function Simulator({ initial, monthly, rate }: { initial: number; monthly: number; rate: number }) {
  const [f, setF] = useState({ initial: money(initial), monthly: money(monthly), rate: fmt(rate || 10, 2), years: 10, target: "" });
  const months = f.years * 12;
  const series = useMemo(() => projection(n(f.initial), n(f.monthly), n(f.rate), months), [f.initial, f.monthly, f.rate, months]);
  const end = series.at(-1)!;
  const toTarget = f.target ? monthsToTarget(n(f.initial), n(f.monthly), n(f.rate), n(f.target)) : null;
  const W = 600, H = 170, P = 8, max = Math.max(1, end.total);
  const x = (m: number) => P + (m / months) * (W - 2 * P), y = (v: number) => H - P - (v / max) * (H - 2 * P);
  const area = (k: "total" | "contributed") => `M${x(0)},${y(0)} ` + series.map((s) => `L${x(s.month)},${y(s[k])}`).join(" ") + ` L${x(months)},${y(0)} Z`;
  return (
    <section className="glass rise p-5 mt-4">
      <SectionTitle>Simulador</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Hoje (R$)"><input className="field num !px-2" inputMode="decimal" value={f.initial} onChange={(e) => setF({ ...f, initial: e.target.value })} /></Field>
        <Field label="Por mês (R$)"><input className="field num !px-2" inputMode="decimal" value={f.monthly} onChange={(e) => setF({ ...f, monthly: e.target.value })} /></Field>
        <Field label="% ao ano"><input className="field num !px-2" inputMode="decimal" value={f.rate} onChange={(e) => setF({ ...f, rate: e.target.value })} /></Field>
      </div>
      <label className="grid gap-1 mt-3"><span className="label">Prazo: {f.years} {f.years === 1 ? "ano" : "anos"}</span>
        <input type="range" min={1} max={35} value={f.years} onChange={(e) => setF({ ...f, years: +e.target.value })} className="w-full accent-[#d9c49a] min-h-11" /></label>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full mt-2" role="img" aria-label="Projeção do patrimônio">
        <path d={area("total")} fill={A} opacity=".35" />
        <path d={area("contributed")} fill="#84aed4" opacity=".45" />
      </svg>
      <div className="flex gap-4 text-xs text-muted"><span><i className="inline-block h-2 w-2 rounded-full mr-1" style={{ background: "#84aed4" }} />Você aportou</span><span><i className="inline-block h-2 w-2 rounded-full mr-1" style={{ background: A }} />Juros</span></div>
      <div className="grid grid-cols-3 gap-3 mt-4">
        <Stat label={`Em ${f.years} anos`} value={brlShort(end.total)} color={A} />
        <Stat label="Aportado" value={brlShort(end.contributed)} />
        <Stat label="Juros" value={brlShort(end.interest)} color={UP} sub={end.total ? `${Math.round((end.interest / end.total) * 100)}% do total` : undefined} />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-end mt-4">
        <Field label="Quero chegar a (R$)"><input className="field num" inputMode="decimal" placeholder="Ex.: 1.000.000" value={f.target} onChange={(e) => setF({ ...f, target: e.target.value })} /></Field>
        <p className="text-sm pb-3 text-right min-w-28">{!f.target ? "" : toTarget == null ? "Não chega em 100 anos" : toTarget === 0 ? "Já chegou!" : `${Math.floor(toTarget / 12)} anos e ${toTarget % 12} meses`}</p>
      </div>
      <p className="text-[11px] text-faint mt-2">Simulação com taxa constante e sem impostos ou inflação. Serve para comparar cenários, não é promessa de retorno.</p>
    </section>
  );
}

export function Investments({ items, moves, monthlyCost, today }: { items: Inv[]; moves: Move[]; monthlyCost: number; today: string }) {
  const [sheet, setSheet] = useState<null | "new" | { view: Inv } | { edit: Inv }>(null);
  const close = () => setSheet(null);
  const total = items.reduce((a, i) => a + i.amount, 0), invested = items.reduce((a, i) => a + i.invested, 0);
  const gain = total - invested, monthly = items.reduce((a, i) => a + i.monthly, 0);
  const rate = total ? items.reduce((a, i) => a + i.rate_aa * i.amount, 0) / total : 0;
  const reserve = items.filter((i) => i.is_reserve || i.type === "reserva").reduce((a, i) => a + i.amount, 0);
  const rm = reserveMonths(reserve, monthlyCost);
  const byType = (Object.keys(INV_TYPES) as InvType[]).map((t) => ({ key: t, value: items.filter((i) => i.type === t).reduce((a, i) => a + i.amount, 0), color: INV_TYPES[t].color })).filter((p) => p.value > 0).sort((a, b) => b.value - a.value);
  const months = Array.from({ length: 12 }, (_, i) => { const d = new Date(today.slice(0, 7) + "-15T12:00:00Z"); d.setUTCMonth(d.getUTCMonth() - 11 + i); return d.toISOString().slice(0, 7); });
  const flow = months.map((m) => moves.filter((x) => x.date.startsWith(m) && x.kind !== "atualizacao").reduce((a, x) => a + (x.kind === "aporte" ? x.amount : -x.amount), 0));
  const maxFlow = Math.max(1, ...flow.map(Math.abs));
  const upcoming = items.filter((i) => i.maturity && i.maturity >= today).sort((a, b) => a.maturity!.localeCompare(b.maturity!)).slice(0, 3);

  return (
    <div style={{ ["--accent" as string]: A }}>
      <section className="glass rise p-5">
        <p className="label">Total investido</p>
        <p className="num text-4xl md:text-5xl mt-1" style={{ color: A }}>{brl(total)}</p>
        <p className="text-sm mt-1" style={{ color: gain >= 0 ? UP : DOWN }}>{gain >= 0 ? "▲" : "▼"} {brl(Math.abs(gain))} de rendimento ({pct(invested ? gain / invested : 0)})</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-4 mt-4">
          <Stat label="Aplicado" value={brl(invested)} sub="saiu do seu bolso" />
          <Stat label="Aporte mensal" value={brl(monthly)} sub="planejado" />
          <Stat label="Rentab. média" value={`${fmt(rate, 1)}% a.a.`} sub="ponderada pelo saldo" />
        </div>
        <button className="btn btn-accent w-full mt-4" onClick={() => setSheet("new")}>+ Investimento</button>
      </section>

      <section className="glass rise p-5 mt-4">
        <SectionTitle>Reserva de emergência</SectionTitle>
        <div className="flex items-baseline justify-between gap-3">
          <p className="num text-2xl">{brl(reserve)}</p>
          <p className="text-sm text-muted">{rm == null ? "lance despesas para calcular" : `${fmt(rm, 1)} meses de custo de vida`}</p>
        </div>
        <div className="mt-3"><Progress value={rm == null ? 0 : rm / 6} color={rm != null && rm >= 6 ? UP : A} /></div>
        <p className="text-xs text-muted mt-1.5">{monthlyCost > 0 ? `Meta sugerida: 6 meses = ${brl(monthlyCost * 6)} (custo médio ${brl(monthlyCost)}/mês nos últimos 3 meses)` : "Marque os investimentos que contam como reserva."}</p>
      </section>

      {items.length === 0 ? <section className="glass p-5 mt-4"><Empty>Comece pela reserva de emergência. Depois, o resto.</Empty></section> : (
        <>
          <section className="glass rise p-5 mt-4">
            <SectionTitle>Distribuição</SectionTitle>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Donut parts={byType} />
              <ul className="flex-1 w-full grid gap-2">
                {byType.map((p) => (
                  <li key={p.key} className="flex items-center gap-3 text-sm">
                    <i className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                    <span className="flex-1 truncate">{INV_TYPES[p.key as InvType].label}</span>
                    <span className="text-muted text-xs">{Math.round((p.value / total) * 100)}%</span>
                    <span className="num w-24 text-right">{brl(p.value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="glass rise p-5 mt-4">
            <SectionTitle>Carteira</SectionTitle>
            <ul>
              {[...items].sort((a, b) => b.amount - a.amount).map((i) => {
                const g = i.invested ? (i.amount - i.invested) / i.invested : 0;
                return (
                  <li key={i.id}><button className="row-hover w-full flex items-center gap-3 min-h-16 px-2 text-left" onClick={() => setSheet({ view: i })}>
                    <i className="h-9 w-1.5 rounded-full shrink-0" style={{ background: INV_TYPES[i.type].color }} />
                    <span className="flex-1 min-w-0"><span className="block truncate">{i.name}</span>
                      <span className="text-xs text-muted">{[i.institution, `${fmt(i.rate_aa, 1)}% a.a.`, LIQUIDITY[i.liquidity]].filter(Boolean).join(" · ")}</span></span>
                    <span className="text-right"><span className="num block">{brl(i.amount)}</span><span className="text-xs num" style={{ color: g >= 0 ? UP : DOWN }}>{pct(g)}</span></span>
                  </button></li>
                );
              })}
            </ul>
            {upcoming.length > 0 && <p className="text-xs text-muted mt-3 px-2">Próximos vencimentos: {upcoming.map((u) => `${u.name} (${shortDate(u.maturity!)})`).join(" · ")}</p>}
          </section>

          <section className="glass rise p-5 mt-4">
            <SectionTitle>Aportes líquidos · 12 meses</SectionTitle>
            <div className="relative flex items-center gap-1.5 h-32">
              <div className="absolute inset-x-0 top-1/2 border-t border-white/10" />
              {flow.map((v, idx) => (
                <div key={idx} className="flex-1 h-full flex flex-col justify-center" title={`${monthLabel(months[idx] + "-01")}: ${brl(v)}`}>
                  <div className="h-1/2 flex items-end"><div className="w-full rounded-t-sm" style={{ height: v > 0 ? `${(v / maxFlow) * 100}%` : 0, background: UP }} /></div>
                  <div className="h-1/2 flex items-start"><div className="w-full rounded-b-sm" style={{ height: v < 0 ? `${(-v / maxFlow) * 100}%` : 0, background: DOWN }} /></div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-muted mt-1 capitalize"><span>{monthLabel(months[0] + "-01").slice(0, 3)}</span><span>{monthLabel(months[11] + "-01").slice(0, 3)}</span></div>
            <p className="text-xs text-muted mt-2">Aportado em 12 meses: {brl(flow.reduce((a, b) => a + b, 0))}</p>
          </section>
        </>
      )}

      <Simulator key={Math.round(total)} initial={total} monthly={monthly} rate={rate} />

      <Sheet accent={A} open={sheet === "new"} onClose={close} title="Novo investimento">{sheet === "new" && <InvForm onDone={close} />}</Sheet>
      <Sheet accent={A} open={!!sheet && typeof sheet === "object" && "view" in sheet} onClose={close} title={sheet && typeof sheet === "object" && "view" in sheet ? sheet.view.name : ""}>
        {sheet && typeof sheet === "object" && "view" in sheet && (() => { const cur = items.find((i) => i.id === sheet.view.id) ?? sheet.view; return (
          <InvDetail inv={cur} moves={moves.filter((m) => m.investment_id === cur.id).sort((a, b) => b.date.localeCompare(a.date))} today={today} onEdit={() => setSheet({ edit: cur })} onDone={close} />); })()}
      </Sheet>
      <Sheet accent={A} open={!!sheet && typeof sheet === "object" && "edit" in sheet} onClose={close} title="Editar investimento">
        {sheet && typeof sheet === "object" && "edit" in sheet && <InvForm inv={sheet.edit} onDone={close} />}
      </Sheet>
    </div>
  );
}
