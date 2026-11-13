"use client";
import { useMemo, useState, useTransition } from "react";
import { deleteInstallmentsFrom, deleteRow, generateRecurring, saveInstallments, saveTx, setPaid } from "@/app/(app)/financas/actions";
import { plan as planInst } from "@/lib/installments";
import { updateSettings } from "@/app/settings-actions";
import { Empty } from "@/components/ui";
import { Field, Progress, SectionTitle, Segmented, Sheet, Stat, LinkBtn, n } from "@/components/kit";
import { brl, monthLabel, shortDate, weekdayShort, dow } from "@/lib/date";
import type { FinCategory } from "@/lib/settings";

const A = "#3ee6c1", IN = "#3ee6c1", OUT = "#ff453a", GREY = "#8e8e93";
export type Tx = { id: string; kind: "receita" | "fixo" | "variavel"; name: string; amount: number; category: string | null; date: string | null; paid: boolean; recurring: boolean; note: string | null; month: string; inst_group?: string | null; inst_no?: number | null; inst_total?: number | null };
export type InstGroup = { id: string; name: string; total: number; n: number; paidN: number; left: number; next: string | null; last: string };
const isOut = (t: Tx) => t.kind !== "receita";
const COLORS = ["#30d158", "#0a84ff", "#ffb340", "#3ee6c1", "#bf5af2", "#ff453a", "#3a7bd5", "#d49bff", "#7ee2a0", "#9a978f"];
const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").slice(0, 30) || "cat";

function useCats(cats: FinCategory[]) {
  return useMemo(() => { const m = new Map(cats.map((c) => [c.key, c])); return (k: string | null) => m.get(k ?? "") ?? { key: k ?? "outros", label: k ?? "Sem categoria", kind: "variavel" as const, color: "#9a978f", budget: 0 }; }, [cats]);
}

