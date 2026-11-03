"use client";
import { useState, useTransition } from "react";
import { activateProgram, archiveProgram, deleteProgram, saveProgram } from "@/app/(app)/corpo/program-actions";
import { Empty } from "@/components/ui";
import { Field, LinkBtn, SectionTitle, Sheet, fmt, n } from "@/components/kit";
import { shortDate, weekdayShort } from "@/lib/date";
import {
  GOALS, MUSCLES, PHASE_KINDS, guessMuscle, newPhaseId, phaseRanges, plannedSetsByMuscle, programPosition, templateFromPlan, totalWeeks,
  type Goal, type Muscle, type Phase, type PhaseKind, type PlannedEx, type Program,
} from "@/lib/training";

const G = "#8ac295";
const ORDER = ["1", "2", "3", "4", "5", "6", "0"];
const blankEx = (): PlannedEx => ({ name: "", muscle: "outro", sets: 3, reps: "8-12", kg: null, rpe: 7, rir: 2, rest: 90, notes: "" });
const numOrNull = (s: string) => (s.trim() === "" ? null : n(s));

/* ───────── Linha do tempo ───────── */
export function Timeline({ p, today }: { p: Program; today: string }) {
  const pos = programPosition(p, today), total = Math.max(1, totalWeeks(p));
  return (
    <div>
      <div className="flex h-9 rounded-xl overflow-hidden gap-[2px]" role="img" aria-label="Fases do programa">
        {p.phases.map((f, i) => (
          <div key={f.id} className="relative grid place-items-center text-[11px] font-medium text-[#120f08] min-w-0"
            style={{ flex: f.weeks, background: PHASE_KINDS[f.kind].color, opacity: pos.status === "andamento" && i !== pos.phaseIndex ? 0.45 : 1 }} title={`${f.name} · ${f.weeks} sem.`}>
            <span className="truncate px-1">{f.weeks >= 2 ? f.name : ""}</span>
          </div>
        ))}
      </div>
      <div className="relative h-5 mt-1">
        {pos.status === "andamento" && <span className="absolute -top-0.5 -translate-x-1/2 text-xs" style={{ left: `${((pos.week - 0.5) / total) * 100}%` }}>▲</span>}
        <div className="flex justify-between text-[10px] text-faint pt-0.5"><span>S1</span><span>S{total}</span></div>
      </div>
    </div>
  );
}

