"use client";
import { Jar } from "@/components/meters";
import { useState, useTransition } from "react";
import { copyPrevMonth, deleteRow, depositBox, saveRow } from "@/app/(app)/financas/actions";
import { Card, Empty } from "@/components/ui";
import { brl, monthLabel } from "@/lib/date";

const ACC = "#3ee6c1";
type Row = { id: string; name: string; amount: number; kind?: string };
const parseMoney = (s: string) => Number(s.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".")) || 0;
const fmtIn = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Linha editável nome + valor; salva ao sair do campo. */
function MoneyRow({ row, table, extra }: { row: Row; table: "finance_items" | "net_worth_items" | "investments"; extra?: React.ReactNode }) {
  const [, start] = useTransition();
  const [name, setName] = useState(row.name);
  const [amt, setAmt] = useState(fmtIn(row.amount));
  return (
    <li className="flex items-center gap-2 py-1">
      <input className="field flex-1 !min-h-11" value={name} onChange={(e) => setName(e.target.value)} aria-label="Nome"
        onBlur={() => name !== row.name && start(() => saveRow(table, { name }, row.id))} />
      <input className="field !w-32 text-right num" inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value)} aria-label="Valor"
        onBlur={() => { const v = parseMoney(amt); setAmt(fmtIn(v)); if (v !== row.amount) start(() => saveRow(table, { amount: v }, row.id)); }} />
      {extra}
      <button className="btn !px-3 text-muted" aria-label="Excluir" onClick={() => { if (confirm(`Excluir “${row.name}”?`)) start(() => deleteRow(table, row.id)); }}>×</button>
    </li>
  );
}

function Donut({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  const total = parts.reduce((a, p) => a + Math.max(0, p.value), 0) || 1;
  const r = 52, c = 2 * Math.PI * r; let off = 0;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90" role="img" aria-label="Distribuição">
      <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="16" />
      {parts.map((p) => {
        const len = (Math.max(0, p.value) / total) * c;
        const el = <circle key={p.label} cx="70" cy="70" r={r} fill="none" stroke={p.color} strokeWidth="16" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-off} />;
        off += len; return el;
      })}
    </svg>
  );
}

export function Flow({ month, items }: { month: string; items: Row[] }) {
  const [pending, start] = useTransition();
  const sum = (k: string) => items.filter((i) => i.kind === k).reduce((a, i) => a + i.amount, 0);
  const inc = sum("receita"), fix = sum("fixo"), varr = sum("variavel"), left = inc - fix - varr;
  const groups = [["receita", "Receitas", "#30d158"], ["fixo", "Custos fixos", "#0a84ff"], ["variavel", "Custos variáveis", "#bf5af2"]] as const;
  return (
    <>
      <Card>
        <div className="flex items-center gap-6 flex-wrap">
          <Donut parts={[{ label: "Fixos", value: fix, color: "#0a84ff" }, { label: "Variáveis", value: varr, color: "#bf5af2" }, { label: "Sobra", value: left, color: ACC }]} />
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 flex-1 min-w-48">
            <div><dt className="label">Receitas</dt><dd className="num text-xl">{brl(inc)}</dd></div>
            <div><dt className="label">Custos</dt><dd className="num text-xl">{brl(fix + varr)}</dd></div>
            <div><dt className="label">Sobra</dt><dd className="num text-2xl" style={{ color: left >= 0 ? ACC : "#ff453a" }}>{brl(left)}</dd></div>
            <div><dt className="label">Poupança</dt><dd className="num text-2xl">{inc ? Math.round((left / inc) * 100) : 0}%</dd></div>
          </dl>
        </div>
      </Card>
      {items.length === 0 && (
        <Card className="mt-4"><Empty>Mês em branco. Quer partir do anterior?</Empty>
          <button className="btn w-full" disabled={pending} onClick={() => start(() => copyPrevMonth("finance_items", month))}>Copiar linhas do mês anterior</button></Card>
      )}
      {groups.map(([k, label, color]) => (
        <Card key={k} className="mt-4">
          <div className="flex justify-between items-baseline mb-2"><p className="label" style={{ color }}>{label}</p><p className="num">{brl(sum(k))}</p></div>
          <ul>{items.filter((i) => i.kind === k).map((r) => <MoneyRow key={r.id} row={r} table="finance_items" />)}</ul>
          <button className="btn w-full mt-2" disabled={pending}
            onClick={() => start(() => saveRow("finance_items", { month, kind: k, name: "Nova linha", amount: 0 }))}>+ Adicionar</button>
        </Card>
      ))}
    </>
  );
}

