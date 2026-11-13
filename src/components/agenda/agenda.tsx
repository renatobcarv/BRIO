"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { aiAgenda, applyProposals, deleteEvent, disableCalendarToken, disconnectGoogle, rotateCalendarToken, saveEvent, syncAllToGoogle, type AgendaProposal } from "@/app/(app)/agenda/actions";
import { Field, Sheet } from "@/components/kit";
import { haptic } from "@/components/game/xp";

export type GoogleState = { ready: boolean; connected: boolean; email: string | null; migrated: boolean; error: boolean; flash: string | null };
export type GEv = { id: string; title: string; date: string; start_time: string | null; end_time: string | null; location: string | null; link: string | null };
export type CalEvent = { id: string; title: string; date: string; start_time: string | null; end_time: string | null; category: string; location: string | null; notes: string | null; remind_min: number | null };
const CAT: Record<string, { label: string; color: string; e: string }> = {
  pessoal: { label: "Pessoal", color: "#9a978f", e: "📌" }, espiritual: { label: "Espiritual", color: "#ffb340", e: "📖" },
  campo: { label: "Campo", color: "#0a84ff", e: "💬" }, treino: { label: "Treino", color: "#e0393e", e: "🏋️" },
  financas: { label: "Finanças", color: "#3ee6c1", e: "💰" }, trabalho: { label: "Trabalho", color: "#bf5af2", e: "💼" }, familia: { label: "Família", color: "#ff6b81", e: "❤️" },
};
const MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const DS = ["S", "T", "Q", "Q", "S", "S", "D"];
const add = (iso: string, n: number) => new Date(Date.parse(iso + "T12:00:00Z") + n * 864e5).toISOString().slice(0, 10);
const hm = (t: string | null) => (t ? t.slice(0, 5) : "");
const br = (iso: string) => iso.split("-").reverse().slice(0, 2).join("/");

export type Routine = { label: string; time: string };
const toMin = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3, 5);
const fmtMin = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const WD = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
type Block = { key: string; title: string; start: number; end: number; color: string; e?: CalEvent; g?: GEv; routine?: boolean };

/** Organiza blocos sobrepostos em colunas lado a lado. */
function lanes(bs: Block[]) {
  const sorted = [...bs].sort((a, b) => a.start - b.start || b.end - a.end), out: (Block & { lane: number; lanes: number })[] = [];
  let group: (Block & { lane: number; lanes: number })[] = [], groupEnd = -1;
  const flush = () => { const n = Math.max(1, ...group.map((g) => g.lane + 1)); group.forEach((g) => (g.lanes = n)); out.push(...group); group = []; };
  for (const b of sorted) {
    if (b.start >= groupEnd && group.length) flush();
    const used = new Set(group.filter((g) => g.end > b.start).map((g) => g.lane));
    let lane = 0; while (used.has(lane)) lane++;
    group.push({ ...b, lane, lanes: 1 }); groupEnd = Math.max(groupEnd, b.end);
  }
  if (group.length) flush();
  return out;
}