/* ───────── Editor de fase ───────── */
function PhaseEditor({ phase, overrides, onSave, onCancel }: { phase: Phase; overrides: Record<string, Muscle>; onSave: (f: Phase) => void; onCancel: () => void }) {
  const [f, setF] = useState<Phase>(() => JSON.parse(JSON.stringify(phase)));
  const [day, setDay] = useState(ORDER.find((d) => (phase.days[d] ?? []).length) ?? "1");
  const list = f.days[day] ?? [];
  const setList = (l: PlannedEx[]) => setF({ ...f, days: { ...f.days, [day]: l } });
  const upd = (i: number, p: Partial<PlannedEx>) => setList(list.map((e, j) => (j === i ? { ...e, ...p } : e)));
  const move = (i: number, d: number) => { const l = [...list]; [l[i], l[i + d]] = [l[i + d], l[i]]; setList(l); };
  const vol = plannedSetsByMuscle(f);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      <div className="grid grid-cols-[minmax(0,1fr)_5rem] gap-2">
        <Field label="Nome da fase"><input className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Semanas"><input className="field num text-center" inputMode="numeric" value={f.weeks} onChange={(e) => setF({ ...f, weeks: Math.max(1, Math.round(n(e.target.value))) })} /></Field>
      </div>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(PHASE_KINDS) as PhaseKind[]).map((k) => (
          <button key={k} className="chip" aria-pressed={f.kind === k} onClick={() => setF({ ...f, kind: k })} style={f.kind === k ? { background: PHASE_KINDS[k].color } : undefined}>{PHASE_KINDS[k].label}</button>
        ))}
      </div>
      <Field label="Objetivo da fase / observações"><textarea className="field" rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>

      <div>
        <p className="label mb-2">Treinos da semana</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {ORDER.map((d) => <button key={d} className="chip shrink-0" aria-pressed={day === d} onClick={() => setDay(d)}>{weekdayShort[+d]}{(f.days[d] ?? []).length ? ` · ${(f.days[d] ?? []).length}` : ""}</button>)}
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
        {list.length === 0 && <p className="font-display italic text-muted">Dia de descanso. Adicione exercícios se houver treino.</p>}
        {list.map((e, i) => (
          <div key={i} className="rounded-2xl border border-white/[.07] bg-white/[.02] p-3 grid grid-cols-[minmax(0,1fr)] gap-2">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,8.5rem)] gap-2">
              <input className="field !min-h-11" placeholder="Exercício" value={e.name} aria-label="Exercício"
                onChange={(ev) => upd(i, { name: ev.target.value, muscle: e.muscle === "outro" || e.muscle === guessMuscle(e.name, overrides) ? guessMuscle(ev.target.value, overrides) : e.muscle })} />
              <select className="field !min-h-11 !px-2 text-sm" value={e.muscle} onChange={(ev) => upd(i, { muscle: ev.target.value as Muscle })} aria-label="Grupo muscular">
                {(Object.keys(MUSCLES) as Muscle[]).map((m) => <option key={m} value={m}>{MUSCLES[m]}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-6 gap-1 min-w-0">
              {([["Séries", "sets"], ["Reps", "reps"], ["Kg", "kg"], ["RPE", "rpe"], ["RIR", "rir"], ["Desc.s", "rest"]] as const).map(([l, k]) => (
                <label key={k} className="grid gap-1 min-w-0"><span className="label text-[9px] text-center tracking-normal">{l}</span>
                  <input className="field !min-h-10 !px-1 text-center num text-sm" inputMode={k === "reps" ? "text" : "decimal"} placeholder="—"
                    value={e[k] == null ? "" : String(e[k]).replace(".", ",")}
                    onChange={(ev) => upd(i, k === "reps" ? { reps: ev.target.value } : k === "sets" ? { sets: Math.max(1, Math.round(n(ev.target.value))) } : k === "rest" ? { rest: Math.round(n(ev.target.value)) } : { [k]: numOrNull(ev.target.value) })} /></label>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input className="field !min-h-10 flex-1 text-sm" placeholder="Observação técnica (opcional)" value={e.notes} onChange={(ev) => upd(i, { notes: ev.target.value })} />
              <button className="btn !px-2 !min-h-10" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Subir">↑</button>
              <button className="btn !px-2 !min-h-10" disabled={i === list.length - 1} onClick={() => move(i, 1)} aria-label="Descer">↓</button>
              <button className="btn !px-2 !min-h-10 text-muted" onClick={() => setList(list.filter((_, j) => j !== i))} aria-label="Remover">✕</button>
            </div>
          </div>
        ))}
        <button className="btn" onClick={() => setList([...list, blankEx()])}>+ Exercício</button>
      </div>

      <div className="rounded-2xl bg-white/[.03] p-3">
        <p className="label mb-2">Séries diretas por semana</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(vol).filter(([, v]) => v).sort((a, b) => b[1]! - a[1]!).map(([m, v]) => <span key={m} className="tag">{MUSCLES[m as Muscle]} <b className="text-ink">{v}</b></span>)}
        </div>
        <p className="text-[11px] text-faint mt-2">Cada série conta só no grupo principal do exercício. Séries indiretas (ex.: tríceps no supino) não entram.</p>
      </div>

      <div className="flex gap-2">
        <button className="btn" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-accent flex-1" disabled={!f.name.trim() || Object.values(f.days).some((l) => l.some((e) => !e.name.trim()))}
          onClick={() => onSave({ ...f, days: Object.fromEntries(Object.entries(f.days).map(([d, l]) => [d, l.filter((e) => e.name.trim())])) })}>Aplicar à fase</button>
      </div>
    </div>
  );
}

