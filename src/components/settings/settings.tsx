"use client";
import { useRef, useState, useTransition } from "react";
import { importBackup, saveChecklist, saveDefaults, savePartner, saveSplit } from "@/app/(app)/configuracoes/actions";
import { Card } from "@/components/ui";
import { fromHMM, toHMM, weekdayShort } from "@/lib/date";
import type { ChecklistItem, Settings, SplitDay } from "@/lib/settings";

const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").slice(0, 40) || "item";

function Saved({ ok }: { ok: boolean }) { return ok ? <span className="text-sm" style={{ color: "#8ac295" }}>Salvo ✓</span> : null; }

export function ChecklistEditor({ initial }: { initial: ChecklistItem[] }) {
  const [items, setItems] = useState(initial);
  const [label, setLabel] = useState("");
  const [pending, start] = useTransition();
  const [ok, setOk] = useState(false);
  const move = (i: number, d: number) => { const n = [...items]; [n[i], n[i + d]] = [n[i + d], n[i]]; setItems(n); setOk(false); };
  const add = () => {
    if (!label.trim()) return;
    let key = slug(label); while (items.some((i) => i.key === key)) key += "_";
    setItems([...items, { key, label: label.trim() }]); setLabel(""); setOk(false);
  };
  return (
    <Card>
      <p className="label mb-3">Checklist diário</p>
      <ul className="grid gap-1">
        {items.map((it, i) => (
          <li key={it.key} className="flex items-center gap-1">
            <input className="field flex-1 !min-h-11" value={it.label} aria-label="Item"
              onChange={(e) => { setItems(items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x))); setOk(false); }} />
            <button className="btn !px-3" aria-label="Subir" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
            <button className="btn !px-3" aria-label="Descer" disabled={i === items.length - 1} onClick={() => move(i, 1)}>↓</button>
            <button className="btn !px-3" aria-label="Destacar como primeiro item" aria-pressed={!!it.primary} title="Jeová em primeiro lugar"
              style={it.primary ? { color: "#e0ac53", borderColor: "#e0ac53" } : undefined}
              onClick={() => { setItems(items.map((x, j) => ({ ...x, primary: j === i }))); setOk(false); }}>★</button>
            <button className="btn !px-3 text-muted" aria-label="Remover" disabled={items.length === 1}
              onClick={() => { setItems(items.filter((_, j) => j !== i)); setOk(false); }}>×</button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2 mt-2">
        <input className="field flex-1" placeholder="Novo item" value={label} onChange={(e) => setLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <button className="btn" onClick={add}>Adicionar</button>
      </div>
      <p className="text-xs text-muted mt-2">★ marca o item do cartão “Jeová em primeiro lugar”.</p>
      <div className="flex items-center gap-3 mt-3"><button className="btn btn-accent" disabled={pending}
        onClick={() => start(async () => { await saveChecklist(items); setOk(true); })}>Salvar checklist</button><Saved ok={ok} /></div>
    </Card>
  );
}

export function DefaultsEditor({ s }: { s: Settings }) {
  const [pending, start] = useTransition();
  const [ok, setOk] = useState(false);
  const [f, setF] = useState({
    pioneer: toHMM(s.pioneer_goal_minutes), water: String(s.water_goal_ml), kcal: String(s.kcal_goal), protein: String(s.protein_goal_g),
    wstart: String(s.weight_start_kg).replace(".", ","), wgoal: String(s.weight_goal_kg).replace(".", ","), rate: String(s.weight_rate_kg_week).replace(".", ","),
  });
  const n = (v: string) => Number(v.replace(",", ".")) || 0;
  const field = (k: keyof typeof f, label: string) => (
    <label className="grid gap-1"><span className="label">{label}</span>
      <input className="field num" inputMode="decimal" value={f[k]} onChange={(e) => { setF({ ...f, [k]: e.target.value }); setOk(false); }} /></label>
  );
  return (
    <Card className="mt-4">
      <p className="label mb-3">Metas padrão</p>
      <div className="grid grid-cols-2 gap-3">
        {field("pioneer", "Pioneiro (h:mm/mês)")}{field("water", "Água (ml/dia)")}
        {field("kcal", "Calorias (kcal)")}{field("protein", "Proteína (g)")}
        {field("wstart", "Peso inicial (kg)")}{field("wgoal", "Peso-alvo (kg)")}{field("rate", "Ritmo (kg/semana)")}
      </div>
      <p className="text-xs text-muted mt-2">Sugestão de água: 35 ml × peso = {Math.round(35 * n(f.wstart))} ml.</p>
      <div className="flex items-center gap-3 mt-3"><button className="btn btn-accent" disabled={pending} onClick={() => start(async () => {
        await saveDefaults({ pioneer_goal_minutes: fromHMM(f.pioneer), water_goal_ml: Math.round(n(f.water)), kcal_goal: Math.round(n(f.kcal)),
          protein_goal_g: Math.round(n(f.protein)), weight_start_kg: n(f.wstart), weight_goal_kg: n(f.wgoal), weight_rate_kg_week: n(f.rate) });
        setOk(true);
      })}>Salvar metas</button><Saved ok={ok} /></div>
    </Card>
  );
}

export function SplitEditor({ initial }: { initial: SplitDay[] }) {
  const [pending, start] = useTransition();
  const [ok, setOk] = useState(false);
  const [days, setDays] = useState(() => [1, 2, 3, 4, 5, 6, 0].map((d) => initial.find((x) => x.dow === d) ?? { dow: d, label: "Off", focus: "" }));
  const upd = (i: number, p: Partial<SplitDay>) => { setDays(days.map((d, j) => (j === i ? { ...d, ...p } : d))); setOk(false); };
  return (
    <Card className="mt-4">
      <p className="label mb-3">Divisão de treino</p>
      <div className="grid gap-2">
        {days.map((d, i) => (
          <div key={d.dow} className="grid grid-cols-[2.5rem_4.5rem_1fr] gap-2 items-center">
            <span className="label">{weekdayShort[d.dow]}</span>
            <input className="field !px-2 text-center" value={d.label} onChange={(e) => upd(i, { label: e.target.value })} aria-label="Rótulo" />
            <input className="field" value={d.focus} onChange={(e) => upd(i, { focus: e.target.value })} aria-label="Foco" />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-3"><button className="btn btn-accent" disabled={pending}
        onClick={() => start(async () => { await saveSplit(days); setOk(true); })}>Salvar divisão</button><Saved ok={ok} /></div>
    </Card>
  );
}

export function PartnerEditor({ phrase, photo }: { phrase: string; photo: string | null }) {
  const [pending, start] = useTransition();
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");
  const [preview, setPreview] = useState(photo);
  return (
    <Card className="mt-4">
      <p className="label mb-3">Maria Luisa</p>
      <form action={(fd) => start(async () => { setErr(""); try { await savePartner(fd); setOk(true); } catch (e) { setErr((e as Error).message); } })} className="grid gap-3">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview ? <img src={preview} alt="Maria Luisa" className="h-20 w-20 rounded-2xl object-cover" /> : <span className="h-20 w-20 rounded-2xl bg-white/5 grid place-items-center text-muted text-xs">sem foto</span>}
          <label className="btn cursor-pointer">Escolher foto
            <input type="file" name="photo" accept="image/*" className="sr-only"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) setPreview(URL.createObjectURL(f)); setOk(false); }} /></label>
        </div>
        <textarea name="phrase" className="field font-display italic" defaultValue={phrase} placeholder="Uma frase dela" onChange={() => setOk(false)} />
        {err && <p role="alert" className="text-sm text-[#e8a39a]">{err}</p>}
        <div className="flex items-center gap-3"><button className="btn btn-accent" disabled={pending}>{pending ? "Salvando…" : "Salvar"}</button><Saved ok={ok} /></div>
      </form>
    </Card>
  );
}

export function Backup() {
  const [pending, start] = useTransition();
  const [report, setReport] = useState<string[] | null>(null);
  const [err, setErr] = useState("");
  const input = useRef<HTMLInputElement>(null);
  return (
    <Card className="mt-4">
      <p className="label mb-3">Backup</p>
      <div className="grid grid-cols-2 gap-2">
        <a className="btn" href="/api/export" download>Exportar JSON</a>
        <button className="btn" disabled={pending} onClick={() => input.current?.click()}>Importar JSON</button>
      </div>
      <input ref={input} type="file" accept="application/json,.json" className="sr-only" onChange={async (e) => {
        const f = e.target.files?.[0]; if (!f) return; setErr(""); setReport(null);
        const text = await f.text();
        if (!confirm("Importar este backup? Registros com o mesmo id serão atualizados; nada será apagado.")) return;
        start(async () => { try { setReport(await importBackup(text)); } catch { setErr("Arquivo inválido. Use um backup exportado pelo Brio."); } });
        e.target.value = "";
      }} />
      {err && <p role="alert" className="text-sm text-[#e8a39a] mt-2">{err}</p>}
      {report && <ul className="text-xs text-muted mt-3 grid gap-0.5">{report.map((r) => <li key={r}>{r}</li>)}</ul>}
    </Card>
  );
}
