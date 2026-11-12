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
  // Paleta pela sequência de dias 100%: luz → aurora → chama → fogueira → inferno → fogo de guerra → chama violeta.
  const run = streak + (full ? 0 : 0);
  const T = run >= 60 ? { n: "CHAMA VIOLETA", a: "#bf5af2", b: "#ff9ff3", bg: "#1e0a2e", heat: 5 }
    : run >= 30 ? { n: "FOGO DE GUERRA", a: "#ff2d2d", b: "#ffd27a", bg: "#2a0606", heat: 5 }
    : run >= 14 ? { n: "INFERNO", a: "#ff3b30", b: "#ff9f0a", bg: "#240707", heat: 4 }
    : run >= 7 ? { n: "FOGUEIRA", a: "#ff6a1a", b: "#ffb340", bg: "#221005", heat: 3 }
    : run >= 3 ? { n: "CHAMA", a: "#ff9f0a", b: "#ffd27a", bg: "#1d1406", heat: 2 }
    : run >= 1 ? { n: "AURORA", a: "#ffd27a", b: "#fff3d6", bg: "#17140c", heat: 1 }
    : { n: "LUZ", a: "#f5f7ff", b: "#cfd8ea", bg: "#111318", heat: 0 };
  const SYS = T.a, ALT = T.b;

  return (
    <section className="relative rise rounded-[22px] p-[1px] overflow-hidden min-w-0 w-full" style={{ background: `linear-gradient(150deg, ${SYS}, ${ALT}55 45%, ${SYS}33 70%, ${ALT})`, boxShadow: `0 0 44px -16px ${SYS}, 0 0 60px -30px ${ALT}` }}>
      <div className="relative isolate rounded-[21px] p-4 sys-scan" style={{ background: `radial-gradient(90% 55% at 50% 0%, ${T.bg}, transparent 65%), radial-gradient(${60 + T.heat * 10}% ${30 + T.heat * 8}% at 50% 105%, ${SYS}${["10", "1c", "2a", "3a", "4d", "66"][T.heat]}, transparent 70%), #08080a` }}>
        {T.heat > 0 && <div aria-hidden className="pointer-events-none absolute -z-10 inset-x-0 bottom-0 h-1/3 overflow-hidden rounded-b-[21px]">
          {Array.from({ length: T.heat * 4 }, (_, i) => <span key={i} className="absolute bottom-2 rounded-full fire-ember" style={{ left: `${((i + 0.5) / (T.heat * 4)) * 100}%`, width: 2 + (i % 2), height: 2 + (i % 2), background: i % 2 ? SYS : ALT, animationDelay: `${(i % 7) * 0.3}s` }} />)}
        </div>}
        {/* cantos */}
        {["left-2 top-2 border-l-2 border-t-2", "right-2 top-2 border-r-2 border-t-2", "left-2 bottom-2 border-l-2 border-b-2", "right-2 bottom-2 border-r-2 border-b-2"].map((c) =>
          <span key={c} className={`absolute h-3 w-3 ${c}`} style={{ borderColor: ALT }} />)}

        <div className="flex items-start gap-3">
          <StreakFlame n={streak} a={SYS} b={ALT} heat={T.heat} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold tracking-[.35em]" style={{ color: SYS }}>{full ? "MISSÃO CONCLUÍDA" : "MISSÃO DIÁRIA"} · <span style={{ color: ALT }}>{T.n}</span></p>
            <p className="text-[15px] font-semibold mt-0.5">{full ? "O sistema registrou sua constância." : "Treinamento para se tornar mais forte"}</p>
          </div>
          <button onClick={() => setEditing(true)} className="text-[11px] text-white/50 underline underline-offset-4 shrink-0 mt-1">editar</button>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3">
          {[[streak, streak === 1 ? "dia 100%" : "dias 100%", SYS], [best, "recorde", ALT], [doneCount, `de ${items.length} hoje`, "#ffd27a"]].map(([v, l, c]) => (
            <div key={String(l)} className="rounded-xl px-2 py-2 text-center border" style={{ borderColor: `${c}33`, background: `${c}0f` }}>
              <p className="num text-2xl leading-none" style={{ color: String(c), textShadow: `0 0 12px ${c}` }}>{v}</p>
              <p className="text-[10px] text-[#b3a99a] mt-1">{l}</p>
            </div>))}
        </div>
        <div className="flex items-center justify-between mt-3 text-[11px] font-mono">
          <span className="text-[#b3a99a]">⏳ {full ? "Concluída hoje" : `restam ${left}`}</span>
          <span style={{ color: SYS }}>{Math.round(pct * 100)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[.06] mt-1.5 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(3, pct * 100)}%`, background: `linear-gradient(90deg, ${ALT}, ${SYS})`, boxShadow: `0 0 12px ${SYS}` }} />
        </div>

        <p className="text-[10px] font-bold tracking-[.3em] mt-4 mb-1.5" style={{ color: `${ALT}cc` }}>OBJETIVOS</p>
        <ul className="grid gap-1.5">
          {ordered.map((it) => {
            const on = opt.has(it.key), m = missionStyle(it.label), main = it === primary;
            return (
              <li key={it.key}>
                <button onClick={() => toggle(it.key)} aria-pressed={on}
                  className={`press w-full flex items-center gap-3 text-left rounded-xl px-3 min-h-[52px] py-2 border transition-all duration-300 ${popped === it.key ? "sys-hit" : ""}`}
                  style={{ borderColor: on ? `${SYS}55` : main ? `${ALT}55` : "rgba(255,255,255,.08)", background: on ? `linear-gradient(90deg, ${SYS}24, ${ALT}0d 70%)` : main ? `linear-gradient(90deg, ${ALT}1a, transparent 80%)` : "rgba(255,255,255,.03)" }}>
                  <span className="grid place-items-center h-8 w-8 shrink-0 rounded-lg" style={{ background: on ? `linear-gradient(140deg, ${SYS}, ${ALT})` : `${m.color}1f`, border: `1px solid ${on ? "transparent" : m.color + "44"}`, boxShadow: on ? `0 0 14px -2px ${SYS}` : "none" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={on ? "#140a03" : m.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={m.icon} /></svg>
                  </span>
                  <span className="flex-1 min-w-0">
                    {main && <span className="block text-[9px] font-bold tracking-[.25em]" style={{ color: on ? "#7a6a5a" : ALT }}>PRINCIPAL</span>}
                    <span className={`block text-[14px] leading-snug ${on ? "text-[#b3a99a] line-through decoration-1" : "text-[#fbf6ee]"}`}>{it.label}</span>
                  </span>
                  <span className="font-mono text-[12px] shrink-0 tabular-nums" style={{ color: on ? SYS : "rgba(235,225,205,.5)", textShadow: on ? `0 0 8px ${SYS}` : "none" }}>[{on ? 1 : 0}/1]</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="rounded-xl border p-2.5" style={{ borderColor: "rgba(255,210,122,.3)", background: "linear-gradient(160deg, rgba(255,210,122,.10), transparent)" }}>
            <p className="text-[9px] font-bold tracking-[.25em]" style={{ color: "#ffd27a" }}>✦ RECOMPENSAS</p>
            <p className="text-[12px] text-white/85 mt-1 leading-snug">+10 XP por objetivo<br />+50 XP ao completar tudo</p>
          </div>
          <div className="rounded-xl border p-2.5" style={{ borderColor: full ? "rgba(48,209,88,.35)" : "rgba(255,107,129,.3)", background: full ? "linear-gradient(160deg, rgba(48,209,88,.10), transparent)" : "linear-gradient(160deg, rgba(255,107,129,.09), transparent)" }}>
            <p className="text-[9px] font-bold tracking-[.25em]" style={{ color: full ? "#30d158" : "#ff6b81" }}>{full ? "▲ SEQUÊNCIA" : "⚠ PENALIDADE"}</p>
            <p className="text-[12px] text-white/85 mt-1 leading-snug">{full ? `${streak} ${streak === 1 ? "dia" : "dias"} 100% seguidos · recorde ${best}` : `Incompleta à meia-noite, a sequência de ${streak} ${streak === 1 ? "dia" : "dias"} 100% zera.`}</p>
          </div>
        </div>
        {!full && <p className="text-center text-[11px] font-mono mt-3" style={{ color: "#ffd27a" }}>+{(items.length - doneCount) * 10 + 50} XP disponíveis</p>}
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
function StreakFlame({ n, a, b, heat }: { n: number; a: string; b: string; heat: number }) {
  const size = 44 + heat * 4, lit = heat > 0;
  return (
    <span className="relative shrink-0 grid place-items-center" style={{ width: size, height: size * 1.15 }}>
      {lit && <span className="absolute inset-0 rounded-full fire-aura" style={{ background: `radial-gradient(50% 50% at 50% 60%, ${a}66, transparent 70%)` }} />}
      <svg viewBox="0 0 40 46" className={`relative w-full h-full overflow-visible ${lit ? "duo-flame" : ""}`} aria-hidden style={lit ? { filter: `drop-shadow(0 3px 8px ${a}88)` } : undefined}>
        <defs>
          <linearGradient id={`duo${heat}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={lit ? b : "#3a3a3c"} /><stop offset="1" stopColor={lit ? a : "#2c2c2e"} /></linearGradient>
        </defs>
        <path d="M21 2c2 6 8 10 11 15 3 5 5 9 5 13a17 17 0 0 1-34 0c0-6 3-11 7-15 1 3 2 5 4 6 0-7 3-13 7-19z" fill={`url(#duo${heat})`} stroke={lit ? "rgba(255,255,255,.25)" : "rgba(255,255,255,.18)"} strokeWidth="1" />
        <path d="M20 21c3 3 7 7 7 11a7 7 0 0 1-14 0c0-3 2-6 4-8 0 2 1 3 2 3 0-2 0-4 1-6z" fill={lit ? "#fff7e0" : "#48484a"} opacity={lit ? 0.92 : 1} />
        <path d="M10 25c1-4 3-7 5-9" stroke="rgba(255,255,255,.55)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <text x="20" y="38" textAnchor="middle" fontSize="11" fontWeight="800" fill={lit ? "#5a1e00" : "#8e8e93"} style={{ fontFamily: "var(--font-sans)" }}>{n}</text>
      </svg>
    </span>
  );
}
