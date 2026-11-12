"use client";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { deleteEvent, disableCalendarToken, rotateCalendarToken, saveEvent } from "@/app/(app)/agenda/actions";
import { Field, Sheet } from "@/components/kit";
import { haptic } from "@/components/game/xp";

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

export function Agenda({ today, month, events, ready, feed }: { today: string; month: string; events: CalEvent[]; ready: boolean; feed: string | null }) {
  const [sel, setSel] = useState(today.slice(0, 7) === month.slice(0, 7) ? today : month);
  const [form, setForm] = useState<null | Partial<CalEvent>>(null);
  const [conn, setConn] = useState(false);
  const y = +month.slice(0, 4), mo = +month.slice(5, 7);
  const prev = `${mo === 1 ? y - 1 : y}-${String(mo === 1 ? 12 : mo - 1).padStart(2, "0")}`, next = `${mo === 12 ? y + 1 : y}-${String(mo === 12 ? 1 : mo + 1).padStart(2, "0")}`;
  const first = month, lead = (new Date(first + "T12:00:00Z").getUTCDay() + 6) % 7;
  const days = Array.from({ length: 42 }, (_, i) => add(first, i - lead));
  const byDay = useMemo(() => { const m = new Map<string, CalEvent[]>(); for (const e of events) m.set(e.date, [...(m.get(e.date) ?? []), e]); return m; }, [events]);
  const list = byDay.get(sel) ?? [];
  const upcoming = events.filter((e) => e.date >= today).slice(0, 6);

  return (
    <div style={{ ["--accent" as string]: "#5ab0ff" }}>
      <header className="rise mb-5 flex items-end justify-between gap-3 min-w-0">
        <div className="min-w-0"><p className="text-[11px] font-semibold tracking-[.3em]" style={{ color: "#5ab0ff" }}>AGENDA</p>
          <h1 className="font-display text-[clamp(32px,10vw,44px)] leading-none mt-1 capitalize">{MES[mo - 1]} <span className="text-muted">{y}</span></h1></div>
        <button onClick={() => setConn(true)} className="press shrink-0 rounded-2xl px-3 py-2 border text-xs font-semibold flex items-center gap-2"
          style={{ borderColor: feed ? "#30d15866" : "rgba(255,255,255,.15)", background: feed ? "rgba(48,209,88,.1)" : "transparent" }}>
          <span className={`h-2 w-2 rounded-full ${feed ? "war-pulse" : ""}`} style={{ background: feed ? "#30d158" : "#8e8e93" }} />{feed ? "Conectado" : "Conectar"}</button>
      </header>

      {!ready && <p className="glass p-4 mb-4 text-sm text-[#ff6961]">Rode a migração <b>supabase/migrations/20261116000000_agenda.sql</b> no Supabase para usar a agenda.</p>}

      <section className="glass rise p-4">
        <div className="flex items-center justify-between mb-3">
          <Link href={`/agenda?m=${prev}`} className="btn !min-h-9 !px-3" aria-label="Mês anterior">‹</Link>
          <button className="text-xs text-muted underline underline-offset-4" onClick={() => setSel(today)}>hoje</button>
          <Link href={`/agenda?m=${next}`} className="btn !min-h-9 !px-3" aria-label="Próximo mês">›</Link>
        </div>
        <div className="grid grid-cols-[repeat(7,minmax(0,1fr))] gap-1 text-center">
          {DS.map((d, i) => <span key={i} className="text-[11px] text-faint pb-1">{d}</span>)}
          {days.map((d) => {
            const inMonth = d.slice(0, 7) === month.slice(0, 7), evs = byDay.get(d) ?? [], on = d === sel, isToday = d === today;
            return (
              <button key={d} onClick={() => { setSel(d); haptic(5); }} aria-pressed={on} aria-label={`${br(d)}${evs.length ? `, ${evs.length} compromissos` : ""}`}
                className={`press rounded-xl h-11 !min-h-0 min-w-0 flex flex-col items-center justify-center gap-0.5 border transition-colors ${inMonth ? "" : "opacity-30"}`}
                style={{ borderColor: on ? "#5ab0ff" : isToday ? "rgba(90,176,255,.4)" : "transparent", background: on ? "rgba(90,176,255,.16)" : "transparent" }}>
                <span className={`num text-sm ${isToday ? "font-bold text-[#5ab0ff]" : ""}`}>{+d.slice(8)}</span>
                <span className="flex gap-0.5 h-1.5">{evs.slice(0, 3).map((e) => <i key={e.id} className="h-1.5 w-1.5 rounded-full" style={{ background: CAT[e.category]?.color }} />)}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="glass rise p-4 mt-4">
        <div className="flex items-center justify-between">
          <p className="font-display text-lg">{sel === today ? "Hoje" : br(sel)}</p>
          <button className="btn btn-accent !min-h-10" onClick={() => setForm({ date: sel, category: "pessoal" })}>+ Compromisso</button>
        </div>
        {list.length === 0 ? <p className="text-sm text-muted mt-3">Nada marcado. Toque em “+ Compromisso”.</p> : (
          <ul className="grid grid-cols-1 gap-2 mt-3 [&>li]:min-w-0">{list.map((e) => <EventRow key={e.id} e={e} onClick={() => setForm(e)} />)}</ul>
        )}
      </section>

      {upcoming.length > 0 && (
        <section className="glass rise p-4 mt-4">
          <p className="label mb-2">Próximos</p>
          <ul className="grid grid-cols-1 gap-2 [&>li]:min-w-0">{upcoming.map((e) => <EventRow key={e.id} e={e} showDate onClick={() => setForm(e)} />)}</ul>
        </section>
      )}

      <Sheet open={!!form} onClose={() => setForm(null)} title={form?.id ? "Editar compromisso" : "Novo compromisso"} accent="#5ab0ff">
        {form && <EventForm key={form.id ?? form.date} ev={form} onDone={() => setForm(null)} />}
      </Sheet>
      <Sheet open={conn} onClose={() => setConn(false)} title="Conexão com calendário" accent="#30d158">
        <Connection feed={feed} />
      </Sheet>
    </div>
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

function Connection({ feed }: { feed: string | null }) {
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
      <div className="rounded-2xl border border-white/10 p-4">
        <p className="text-sm font-semibold">Google Agenda em 2 vias <span className="text-[10px] text-muted font-normal ml-1">em breve</span></p>
        <p className="text-xs text-muted mt-1">Para o que você criar no Google aparecer aqui também, é preciso registrar o BRIO no Google Cloud (OAuth). Dá para fazer quando quiser.</p>
      </div>
      {err && <p role="alert" className="text-sm text-[#ff6961]">{err}</p>}
    </div>
  );
}