/* ───────── Editor do programa ───────── */
function ProgramForm({ initial, today, onDone, overrides }: { initial: Omit<Program, "id" | "active" | "archived"> & { id?: string }; today: string; onDone: () => void; overrides: Record<string, Muscle> }) {
  const [pending, start] = useTransition();
  const [p, setP] = useState(initial);
  const [editing, setEditing] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const movePhase = (i: number, d: number) => { const l = [...p.phases]; [l[i], l[i + d]] = [l[i + d], l[i]]; setP({ ...p, phases: l }); };
  if (editing != null) return <PhaseEditor phase={p.phases[editing]} overrides={overrides} onCancel={() => setEditing(null)}
    onSave={(f) => { setP({ ...p, phases: p.phases.map((x, j) => (j === editing ? f : x)) }); setEditing(null); }} />;
  const ranges = phaseRanges(p);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      <Field label="Nome do programa"><input className="field" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Início"><input type="date" className="field" value={p.start_date} onChange={(e) => setP({ ...p, start_date: e.target.value })} /></Field>
        <Field label="Objetivo"><select className="field" value={p.goal} onChange={(e) => setP({ ...p, goal: e.target.value as Goal })}>
          {(Object.keys(GOALS) as Goal[]).map((g) => <option key={g} value={g}>{GOALS[g]}</option>)}</select></Field>
      </div>
      <div>
        <p className="label mb-2">Fases · {totalWeeks(p)} semanas · termina {shortDate(ranges.at(-1)?.end ?? p.start_date)}</p>
        <Timeline p={{ ...p, id: "", active: true, archived: false }} today={today} />
        <ul className="grid gap-2 mt-3">
          {p.phases.map((f, i) => (
            <li key={f.id} className="flex items-center gap-2 rounded-xl bg-white/[.03] p-2 pl-3">
              <i className="h-3 w-3 rounded-full shrink-0" style={{ background: PHASE_KINDS[f.kind].color }} />
              <button className="flex-1 text-left min-w-0" onClick={() => setEditing(i)}>
                <span className="block truncate">{f.name}</span>
                <span className="text-xs text-muted">{f.weeks} sem. · {shortDate(ranges[i].start)}–{shortDate(ranges[i].end)} · {Object.values(f.days).flat().length} exercícios</span>
              </button>
              <button className="btn !px-2 !min-h-10" disabled={i === 0} onClick={() => movePhase(i, -1)} aria-label="Subir">↑</button>
              <button className="btn !px-2 !min-h-10" disabled={i === p.phases.length - 1} onClick={() => movePhase(i, 1)} aria-label="Descer">↓</button>
              <button className="btn !px-2 !min-h-10" onClick={() => setP({ ...p, phases: [...p.phases.slice(0, i + 1), { ...JSON.parse(JSON.stringify(f)), id: newPhaseId(), name: f.name + " (cópia)" }, ...p.phases.slice(i + 1)] })} aria-label="Duplicar">⧉</button>
              <button className="btn !px-2 !min-h-10 text-muted" disabled={p.phases.length === 1} onClick={() => setP({ ...p, phases: p.phases.filter((_, j) => j !== i) })} aria-label="Remover">✕</button>
            </li>
          ))}
        </ul>
        <button className="btn w-full mt-2" onClick={() => setP({ ...p, phases: [...p.phases, { id: newPhaseId(), name: "Nova fase", kind: "outro", weeks: 2, notes: "", days: JSON.parse(JSON.stringify(p.phases.at(-1)?.days ?? {})) }] })}>+ Fase</button>
        <p className="text-xs text-faint mt-1">Toque numa fase para editar os treinos dela. Uma fase nova copia os treinos da anterior.</p>
      </div>
      <Field label="Observações do programa"><textarea className="field" rows={2} value={p.notes ?? ""} onChange={(e) => setP({ ...p, notes: e.target.value })} /></Field>
      {err && <p role="alert" className="text-sm text-[#e8a39a]">{err}</p>}
      <button className="btn btn-accent" disabled={pending || !p.name.trim()} onClick={() => start(async () => {
        setErr("");
        try { await saveProgram({ name: p.name, goal: p.goal, start_date: p.start_date, phases: p.phases, notes: p.notes || null }, p.id); onDone(); }
        catch (e) { setErr((e as Error).message.includes("relation") ? "Rode a migração de periodização no Supabase." : "Confira os campos: cada exercício precisa de nome, séries e repetições."); }
      })}>{pending ? "Salvando…" : p.id ? "Salvar programa" : "Criar programa"}</button>
    </div>
  );
}

