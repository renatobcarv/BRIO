"use client";
import { useEffect, useOptimistic, useState, useTransition } from "react";
import { toggleCheck } from "@/app/(app)/home-actions";
import { updateSettings } from "@/app/settings-actions";
import { Sheet } from "@/components/kit";
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
  [/campo|prega|pioneir|servi[cç]o/i, "#0a84ff", "M21 11.5a8.4 8.4 0 0 1-12.2 7.5L3 20.5l1.6-5.2A8.4 8.4 0 1 1 21 11.5z"],
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
    if (on && after === items.length) setTimeout(() => { gain(50, "Dia completo", "#30d158"); celebrate("MISSÃO DIÁRIA CONCLUÍDA", "Todos os objetivos cumpridos · +50 XP de bônus"); }, 500);
    start(async () => { setOpt({ key, on }); await toggleCheck(date, key, on); });
  };
  const primary = items.find((i) => i.primary) ?? items[0];
  const ordered = primary ? [primary, ...items.filter((i) => i !== primary)] : items;
  const doneCount = items.filter((i) => opt.has(i.key)).length;
  const pct = items.length ? doneCount / items.length : 0, full = pct === 1;
  const left = useCountdown();
  const SYS = full ? "#ffd60a" : "#3ad1ff";

  return (
    <section className="relative rise rounded-[22px] p-[1px] overflow-hidden" style={{ background: `linear-gradient(160deg, ${SYS}aa, ${SYS}22 40%, ${SYS}66)`, boxShadow: `0 0 40px -14px ${SYS}, inset 0 0 0 1px ${SYS}33` }}>
      <div className="relative rounded-[21px] p-4 sys-scan" style={{ background: "linear-gradient(180deg, #06101f 0%, #040a14 60%, #03070e 100%)" }}>
        {/* cantos */}
        {["left-2 top-2 border-l-2 border-t-2", "right-2 top-2 border-r-2 border-t-2", "left-2 bottom-2 border-l-2 border-b-2", "right-2 bottom-2 border-r-2 border-b-2"].map((c) =>
          <span key={c} className={`absolute h-3 w-3 ${c}`} style={{ borderColor: SYS }} />)}

        <div className="flex items-start gap-3">
          <span className="grid place-items-center h-10 w-10 shrink-0 rounded-xl border-2 font-black text-lg sys-pulse" style={{ borderColor: SYS, color: SYS, boxShadow: `0 0 16px -2px ${SYS}`, background: `${SYS}14` }}>{full ? "✓" : "!"}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold tracking-[.35em]" style={{ color: SYS }}>{full ? "MISSÃO CONCLUÍDA" : "MISSÃO DIÁRIA"}</p>
            <p className="text-[15px] font-semibold mt-0.5">{full ? "O sistema registrou sua constância." : "Treinamento para se tornar mais forte"}</p>
          </div>
          <button onClick={() => setEditing(true)} className="text-[11px] text-white/50 underline underline-offset-4 shrink-0 mt-1">editar</button>
        </div>

        <div className="flex items-center justify-between mt-3 text-[11px] font-mono">
          <span className="text-white/55">⏳ {full ? "Concluída hoje" : `restam ${left}`}</span>
          <span style={{ color: SYS }}>{Math.round(pct * 100)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[.06] mt-1.5 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(3, pct * 100)}%`, background: `linear-gradient(90deg, ${SYS}88, ${SYS})`, boxShadow: `0 0 12px ${SYS}` }} />
        </div>

        <p className="text-[10px] font-bold tracking-[.3em] text-white/40 mt-4 mb-1.5">OBJETIVOS</p>
        <ul className="grid gap-1.5">
          {ordered.map((it) => {
            const on = opt.has(it.key), m = missionStyle(it.label), main = it === primary;
            return (
              <li key={it.key}>
                <button onClick={() => toggle(it.key)} aria-pressed={on}
                  className={`press w-full flex items-center gap-3 text-left rounded-xl px-3 min-h-[52px] py-2 border transition-all duration-300 ${popped === it.key ? "sys-hit" : ""}`}
                  style={{ borderColor: on ? `${m.color}55` : main ? `${SYS}44` : "rgba(255,255,255,.06)", background: on ? `linear-gradient(90deg, ${m.color}1f, transparent 70%)` : main ? `${SYS}0d` : "rgba(255,255,255,.02)" }}>
                  <span className="grid place-items-center h-8 w-8 shrink-0 rounded-lg" style={{ background: on ? m.color : `${m.color}22`, boxShadow: on ? `0 0 14px -2px ${m.color}` : "none" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={on ? "#000" : m.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={m.icon} /></svg>
                  </span>
                  <span className="flex-1 min-w-0">
                    {main && <span className="block text-[9px] font-bold tracking-[.25em]" style={{ color: on ? "#5a6a7a" : SYS }}>PRINCIPAL</span>}
                    <span className={`block text-[14px] leading-snug ${on ? "text-white/45 line-through decoration-1" : "text-white"}`}>{it.label}</span>
                  </span>
                  <span className="font-mono text-[12px] shrink-0 tabular-nums" style={{ color: on ? "#30d158" : "rgba(255,255,255,.45)" }}>[{on ? 1 : 0}/1]</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="rounded-xl border p-2.5" style={{ borderColor: `${SYS}33`, background: `${SYS}0a` }}>
            <p className="text-[9px] font-bold tracking-[.25em]" style={{ color: SYS }}>RECOMPENSAS</p>
            <p className="text-[12px] text-white/85 mt-1 leading-snug">+10 XP por objetivo<br />+50 XP ao completar tudo</p>
          </div>
          <div className="rounded-xl border p-2.5" style={{ borderColor: full ? "rgba(48,209,88,.35)" : "rgba(255,69,58,.3)", background: full ? "rgba(48,209,88,.06)" : "rgba(255,69,58,.05)" }}>
            <p className="text-[9px] font-bold tracking-[.25em]" style={{ color: full ? "#30d158" : "#ff6961" }}>{full ? "SEQUÊNCIA" : "PENALIDADE"}</p>
            <p className="text-[12px] text-white/85 mt-1 leading-snug">{full ? `${streak} ${streak === 1 ? "dia" : "dias"} 100% seguidos · recorde ${best}` : `Incompleta à meia-noite, a sequência de ${streak} ${streak === 1 ? "dia" : "dias"} 100% zera.`}</p>
          </div>
        </div>
        {!full && <p className="text-center text-[11px] font-mono mt-3" style={{ color: SYS }}>+{(items.length - doneCount) * 10 + 50} XP disponíveis</p>}
      </div>
      <Sheet open={editing} onClose={() => setEditing(false)} title="Editar missões"><Editor items={items} onClose={() => setEditing(false)} /></Sheet>
    </section>
  );
}

/** Tempo até a meia-noite de São Paulo. */
function useCountdown() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  if (now == null) return "--:--:--";
  const sp = new Date(now - 3 * 36e5), end = Date.UTC(sp.getUTCFullYear(), sp.getUTCMonth(), sp.getUTCDate() + 1) + 3 * 36e5;
  const ms = Math.max(0, end - now), h = Math.floor(ms / 36e5), m = Math.floor(ms / 6e4) % 60, sec = Math.floor(ms / 1e3) % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
