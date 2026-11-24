"use client";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { addTask, setEventDone } from "@/app/(app)/agenda/actions";

const A = "#ffb21e";
export type Mission = { id: string; title: string; start_time: string | null; end_time: string | null; done: boolean; kind: string; google: boolean };

/** Missões de hoje: os compromissos e tarefas da agenda viram um to-do. Marcar aqui marca na agenda (e no Google, se conectado). */
export function Missions({ date, items, google }: { date: string; items: Mission[]; google: boolean }) {
  const [list, toggle] = useOptimistic(items, (l: Mission[], x: { id: string; done: boolean }) => l.map((m) => (m.id === x.id ? { ...m, done: x.done } : m)));
  const [title, setTitle] = useState(""), [time, setTime] = useState(""), [err, setErr] = useState(""), [busy, start] = useTransition();
  const now = new Date(Date.now() - 3 * 36e5).toISOString().slice(11, 16);
  const done = list.filter((m) => m.done).length;
  const sorted = [...list].sort((a, b) => Number(a.done) - Number(b.done) || (a.start_time ?? "99").localeCompare(b.start_time ?? "99"));
  return (
    <section className="glass rise p-5 mt-4" aria-label="Missões de hoje">
      <div className="flex items-end justify-between">
        <div><p className="label">Missões de hoje</p><p className="text-[13px] text-white/55 mt-0.5">{list.length ? `${done} de ${list.length} feitas` : "Nada na agenda hoje."}{google && " · sincronizado com o Google Agenda"}</p></div>
        <Link href="/agenda" className="label !text-[10px] underline underline-offset-4 min-h-11 inline-flex items-center">agenda</Link>
      </div>
      {list.length > 0 && <div className="h-1.5 rounded-full bg-white/10 mt-3"><i className="block h-1.5 rounded-full transition-all" style={{ width: `${(done / list.length) * 100}%`, background: A }} /></div>}
      <ul className="mt-3 grid gap-1.5">
        {sorted.map((m) => { const late = !m.done && m.start_time && m.start_time.slice(0, 5) < now; return (
          <li key={m.id}>
            <button onClick={() => start(async () => { toggle({ id: m.id, done: !m.done }); const e = await setEventDone(m.id, !m.done); if (e) setErr(e); })}
              className="w-full flex items-center gap-3 rounded-[12px] px-3 min-h-12 text-left bg-white/[.03] hover:bg-white/[.06]" aria-pressed={m.done}>
              <span className="grid place-items-center h-6 w-6 shrink-0 rounded-full border" style={{ borderColor: m.done ? A : "rgba(255,255,255,.3)", background: m.done ? A : "transparent", color: "#000" }}>{m.done ? "✓" : ""}</span>
              <span className={`flex-1 min-w-0 truncate text-[14.5px] ${m.done ? "line-through text-white/40" : ""}`}>{m.title}</span>
              {m.start_time && <span className="shrink-0 font-mono text-[12px]" style={{ color: late ? "#ff8a80" : "rgba(255,255,255,.55)" }}>{m.start_time.slice(0, 5)}</span>}
            </button>
          </li>); })}
      </ul>
      <form className="mt-3 grid grid-cols-[1fr_auto] gap-2" onSubmit={(e) => { e.preventDefault(); const t = title.trim(); if (!t) return; start(async () => { const x = await addTask(t, date, time || null); if (x) setErr(x); else { setTitle(""); setTime(""); setErr(""); } }); }}>
        <input className="field col-span-2 min-w-0" placeholder="Nova missão para hoje…" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} aria-label="Nova missão" />
        <input type="time" className="field min-w-0" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Horário (opcional)" />
        <button className="btn btn-accent !px-5" disabled={busy || !title.trim()}>Adicionar</button>
      </form>
      {err && <p className="text-[12.5px] mt-2" style={{ color: A }}>{err}</p>}
    </section>
  );
}