/* ───────── Tela ───────── */
export function ProgramView({ programs, today, planDays, overrides, sessionsDone }: {
  programs: Program[]; today: string; planDays: Record<string, { name: string; sets: number; reps: string; rest: number }[]>;
  overrides: Record<string, Muscle>; sessionsDone: Record<string, number>;
}) {
  const [pending, start] = useTransition();
  const [form, setForm] = useState<null | (Omit<Program, "id" | "active" | "archived"> & { id?: string })>(null);
  const active = programs.find((p) => p.active);
  const others = programs.filter((p) => !p.active);
  const monday = (() => { const d = new Date(today + "T12:00:00Z"); const off = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - off + 7); return d.toISOString().slice(0, 10); })();
  const fromPlan = () => setForm({ name: "Powerbuilding · ciclo 1", goal: "powerbuilding", start_date: monday, phases: templateFromPlan(planDays, overrides), notes: "" });
  const blank = () => setForm({ name: "Novo programa", goal: "hipertrofia", start_date: monday, phases: [{ id: newPhaseId(), name: "Fase 1", kind: "acumulacao", weeks: 4, notes: "", days: {} }], notes: "" });

  return (
    <div style={{ ["--accent" as string]: G }}>
      {active ? (() => {
        const pos = programPosition(active, today), ph = active.phases[pos.phaseIndex], ranges = phaseRanges(active);
        const planned = ph ? Object.values(ph.days).filter((l) => l.length).length : 0;
        const done = sessionsDone[`${active.id}:${pos.week}`] ?? 0;
        return (
          <>
            <section className="glass rise p-5">
              <div className="flex items-start justify-between gap-2">
                <div><p className="label" style={{ color: G }}>Programa ativo · {GOALS[active.goal]}</p><p className="font-display text-2xl mt-1">{active.name}</p></div>
                <LinkBtn onClick={() => setForm({ ...active })}>Editar</LinkBtn>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div><p className="label">Semana</p><p className="num text-3xl">{pos.status === "futuro" ? "—" : `${pos.week}`}<span className="text-muted text-lg">/{pos.total}</span></p></div>
                <div><p className="label">Fase</p><p className="text-lg leading-tight mt-1" style={{ color: ph ? PHASE_KINDS[ph.kind].color : undefined }}>{pos.status === "futuro" ? `começa em ${pos.startsIn} d` : pos.status === "concluido" ? "Concluído" : ph?.name}</p>
                  {pos.status === "andamento" && <p className="text-xs text-muted">sem. {pos.weekInPhase} de {ph?.weeks}</p>}</div>
                <div><p className="label">Esta semana</p><p className="num text-3xl">{done}<span className="text-muted text-lg">/{planned}</span></p><p className="text-xs text-muted">treinos</p></div>
              </div>
              <div className="mt-5"><Timeline p={active} today={today} /></div>
              {ph && pos.status === "andamento" && <p className="text-sm text-muted mt-2 font-display italic">{ph.notes || PHASE_KINDS[ph.kind].hint}</p>}
            </section>

            <section className="glass rise p-5 mt-4">
              <SectionTitle>Fases</SectionTitle>
              <ul className="grid gap-3">
                {active.phases.map((f, i) => {
                  const vol = plannedSetsByMuscle(f), cur = i === pos.phaseIndex && pos.status === "andamento";
                  return (
                    <li key={f.id} className={`rounded-2xl p-4 border ${cur ? "border-white/20 bg-white/[.04]" : "border-white/[.06]"}`}>
                      <div className="flex items-center gap-2">
                        <i className="h-3 w-3 rounded-full" style={{ background: PHASE_KINDS[f.kind].color }} />
                        <p className="font-medium flex-1">{f.name}{cur && <span className="tag ml-2">atual</span>}</p>
                        <p className="text-xs text-muted">{shortDate(ranges[i].start)} – {shortDate(ranges[i].end)}</p>
                      </div>
                      <p className="text-xs text-muted mt-1">{PHASE_KINDS[f.kind].label} · {f.weeks} {f.weeks === 1 ? "semana" : "semanas"} · {Object.values(f.days).filter((l) => l.length).length} treinos/sem.</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {Object.entries(vol).filter(([, v]) => v).sort((a, b) => b[1]! - a[1]!).slice(0, 8).map(([m, v]) => <span key={m} className="tag">{MUSCLES[m as Muscle]} {v}</span>)}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="text-[11px] text-faint mt-3">Números = séries diretas planejadas por semana.</p>
            </section>

            <div className="flex gap-2 mt-4">
              <button className="btn flex-1" disabled={pending} onClick={() => { if (confirm("Arquivar este programa? O histórico fica guardado.")) start(() => archiveProgram(active.id)); }}>Arquivar</button>
              <button className="btn flex-1" onClick={fromPlan}>Novo programa</button>
            </div>
          </>
        );
      })() : (
        <section className="glass rise p-5">
          <p className="font-display text-2xl">Periodização</p>
          <p className="text-muted mt-1">Organize o treino em fases com objetivo claro. O app compara o planejado com o realizado e guarda os dois.</p>
          <div className="grid gap-2 mt-4">
            <button className="btn btn-accent" onClick={fromPlan}>Criar a partir do meu plano atual</button>
            <p className="text-xs text-faint -mt-1">4 fases (acumulação 4 sem · intensificação 4 · realização 3 · deload 1), com repetições e RPE ajustados por fase. Tudo editável.</p>
            <button className="btn" onClick={blank}>Começar em branco</button>
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section className="glass rise p-5 mt-4">
          <SectionTitle>Outros programas</SectionTitle>
          <ul>
            {others.map((p) => (
              <li key={p.id} className="flex items-center gap-2 min-h-14">
                <div className="flex-1 min-w-0"><p className="truncate">{p.name}</p><p className="text-xs text-muted">{GOALS[p.goal]} · {totalWeeks(p)} sem. · início {shortDate(p.start_date)} {p.start_date.slice(0, 4)}{p.archived ? " · arquivado" : ""}</p></div>
                <button className="btn !min-h-10 text-sm" disabled={pending} onClick={() => start(() => activateProgram(p.id))}>Ativar</button>
                <button className="btn !min-h-10 !px-3 text-muted" disabled={pending} aria-label="Excluir" onClick={() => { if (confirm(`Excluir “${p.name}”? As sessões registradas continuam no histórico.`)) start(() => deleteProgram(p.id)); }}>✕</button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {!active && others.length === 0 && null}

      <Sheet accent={G} open={!!form} onClose={() => setForm(null)} title={form?.id ? "Editar programa" : "Novo programa"}>
        {form && <ProgramForm key={form.id ?? "novo"} initial={form} today={today} overrides={overrides} onDone={() => setForm(null)} />}
      </Sheet>
    </div>
  );
}
export { Empty, fmt };