/* ───────── Formulário de lançamento ───────── */
export function TxForm({ tx, month, cats, onDone }: { tx?: Tx; month: string; cats: FinCategory[]; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [type, setType] = useState<"despesa" | "receita">(tx?.kind === "receita" ? "receita" : "despesa");
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({
    amount: tx ? tx.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "", name: tx?.name ?? "",
    category: tx?.category ?? "", date: tx?.date ?? (today.slice(0, 7) === month.slice(0, 7) ? today : month),
    paid: tx?.paid ?? true, recurring: tx?.recurring ?? false, note: tx?.note ?? "",
  });
  const [inst, setInst] = useState({ on: false, n: "10", mode: "total" as "total" | "parcela" });
  const [err, setErr] = useState<string | null>(null);
  const preview = inst.on && n(f.amount) && +inst.n >= 2 ? planInst(inst.mode === "total" ? { total: n(f.amount), n: +inst.n, first: f.date } : { each: n(f.amount), n: +inst.n, first: f.date }) : null;
  const options = cats.filter((c) => (type === "receita" ? c.kind === "receita" : c.kind !== "receita"));
  const cat = cats.find((c) => c.key === f.category);
  const kind = type === "receita" ? "receita" : cat?.kind === "fixo" ? "fixo" : "variavel";
  const save = () => start(async () => {
    const base = { kind: kind as "receita" | "fixo" | "variavel", name: f.name, amount: n(f.amount), category: f.category || (type === "receita" ? "extra" : "outros"), date: f.date, paid: f.paid, recurring: inst.on ? false : f.recurring, note: f.note };
    try { if (inst.on && !tx) await saveInstallments({ ...base, n: Math.round(+inst.n), mode: inst.mode }); else await saveTx(base, tx?.id); onDone(); }
    catch (e) { setErr((e as Error).message); }
  });
  return (
    <div className="grid gap-4">
      <Segmented value={type} onChange={(v) => { setType(v); setF({ ...f, category: "" }); }} options={[["despesa", "Despesa"], ["receita", "Receita"]]} />
      <div className="flex items-baseline gap-2 border-b border-white/10 pb-2">
        <span className="text-muted text-xl">R$</span>
        <input className="bg-transparent outline-none num text-4xl w-full" inputMode="decimal" placeholder="0,00" value={f.amount}
          onChange={(e) => setF({ ...f, amount: e.target.value })} style={{ color: type === "receita" ? IN : undefined }} aria-label="Valor" autoFocus />
      </div>
      <Field label="Descrição"><input className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder={type === "receita" ? "Ex.: Salário" : "Ex.: Mercado"} /></Field>
      <div>
        <p className="label mb-2">Categoria</p>
        <div className="flex flex-wrap gap-2">
          {options.map((c) => (
            <button key={c.key} className="chip gap-2" aria-pressed={f.category === c.key} onClick={() => setF({ ...f, category: c.key, recurring: tx ? f.recurring : c.kind === "fixo" || f.recurring })}
              style={f.category === c.key ? { background: c.color } : undefined}>
              <i className="h-2 w-2 rounded-full" style={{ background: f.category === c.key ? "#120f08" : c.color }} />{c.label}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Data"><input type="date" className="field" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        <Field label="Situação">
          <Segmented value={f.paid ? "s" : "n"} onChange={(v) => setF({ ...f, paid: v === "s" })} options={[["s", type === "receita" ? "Recebido" : "Pago"], ["n", type === "receita" ? "A receber" : "A pagar"]]} />
        </Field>
      </div>
      {tx?.inst_group && tx.inst_no && (
        <div className="rounded-2xl p-3 border" style={{ borderColor: A + "44", background: A + "0f" }}>
          <p className="text-sm">💳 Parcela <b>{tx.inst_no}/{tx.inst_total}</b> de uma compra parcelada.</p>
          <button className="text-xs text-[#ff6961] underline mt-2" disabled={pending} onClick={() => { if (confirm(`Apagar a parcela ${tx.inst_no} e as seguintes? (ex.: quitou antes)`)) start(async () => { await deleteInstallmentsFrom(tx.inst_group!, tx.inst_no!); onDone(); }); }}>Apagar esta e as próximas parcelas</button>
        </div>
      )}
      {!tx && type === "despesa" && (
        <div className="rounded-2xl border p-3 grid gap-3" style={{ borderColor: inst.on ? A + "66" : "rgba(255,255,255,.08)", background: inst.on ? A + "0d" : "transparent" }}>
          <label className="flex items-center gap-3 min-h-10"><input type="checkbox" className="h-5 w-5 accent-[#3ee6c1]" checked={inst.on} onChange={(e) => setInst({ ...inst, on: e.target.checked })} />
            <span>💳 Parcelado</span></label>
          {inst.on && <>
            <div className="grid grid-cols-[6rem_1fr] gap-2 items-end">
              <Field label="Parcelas"><input className="field num text-center" inputMode="numeric" value={inst.n} onChange={(e) => setInst({ ...inst, n: e.target.value.replace(/\D/g, "").slice(0, 2) })} /></Field>
              <Field label="O valor digitado é"><Segmented value={inst.mode} onChange={(v) => setInst({ ...inst, mode: v })} options={[["total", "Total"], ["parcela", "Da parcela"]]} /></Field>
            </div>
            <div className="flex flex-wrap gap-1.5">{[2, 3, 4, 6, 10, 12].map((k) => <button key={k} className="chip !min-h-8 text-xs" aria-pressed={+inst.n === k} onClick={() => setInst({ ...inst, n: String(k) })}>{k}×</button>)}</div>
            {preview && <p className="text-sm">
              <b className="num">{preview.length}× de {brl(preview.at(-1)!.amount)}</b>{preview[0].amount !== preview.at(-1)!.amount ? <span className="text-muted"> (1ª {brl(preview[0].amount)})</span> : null}
              <span className="text-muted"> · total <b className="num text-ink">{brl(preview.reduce((a, x) => a + x.amount, 0))}</b> · última em {monthLabel(preview.at(-1)!.date.slice(0, 7) + "-01")}</span></p>}
            <p className="text-[11px] text-faint">Uma linha por mês. A 1ª segue o “Pago/A pagar”; as outras ficam “A pagar”.</p>
          </>}
        </div>
      )}
      {!inst.on && <label className="flex items-center gap-3 min-h-11"><input type="checkbox" className="h-5 w-5 accent-[#3ee6c1]" checked={f.recurring} onChange={(e) => setF({ ...f, recurring: e.target.checked })} />
        <span>Repete todo mês <span className="text-faint text-sm">(entra automaticamente nos próximos meses)</span></span></label>}
      {err && <p className="text-sm text-[#ff6961]">{err}</p>}
      <Field label="Observação"><input className="field" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Opcional" /></Field>
      <div className="flex gap-2">
        {tx && <button className="btn text-muted" disabled={pending} onClick={() => { if (confirm(`Excluir “${tx.name}”?`)) start(async () => { await deleteRow("finance_items", tx.id); onDone(); }); }}>Excluir</button>}
        <button className="btn btn-accent flex-1" disabled={pending || !n(f.amount) || !f.name.trim()} onClick={save}>{pending ? "Salvando…" : tx ? "Salvar" : inst.on && preview ? `Lançar ${preview.length} parcelas` : "Adicionar"}</button>
      </div>
    </div>
  );
}

/* ───────── Resumo ───────── */
function Donut({ parts, size = 168 }: { parts: { key: string; label: string; value: number; color: string }[]; size?: number }) {
  const total = parts.reduce((a, p) => a + p.value, 0);
  const r = size / 2 - 14, c = 2 * Math.PI * r; let off = 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label="Gastos por categoria">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="18" />
        {total > 0 && parts.map((p) => { const len = (p.value / total) * c; const el = <circle key={p.key} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={p.color} strokeWidth="18" strokeDasharray={`${Math.max(0, len - 2)} ${c - len + 2}`} strokeDashoffset={-off} />; off += len; return el; })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center"><span><span className="label block">Gastos</span><span className="num text-lg">{brl(total)}</span></span></div>
    </div>
  );
}

export function Overview({ month, txs, prevTxs, history, cats, onAdd, onOpen }: {
  month: string; txs: Tx[]; prevTxs: Tx[]; history: { month: string; income: number; expense: number }[]; cats: FinCategory[]; onAdd: () => void; onOpen: (t: Tx) => void;
}) {
  const catOf = useCats(cats);
  const inc = txs.filter((t) => !isOut(t)).reduce((a, t) => a + t.amount, 0);
  const out = txs.filter(isOut).reduce((a, t) => a + t.amount, 0);
  const paidOut = txs.filter((t) => isOut(t) && t.paid).reduce((a, t) => a + t.amount, 0);
  const pendOut = out - paidOut, pendIn = txs.filter((t) => !isOut(t) && !t.paid).reduce((a, t) => a + t.amount, 0);
  const prevOut = prevTxs.filter(isOut).reduce((a, t) => a + t.amount, 0);
  const delta = prevOut ? (out - prevOut) / prevOut : null;
  const left = inc - out;
  const byCat = new Map<string, number>();
  for (const t of txs.filter(isOut)) byCat.set(t.category ?? "outros", (byCat.get(t.category ?? "outros") ?? 0) + t.amount);
  const parts = [...byCat].sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ key: k, label: catOf(k).label, value: v, color: catOf(k).color }));
  const fixed = txs.filter((t) => t.kind === "fixo").reduce((a, t) => a + t.amount, 0);
  const maxH = Math.max(1, ...history.flatMap((h) => [h.income, h.expense]));
  const upcoming = txs.filter((t) => !t.paid).sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "")).slice(0, 6);
  const biggest = txs.filter(isOut).sort((a, b) => b.amount - a.amount).slice(0, 5);

  return (
    <>
      <section className="glass rise p-5">
        <p className="label">Saldo do mês</p>
        <p className="num text-[44px] md:text-5xl mt-1 leading-none" style={{ color: left >= 0 ? "#f5f5f7" : OUT }}>{brl(left)}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-4 mt-4">
          <Stat label="Receitas" value={brl(inc)} color={IN} sub={pendIn ? `${brl(pendIn)} a receber` : "tudo recebido"} />
          <Stat label="Despesas" value={brl(out)} sub={delta == null ? "—" : `${delta > 0 ? "▲" : "▼"} ${Math.abs(Math.round(delta * 100))}% vs mês ant.`} />
          <Stat label="Poupança" value={`${inc ? Math.round((left / inc) * 100) : 0}%`} sub="da renda" />
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted mb-1"><span>Pago {brl(paidOut)}</span><span>A pagar {brl(pendOut)}</span></div>
          <div className="bar" style={{ height: 8 }}><i style={{ width: `${out ? (paidOut / out) * 100 : 0}%`, background: A }} /></div>
          <p className="text-xs text-muted mt-1.5">Custos fixos: {brl(fixed)} ({inc ? Math.round((fixed / inc) * 100) : 0}% da renda)</p>
        </div>
        <button className="btn btn-accent w-full mt-4" onClick={onAdd}>+ Novo lançamento</button>
      </section>

      <section className="glass rise p-5 mt-4">
        <SectionTitle>Para onde foi o dinheiro</SectionTitle>
        {parts.length === 0 ? <Empty>Nenhuma despesa neste mês.</Empty> : (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Donut parts={parts} />
            <ul className="flex-1 w-full grid gap-2">
              {parts.slice(0, 7).map((p) => (
                <li key={p.key} className="flex items-center gap-3 text-sm">
                  <i className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                  <span className="flex-1 truncate">{p.label}</span>
                  <span className="text-muted text-xs">{Math.round((p.value / out) * 100)}%</span>
                  <span className="num w-24 text-right">{brl(p.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="glass rise p-5 mt-4">
        <SectionTitle>Últimos 6 meses</SectionTitle>
        <div className="flex items-end gap-3 h-40">
          {history.map((h) => (
            <div key={h.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end" title={`Receitas ${brl(h.income)} · Despesas ${brl(h.expense)}`}>
              <div className="flex items-end gap-1 w-full h-full">
                <div className="flex-1 rounded-t-md" style={{ height: `${(h.income / maxH) * 100}%`, minHeight: 2, background: h.month === month ? IN : IN + "55" }} />
                <div className="flex-1 rounded-t-md" style={{ height: `${(h.expense / maxH) * 100}%`, minHeight: 2, background: h.month === month ? "#e5e5ea" : GREY + "55" }} />
              </div>
              <span className="text-[10px] text-muted capitalize">{monthLabel(h.month).slice(0, 3)}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 text-xs text-muted mt-2"><span><i className="inline-block h-2 w-2 rounded-full mr-1" style={{ background: IN }} />Receitas</span><span><i className="inline-block h-2 w-2 rounded-full mr-1" style={{ background: "#e5e5ea" }} />Despesas</span></div>
      </section>

      {upcoming.length > 0 && (
        <section className="glass rise p-5 mt-4">
          <SectionTitle>Pendentes</SectionTitle>
          <ul>{upcoming.map((t) => <TxRow key={t.id} t={t} catOf={catOf} onOpen={onOpen} />)}</ul>
        </section>
      )}
      {biggest.length > 0 && (
        <section className="glass rise p-5 mt-4">
          <SectionTitle>Maiores gastos</SectionTitle>
          <ul>{biggest.map((t) => <TxRow key={t.id} t={t} catOf={catOf} onOpen={onOpen} />)}</ul>
        </section>
      )}
    </>
  );
}

/* ───────── Lista de lançamentos ───────── */
function TxRow({ t, catOf, onOpen }: { t: Tx; catOf: ReturnType<typeof useCats>; onOpen: (t: Tx) => void }) {
  const [pending, start] = useTransition();
  const c = catOf(t.category);
  return (
    <li className="flex items-center gap-2">
      <button aria-label={t.paid ? "Marcar como pendente" : "Marcar como pago"} aria-pressed={t.paid} disabled={pending} onClick={() => start(() => setPaid(t.id, !t.paid))}
        className="h-10 w-10 shrink-0 grid place-items-center rounded-full border transition-colors" style={{ borderColor: t.paid ? c.color : "rgba(255,255,255,.18)", background: t.paid ? c.color + "33" : "transparent" }}>
        {t.paid ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.color} strokeWidth="3" aria-hidden><path d="M5 12l5 5L20 7" /></svg> : <i className="h-2 w-2 rounded-full" style={{ background: c.color }} />}
      </button>
      <button className="row-hover flex-1 min-w-0 flex items-center gap-3 min-h-14 px-2 text-left" onClick={() => onOpen(t)}>
        <span className="flex-1 min-w-0">
          <span className="block truncate">{t.name}</span>
          <span className="text-xs text-muted flex items-center gap-1.5 flex-wrap">{c.label}{t.recurring && <span className="tag !py-0">↻ mensal</span>}{!t.paid && <span className="tag !py-0" style={{ color: OUT }}>{isOut(t) ? "a pagar" : "a receber"}</span>}</span>
        </span>
        <span className="num text-right" style={{ color: isOut(t) ? undefined : IN }}>{isOut(t) ? "−" : "+"}{brl(t.amount)}</span>
      </button>
    </li>
  );
}

export function Transactions({ month, txs, cats, hasRecurringPrev, onAdd, onOpen }: { month: string; txs: Tx[]; cats: FinCategory[]; hasRecurringPrev: boolean; onAdd: () => void; onOpen: (t: Tx) => void }) {
  const catOf = useCats(cats);
  const [pending, start] = useTransition();
  const [filter, setFilter] = useState<"todos" | "receitas" | "despesas" | "pendentes">("todos");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const list = txs.filter((t) => (filter === "todos" || (filter === "receitas" ? !isOut(t) : filter === "despesas" ? isOut(t) : !t.paid))
    && (!cat || t.category === cat) && (!q || t.name.toLowerCase().includes(q.toLowerCase())));
  const groups = new Map<string, Tx[]>();
  for (const t of [...list].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))) { const d = t.date ?? month; groups.set(d, [...(groups.get(d) ?? []), t]); }
  const total = list.reduce((a, t) => a + (isOut(t) ? -t.amount : t.amount), 0);
  const hasRecurringNow = txs.some((t) => t.recurring);

  return (
    <>
      {hasRecurringPrev && !hasRecurringNow && (
        <section className="glass rise p-4 mb-4 flex items-center gap-3" style={{ borderColor: "rgba(217,196,154,.3)" }}>
          <p className="flex-1 text-sm">Trazer as contas recorrentes do mês anterior como pendentes?</p>
          <button className="btn btn-accent" disabled={pending} onClick={() => start(async () => { await generateRecurring(month); })}>Trazer</button>
        </section>
      )}
      <div className="grid gap-2">
        <input className="field" placeholder="Buscar lançamento…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {([["todos", "Todos"], ["despesas", "Despesas"], ["receitas", "Receitas"], ["pendentes", "Pendentes"]] as const).map(([k, l]) =>
            <button key={k} className="chip shrink-0" aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>)}
          <select className="field !min-h-9 !w-auto !rounded-full text-sm" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filtrar por categoria">
            <option value="">Todas as categorias</option>{cats.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>
      </div>
      <section className="glass rise p-4 mt-3">
        <div className="flex justify-between text-sm px-1 mb-2"><span className="text-muted">{list.length} lançamentos</span><span className="num" style={{ color: total >= 0 ? IN : undefined }}>{brl(total)}</span></div>
        {list.length === 0 ? <Empty>Nada por aqui. Registre seu primeiro lançamento.</Empty> : [...groups].map(([d, items]) => (
          <div key={d} className="mt-2">
            <p className="label px-1 py-1">{weekdayShort[dow(d)]}, {shortDate(d)}</p>
            <ul>{items.map((t) => <TxRow key={t.id} t={t} catOf={catOf} onOpen={onOpen} />)}</ul>
          </div>
        ))}
      </section>
      <button onClick={onAdd} aria-label="Novo lançamento"
        className="fixed right-5 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] md:bottom-8 md:right-8 z-30 h-14 w-14 rounded-full grid place-items-center text-3xl shadow-2xl"
        style={{ background: A, color: "#120f08" }}>+</button>
    </>
  );
}

/* ───────── Orçamento e categorias ───────── */
function CategoryEditor({ cats, onDone }: { cats: FinCategory[]; onDone: () => void }) {
  const [list, setList] = useState(cats);
  const [pending, start] = useTransition();
  const upd = (i: number, p: Partial<FinCategory>) => setList(list.map((c, j) => (j === i ? { ...c, ...p } : c)));
  return (
    <div className="grid gap-4">
      {(["receita", "fixo", "variavel"] as const).map((kind) => (
        <div key={kind}>
          <p className="label mb-2">{kind === "receita" ? "Receitas" : kind === "fixo" ? "Custos fixos" : "Custos variáveis"}</p>
          <div className="grid gap-2">
            {list.map((c, i) => c.kind !== kind ? null : (
              <div key={c.key} className="flex items-center gap-1.5">
                <label className="h-11 w-11 shrink-0 rounded-xl border border-white/10 grid place-items-center cursor-pointer" style={{ background: c.color }} title="Cor">
                  <input type="color" className="sr-only" value={c.color} onChange={(e) => upd(i, { color: e.target.value })} aria-label={`Cor de ${c.label}`} /></label>
                <input className="field flex-1 !min-h-11" value={c.label} onChange={(e) => upd(i, { label: e.target.value })} aria-label="Nome" />
                <select className="field !w-24 !min-h-11 !px-2 text-sm" value={c.kind} onChange={(e) => upd(i, { kind: e.target.value as FinCategory["kind"] })} aria-label="Tipo">
                  <option value="receita">Receita</option><option value="fixo">Fixo</option><option value="variavel">Variável</option></select>
                <button className="btn !px-3 text-muted" onClick={() => setList(list.filter((_, j) => j !== i))} aria-label="Remover">✕</button>
              </div>
            ))}
            <button className="btn text-sm" onClick={() => { const label = `Nova ${kind === "receita" ? "receita" : "categoria"}`; let k = slug(label); while (list.some((x) => x.key === k)) k += "_";
              setList([...list, { key: k, label, kind, color: COLORS[list.length % COLORS.length], budget: 0 }]); }}>+ Categoria</button>
          </div>
        </div>
      ))}
      <button className="btn btn-accent" disabled={pending} onClick={() => start(async () => { await updateSettings({ finance_categories: list }); onDone(); })}>{pending ? "Salvando…" : "Salvar categorias"}</button>
    </div>
  );
}

export function Budget({ txs, cats }: { txs: Tx[]; cats: FinCategory[] }) {
  const [pending, start] = useTransition();
  const [edit, setEdit] = useState(false);
  const [budgets, setBudgets] = useState<Record<string, string>>(() => Object.fromEntries(cats.map((c) => [c.key, c.budget ? String(c.budget) : ""])));
  const outCats = cats.filter((c) => c.kind !== "receita");
  const spent = (k: string) => txs.filter((t) => isOut(t) && t.category === k).reduce((a, t) => a + t.amount, 0);
  const totalB = outCats.reduce((a, c) => a + c.budget, 0), totalS = outCats.reduce((a, c) => a + spent(c.key), 0);
  return (
    <>
      <section className="glass rise p-5">
        <SectionTitle action={<LinkBtn onClick={() => setEdit(true)}>Categorias</LinkBtn>}>Orçamento do mês</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Planejado" value={brl(totalB)} />
          <Stat label="Gasto" value={brl(totalS)} color={totalS > totalB && totalB ? OUT : undefined} />
          <Stat label="Disponível" value={brl(totalB - totalS)} color={A} />
        </div>
        <div className="mt-4"><Progress value={totalB ? totalS / totalB : 0} color={totalS > totalB ? OUT : A} /></div>
      </section>
      <section className="glass rise p-5 mt-4">
        <p className="text-xs text-muted mb-3">Defina um limite por categoria. Deixe em branco para não acompanhar.</p>
        <ul className="grid gap-4">
          {outCats.map((c) => {
            const s = spent(c.key), b = n(budgets[c.key] ?? ""), over = b > 0 && s > b;
            return (
              <li key={c.key}>
                <div className="flex items-center gap-2">
                  <i className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                  <span className="flex-1 text-sm">{c.label}</span>
                  <span className="num text-sm" style={{ color: over ? OUT : undefined }}>{brl(s)}</span>
                  <span className="text-faint text-sm">/</span>
                  <input className="field !min-h-9 !w-24 text-right num text-sm !px-2" inputMode="decimal" placeholder="limite" value={budgets[c.key] ?? ""}
                    onChange={(e) => setBudgets({ ...budgets, [c.key]: e.target.value })} aria-label={`Limite de ${c.label}`} />
                </div>
                {b > 0 && <div className="mt-1.5"><Progress value={s / b} color={over ? OUT : c.color} height={5} />
                  <p className="text-[11px] mt-1" style={{ color: over ? OUT : "#9a978f" }}>{over ? `Estourou ${brl(s - b)}` : `Restam ${brl(b - s)}`}</p></div>}
              </li>
            );
          })}
        </ul>
        <button className="btn btn-accent w-full mt-5" disabled={pending}
          onClick={() => start(() => updateSettings({ finance_categories: cats.map((c) => ({ ...c, budget: n(budgets[c.key] ?? "") })) }))}>{pending ? "Salvando…" : "Salvar limites"}</button>
      </section>
      <Sheet accent={A} open={edit} onClose={() => setEdit(false)} title="Categorias"><CategoryEditor cats={cats} onDone={() => setEdit(false)} /></Sheet>
    </>
  );
}

/* ───────── Contêiner com o painel de lançamento ───────── */
export function MoneyShell({ view, month, txs, prevTxs, history, cats, hasRecurringPrev, installments = [] }: {
  view: "resumo" | "lancamentos"; month: string; txs: Tx[]; prevTxs: Tx[]; history: { month: string; income: number; expense: number }[]; cats: FinCategory[]; hasRecurringPrev: boolean; installments?: InstGroup[];
}) {
  const [sheet, setSheet] = useState<null | "new" | Tx>(null);
  const close = () => setSheet(null);
  return (
    <div style={{ ["--accent" as string]: A }}>
      {view === "resumo"
        ? <Overview month={month} txs={txs} prevTxs={prevTxs} history={history} cats={cats} onAdd={() => setSheet("new")} onOpen={setSheet} />
        : <Transactions month={month} txs={txs} cats={cats} hasRecurringPrev={hasRecurringPrev} onAdd={() => setSheet("new")} onOpen={setSheet} />}
      {installments.length > 0 && (
        <section className="glass rise p-5 mt-4">
          <div className="flex items-baseline justify-between"><SectionTitle>💳 Parcelas em aberto</SectionTitle>
            <span className="num text-sm" style={{ color: OUT }}>{brl(installments.reduce((a, g) => a + g.left, 0))}</span></div>
          <ul className="grid gap-3 mt-1">
            {installments.map((g) => (
              <li key={g.id}>
                <div className="flex items-baseline justify-between gap-3"><span className="font-medium truncate">{g.name}</span><span className="num text-sm shrink-0">{brl(g.left)} <span className="text-muted text-xs">de {brl(g.total)}</span></span></div>
                <div className="flex gap-0.5 mt-1.5">{Array.from({ length: g.n }, (_, i) => <i key={i} className="h-1.5 flex-1 rounded-full" style={{ background: i < g.paidN ? A : "rgba(255,255,255,.1)" }} />)}</div>
                <p className="text-[11px] text-muted mt-1">{g.paidN}/{g.n} pagas{g.next ? ` · próxima ${shortDate(g.next)}` : ""} · termina {monthLabel(g.last.slice(0, 7) + "-01")}</p>
              </li>))}
          </ul>
        </section>
      )}
      <Sheet accent={A} open={!!sheet} onClose={close} title={sheet === "new" ? "Novo lançamento" : "Editar lançamento"}>
        {sheet && <TxForm key={sheet === "new" ? "new" : sheet.id} tx={sheet === "new" ? undefined : sheet} month={month} cats={cats} onDone={close} />}
      </Sheet>
    </div>
  );
}