export function Investments({ items }: { items: (Row & { rate_aa: number })[] }) {
  const [pending, start] = useTransition();
  const total = items.reduce((a, i) => a + i.amount, 0);
  const proj = (m: number) => items.reduce((a, i) => a + i.amount * Math.pow(1 + i.rate_aa / 100, m / 12), 0);
  const series = Array.from({ length: 13 }, (_, m) => proj(m)), max = Math.max(...series, 1);
  return (
    <>
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <div><p className="label">Hoje</p><p className="num text-2xl">{brl(total)}</p></div>
          <div><p className="label">Em 12 meses</p><p className="num text-2xl" style={{ color: ACC }}>{brl(series[12])}</p></div>
        </div>
        <div className="flex items-end gap-1 h-24 mt-4">
          {series.map((v, i) => <div key={i} className="flex-1 rounded-sm" style={{ height: `${(v / max) * 100}%`, background: i === 12 ? ACC : ACC + "44" }} />)}
        </div>
      </Card>
      <Card className="mt-4">
        <div className="flex justify-between label mb-1"><span>Ativo</span><span className="mr-24">Valor · % a.a.</span></div>
        {items.length === 0 ? <Empty>Nenhum investimento cadastrado.</Empty> :
          <ul>{items.map((r) => <MoneyRow key={r.id} row={r} table="investments" extra={<RateInput id={r.id} rate={r.rate_aa} />} />)}</ul>}
        <button className="btn w-full mt-2" disabled={pending} onClick={() => start(() => saveRow("investments", { name: "Novo ativo", amount: 0, rate_aa: 10 }))}>+ Adicionar</button>
      </Card>
    </>
  );
}
function RateInput({ id, rate }: { id: string; rate: number }) {
  const [, start] = useTransition();
  const [v, setV] = useState(String(rate).replace(".", ","));
  return <input className="field !w-16 text-center num !px-1" inputMode="decimal" value={v} aria-label="Rentabilidade % a.a." onChange={(e) => setV(e.target.value)}
    onBlur={() => start(() => saveRow("investments", { rate_aa: Number(v.replace(",", ".")) || 0 }, id))} />;
}

type Box = { id: string; name: string; target: number; monthly: number; saved: number; color: string | null };
export function Boxes({ items }: { items: Box[] }) {
  const [pending, start] = useTransition();
  const [edit, setEdit] = useState<string | null>(null);
  return (
    <>
      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((b) => {
          const left = Math.max(0, b.target - b.saved), months = b.monthly > 0 ? Math.ceil(left / b.monthly) : null, color = b.color || ACC;
          return (
            <Card key={b.id}>
              {edit === b.id ? <BoxForm box={b} onDone={() => setEdit(null)} /> : (
                <button className="w-full text-left flex items-center gap-4" onClick={() => setEdit(b.id)}>
                  <span className="relative shrink-0"><Jar pct={b.target ? b.saved / b.target : 0} size={70} color={color} /><span className="absolute inset-x-0 bottom-3 text-center num text-xs font-semibold text-black/80">{b.target ? Math.round((b.saved / b.target) * 100) : 0}%</span></span>
                  <span className="flex-1">
                    <span className="font-display text-xl block">{b.name}</span>
                    <span className="num block">{brl(b.saved)} <span className="text-muted text-sm">/ {brl(b.target)}</span></span>
                    <span className="text-xs text-muted">{brl(b.monthly)}/mês · {left === 0 ? "concluída" : months ? `${months} ${months === 1 ? "mês" : "meses"} restantes` : "sem aporte"}</span>
                  </span>
                </button>
              )}
              {edit !== b.id && <Deposit id={b.id} monthly={b.monthly} />}
            </Card>
          );
        })}
      </div>
      {items.length === 0 && <Card><Empty>Uma caixinha é um propósito com nome.</Empty></Card>}
      <button className="btn w-full mt-4" disabled={pending}
        onClick={() => start(() => saveRow("savings_boxes", { name: "Nova caixinha", target: 1000, monthly: 100, saved: 0, color: ACC }))}>+ Nova caixinha</button>
    </>
  );
}
function BoxForm({ box, onDone }: { box: Box; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [f, setF] = useState({ name: box.name, target: fmtIn(box.target), monthly: fmtIn(box.monthly), saved: fmtIn(box.saved), color: box.color || ACC });
  const fld = (k: "target" | "monthly" | "saved", label: string) => (
    <label className="grid gap-1"><span className="label">{label}</span>
      <input className="field num" inputMode="decimal" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></label>
  );
  return (
    <div className="grid gap-2">
      <input className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} aria-label="Objetivo" />
      <div className="grid grid-cols-3 gap-2">{fld("target", "Total")}{fld("monthly", "Aporte/mês")}{fld("saved", "Acumulado")}</div>
      <div className="flex gap-2 items-center">
        {[ACC, "#ffb340", "#0a84ff", "#30d158", "#bf5af2"].map((c) => <button key={c} aria-label={`Cor ${c}`} aria-pressed={f.color === c} onClick={() => setF({ ...f, color: c })}
          className="h-9 w-9 rounded-full border-2" style={{ background: c, borderColor: f.color === c ? "#fff" : "transparent" }} />)}
      </div>
      <div className="flex gap-2 justify-end mt-1">
        <button className="btn text-muted" onClick={() => { if (confirm("Excluir caixinha?")) start(async () => { await deleteRow("savings_boxes", box.id); onDone(); }); }}>Excluir</button>
        <button className="btn" onClick={onDone}>Cancelar</button>
        <button className="btn btn-accent" disabled={pending} onClick={() => start(async () => {
          await saveRow("savings_boxes", { name: f.name, target: parseMoney(f.target), monthly: parseMoney(f.monthly), saved: parseMoney(f.saved), color: f.color }, box.id); onDone();
        })}>Salvar</button>
      </div>
    </div>
  );
}