export function Agenda({ today, month, events, ready, feed, google, gEvents = [], routine = [] }: { today: string; month: string; events: CalEvent[]; ready: boolean; feed: string | null; google?: GoogleState; gEvents?: GEv[]; routine?: Routine[] }) {
  const [sel, setSel] = useState(today.slice(0, 7) === month.slice(0, 7) ? today : month);
  const [form, setForm] = useState<null | Partial<CalEvent>>(null);
  const [conn, setConn] = useState(!!google?.flash);
  const [view, setView] = useState<"dia" | "semana" | "mes">("dia");
  const now = useNow();
  const y = +month.slice(0, 4), mo = +month.slice(5, 7);
  const prev = `${mo === 1 ? y - 1 : y}-${String(mo === 1 ? 12 : mo - 1).padStart(2, "0")}`, next = `${mo === 12 ? y + 1 : y}-${String(mo === 12 ? 1 : mo + 1).padStart(2, "0")}`;
  const lead = (new Date(month + "T12:00:00Z").getUTCDay() + 6) % 7;
  const days = Array.from({ length: 42 }, (_, i) => add(month, i - lead));
  const byDay = useMemo(() => { const m = new Map<string, CalEvent[]>(); for (const e of events) m.set(e.date, [...(m.get(e.date) ?? []), e]); return m; }, [events]);
  const gBy = useMemo(() => { const m = new Map<string, GEv[]>(); for (const e of gEvents) m.set(e.date, [...(m.get(e.date) ?? []), e]); return m; }, [gEvents]);
  const linked = !!feed || !!google?.connected;
  const blocksOf = (d: string): Block[] => [
    ...routine.map((r) => ({ key: "r" + r.label, title: r.label, start: toMin(r.time), end: toMin(r.time) + 30, color: "#30d158", routine: true })),
    ...(byDay.get(d) ?? []).filter((e) => e.start_time).map((e) => ({ key: e.id, title: e.title, start: toMin(e.start_time!), end: e.end_time ? Math.max(toMin(e.end_time), toMin(e.start_time!) + 20) : toMin(e.start_time!) + 60, color: CAT[e.category]?.color ?? "#9a978f", e })),
    ...(gBy.get(d) ?? []).filter((e) => e.start_time).map((e) => ({ key: "g" + e.id, title: e.title, start: toMin(e.start_time!), end: e.end_time ? Math.max(toMin(e.end_time), toMin(e.start_time!) + 20) : toMin(e.start_time!) + 60, color: "#e5e5ea", g: e })),
  ];
  const allDay = (d: string) => [...(byDay.get(d) ?? []).filter((e) => !e.start_time)];
  const nowMin = now ? (new Date(now - 3 * 36e5).getUTCHours() * 60 + new Date(now - 3 * 36e5).getUTCMinutes()) : null;
  const todayBlocks = blocksOf(today).filter((b) => !b.routine).sort((a, b) => a.start - b.start);
  const current = nowMin != null ? todayBlocks.find((b) => b.start <= nowMin && b.end > nowMin) : undefined;
  const upcoming = nowMin != null ? todayBlocks.find((b) => b.start > nowMin) : undefined;
  const busy = todayBlocks.reduce((a, b) => a + (b.end - b.start), 0);
  const openAt = (d: string, min?: number) => setForm({ date: d, category: "pessoal", start_time: min != null ? fmtMin(Math.floor(min / 30) * 30) : null, end_time: min != null ? fmtMin(Math.floor(min / 30) * 30 + 60) : null });
  const weekStart = add(sel, -((new Date(sel + "T12:00:00Z").getUTCDay() + 6) % 7));

  return (
    <div style={{ ["--accent" as string]: "#5ab0ff" }}>
      {/* Cabeçalho */}
      <header className="rise mb-4 rounded-[26px] p-4 border relative overflow-hidden" style={{ borderColor: "rgba(90,176,255,.25)", background: "radial-gradient(120% 90% at 0% 0%, rgba(90,176,255,.16), transparent 55%), radial-gradient(90% 80% at 100% 100%, rgba(191,90,242,.12), transparent 60%), #07090f" }}>
        <div className="absolute inset-0 pointer-events-none opacity-[.07]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-[.35em] text-[#5ab0ff]">CENTRAL DE OPERAÇÕES</p>
            <p className="num text-[40px] leading-none mt-1 tabular-nums">{now ? fmtMin(nowMin!) : "--:--"}<span className="text-lg text-muted ml-1">{now ? String(new Date(now).getUTCSeconds()).padStart(2, "0") : ""}</span></p>
            <p className="text-xs text-muted mt-1">{WD[new Date(today + "T12:00:00Z").getUTCDay()]}, {br(today)} · {todayBlocks.length} {todayBlocks.length === 1 ? "compromisso" : "compromissos"} · {Math.floor(busy / 60)}h{String(busy % 60).padStart(2, "0")} ocupadas</p>
          </div>
          <button onClick={() => setConn(true)} className="press shrink-0 rounded-2xl px-3 py-2 border text-xs font-semibold flex items-center gap-2"
            style={{ borderColor: linked ? "#30d15866" : "rgba(255,255,255,.15)", background: linked ? "rgba(48,209,88,.1)" : "transparent" }}>
            <span className={`h-2 w-2 rounded-full ${linked ? "war-pulse" : ""}`} style={{ background: linked ? "#30d158" : "#8e8e93" }} />{google?.connected ? "Google ✓" : linked ? "Conectado" : "Conectar"}</button>
        </div>
        <div className="relative grid grid-cols-2 gap-2 mt-3">
          <div className="rounded-2xl p-2.5 border" style={{ borderColor: current ? current.color + "66" : "rgba(255,255,255,.08)", background: current ? current.color + "14" : "rgba(255,255,255,.03)" }}>
            <p className="text-[9px] font-bold tracking-[.25em] text-muted">AGORA</p>
            <p className="text-sm font-semibold truncate mt-0.5">{current ? current.title : "Livre"}</p>
            <p className="text-[11px] text-muted num">{current ? `até ${fmtMin(current.end)}` : upcoming ? `até ${fmtMin(upcoming.start)}` : "resto do dia"}</p>
          </div>
          <div className="rounded-2xl p-2.5 border" style={{ borderColor: upcoming ? upcoming.color + "55" : "rgba(255,255,255,.08)", background: "rgba(255,255,255,.03)" }}>
            <p className="text-[9px] font-bold tracking-[.25em] text-muted">PRÓXIMO</p>
            <p className="text-sm font-semibold truncate mt-0.5">{upcoming ? upcoming.title : "Nada mais hoje"}</p>
            <p className="text-[11px] text-muted num">{upcoming && nowMin != null ? `${fmtMin(upcoming.start)} · em ${upcoming.start - nowMin >= 60 ? `${Math.floor((upcoming.start - nowMin) / 60)}h${String((upcoming.start - nowMin) % 60).padStart(2, "0")}` : `${upcoming.start - nowMin} min`}` : "—"}</p>
          </div>
        </div>
      </header>

      {!ready && <p className="glass p-4 mb-4 text-sm text-[#ff6961]">Rode a migração <b>supabase/migrations/20261116000000_agenda.sql</b> no Supabase para usar a agenda.</p>}

      <AiBar today={today} />

      {/* Visões */}
      <div className="flex items-center gap-2 mt-4 mb-3">
        <div className="inline-flex p-1 rounded-2xl bg-white/[.04] border border-white/[.06] gap-1">
          {(["dia", "semana", "mes"] as const).map((v) => <button key={v} onClick={() => setView(v)} className={`min-h-9 px-3.5 rounded-xl text-sm capitalize ${view === v ? "bg-white/[.1] text-ink" : "text-muted"}`}>{v === "mes" ? "Mês" : v}</button>)}
        </div>
        <span className="flex-1" />
        <button className="btn !min-h-9 !px-3" aria-label="Anterior" onClick={() => setSel(add(sel, view === "semana" ? -7 : -1))}>‹</button>
        <button className="text-xs text-muted underline underline-offset-4 px-1" onClick={() => setSel(today)}>hoje</button>
        <button className="btn !min-h-9 !px-3" aria-label="Próximo" onClick={() => setSel(add(sel, view === "semana" ? 7 : 1))}>›</button>
      </div>

      {view === "dia" && <DayTimeline date={sel} today={today} nowMin={nowMin} blocks={blocksOf(sel)} allDay={allDay(sel)} gAllDay={(gBy.get(sel) ?? []).filter((e) => !e.start_time)}
        onEvent={(e) => setForm(e)} onEmpty={(m) => openAt(sel, m)} onAdd={() => openAt(sel)} />}

      {view === "semana" && <WeekGrid start={weekStart} today={today} nowMin={nowMin} blocksOf={blocksOf} allDayOf={allDay}
        onDay={(d) => { setSel(d); setView("dia"); }} onEvent={(e) => setForm(e)} />}

      {view === "mes" && (
        <section className="glass rise p-4">
          <div className="flex items-center justify-between mb-3">
            <Link href={`/agenda?m=${prev}`} className="btn !min-h-9 !px-3" aria-label="Mês anterior">‹</Link>
            <p className="font-display text-lg capitalize">{MES[mo - 1]} {y}</p>
            <Link href={`/agenda?m=${next}`} className="btn !min-h-9 !px-3" aria-label="Próximo mês">›</Link>
          </div>
          <div className="grid grid-cols-[repeat(7,minmax(0,1fr))] gap-1 text-center">
            {DS.map((d, i) => <span key={i} className="text-[11px] text-faint pb-1">{d}</span>)}
            {days.map((d) => {
              const inMonth = d.slice(0, 7) === month.slice(0, 7), evs = byDay.get(d) ?? [], on = d === sel, isToday = d === today;
              return (
                <button key={d} onClick={() => { setSel(d); setView("dia"); haptic(5); }} aria-label={`${br(d)}${evs.length ? `, ${evs.length} compromissos` : ""}`}
                  className={`press rounded-xl h-11 !min-h-0 min-w-0 flex flex-col items-center justify-center gap-0.5 border ${inMonth ? "" : "opacity-30"}`}
                  style={{ borderColor: on ? "#5ab0ff" : isToday ? "rgba(90,176,255,.4)" : "transparent", background: on ? "rgba(90,176,255,.16)" : "transparent" }}>
                  <span className={`num text-sm ${isToday ? "font-bold text-[#5ab0ff]" : ""}`}>{+d.slice(8)}</span>
                  <span className="flex gap-0.5 h-1.5">{evs.slice(0, 3).map((e) => <i key={e.id} className="h-1.5 w-1.5 rounded-full" style={{ background: CAT[e.category]?.color }} />)}{(gBy.get(d) ?? []).slice(0, Math.max(0, 3 - evs.length)).map((e) => <i key={e.id} className="h-1.5 w-1.5 rounded-full bg-white/70" />)}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-[11px] text-muted">
        {Object.values(CAT).map((c) => <span key={c.label} className="flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: c.color }} />{c.label}</span>)}
        <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full border border-dashed border-[#30d158]" />Rotina</span>
        {google?.connected && <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-white/80" />Google</span>}
      </div>

      <Sheet open={!!form} onClose={() => setForm(null)} title={form?.id ? "Editar compromisso" : "Novo compromisso"} accent="#5ab0ff">
        {form && <EventForm key={form.id ?? `${form.date}${form.start_time}`} ev={form} onDone={() => setForm(null)} />}
      </Sheet>
      <Sheet open={conn} onClose={() => setConn(false)} title="Conexão com calendário" accent="#30d158">
        <Connection feed={feed} google={google} />
      </Sheet>
    </div>
  );
}

function useNow() {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => { setN(Date.now()); const id = setInterval(() => setN(Date.now()), 1000); return () => clearInterval(id); }, []);
  return n;
}

const PX = 64; // pixels por hora no dia
function DayTimeline({ date, today, nowMin, blocks, allDay, gAllDay, onEvent, onEmpty, onAdd }: { date: string; today: string; nowMin: number | null; blocks: Block[]; allDay: CalEvent[]; gAllDay: GEv[]; onEvent: (e: CalEvent) => void; onEmpty: (min: number) => void; onAdd: () => void }) {
  const from = Math.min(5, ...blocks.map((b) => Math.floor(b.start / 60))), to = Math.max(23, ...blocks.map((b) => Math.ceil(b.end / 60)));
  const hours = Array.from({ length: to - from + 1 }, (_, i) => from + i);
  const ref = useRef<HTMLDivElement>(null);
  const ready = nowMin != null;
  useEffect(() => { if (!ref.current) return; const target = date === today && nowMin != null ? nowMin / 60 : Math.min(8, ...blocks.map((b) => b.start / 60)); ref.current.scrollTop = Math.max(0, (target - from - 1.5) * PX); }, [date, ready]); // eslint-disable-line react-hooks/exhaustive-deps
  const laid = lanes(blocks);
  return (
    <section className="glass rise overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4">
        <div><p className="font-display text-xl">{date === today ? "Hoje" : WD[new Date(date + "T12:00:00Z").getUTCDay()]}</p><p className="text-xs text-muted">{br(date)} · da hora que começa até a hora que termina</p></div>
        <button className="btn btn-accent !min-h-10 whitespace-nowrap shrink-0" onClick={onAdd}>+ Novo</button>
      </div>
      {(allDay.length > 0 || gAllDay.length > 0) && (
        <div className="flex flex-wrap gap-1.5 px-4 mt-3">
          {allDay.map((e) => <button key={e.id} onClick={() => onEvent(e)} className="press text-xs rounded-full px-3 py-1.5 border" style={{ borderColor: CAT[e.category]?.color + "66", background: CAT[e.category]?.color + "1a" }}>{CAT[e.category]?.e} {e.title}</button>)}
          {gAllDay.map((e) => <a key={e.id} href={e.link ?? "#"} target="_blank" rel="noreferrer" className="text-xs rounded-full px-3 py-1.5 border border-white/20 bg-white/5">G · {e.title}</a>)}
        </div>
      )}
      <div ref={ref} className="relative mt-3 overflow-y-auto" style={{ maxHeight: "62dvh" }}>
        <div className="relative" style={{ height: hours.length * PX }}>
          {hours.map((h, i) => (
            <button key={h} onClick={() => onEmpty(h * 60)} aria-label={`Novo às ${h}h`} className="absolute left-0 right-0 flex items-start text-left" style={{ top: i * PX, height: PX }}>
              <span className="w-12 shrink-0 text-[10px] num text-faint -mt-1.5 pl-3">{String(h % 24).padStart(2, "0")}:00</span>
              <span className="flex-1 border-t border-white/[.06] h-full" />
            </button>
          ))}
          {date === today && nowMin != null && nowMin / 60 >= from && nowMin / 60 <= to + 1 && (
            <div className="absolute left-10 right-2 z-20 pointer-events-none" style={{ top: (nowMin / 60 - from) * PX }}>
              <div className="h-[2px] bg-[#ff453a]" style={{ boxShadow: "0 0 8px #ff453a" }} /><span className="absolute -left-1.5 -top-[5px] h-3 w-3 rounded-full bg-[#ff453a] war-pulse" />
            </div>
          )}
          {laid.map((b) => {
            const top = (b.start / 60 - from) * PX, h = Math.max(22, ((b.end - b.start) / 60) * PX - 2), w = `calc((100% - 3.5rem) / ${b.lanes})`;
            const inner = (<>
              <span className="block text-[12px] font-semibold leading-tight truncate">{b.routine ? "🍽️ " : b.g ? "G · " : `${CAT[b.e!.category]?.e ?? ""} `}{b.title}</span>
              {h > 34 && <span className="block text-[10px] num opacity-75">{fmtMin(b.start)}–{fmtMin(b.end)}{b.e?.location ? ` · ${b.e.location}` : ""}</span>}
            </>);
            const style = { top, height: h, left: `calc(3.25rem + ${w} * ${b.lane})`, width: `calc(${w} - 4px)`, borderColor: b.color + (b.routine ? "88" : "aa"),
              background: b.routine ? "transparent" : `linear-gradient(160deg, ${b.color}38, ${b.color}14)`, boxShadow: b.routine ? "none" : `0 6px 18px -10px ${b.color}` } as React.CSSProperties;
            return b.e ? <button key={b.key} onClick={() => onEvent(b.e!)} className="absolute z-10 rounded-xl border-l-[3px] border px-2 py-1 text-left overflow-hidden press" style={style}>{inner}</button>
              : b.g ? <a key={b.key} href={b.g.link ?? "#"} target="_blank" rel="noreferrer" className="absolute z-10 rounded-xl border-l-[3px] border px-2 py-1 overflow-hidden" style={style}>{inner}</a>
              : <div key={b.key} className="absolute z-[5] rounded-xl border border-dashed px-2 py-1 overflow-hidden text-[#30d158]" style={style}>{inner}</div>;
          })}
        </div>
      </div>
      <p className="text-[11px] text-faint px-4 py-3">Toque num horário vazio para marcar ali.</p>
    </section>
  );
}

function WeekGrid({ start, today, nowMin, blocksOf, allDayOf, onDay, onEvent }: { start: string; today: string; nowMin: number | null; blocksOf: (d: string) => Block[]; allDayOf: (d: string) => CalEvent[]; onDay: (d: string) => void; onEvent: (e: CalEvent) => void }) {
  const days = Array.from({ length: 7 }, (_, i) => add(start, i)), F = 6, T = 23, P = 26;
  return (
    <section className="glass rise p-3 overflow-hidden">
      <div className="grid grid-cols-[1.75rem_repeat(7,minmax(0,1fr))] gap-x-1">
        <span />
        {days.map((d) => (
          <button key={d} onClick={() => onDay(d)} className="text-center pb-1">
            <span className="block text-[10px] text-muted">{WD[new Date(d + "T12:00:00Z").getUTCDay()].slice(0, 3)}</span>
            <span className={`block num text-sm ${d === today ? "text-[#5ab0ff] font-bold" : ""}`}>{+d.slice(8)}</span>
            <span className="block h-1.5">{allDayOf(d).length > 0 && <i className="inline-block h-1.5 w-1.5 rounded-full bg-[#ffd60a]" />}</span>
          </button>
        ))}
        <div className="relative" style={{ height: (T - F) * P }}>{Array.from({ length: T - F }, (_, i) => <span key={i} className="absolute right-0 text-[9px] num text-faint -translate-y-1/2" style={{ top: i * P }}>{F + i}</span>)}</div>
        {days.map((d) => (
          <div key={d} className="relative rounded-lg" style={{ height: (T - F) * P, background: d === today ? "rgba(90,176,255,.06)" : "rgba(255,255,255,.02)" }}>
            {Array.from({ length: T - F }, (_, i) => <span key={i} className="absolute inset-x-0 border-t border-white/[.05]" style={{ top: i * P }} />)}
            {lanes(blocksOf(d).filter((b) => !b.routine)).map((b) => {
              const top = Math.max(0, (b.start / 60 - F) * P), h = Math.max(10, ((b.end - b.start) / 60) * P - 1);
              return <button key={b.key} onClick={() => (b.e ? onEvent(b.e) : onDay(d))} className="absolute rounded-md overflow-hidden text-[8px] leading-tight text-left px-0.5"
                style={{ top, height: h, left: `${(b.lane / b.lanes) * 100}%`, width: `${100 / b.lanes}%`, background: b.color + "55", borderLeft: `2px solid ${b.color}` }}>{h > 18 ? b.title : ""}</button>;
            })}
            {d === today && nowMin != null && <span className="absolute inset-x-0 h-[2px] bg-[#ff453a] z-10" style={{ top: (nowMin / 60 - F) * P }} />}
          </div>
        ))}
      </div>
      <p className="text-[11px] text-faint mt-2">Toque num dia para abrir a linha do tempo.</p>
    </section>
  );
}

function AiBar({ today }: { today: string }) {
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const [res, setRes] = useState<{ reply: string; proposals: AgendaProposal[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [off, setOff] = useState<Set<number>>(new Set());
  const ask = () => start(async () => { setErr(null); setOff(new Set()); const r = await aiAgenda(text, today); if ("error" in r) { setErr(r.error); setRes(null); } else setRes(r); });
  const apply = () => start(async () => { const list = res!.proposals.filter((_, i) => !off.has(i)); const e = await applyProposals(list); if (e) setErr(e); else { haptic([20, 40, 20]); setRes(null); setText(""); } });
  return (
    <section className="rise rounded-[22px] p-[1px]" style={{ background: "linear-gradient(120deg, #5ab0ff, #bf5af2, #ff6b81)" }}>
      <div className="rounded-[21px] p-3 bg-[#07080d]">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden>✦</span>
          <p className="text-[10px] font-bold tracking-[.3em] bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg,#5ab0ff,#bf5af2)" }}>ASSISTENTE DE AGENDA</p>
        </div>
        <div className="flex items-end gap-2 mt-2">
          <textarea rows={2} className="field flex-1 !min-h-[52px] text-[15px] resize-none" value={text} onChange={(e) => setText(e.target.value)}
            placeholder="Ex.: tenho dentista quinta às 15h, reunião sábado 19h30 no salão e pagar o cartão dia 20" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && text.trim()) { e.preventDefault(); ask(); } }} />
          <button className="btn btn-accent !min-h-[52px] !px-4" disabled={pending || !text.trim()} onClick={ask} aria-label="Enviar">{pending && !res ? "…" : "→"}</button>
        </div>
        <p className="text-[10px] text-faint mt-1">Dica: no celular, toque no 🎤 do teclado e fale.</p>
        {err && <p className="text-sm text-[#ff6961] mt-2">{err}</p>}
        {res && (
          <div className="mt-3 grid gap-2">
            {res.reply && <p className="text-sm text-ink/85">{res.reply}</p>}
            {res.proposals.length === 0 ? <p className="text-xs text-muted">Nada para marcar.</p> : res.proposals.map((p, i) => {
              const c = CAT[p.category] ?? CAT.pessoal, on = !off.has(i);
              return (
                <button key={i} onClick={() => setOff((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; })}
                  className="press flex items-center gap-3 text-left rounded-2xl px-3 py-2.5 border" style={{ borderColor: on ? c.color + "66" : "rgba(255,255,255,.08)", background: on ? c.color + "14" : "transparent", opacity: on ? 1 : 0.5 }}>
                  <span className="text-[10px] font-bold rounded-md px-1.5 py-0.5 shrink-0" style={{ background: p.action === "apagar" ? "#ff453a33" : p.action === "alterar" ? "#ffd60a33" : "#30d15833", color: p.action === "apagar" ? "#ff6961" : p.action === "alterar" ? "#ffd60a" : "#30d158" }}>{p.action.toUpperCase()}</span>
                  <span className="flex-1 min-w-0"><span className="block text-sm font-medium truncate">{c.e} {p.title}</span>
                    <span className="block text-[11px] text-muted num">{WD[new Date(p.date + "T12:00:00Z").getUTCDay()].slice(0, 3)} {br(p.date)} · {p.start_time ? `${p.start_time}${p.end_time ? `–${p.end_time}` : ""}` : "dia todo"}{p.location ? ` · ${p.location}` : ""}</span></span>
                  <span className="h-5 w-5 rounded-md border grid place-items-center text-[11px]" style={{ borderColor: on ? c.color : "rgba(255,255,255,.3)", background: on ? c.color : "transparent", color: "#000" }}>{on ? "✓" : ""}</span>
                </button>);
            })}
            {res.proposals.length > 0 && <div className="grid grid-cols-2 gap-2">
              <button className="btn" onClick={() => setRes(null)}>Descartar</button>
              <button className="btn btn-accent" disabled={pending || off.size === res.proposals.length} onClick={apply}>{pending ? "Salvando…" : `Confirmar (${res.proposals.length - off.size})`}</button>
            </div>}
          </div>
        )}
      </div>
    </section>
  );
}

function EventRow({ e, onClick, showDate }: { e: CalEvent; onClick: () => void; showDate?: boolean }) {
  const c = CAT[e.category] ?? CAT.pessoal;
  return (
    <li><button onClick={onClick} className="press w-full flex items-center gap-3 text-left rounded-2xl px-3 py-2.5 border" style={{ borderColor: c.color + "33", background: `linear-gradient(90deg, ${c.color}14, transparent 70%)` }}>
      <span className="w-1 self-stretch rounded-full" style={{ background: c.color }} />
      <span className="w-14 shrink-0 num text-xs text-muted leading-tight">{showDate && <span className="block text-ink">{br(e.date)}</span>}{e.start_time ? `${hm(e.start_time)}${e.end_time ? `–${hm(e.end_time)}` : ""}` : "dia todo"}</span>
      <span className="flex-1 min-w-0"><span className="block font-medium truncate">{c.e} {e.title}</span>{e.location && <span className="block text-xs text-muted truncate">📍 {e.location}</span>}</span>
      {e.remind_min != null && <span className="text-xs text-muted" title="Lembrete">🔔</span>}
    </button></li>
  );
}

function EventForm({ ev, onDone }: { ev: Partial<CalEvent>; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState({ title: ev.title ?? "", date: ev.date ?? "", allDay: !ev.start_time && !!ev.id, start: hm(ev.start_time ?? null) || "09:00", end: hm(ev.end_time ?? null) || "10:00",
    category: ev.category ?? "pessoal", location: ev.location ?? "", notes: ev.notes ?? "", remind: ev.remind_min != null ? String(ev.remind_min) : "30" });
  const save = () => start(async () => {
    const e = await saveEvent({ title: f.title, date: f.date, start_time: f.allDay ? null : f.start, end_time: f.allDay ? null : f.end || null, category: f.category as never,
      location: f.location.trim() || null, notes: f.notes.trim() || null, remind_min: f.remind === "" ? null : +f.remind }, ev.id);
    if (e) setErr(e); else { haptic(15); onDone(); }
  });
  return (
    <div className="grid gap-3">
      <Field label="Título"><input className="field" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Ex.: Reunião, saída de campo, dentista" /></Field>
      <div className="flex flex-wrap gap-1.5">{Object.entries(CAT).map(([k, c]) => <button key={k} className="chip !min-h-9 text-xs" aria-pressed={f.category === k} onClick={() => setF({ ...f, category: k })}>{c.e} {c.label}</button>)}</div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Data"><input type="date" className="field" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        <label className="flex items-center gap-2 min-h-11 mt-5 text-sm"><input type="checkbox" className="h-5 w-5" checked={f.allDay} onChange={(e) => setF({ ...f, allDay: e.target.checked })} />Dia todo</label>
      </div>
      {!f.allDay && <div className="grid grid-cols-2 gap-2">
        <Field label="Início"><input type="time" className="field" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></Field>
        <Field label="Fim"><input type="time" className="field" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></Field>
      </div>}
      <Field label="Local"><input className="field" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} placeholder="Opcional" /></Field>
      <Field label="Lembrete">
        <select className="field" value={f.remind} onChange={(e) => setF({ ...f, remind: e.target.value })}>
          <option value="">Sem lembrete</option><option value="0">Na hora</option><option value="10">10 min antes</option><option value="30">30 min antes</option><option value="60">1 hora antes</option><option value="1440">1 dia antes</option>
        </select>
      </Field>
      <Field label="Notas"><textarea className="field !min-h-[70px]" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
      {err && <p role="alert" className="text-sm text-[#ff6961]">{err}</p>}
      <div className="flex gap-2">
        {ev.id && <button className="btn text-muted" disabled={pending} onClick={() => { if (confirm("Excluir este compromisso?")) start(async () => { const e = await deleteEvent(ev.id!); if (e) setErr(e); else onDone(); }); }}>Excluir</button>}
        <button className="btn btn-accent flex-1" disabled={pending || !f.title.trim() || !f.date} onClick={save}>{pending ? "Salvando…" : ev.id ? "Salvar" : "Criar"}</button>
      </div>
    </div>
  );
}

function Connection({ feed, google }: { feed: string | null; google?: GoogleState }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const https = feed ? `https://${feed}` : "", webcal = feed ? `webcal://${feed}` : "";
  const copy = async () => { try { await navigator.clipboard.writeText(https); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { setErr("Não deu para copiar. Segure o link e copie."); } };
  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border p-4" style={{ borderColor: feed ? "#30d15855" : "rgba(255,255,255,.1)", background: feed ? "rgba(48,209,88,.07)" : "transparent" }}>
        <p className="text-sm font-semibold flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: feed ? "#30d158" : "#8e8e93" }} />{feed ? "Link de assinatura ativo" : "Nenhum calendário conectado"}</p>
        <p className="text-xs text-muted mt-1">Seus compromissos do BRIO aparecem no Calendário do iPhone, Google Agenda ou Outlook e atualizam sozinhos (a cada hora, mais ou menos).</p>
        {feed && <p className="mt-3 text-[11px] font-mono break-all rounded-xl bg-black/40 p-2.5 select-all">{https}</p>}
        <div className="grid gap-2 mt-3">
          {feed ? <>
            <a href={webcal} className="btn btn-accent">📅 Abrir no Calendário do iPhone</a>
            <button className="btn" onClick={copy}>{copied ? "Copiado ✓" : "Copiar link"}</button>
          </> : <button className="btn btn-accent" disabled={pending} onClick={() => start(async () => setErr(await rotateCalendarToken()))}>{pending ? "Gerando…" : "Gerar link de conexão"}</button>}
        </div>
      </div>
      {feed && <div className="grid gap-2 text-sm">
        <p className="label">Como conectar</p>
        <p><b>iPhone:</b> toque em “Abrir no Calendário do iPhone” → <i>Assinar</i>. Ou Ajustes → Calendário → Contas → Adicionar conta → Outra → Adicionar calendário assinado → cole o link.</p>
        <p><b>Google Agenda (no computador):</b> calendar.google.com → “Outras agendas” → <i>+</i> → <i>Do URL</i> → cole o link.</p>
        <p className="text-xs text-muted">A conexão é de leitura: você cria e edita aqui no BRIO, e o calendário mostra. Quem tiver o link vê seus compromissos, então não compartilhe.</p>
      </div>}
      {feed && <div className="grid grid-cols-2 gap-2">
        <button className="btn" disabled={pending} onClick={() => { if (confirm("Trocar o link? O antigo para de funcionar e você precisa assinar de novo.")) start(async () => setErr(await rotateCalendarToken())); }}>Trocar link</button>
        <button className="btn text-muted" disabled={pending} onClick={() => { if (confirm("Desconectar? Os calendários assinados param de atualizar.")) start(async () => setErr(await disableCalendarToken())); }}>Desconectar</button>
      </div>}
      <div className="rounded-2xl border p-4" style={{ borderColor: google?.connected ? "#4285f455" : "rgba(255,255,255,.1)", background: google?.connected ? "rgba(66,133,244,.08)" : "transparent" }}>
        <p className="text-sm font-semibold flex items-center gap-2"><span className="grid place-items-center h-5 w-5 rounded bg-white text-[11px] font-black text-[#4285f4]">G</span>Google Agenda · 2 vias
          {google?.connected && <span className="text-[10px] text-[#30d158] font-normal">conectado</span>}</p>
        <p className="text-xs text-muted mt-1">{google?.connected ? `Conta ${google.email ?? ""}. O que você cria aqui vai para o Google; os eventos do Google aparecem aqui com a marca G.` : "Cria, edita e apaga no Google automaticamente, e mostra seus eventos do Google aqui."}</p>
        {google?.flash && <p className="text-xs mt-2" style={{ color: google.flash === "ok" ? "#30d158" : "#ff6961" }}>{({"ok": "Google Agenda conectado ✓", "config": "Falta o GOOGLE_CLIENT_SECRET na Vercel.", "erro": "O Google não confirmou a conexão. Tente de novo.", "sem-refresh": "O Google não liberou acesso contínuo. Remova o BRIO em myaccount.google.com/permissions e conecte de novo.", "migracao": "Rode a migração 20261117000000_google_agenda.sql no Supabase."} as Record<string, string>)[google.flash] ?? ""}</p>}
        {google?.error && <p className="text-xs mt-2 text-[#ff6961]">A conexão expirou. Conecte de novo.</p>}
        {!google?.migrated && <p className="text-xs mt-2 text-[#ff6961]">Rode a migração 20261117000000_google_agenda.sql no Supabase.</p>}
        <div className="grid gap-2 mt-3">
          {google?.connected ? <>
            <button className="btn" disabled={pending} onClick={() => start(async () => setErr(await syncAllToGoogle()))}>{pending ? "Sincronizando…" : "Enviar compromissos ao Google"}</button>
            <button className="btn text-muted" disabled={pending} onClick={() => { if (confirm("Desconectar o Google Agenda? Os eventos já enviados continuam lá.")) start(async () => setErr(await disconnectGoogle())); }}>Desconectar Google</button>
          </> : google?.ready ? <a className="btn btn-accent" href="/api/google/connect">Conectar com Google</a>
            : <p className="text-xs text-muted">Precisa configurar as chaves do Google na Vercel primeiro (passo a passo no chat).</p>}
        </div>
      </div>
      {err && <p role="alert" className="text-sm text-[#ff6961]">{err}</p>}
    </div>
  );
}
