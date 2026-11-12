"use client";
import { useState, useTransition } from "react";
import { deleteContact, saveContact, visitContact } from "@/app/(app)/pioneiro/actions";
import { Sheet } from "@/components/kit";
import { FieldQuiz, FIELD_ICON } from "@/components/quiz/field-quiz";
import { CountUp } from "@/components/count-up";
import { shortDate, toHMM } from "@/lib/date";

const C = "#0a84ff";
export type Contact = { id: string; name: string; address: string | null; notes: string | null; next_visit: string | null; last_visit: string | null; status: "revisita" | "estudo" | "encerrado" };
type TodayEntry = { minutes: number; category: string; start_time?: string | null; end_time?: string | null; return_visits?: number | null; notes?: string | null };

export function FieldHub({ today, contacts, todayEntries, monthMinutes, goal }: { today: string; contacts: Contact[]; todayEntries: TodayEntry[]; monthMinutes: number; goal: number }) {
  const [quiz, setQuiz] = useState(false);
  const [edit, setEdit] = useState<Contact | null>(null);
  const [pending, start] = useTransition();
  const tMin = todayEntries.reduce((a, e) => a + e.minutes, 0), tRv = todayEntries.reduce((a, e) => a + (e.return_visits ?? 0), 0);
  const active = contacts.filter((c) => c.status !== "encerrado").sort((a, b) => (a.next_visit ?? "9999").localeCompare(b.next_visit ?? "9999"));
  const pct = goal ? Math.min(1, monthMinutes / goal) : 0;

  return (
    <div style={{ ["--accent" as string]: C }}>
      <section className="rounded-[26px] p-5 overflow-hidden relative border" style={{ borderColor: C + "44", background: `linear-gradient(160deg, ${C}2a, #0f0f11 65%)` }}>
        <div className="flex items-center gap-4">
          <span className="h-14 w-14 rounded-2xl grid place-items-center shrink-0 glow" style={{ background: C, ["--glow" as string]: C }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinejoin="round" aria-hidden><path d={FIELD_ICON} /></svg>
          </span>
          <div className="flex-1">
            <p className="label">Hoje</p>
            <p className="mt-0.5"><span className="num text-3xl">{toHMM(tMin)}</span><span className="text-muted ml-2 text-sm">{tRv ? `· ${tRv} revisitas` : tMin ? "" : "nada registrado ainda"}</span></p>
          </div>
        </div>
        <div className="mt-4"><div className="h-2 rounded-full bg-white/[.08] overflow-hidden"><div className="h-full rounded-full bar-grow" style={{ width: `${Math.max(2, pct * 100)}%`, background: C, boxShadow: `0 0 12px ${C}` }} /></div>
          <p className="text-xs text-muted mt-1.5"><CountUp value={Math.round(pct * 100)} />% da meta do mês · {toHMM(monthMinutes)} de {toHMM(goal)}</p></div>
        <button className="btn btn-accent w-full mt-4 !min-h-14 text-base" onClick={() => setQuiz(true)}>Registrar serviço de hoje</button>
      </section>

      {todayEntries.length > 0 && (
        <section className="glass rise p-5 mt-4">
          <p className="label mb-2">Relatório do dia</p>
          <ul className="grid gap-2">
            {todayEntries.map((e, i) => (
              <li key={i} className="text-[15px]">
                <span className="num">{toHMM(e.minutes)}</span>
                <span className="text-muted"> · {e.category === "campo" ? "Campo" : e.category === "publico" ? "Testemunho público" : e.category === "obra" ? "Obra" : "Assembleia"}{e.start_time ? ` · ${e.start_time.slice(0, 5)}–${e.end_time?.slice(0, 5)}` : ""}{e.return_visits ? ` · ${e.return_visits} revisitas` : ""}</span>
                {e.notes && <p className="text-sm text-muted mt-0.5">{e.notes}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="glass rise p-5 mt-4">
        <div className="flex items-baseline justify-between mb-3"><p className="label">Revisitas</p><p className="text-sm text-muted num">{active.length}</p></div>
        {active.length === 0 ? <p className="text-muted text-sm">Os contatos que você anotar ao registrar o serviço aparecem aqui, com a data para voltar.</p> : (
          <ul className="grid gap-2">
            {active.map((c) => {
              const due = c.next_visit && c.next_visit <= today;
              return (
                <li key={c.id} className="flex items-center gap-3 rounded-2xl p-3 border" style={{ borderColor: due ? C + "66" : "rgba(255,255,255,.06)", background: due ? `${C}14` : "#141416" }}>
                  <button className="flex items-center gap-3 flex-1 min-w-0 text-left" onClick={() => setEdit(c)}>
                    <span className="h-10 w-10 rounded-full grid place-items-center font-semibold text-black shrink-0" style={{ background: c.status === "estudo" ? "#30d158" : C }}>{c.name[0]?.toUpperCase()}</span>
                    <span className="min-w-0"><span className="block truncate">{c.name}{c.status === "estudo" && <span className="tag ml-2" style={{ color: "#30d158" }}>estudo</span>}</span>
                      <span className="text-xs block truncate" style={{ color: due ? C : "#8e8e93" }}>{c.next_visit ? (due ? `Voltar hoje${c.next_visit < today ? " (atrasada)" : ""}` : `Voltar em ${shortDate(c.next_visit)}`) : c.address || "sem data marcada"}</span></span>
                  </button>
                  <button className="btn !min-h-10 text-sm shrink-0" disabled={pending} onClick={() => { const d = prompt("Visitado! Próxima visita (AAAA-MM-DD), ou deixe vazio:", ""); start(() => visitContact(c.id, d)); }}>Visitei</button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Sheet accent={C} open={quiz} onClose={() => setQuiz(false)} title="Serviço de hoje">{quiz && <FieldQuiz today={today} contacts={active} onClose={() => setQuiz(false)} />}</Sheet>
      <Sheet accent={C} open={!!edit} onClose={() => setEdit(null)} title={edit?.name ?? ""}>{edit && <ContactForm c={edit} onDone={() => setEdit(null)} />}</Sheet>
    </div>
  );
}

function ContactForm({ c, onDone }: { c: Contact; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [f, setF] = useState({ name: c.name, address: c.address ?? "", notes: c.notes ?? "", next_visit: c.next_visit, status: c.status });
  return (
    <div className="grid gap-3">
      <input className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} aria-label="Nome" />
      <input className="field" value={f.address} placeholder="Endereço" onChange={(e) => setF({ ...f, address: e.target.value })} />
      <textarea className="field" rows={3} value={f.notes} placeholder="Observações, assuntos, textos usados" onChange={(e) => setF({ ...f, notes: e.target.value })} />
      <label className="grid gap-1.5"><span className="label">Próxima visita</span><input type="date" className="field" value={f.next_visit ?? ""} onChange={(e) => setF({ ...f, next_visit: e.target.value || null })} /></label>
      <div className="flex gap-2">{(["revisita", "estudo", "encerrado"] as const).map((s) => <button key={s} className="chip" aria-pressed={f.status === s} onClick={() => setF({ ...f, status: s })}>{s === "revisita" ? "Revisita" : s === "estudo" ? "Estudo bíblico" : "Encerrado"}</button>)}</div>
      {c.last_visit && <p className="text-xs text-muted">Última visita: {shortDate(c.last_visit)}</p>}
      <div className="flex gap-2 mt-1">
        <button className="btn text-muted" disabled={pending} onClick={() => { if (confirm("Excluir contato?")) start(async () => { await deleteContact(c.id); onDone(); }); }}>Excluir</button>
        <button className="btn btn-accent flex-1" disabled={pending || !f.name.trim()} onClick={() => start(async () => { await saveContact(f, c.id); onDone(); })}>Salvar</button>
      </div>
    </div>
  );
}