export function NetWorth({ month, items, history }: { month: string; items: Row[]; history: { month: string; value: number }[] }) {
  const [pending, start] = useTransition();
  const sum = (k: string) => items.filter((i) => i.kind === k).reduce((a, i) => a + i.amount, 0);
  const net = sum("ativo") - sum("passivo");
  const vals = history.map((h) => h.value), min = Math.min(0, ...vals), max = Math.max(1, ...vals);
  const W = 600, H = 160, P = 16;
  const x = (i: number) => P + (history.length > 1 ? (i / (history.length - 1)) * (W - 2 * P) : (W - 2 * P) / 2);
  const y = (v: number) => P + ((max - v) / (max - min || 1)) * (H - 2 * P);
  return (
    <>
      <Card>
        <div className="grid grid-cols-3 gap-3">
          <div><p className="label">Ativos</p><p className="num text-lg">{brl(sum("ativo"))}</p></div>
          <div><p className="label">Passivos</p><p className="num text-lg">{brl(sum("passivo"))}</p></div>
          <div><p className="label">Patrimônio</p><p className="num text-xl" style={{ color: ACC }}>{brl(net)}</p></div>
        </div>
        {history.length > 1 && (
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full mt-4" role="img" aria-label="Evolução do patrimônio">
            <path d={history.map((h, i) => `${i ? "L" : "M"}${x(i)},${y(h.value)}`).join(" ")} fill="none" stroke={ACC} strokeWidth="2.5" />
            {history.map((h, i) => <g key={h.month}><circle cx={x(i)} cy={y(h.value)} r="3.5" fill="#07080b" stroke={ACC} strokeWidth="2" />
              <text x={x(i)} y={H - 2} fill="#9a978f" fontSize="11" textAnchor="middle">{monthLabel(h.month).slice(0, 3)}</text></g>)}
          </svg>
        )}
      </Card>
      {items.length === 0 && (
        <Card className="mt-4"><Empty>Nenhum item neste mês.</Empty>
          <button className="btn w-full" disabled={pending} onClick={() => start(() => copyPrevMonth("net_worth_items", month))}>Copiar do mês anterior</button></Card>
      )}
      {([["ativo", "Ativos", "#30d158"], ["passivo", "Passivos", "#ff453a"]] as const).map(([k, label, color]) => (
        <Card key={k} className="mt-4">
          <div className="flex justify-between mb-2"><p className="label" style={{ color }}>{label}</p><p className="num">{brl(sum(k))}</p></div>
          <ul>{items.filter((i) => i.kind === k).map((r) => <MoneyRow key={r.id} row={r} table="net_worth_items" />)}</ul>
          <button className="btn w-full mt-2" disabled={pending} onClick={() => start(() => saveRow("net_worth_items", { month, kind: k, name: "Novo item", amount: 0 }))}>+ Adicionar</button>
        </Card>
      ))}
    </>
  );
}

function Deposit({ id, monthly }: { id: string; monthly: number }) {
  const [pending, start] = useTransition();
  const [v, setV] = useState("");
  return (
    <div className="flex gap-2 mt-4">
      <input className="field !min-h-10 num" inputMode="decimal" placeholder={`Aporte (ex.: ${fmtIn(monthly)})`} value={v} onChange={(e) => setV(e.target.value)} aria-label="Valor do aporte" />
      <button className="btn !min-h-10" disabled={pending || !parseMoney(v)} onClick={() => start(async () => { await depositBox(id, parseMoney(v)); setV(""); })}>Aportar</button>
      <button className="btn !min-h-10 text-muted" disabled={pending || !monthly} title="Aportar o valor mensal" onClick={() => start(() => depositBox(id, monthly))}>+{fmtIn(monthly)}</button>
    </div>
  );
}
