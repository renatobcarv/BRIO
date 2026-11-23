"use client";
import { NoteRead, RichNote } from "@/components/rich-note";
import { Candle } from "@/components/meters";
import { useState, useTransition } from "react";
import { addJournal, addStudy, deleteJournal, deleteStudy } from "@/app/(app)/espiritual/actions";
import { Card, Empty } from "@/components/ui";
import { shortDate } from "@/lib/date";

export const STUDY_TYPES = { biblia: "Bíblia", publicacao: "Publicação", meio_semana: "Reunião do meio de semana",
  sentinela: "Sentinela", pesquisa: "Pesquisa de tema", outro: "Outro" } as const;
const KINDS = { oracao: "Motivo de oração", gratidao: "Gratidão", reflexao: "Reflexão" } as const;
type Study = { id: string; date: string; type: keyof typeof STUDY_TYPES; material: string | null; minutes: number; takeaway: string | null };
type Journal = { id: string; date: string; kind: keyof typeof KINDS; text: string };

export function StudyTab({ today, studies }: { today: string; studies: Study[] }) {
  const [pending, start] = useTransition();
  const [f, setF] = useState({ date: today, type: "publicacao" as keyof typeof STUDY_TYPES, material: "", minutes: "30", takeaway: "" });
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
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
        <div className="mt-2"><RichNote value={f.takeaway} onChange={(v) => { setF({ ...f, takeaway: v }); setOk(false); }} placeholder="O que aprendi / como vou aplicar" /></div>
        {f.takeaway.length > 500 && <p className="text-[11px] text-faint mt-1 num">{f.takeaway.length.toLocaleString("pt-BR")} caracteres</p>}
        {err && <p role="alert" className="text-sm text-[#ff6961] mt-2">{err}</p>}
        {ok && <p className="text-sm text-[#30d158] mt-2">Estudo salvo ✓</p>}
        <button className="btn btn-accent w-full mt-3" disabled={pending}
          onClick={() => start(async () => { const e = await addStudy({ ...f, minutes: Number(f.minutes) || 0 }); setErr(e); if (!e) { setOk(true); setF({ ...f, material: "", takeaway: "" }); } })}>Salvar estudo</button>
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
                {s.takeaway && <Takeaway text={s.takeaway} />}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

export { BibleTab } from "./bible";

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
        <div className="mt-3"><RichNote value={text} onChange={setText} placeholder="Escreva com calma… Use os botões para título, destaque e textos bíblicos." /></div>
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
                <div className="mt-2"><NoteRead text={e.text} clamp={600} /></div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

/** Anotação longa: mostra o começo e expande. Mantém as quebras de linha. */
function Takeaway({ text }: { text: string }) {
  return <div className="mt-1"><NoteRead text={text} clamp={420} /></div>;
}
