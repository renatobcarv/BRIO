"use client";
import { useEffect, useOptimistic, useState, useTransition } from "react";
import { toggleCheck } from "@/app/(app)/home-actions";
import { updateSettings } from "@/app/settings-actions";
import { Sheet } from "@/components/kit";
import type { ChecklistItem } from "@/lib/settings";
import { useXp } from "@/components/game/xp";

const GOLD = "#ff2800";

/** Ícone e cor de cada missão pelo texto (funciona com missões personalizadas). */
const MISSIONS: [RegExp, string, string][] = [
  [/ora[cç][aã]o|estudo pessoal|devocional/i, "#ff2800", "M3 6c3-1.5 6-1.5 9 0v13c-3-1.5-6-1.5-9 0zM21 6c-3-1.5-6-1.5-9 0v13c3-1.5 6-1.5 9 0z"],
  [/b[ií]blia|leitura|livro/i, "#ff4d3d", "M4 5a2 2 0 0 1 2-2h6v17H6a2 2 0 0 0-2 2zM20 5a2 2 0 0 0-2-2h-6v17h6a2 2 0 0 1 2 2z"],
  [/faculdade|aula|curso|estud/i, "#dc0000", "M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5"],
  [/treino|cardio|academia|corrida/i, "#30d158", "M4 9v6M8 6v12M16 6v12M20 9v6M8 12h8"],
  [/[aá]gua|hidrat/i, "#f5f5f7", "M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"],
  [/refei|prote[ií]na|dieta|comer/i, "#ff4d3d", "M7 3v8a2 2 0 0 0 4 0V3M9 11v10M17 3c-2 0-3 3-3 6s1 4 3 4v8"],
  [/dorm|sono/i, "#dc0000", "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"],
  [/campo|prega|pioneir|servi[cç]o/i, "#f5f5f7", "M21 11.5a8.4 8.4 0 0 1-12.2 7.5L3 20.5l1.6-5.2A8.4 8.4 0 1 1 21 11.5z"],
  [/finan|gasto|lan[cç]a/i, "#f5f5f7", "M3 7h18v10H3zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"],
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
  // Paleta pela sequência de dias 100%: luz → aurora → chama → fogueira → inferno → fogo de guerra → chama violeta.
  const run = streak + (full ? 0 : 0);
  const T = run >= 60 ? { n: "RUBI", a: "#ff2d55", b: "#ffffff", bg: "#2a0512", heat: 5 }
    : run >= 30 ? { n: "FOGO DE GUERRA", a: "#e11d48", b: "#ff7a5c", bg: "#2a0510", heat: 5 }
    : run >= 14 ? { n: "INFERNO", a: "#dc0000", b: "#ff7a5c", bg: "#24060f", heat: 4 }
    : run >= 7 ? { n: "FOGUEIRA", a: "#ff2800", b: "#ffd1e0", bg: "#200811", heat: 3 }
    : run >= 3 ? { n: "CHAMA", a: "#ff4d3d", b: "#ffd1e0", bg: "#1c0a0e", heat: 2 }
    : run >= 1 ? { n: "AURORA", a: "#ff7a5c", b: "#ffffff", bg: "#170d10", heat: 1 }
    : { n: "LUZ", a: "#f5f5f7", b: "#cfd8ea", bg: "#111113", heat: 0 };
  const SYS = T.a, ALT = T.b;

  return (
    <section className="hunt-card rise relative min-w-0 w-full overflow-hidden" style={{ ["--sys" as string]: SYS }}>
      <span aria-hidden className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: SYS, boxShadow: `0 0 18px ${SYS}` }} />
      <div className="p-4 pl-5">
        <div className="flex items-start gap-3">
          <StreakFlame n={streak} a={SYS} b={ALT} heat={T.heat} />
          <div className="flex-1 min-w-0">
            <p className="label" style={{ color: SYS }}>{full ? "Missão concluída" : "Missão diária"} · {T.n}</p>
            <p className="font-display text-3xl mt-1">{full ? "Alvo abatido." : "Olho no alvo."}</p>
          </div>
          <button onClick={() => setEditing(true)} className="label !text-[10px] underline underline-offset-4 shrink-0 mt-1 min-h-11">editar</button>
        </div>

        <div className="grid grid-cols-3 mt-4 border-y border-white/[.08] divide-x divide-white/[.08]">
          {[[streak, streak === 1 ? "dia 100%" : "dias 100%"], [best, "recorde"], [`${doneCount}/${items.length}`, "hoje"]].map(([v, l], i) => (
            <div key={String(l)} className="py-3 text-center">
              <p className="num text-3xl leading-none" style={{ color: i === 0 ? SYS : i === 1 ? "#ffb21e" : "#f5f5f7" }}>{v}</p>
              <p className="label !text-[9px] mt-1.5">{l}</p>
            </div>))}
        </div>

        <div className="flex items-end justify-between mt-4">
          <div><p className="label !text-[9px]">{full ? "Status" : "Tempo restante"}</p><p className="num text-2xl tabular-nums mt-0.5">{full ? "CUMPRIDA" : left}</p></div>
          <p className="num text-2xl" style={{ color: SYS }}>{Math.round(pct * 100)}%</p>
        </div>
        <div className="flex gap-[3px] mt-2" aria-hidden>
          {items.map((it, i) => <i key={it.key} className="h-1.5 flex-1 transition-colors duration-500" style={{ background: i < doneCount ? SYS : "rgba(255,255,255,.08)" }} />)}
        </div>

        <p className="label !text-[9px] mt-5 mb-2">Objetivos</p>
        <ul className="grid gap-px bg-white/[.06] border border-white/[.06]">
          {ordered.map((it) => {
            const on = opt.has(it.key), m = missionStyle(it.label), main = it === primary;
            return (
              <li key={it.key} className="bg-[#080808]">
                <button onClick={() => toggle(it.key)} aria-pressed={on}
                  className={`press w-full flex items-center gap-3 text-left px-3 min-h-[54px] py-2 transition-colors ${popped === it.key ? "sys-hit" : ""}`}
                  style={{ background: on ? `linear-gradient(90deg, ${SYS}1f, transparent 70%)` : undefined }}>
                  <span className="grid place-items-center h-6 w-6 shrink-0 border" style={{ borderColor: on ? SYS : "rgba(255,255,255,.25)", background: on ? SYS : "transparent" }}>
                    {on && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" aria-hidden><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={on ? "#6b6b70" : "#a1a1a6"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0"><path d={m.icon} /></svg>
                  <span className="flex-1 min-w-0">
                    {main && <span className="label !text-[9px] block" style={{ color: on ? undefined : SYS }}>Principal</span>}
                    <span className={`block text-[14px] leading-snug ${on ? "text-[#6b6b70] line-through decoration-1" : "text-[#f5f5f7]"}`}>{it.label}</span>
                  </span>
                  <span className="font-mono text-[11px] shrink-0 tabular-nums" style={{ color: on ? "#ffb21e" : "#6b6b70" }}>{on ? "+10" : "10"} XP</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex items-start justify-between gap-3 mt-4 text-[12px]">
          <p className="text-white/60 leading-snug">{full ? `${streak} ${streak === 1 ? "dia" : "dias"} 100% seguidos · recorde ${best}` : `Incompleta à meia-noite, a sequência de ${streak} ${streak === 1 ? "dia" : "dias"} zera.`}</p>
          {!full && <p className="font-mono shrink-0" style={{ color: "#ffb21e" }}>+{(items.length - doneCount) * 10 + 50} XP</p>}
        </div>
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

/** Chama estilo cartoon (arredondada, gordinha, quica). Cresce e esquenta com a sequência. */
function StreakFlame({ n, a, heat }: { n: number; a: string; b: string; heat: number }) {
  const lit = heat > 0, size = 52;
  return (
    <span className="relative shrink-0" style={{ width: size, height: size * 1.1 }}>
      <svg viewBox="0 0 40 44" className="w-full h-full overflow-visible" aria-hidden style={lit ? { filter: `drop-shadow(0 0 ${4 + heat * 2}px ${a})` } : undefined}>
        <path d="M20 1 L31 16 L27 15 L35 28 L28 43 L12 43 L5 28 L13 15 L9 16 Z" fill={lit ? a : "#1c1c1e"} stroke={lit ? "none" : "#3a3a3c"} />
        <path d="M20 18 L26 30 L22 29 L24 43 L16 43 L18 29 L14 30 Z" fill={lit ? "#000" : "#0b0b0b"} opacity={lit ? 0.55 : 1} />
        <text x="20" y="39" textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff" style={{ fontFamily: "var(--font-hunt), var(--font-sans)" }}>{n}</text>
      </svg>
    </span>
  );
}
