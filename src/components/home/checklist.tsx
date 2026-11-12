"use client";
import { useOptimistic, useState, useTransition } from "react";
import { toggleCheck } from "@/app/(app)/home-actions";
import { updateSettings } from "@/app/settings-actions";
import { LinkBtn, Sheet } from "@/components/kit";
import type { ChecklistItem } from "@/lib/settings";
import { useXp } from "@/components/game/xp";

const GOLD = "#ffb340";

/** Ícone e cor de cada missão pelo texto (funciona com missões personalizadas). */
const MISSIONS: [RegExp, string, string][] = [
  [/ora[cç][aã]o|estudo pessoal|devocional/i, "#ffb340", "M12 3v18M7 8h10M5 21h14"],
  [/b[ií]blia|leitura|livro/i, "#ff9f0a", "M4 5a2 2 0 0 1 2-2h6v17H6a2 2 0 0 0-2 2zM20 5a2 2 0 0 0-2-2h-6v17h6a2 2 0 0 1 2 2z"],
  [/faculdade|aula|curso|estud/i, "#bf5af2", "M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5"],
  [/treino|cardio|academia|corrida/i, "#30d158", "M4 9v6M8 6v12M16 6v12M20 9v6M8 12h8"],
  [/[aá]gua|hidrat/i, "#64d2ff", "M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"],
  [/refei|prote[ií]na|dieta|comer/i, "#ff8a65", "M7 3v8a2 2 0 0 0 4 0V3M9 11v10M17 3c-2 0-3 3-3 6s1 4 3 4v8"],
  [/dorm|sono/i, "#5e5ce6", "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"],
  [/campo|prega|pioneir|servi[cç]o/i, "#0a84ff", "M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"],
  [/finan|gasto|lan[cç]a/i, "#64d2ff", "M3 7h18v10H3zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"],
];
function missionStyle(label: string) {
  const m = MISSIONS.find(([re]) => re.test(label));
  return m ? { color: m[1], icon: m[2] } : { color: "#8e8e93", icon: "M5 12l5 5L20 7" };
}
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

export function Checklist({ date, items, done, streak = 0, best = 0 }: { date: string; items: ChecklistItem[]; done: string[]; streak?: number; best?: number }) {
  const [, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [opt, setOpt] = useOptimistic(new Set(done), (s: Set<string>, a: { key: string; on: boolean }) => {
    const n = new Set(s); if (a.on) n.add(a.key); else n.delete(a.key); return n;
  });
  const { gain, celebrate } = useXp();
  const [popped, setPopped] = useState<string | null>(null);
  const toggle = (key: string) => {
    const on = !opt.has(key);
    const after = items.filter((i) => (i.key === key ? on : opt.has(i.key))).length;
    const wasFull = items.every((i) => opt.has(i.key));
    if (on) { setPopped(key); setTimeout(() => setPopped(null), 400); gain(10, items.find((i) => i.key === key)?.label.split(/[+(/]/)[0].trim()); }
    else gain(wasFull ? -60 : -10);
    if (on && after === items.length) setTimeout(() => { gain(50, "Dia completo", "#30d158"); celebrate("Dia completo", "Todas as missões cumpridas · +50 XP"); }, 500);
    start(async () => { setOpt({ key, on }); await toggleCheck(date, key, on); });
  };
  const primary = items.find((i) => i.primary) ?? items[0];
  const ordered = primary ? [primary, ...items.filter((i) => i !== primary)] : items;
  const doneCount = items.filter((i) => opt.has(i.key)).length;
  const pct = items.length ? doneCount / items.length : 0;

  return (
    <section className="glass rise p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="label">Missões do dia</p>
          <p className="mt-1"><span className="num text-3xl">{doneCount}</span><span className="num text-xl text-faint">/{items.length}</span></p>
        </div>
        <div className="text-right">
          <LinkBtn onClick={() => setEditing(true)}>Editar</LinkBtn>
          <p className="text-xs mt-0.5" style={{ color: pct === 1 ? "#30d158" : "#8e8e93" }}>{pct === 1 ? "Dia completo ✓" : `+${(items.length - doneCount) * 10 + 50} XP disponíveis`}</p>
        </div>
      </div>
      <div className="flex gap-1 mt-3" aria-hidden>
        {ordered.map((it) => { const m = missionStyle(it.label); return <i key={it.key} className="h-1.5 flex-1 rounded-full transition-colors duration-500" style={{ background: opt.has(it.key) ? m.color : "rgba(255,255,255,.08)" }} />; })}
      </div>
      <p className="text-xs text-faint mt-2">{streak ? `${streak} ${streak === 1 ? "dia" : "dias"} 100% seguidos · recorde ${best}` : `Recorde de dias 100%: ${best}`}</p>

      <ul className="mt-4 grid gap-2">
        {ordered.map((it) => {
          const on = opt.has(it.key), m = missionStyle(it.label), main = it === primary;
          return (
            <li key={it.key}>
              <button onClick={() => toggle(it.key)} aria-pressed={on}
                className={`w-full flex items-center gap-3 text-left rounded-2xl px-3 transition-colors ${main ? "min-h-[68px] py-3" : "min-h-14 py-2"}`}
                style={{ background: on ? "rgba(255,255,255,.025)" : main ? "rgba(255,179,64,.07)" : "#151517", border: `1px solid ${main && !on ? "rgba(255,179,64,.25)" : "rgba(255,255,255,.05)"}` }}>
                <span className={`grid place-items-center shrink-0 rounded-[10px] transition-opacity ${main ? "h-10 w-10" : "h-8 w-8"} ${on ? "opacity-45" : ""}`} style={{ background: m.color }}>
                  <svg width={main ? 20 : 17} height={main ? 20 : 17} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={m.icon} /></svg>
                </span>
                <span className="flex-1 min-w-0">
                  {main && <span className="block text-[11px] font-medium" style={{ color: on ? "#5a5a5f" : "#ffb340" }}>Missão principal</span>}
                  <span className={`block leading-snug transition-colors ${main ? "text-[16px] font-semibold" : "text-[15px]"} ${on ? "text-faint" : "text-ink"}`}>{it.label}</span>
                </span>
                {!on && <span className="text-[11px] font-medium text-muted shrink-0">+10</span>}
                <span className={`grid place-items-center h-7 w-7 shrink-0 rounded-full border-2 transition-all duration-300 ${popped === it.key ? "check-pop" : ""}`}
                  style={{ borderColor: on ? m.color : "rgba(255,255,255,.22)", background: on ? m.color : "transparent" }}>
                  {on && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12.5l4.5 4.5L19 7.5" className="check-draw" /></svg>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <Sheet open={editing} onClose={() => setEditing(false)} title="Editar missões"><Editor items={items} onClose={() => setEditing(false)} /></Sheet>
    </section>
  );
}
