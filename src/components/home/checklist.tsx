"use client";
import { useOptimistic, useState, useTransition } from "react";
import { toggleCheck } from "@/app/(app)/home-actions";
import { updateSettings } from "@/app/settings-actions";
import { Ring } from "@/components/ui";
import { LinkBtn, Sheet } from "@/components/kit";
import type { ChecklistItem } from "@/lib/settings";

const GOLD = "#e0ac53";
const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").slice(0, 40) || "item";
const Check = ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#120f08" strokeWidth="3" aria-hidden><path d="M5 12l5 5L20 7" /></svg>;

function Editor({ items, onClose }: { items: ChecklistItem[]; onClose: () => void }) {
  const [list, setList] = useState(items);
  const [label, setLabel] = useState("");
  const [pending, start] = useTransition();
  const move = (i: number, d: number) => { const n = [...list]; [n[i], n[i + d]] = [n[i + d], n[i]]; setList(n); };
  const add = () => {
    if (!label.trim()) return;
    let key = slug(label); while (list.some((x) => x.key === key)) key += "_";
    setList([...list, { key, label: label.trim() }]); setLabel("");
  };
  return (
    <div className="grid gap-3">
      <ul className="grid gap-1.5">
        {list.map((it, i) => (
          <li key={it.key} className="flex items-center gap-1">
            <input className="field flex-1 !min-h-11" value={it.label} aria-label="Item" onChange={(e) => setList(list.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
            <button className="btn !px-3" aria-label="Subir" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
            <button className="btn !px-3" aria-label="Descer" disabled={i === list.length - 1} onClick={() => move(i, 1)}>↓</button>
            <button className="btn !px-3" aria-label="Marcar como prioridade" aria-pressed={!!it.primary} title="Prioridade do dia"
              style={it.primary ? { color: GOLD, borderColor: GOLD } : undefined} onClick={() => setList(list.map((x, j) => ({ ...x, primary: j === i })))}>★</button>
            <button className="btn !px-3 text-muted" aria-label="Remover" disabled={list.length === 1} onClick={() => setList(list.filter((_, j) => j !== i))}>✕</button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input className="field flex-1" placeholder="Novo item (ex.: Ler 10 páginas)" value={label} onChange={(e) => setLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <button className="btn" onClick={add}>Adicionar</button>
      </div>
      <p className="text-xs text-faint">★ define a prioridade do dia, que aparece em destaque no topo.</p>
      <button className="btn btn-accent" disabled={pending} onClick={() => start(async () => { await updateSettings({ checklist: list }); onClose(); })}>
        {pending ? "Salvando…" : "Salvar checklist"}</button>
    </div>
  );
}

export function Checklist({ date, items, done }: { date: string; items: ChecklistItem[]; done: string[] }) {
  const [, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [opt, setOpt] = useOptimistic(new Set(done), (s: Set<string>, a: { key: string; on: boolean }) => {
    const n = new Set(s); if (a.on) n.add(a.key); else n.delete(a.key); return n;
  });
  const toggle = (key: string) => { const on = !opt.has(key); start(async () => { setOpt({ key, on }); await toggleCheck(date, key, on); }); };
  const primary = items.find((i) => i.primary) ?? items[0];
  const rest = items.filter((i) => i !== primary);
  const doneCount = items.filter((i) => opt.has(i.key)).length;
  const pct = items.length ? doneCount / items.length : 0;
  const pOn = primary && opt.has(primary.key);

  return (
    <section className="glass rise p-5" style={{ ["--accent" as string]: GOLD }}>
      <div className="flex items-center gap-5">
        <Ring value={pct} size={92} stroke={9} color={GOLD}><span className="num text-2xl">{Math.round(pct * 100)}%</span></Ring>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between"><p className="label">Disciplina de hoje</p><LinkBtn onClick={() => setEditing(true)}>Editar</LinkBtn></div>
          <p className="font-display text-xl leading-snug">{doneCount} de {items.length} feitos</p>
          <p className="text-sm text-muted">{pct === 1 ? "Dia completo. Honra cumprida." : "Um item de cada vez."}</p>
        </div>
      </div>

      {primary && (
        <button onClick={() => toggle(primary.key)} aria-pressed={pOn}
          className="w-full mt-4 text-left rounded-2xl p-4 flex items-center gap-4 border transition-colors"
          style={{ borderColor: "rgba(224,172,83,.35)", background: pOn ? "linear-gradient(180deg, rgba(224,172,83,.18), rgba(224,172,83,.05))" : "rgba(224,172,83,.04)" }}>
          <span className="grid place-items-center h-11 w-11 rounded-xl shrink-0 border" style={{ borderColor: GOLD, background: pOn ? GOLD : "transparent" }}>
            {pOn ? <Check size={20} /> : <span className="text-gold">★</span>}</span>
          <span><span className="label text-gold block">Prioridade</span><span className="font-display text-lg leading-snug">{primary.label}</span></span>
        </button>
      )}

      <ul className="mt-2">
        {rest.map((it) => {
          const on = opt.has(it.key);
          return (
            <li key={it.key}>
              <button onClick={() => toggle(it.key)} aria-pressed={on} className="row-hover w-full flex items-center gap-4 min-h-12 px-2 text-left">
                <span className="grid place-items-center h-6 w-6 shrink-0 rounded-lg border transition-colors"
                  style={{ borderColor: on ? GOLD : "rgba(255,255,255,.2)", background: on ? GOLD : "transparent" }}>{on && <Check />}</span>
                <span className={on ? "text-muted line-through decoration-white/20" : ""}>{it.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <Sheet open={editing} onClose={() => setEditing(false)} title="Editar checklist"><Editor items={items} onClose={() => setEditing(false)} /></Sheet>
    </section>
  );
}
