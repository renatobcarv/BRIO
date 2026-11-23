"use client";
import { useState, useTransition } from "react";
import { importStatement } from "@/app/(app)/financas/actions";
import { parseStatement, type BankRow } from "@/lib/bank-import";
import { Sheet } from "@/components/kit";
import { brl } from "@/lib/date";
import type { FinCategory } from "@/lib/settings";

const A = "#ffb21e";

/** Importar extrato (OFX/CSV exportado pelo app do banco): revisa, ajusta categoria e salva. */
export function ImportStatement({ cats }: { cats: FinCategory[] }) {
  const [open, setOpen] = useState(false), [rows, setRows] = useState<(BankRow & { on: boolean })[]>([]);
  const [msg, setMsg] = useState(""), [pending, start] = useTransition();
  const read = async (f: File | undefined) => {
    if (!f) return;
    const r = parseStatement(f.name, await f.text());
    setRows(r.map((x) => ({ ...x, on: true })));
    setMsg(r.length ? "" : "Não encontrei lançamentos. Use o arquivo OFX ou CSV exportado pelo app do banco.");
  };
  const sel = rows.filter((r) => r.on);
  const save = () => start(async () => {
    try { const n = await importStatement(sel.map(({ on: _on, ...r }) => r)); setMsg(n ? `${n} lançamentos importados.` : "Tudo já estava no BRIO, nada novo."); setRows([]); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Erro ao importar."); }
  });
  return (
    <>
      <button className="btn w-full mt-2" onClick={() => setOpen(true)}>⇪ Importar extrato do banco</button>
      <Sheet accent={A} open={open} onClose={() => { setOpen(false); setRows([]); setMsg(""); }} title="Importar extrato">
        {!rows.length ? (
          <div className="grid gap-3">
            <p className="text-sm text-white/65">De graça e sem senha do banco: no app do banco, exporte o extrato em <b>OFX</b> (ou CSV) e escolha o arquivo aqui. O BRIO separa receitas e gastos e sugere a categoria.</p>
            <label className="btn btn-accent w-full cursor-pointer">Escolher arquivo<input type="file" accept=".ofx,.csv,.txt,text/csv" className="sr-only" onChange={(e) => read(e.target.files?.[0])} /></label>
            <p className="text-[12px] text-white/45">Nubank: Extrato › Exportar (CSV). Itaú, Bradesco, BB, Caixa, Inter: extrato no internet banking › salvar em OFX/Money.</p>
            {msg && <p className="text-sm" style={{ color: A }}>{msg}</p>}
          </div>
        ) : (
          <div className="grid gap-3">
            <p className="text-sm text-white/65">{sel.length} de {rows.length} selecionados · entradas {brl(sel.filter((r) => r.amount > 0).reduce((a, r) => a + r.amount, 0))} · saídas {brl(-sel.filter((r) => r.amount < 0).reduce((a, r) => a + r.amount, 0))}</p>
            <ul className="max-h-[50vh] overflow-y-auto divide-y divide-white/[.06]">
              {rows.map((r, i) => (
                <li key={i} className="flex items-center gap-2 py-2 text-[13px]">
                  <input type="checkbox" checked={r.on} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, on: e.target.checked } : x))} aria-label={`Importar ${r.name}`} />
                  <span className="font-mono text-[11px] text-white/40 w-10">{r.date.slice(8)}/{r.date.slice(5, 7)}</span>
                  <span className="flex-1 min-w-0 truncate">{r.name}</span>
                  <select className="bg-white/[.06] rounded-md text-[12px] px-1 py-1 max-w-[110px]" value={r.category}
                    onChange={(e) => { const c = cats.find((x) => x.key === e.target.value); setRows(rows.map((x, j) => j === i ? { ...x, category: e.target.value, kind: c?.kind ?? x.kind } : x)); }}>
                    {cats.filter((c) => (r.amount > 0) === (c.kind === "receita")).map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                  <span className="w-20 text-right" style={{ color: r.amount > 0 ? "#30d158" : undefined }}>{brl(r.amount)}</span>
                </li>))}
            </ul>
            <button className="btn btn-accent w-full" disabled={pending || !sel.length} onClick={save}>{pending ? "Importando…" : `Importar ${sel.length} lançamentos`}</button>
            <button className="btn w-full" onClick={() => setRows([])}>Escolher outro arquivo</button>
            {msg && <p className="text-sm" style={{ color: A }}>{msg}</p>}
          </div>
        )}
      </Sheet>
    </>
  );
}
