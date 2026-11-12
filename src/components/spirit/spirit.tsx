"use client";
import { Candle, Scroll } from "@/components/meters";
import { useOptimistic, useState, useTransition } from "react";
import { addJournal, addStudy, deleteJournal, deleteStudy, toggleChapter } from "@/app/(app)/espiritual/actions";
import { Card, Empty } from "@/components/ui";
import { shortDate } from "@/lib/date";
import { BOOKS, TOTAL_CHAPTERS } from "@/lib/bible";

const ACC = "#ffb340";
export const STUDY_TYPES = { biblia: "Bíblia", publicacao: "Publicação", meio_semana: "Reunião do meio de semana",
  sentinela: "Sentinela", pesquisa: "Pesquisa de tema", outro: "Outro" } as const;
const KINDS = { oracao: "Motivo de oração", gratidao: "Gratidão", reflexao: "Reflexão" } as const;
type Study = { id: string; date: string; type: keyof typeof STUDY_TYPES; material: string | null; minutes: number; takeaway: string | null };
type Journal = { id: string; date: string; kind: keyof typeof KINDS; text: string };

export function StudyTab({ today, studies }: { today: string; studies: Study[] }) {
  const [pending, start] = useTransition();
  const [f, setF] = useState({ date: today, type: "publicacao" as keyof typeof STUDY_TYPES, material: "", minutes: "30", takeaway: "" });
  return (
    <>
      {(() => { const from = new Date(Date.parse(today + "T12:00:00Z") - 6 * 864e5).toISOString().slice(0, 10), wk = studies.filter((s) => s.date >= from).reduce((a, s) => a + s.minutes, 0), target = 210; return (
        <Card className="mb-4">
          <div className="flex items-center gap-4">
            <Candle pct={wk / target} size={40} />
            <div className="flex-1"><p className="label">Estudo nos últimos 7 dias</p>
              <p className="mt-1"><span className="num text-3xl">{Math.floor(wk / 60)}h{String(wk % 60).padStart(2, "0")}</span> <span className="text-muted text-sm">de 3h30</span></p>
              <p className="text-xs text-muted mt-0.5">{wk >= target ? "A vela está alta. Constância é luz." : "Cada estudo alimenta a chama."}</p></div>
          </div>
        </Card>); })()}
      <Card>
        <p className="label mb-3">Registrar estudo</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(STUDY_TYPES) as (keyof typeof STUDY_TYPES)[]).map((t) =>
            <button key={t} className="chip" aria-pressed={f.type === t} onClick={() => setF({ ...f, type: t })}>{STUDY_TYPES[t]}</button>)}
        </div>
        <div className="grid grid-cols-[1fr_6rem] gap-2 mt-3">
          <input type="date" className="field" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} aria-label="Data" />
          <input className="field text-center num" inputMode="numeric" value={f.minutes} onChange={(e) => setF({ ...f, minutes: e.target.value })} aria-label="Minutos" />
        </div>
        <input className="field mt-2" placeholder="Material / referência" value={f.material} onChange={(e) => setF({ ...f, material: e.target.value })} />
        <textarea className="field mt-2" placeholder="O que aprendi / como vou aplicar" value={f.takeaway} onChange={(e) => setF({ ...f, takeaway: e.target.value })} />
        <button className="btn btn-accent w-full mt-3" disabled={pending}
          onClick={() => start(async () => { await addStudy({ ...f, minutes: Number(f.minutes) || 0 }); setF({ ...f, material: "", takeaway: "" }); })}>Salvar estudo</button>
      </Card>
      <Card className="mt-4">
        <p className="label mb-2">Estudos recentes</p>
        {studies.length === 0 ? <Empty>Seu primeiro estudo registrado aparecerá aqui.</Empty> : (
          <ul className="divide-y divide-white/5">
            {studies.slice(0, 20).map((s) => (
              <li key={s.id} className="py-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted w-16">{shortDate(s.date)}</span>
                  <span className="flex-1 text-sm">{STUDY_TYPES[s.type]}{s.material ? ` · ${s.material}` : ""}</span>
                  <span className="num text-sm">{s.minutes} min</span>
                  <button className="btn !min-h-9 !px-3 text-muted" aria-label="Excluir" onClick={() => { if (confirm("Excluir?")) start(() => deleteStudy(s.id)); }}>×</button>
                </div>
                {s.takeaway && <p className="font-display italic mt-1 text-[15px]">{s.takeaway}</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

export function BibleTab({ read, streak }: { read: { book: number; chapter: number }[]; streak: number }) {
  const [, start] = useTransition();
  const [set, toggle] = useOptimistic(new Set(read.map((r) => `${r.book}:${r.chapter}`)),
    (s: Set<string>, k: { key: string; on: boolean }) => { const n = new Set(s); if (k.on) n.add(k.key); else n.delete(k.key); return n; });
  const [open, setOpen] = useState<number | null>(null);
  const total = set.size;
  return (
    <>
      <Card>
        <div className="flex items-end justify-between">
          <div><p className="label">Bíblia inteira</p><p className="mt-1"><span className="num text-4xl">{total}</span> <span className="text-muted">/ {TOTAL_CHAPTERS} capítulos</span></p></div>
          <div className="text-right"><Scroll pct={total / TOTAL_CHAPTERS} size={70} /><p className="label mt-1">Sequência <span className="num text-gold">{streak} d</span></p></div>
        </div>
        <div className="bar mt-3"><i style={{ width: `${(total / TOTAL_CHAPTERS) * 100}%` }} /></div>
        <p className="text-xs text-muted mt-1">{((total / TOTAL_CHAPTERS) * 100).toFixed(1).replace(".", ",")}%</p>
      </Card>
      <Card className="mt-4">
        <p className="label mb-3">Livros</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {BOOKS.map(([name, n], i) => {
            const b = i + 1, done = Array.from({ length: n }, (_, c) => set.has(`${b}:${c + 1}`)).filter(Boolean).length;
            return (
              <button key={b} onClick={() => setOpen(open === b ? null : b)} aria-expanded={open === b}
                className={`text-left rounded-xl p-3 min-h-14 border transition-colors ${open === b ? "border-gold/50 bg-white/[.05]" : "border-white/5"}`}>
                <span className="text-sm block">{name}</span>
                <span className="bar block mt-2 !h-1"><i style={{ width: `${(done / n) * 100}%` }} /></span>
                <span className="text-[11px] text-muted">{done}/{n}</span>
              </button>
            );
          })}
        </div>
        {open && (
          <div className="mt-4">
            <p className="font-display text-xl mb-2">{BOOKS[open - 1][0]}</p>
            <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5">
              {Array.from({ length: BOOKS[open - 1][1] }, (_, c) => {
                const key = `${open}:${c + 1}`, on = set.has(key);
                return <button key={key} aria-pressed={on} aria-label={`Capítulo ${c + 1}`}
                  onClick={() => start(async () => { toggle({ key, on: !on }); await toggleChapter(open, c + 1, !on); })}
                  className="aspect-square min-h-9 rounded-lg text-xs" style={{ background: on ? ACC : "rgba(255,255,255,.05)", color: on ? "#120f08" : undefined }}>{c + 1}</button>;
              })}
            </div>
          </div>
        )}
      </Card>
    </>
  );
}

export function JournalTab({ entries }: { entries: Journal[] }) {
  const [pending, start] = useTransition();
  const [kind, setKind] = useState<keyof typeof KINDS>("oracao");
  const [text, setText] = useState("");
  return (
    <>
      <Card>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(KINDS) as (keyof typeof KINDS)[]).map((k) => <button key={k} className="chip" aria-pressed={kind === k} onClick={() => setKind(k)}>{KINDS[k]}</button>)}
        </div>
        <textarea className="field mt-3" placeholder="Escreva com calma…" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn btn-accent w-full mt-3" disabled={pending || !text.trim()}
          onClick={() => start(async () => { await addJournal(kind, text); setText(""); })}>Guardar</button>
      </Card>
      <Card className="mt-4">
        {entries.length === 0 ? <Empty>Um coração que agradece começa por escrever.</Empty> : (
          <ul className="divide-y divide-white/5">
            {entries.map((e) => (
              <li key={e.id} className="py-3">
                <div className="flex items-center gap-3"><span className="label flex-1">{shortDate(e.date)} · {KINDS[e.kind]}</span>
                  <button className="btn !min-h-9 !px-3 text-muted" aria-label="Excluir" onClick={() => { if (confirm("Excluir?")) start(() => deleteJournal(e.id)); }}>×</button></div>
                <p className="font-display text-[17px] mt-1 whitespace-pre-line">{e.text}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
