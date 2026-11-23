"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { saveProgram } from "@/app/(app)/corpo/program-actions";
import { Sheet } from "@/components/kit";
import { haptic } from "@/components/game/xp";
import { addDays, dow, shortDate, weekdayShort } from "@/lib/date";
import { GOALS, MUSCLES, PHASE_KINDS, dayTitle, guessMuscle, isMainLift, newPhaseId, phaseRanges, plannedSetsByMuscle, programPosition, totalWeeks,
  type Goal, type Muscle, type Phase, type PhaseKind, type PlannedEx, type Program } from "@/lib/training";
import { buildSession, isTimed, masterFor, type Workout } from "./training-core";
import { ExerciseThumb } from "./exercise-media";
import { LIBRARY, fromLibrary } from "./program";

const R = "#ffb21e";
const DAYS = ["1", "2", "3", "4", "5", "6", "0"];
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

/** Construtor de programa: tudo na mesma tela, salvando sozinho. */
export function ProgramBuilder({ program, today, overrides, workouts, bodyweight }: { program: Program; today: string; overrides: Record<string, Muscle>; workouts: Workout[]; bodyweight: number | null }) {
  const [p, setP] = useState<Program>(() => clone(program));
  const pos = programPosition(p, today);
  const [ph, setPh] = useState(Math.max(0, pos.phaseIndex));
  const [day, setDay] = useState(() => { const d = new Date(today + "T12:00:00Z").getUTCDay(); return String(d); });
  const [status, setStatus] = useState<"" | "salvando" | "salvo" | "erro">("");
  const [lib, setLib] = useState(false);
  const [copyDay, setCopyDay] = useState(false);
  const [settings, setSettings] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const first = useRef(true);

  // Salva sozinho, 800 ms depois da última mudança
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setStatus("salvando"); clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try { await saveProgram({ name: p.name, goal: p.goal, start_date: p.start_date, phases: p.phases.map((f) => ({ ...f, days: Object.fromEntries(Object.entries(f.days).map(([d, l]) => [d, l.filter((e) => e.name.trim())])) })), notes: p.notes || null }, p.id); setStatus("salvo"); }
      catch { setStatus("erro"); }
    }, 800);
    return () => clearTimeout(timer.current);
  }, [p]);

  const phase = p.phases[Math.min(ph, p.phases.length - 1)];
  const list = phase.days[day] ?? [];
  const ranges = phaseRanges(p);
  const vol = useMemo(() => plannedSetsByMuscle(phase), [phase]);
  const setPhase = (patch: Partial<Phase>) => setP((x) => ({ ...x, phases: x.phases.map((f, i) => (i === ph ? { ...f, ...patch } : f)) }));
  const setList = (l: PlannedEx[]) => setPhase({ days: { ...phase.days, [day]: l } });
  const upd = (i: number, patch: Partial<PlannedEx>) => setList(list.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  const move = (i: number, d: number) => { const l = [...list]; [l[i], l[i + d]] = [l[i + d], l[i]]; setList(l); haptic(6); };

  const copyToFollowing = () => {
    if (!confirm(`Copiar os treinos de "${phase.name}" para as ${p.phases.length - ph - 1} fases seguintes? Repetições e RPE se ajustam ao tipo de cada fase.`)) return;
    setP((x) => ({ ...x, phases: x.phases.map((f, i) => i <= ph ? f : { ...f, days: Object.fromEntries(Object.entries(phase.days).map(([d, l]) => [d, l.map((e) => ({ ...fromLibrary(e.name, f.kind, overrides), muscle: e.muscle, notes: e.notes }))])), dayNames: clone(phase.dayNames ?? {}) }) }));
    haptic(20);
  };
  const addPhase = () => { setP((x) => ({ ...x, phases: [...x.phases, { id: newPhaseId(), name: `S${x.phases.length + 1}`, kind: "outro", weeks: 1, notes: "", days: clone(x.phases.at(-1)?.days ?? {}) }] })); setPh(p.phases.length); };
  const dupPhase = () => { setP((x) => ({ ...x, phases: [...x.phases.slice(0, ph + 1), { ...clone(phase), id: newPhaseId(), name: `${phase.name} (cópia)` }, ...x.phases.slice(ph + 1)] })); setPh(ph + 1); };
  const delPhase = () => { if (p.phases.length === 1 || !confirm(`Excluir a fase "${phase.name}"?`)) return; setP((x) => ({ ...x, phases: x.phases.filter((_, i) => i !== ph) })); setPh(Math.max(0, ph - 1)); };

  const [tune, setTune] = useState(false);
  const [editing, setEditing] = useState(false);
  const [weekOffset, setWeekOffset] = useState(Math.max(0, pos.weekInPhase - 1));
  const offset = Math.min(weekOffset, phase.weeks - 1);
  const weekStart = addDays(ranges[ph].start, offset * 7);
  const selectedDate = addDays(weekStart, (+day - dow(weekStart) + 7) % 7);
  const weekNo = programPosition(p, weekStart).week;
  const master = masterFor(p, weekStart, workouts);
  const previewDays = master?.days ?? phase.days;
  const preview = previewDays[day] ?? [];
  const suggested = buildSession(selectedDate < today ? selectedDate : today, { dow: +day, label: "", focus: "" }, preview,
    workouts, { programId: p.id, weekNo, phase: phase.name, deload: phase.kind === "deload" }, bodyweight);
  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-[.3em]" style={{ color: R }}>CAMPANHA ATIVA · {GOALS[p.goal].toUpperCase()}</p>
          <p className="font-display text-2xl leading-tight mt-1">{p.name}</p>
          <p className="text-xs text-muted mt-0.5">{pos.status === "andamento" ? `Semana ${pos.week} de ${pos.total}` : pos.status === "futuro" ? `Começa em ${pos.startsIn} dias` : "Concluído"} · {totalWeeks(p)} semanas</p>
        </div>
        <span className="text-xs shrink-0 mt-1" style={{ color: status === "erro" ? "#ff453a" : status === "salvo" ? "#30d158" : "#8e8e93" }}>
          {status === "salvando" ? "Salvando…" : status === "salvo" ? "Salvo ✓" : status === "erro" ? "Erro ao salvar" : ""}</span>
      </div>

      {/* Fases */}
      <h3 className="mt-5 font-display text-2xl">Fases da campanha</h3>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {p.phases.map((f, i) => {
          const on = i === ph, cur = i === pos.phaseIndex && pos.status === "andamento", c = PHASE_KINDS[f.kind].color;
          return (
            <button key={f.id} onClick={() => { setPh(i); setWeekOffset(cur ? Math.max(0, pos.weekInPhase - 1) : 0); setOpen(null); setTune(false); haptic(6); }} aria-pressed={on} className="press min-h-14 min-w-0 rounded-lg border px-2.5 py-2 text-left"
              style={{ borderColor: on ? c : "rgba(255,255,255,.08)", background: on ? `${c}26` : "#140808", boxShadow: on ? `0 0 16px -6px ${c}` : "none" }}>
              <span className="block text-[13px] font-semibold leading-snug">{f.name}</span>
              <span className="block text-[10px]" style={{ color: c }}>{f.name.trim() === PHASE_KINDS[f.kind].label ? `${f.weeks} sem` : PHASE_KINDS[f.kind].label}{cur ? " · agora" : ""}</span>
            </button>
          );
        })}
        <button onClick={addPhase} className="press min-h-14 rounded-lg border border-dashed px-3 text-sm text-muted" style={{ borderColor: "rgba(255,178,30,.35)" }}>+ Fase</button>
      </div>

      {/* Fase selecionada */}
      <div key={phase.id} className="mt-3 rounded-[8px] border p-3 step-in-right" style={{ borderColor: PHASE_KINDS[phase.kind].color + "55", background: "#120707" }}>
        <div className="flex items-center gap-2">
          <input className="bg-transparent outline-none font-semibold text-lg flex-1 min-w-0" value={phase.name} onChange={(e) => setPhase({ name: e.target.value })} aria-label="Nome da fase" />
          <button className="text-xs font-semibold shrink-0" style={{ color: R }} onClick={() => setTune(!tune)} aria-expanded={tune}>{tune ? "Fechar" : "Ajustar ▸"}</button>
        </div>
        <p className="text-[11px] text-muted">{PHASE_KINDS[phase.kind].label} · {phase.weeks} {phase.weeks === 1 ? "semana" : "semanas"} · {shortDate(ranges[ph].start)}–{shortDate(ranges[ph].end)}</p>
        {tune && <div className="step-in-right">
        <div className="flex flex-wrap gap-1.5 mt-2">
          {(Object.keys(PHASE_KINDS) as PhaseKind[]).map((k) => <button key={k} className="chip !min-h-9 !px-3 text-xs" aria-pressed={phase.kind === k} onClick={() => setPhase({ kind: k })}>{PHASE_KINDS[k].label}</button>)}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-muted">Semanas</span>
          <button className="press h-9 w-9 rounded-full bg-white/[.07]" onClick={() => setPhase({ weeks: Math.max(1, phase.weeks - 1) })} aria-label="Menos semanas">−</button>
          <span className="num text-lg w-6 text-center">{phase.weeks}</span>
          <button className="press h-9 w-9 rounded-full bg-white/[.07]" onClick={() => setPhase({ weeks: Math.min(52, phase.weeks + 1) })} aria-label="Mais semanas">+</button>
          <div className="ml-auto flex gap-1">
            <button className="press h-9 w-9 rounded-full bg-white/[.07] text-sm" onClick={dupPhase} aria-label="Duplicar fase" title="Duplicar fase">⧉</button>
            <button className="press h-9 w-9 rounded-full bg-white/[.07] text-sm text-muted disabled:opacity-30" onClick={delPhase} disabled={p.phases.length === 1} aria-label="Excluir fase" title="Excluir fase">✕</button>
          </div>
        </div>
        <textarea className="field mt-2 !min-h-[60px] text-sm" rows={2} placeholder="Objetivo da fase (ex.: RPE 6–7 nos básicos, cardio 2–3×/sem)" value={phase.notes} onChange={(e) => setPhase({ notes: e.target.value })} />
        </div>}
        {!tune && phase.notes && <p className="text-xs text-ink/70 mt-1.5">{phase.notes}</p>}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-2xl">Treinos da semana</h3>
        <button type="button" className="btn !min-h-10 text-sm" aria-pressed={editing} onClick={() => { setEditing(!editing); setOpen(null); }}>{editing ? "Ver plano do Mestre" : "Editar plano base"}</button>
      </div>
      {!editing && (
        <div className="mt-3 rounded-xl border border-[#ffb21e40] bg-[linear-gradient(135deg,#2b1d0c,#131211)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#ffca70]">Semana {weekNo} · {shortDate(weekStart)} a {shortDate(addDays(weekStart, 6))}</p>
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="font-display text-xl">{master?.wave ?? PHASE_KINDS[phase.kind].label}</p>
            <p className="text-xs font-medium text-white/75">{Object.values(previewDays).filter((exercises) => exercises.length > 0).length} dias de treino</p>
          </div>
          {weekStart > today && <p className="mt-1 text-xs text-white/70">Prévia. O Mestre recalcula com os próximos registros.</p>}
          {phase.weeks > 1 && <label className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/80">Semana nesta fase
            <select className="field !w-auto !min-h-10" value={offset} onChange={(e) => setWeekOffset(Number(e.target.value))}>
              {Array.from({ length: phase.weeks }, (_, i) => <option key={i} value={i}>{i + 1} de {phase.weeks}</option>)}
            </select>
          </label>}
          {master?.changes.length ? <details className="mt-3 text-sm text-white/80">
            <summary className="cursor-pointer text-[#ffca70]">Por que o Mestre escolheu este treino</summary>
            <ul className="mt-2 list-disc space-y-1 pl-4">{master.changes.map((c, i) => <li key={i}>{c.text}</li>)}</ul>
          </details> : null}
        </div>
      )}

      {/* Dias */}
      <div className="grid grid-cols-7 gap-1 mt-2">
        {DAYS.map((d) => {
          const n = ((editing ? phase.days : previewDays)[d] ?? []).length, on = d === day;
          return (
            <button key={d} aria-pressed={on} aria-label={`${weekdayShort[+d]} · ${n ? n + " exercícios" : "descanso"}`} onClick={() => { setDay(d); setOpen(null); haptic(6); }} className="press rounded-xl py-2 text-center border"
              style={{ borderColor: on ? R : "rgba(255,255,255,.06)", background: on ? "rgba(255,178,30,.16)" : "transparent", boxShadow: on ? `0 0 14px -6px ${R}` : "none" }}>
              <span className={`block text-[11px] ${on ? "text-ink font-semibold" : "text-muted"}`}>{weekdayShort[+d]}</span>
              <span className="block num text-sm mt-0.5" style={{ color: n ? (on ? R : "#f5f5f7") : "#84848a" }}>{n || "–"}</span>
            </button>
          );
        })}
      </div>

      {!editing && (
        <section className="mt-4" aria-label="Plano do dia">
          <h4 className="font-display text-xl">{preview.length ? (dayTitle({ ...phase, days: previewDays }, day) || "Treino do dia") : "Dia de recuperação"}</h4>
          <p className="mt-0.5 text-xs text-white/65">{weekdayShort[+day]} · {shortDate(selectedDate)}{preview.length ? ` · ${preview.length} exercícios` : ""}</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {preview.map((e, i) => {
              const timed = isTimed(e.name, e.muscle);
              const ex = suggested.exercises[i];
              const kg = ex.sets[0]?.kg;
              const original = phase.days[day]?.[i];
              const rotated = !master?.adjusted && original && original.name !== e.name;
              return (
                <li key={i} className="min-w-0 rounded-xl border border-white/10 bg-[#121212] p-3">
                  <div className="flex items-center gap-3">
                    <ExerciseThumb name={e.name} size={48} />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#ffca70]">{timed ? "Condicionamento" : isMainLift(e.name) ? "Levantamento principal" : "Acessório"} · {MUSCLES[e.muscle]}</p>
                      <p className="mt-0.5 font-semibold leading-tight">{e.name}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-2 text-sm">
                    <p><span className="block text-[11px] text-white/65">{timed ? "Duração" : "Séries × reps"}</span><strong>{timed ? e.reps : `${e.sets} × ${e.reps}`}</strong></p>
                    {!timed && <p><span className="block text-[11px] text-white/65">{e.kg != null ? "Carga do plano" : "Carga inicial sugerida"}</span><strong className="text-[#ffca70]">{kg ? `${Number(kg).toLocaleString("pt-BR")} kg` : e.kg === 0 ? "0 kg" : "A definir"}</strong></p>}
                  </div>
                  {(e.rpe || e.rest > 0) && <p className="mt-2 text-xs text-white/65">{[e.rpe ? `Esforço ${e.rpe.toLocaleString("pt-BR")}/10` : "", e.rest > 0 ? `${e.rest} s de descanso` : ""].filter(Boolean).join(" · ")}</p>}
                  {rotated && <p className="mt-2 text-xs text-[#ffca70]">Variação de {original.name}</p>}
                  {e.notes && <p className="mt-1 text-xs text-white/75">{e.notes}</p>}
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {editing && <>
      <input className="field mt-3 !min-h-12 font-semibold text-lg" placeholder={`Nome do treino · ${weekdayShort[+day]} (ex.: Lower A)`}
        value={phase.dayNames?.[day] ?? ""} onChange={(e) => setPhase({ dayNames: { ...(phase.dayNames ?? {}), [day]: e.target.value } })} aria-label="Nome do treino do dia" />
      {!phase.dayNames?.[day] && list.length > 0 && <p className="text-[11px] text-faint mt-1">Sem nome, aparece como “{dayTitle(phase, day)}”.</p>}
      {/* Exercícios do dia */}
      <div key={`${phase.id}-${day}`} className="grid grid-cols-1 gap-2 mt-3 [&>*]:min-w-0">
        {list.length === 0 && <p className="text-center text-muted text-sm py-4">Dia de descanso. Adicione exercícios se houver treino.</p>}
        {list.map((e, i) => {
          const isOpen = open === i, cardio = e.muscle === "cardio";
          const rest = e.rest >= 60 ? `${Math.floor(e.rest / 60)}${e.rest % 60 ? `:${String(e.rest % 60).padStart(2, "0")}` : ""} min` : e.rest ? `${e.rest}s` : "";
          const Quick = ({ values, cur, onPick, fmtv = (v: number | string) => String(v) }: { values: (number | string)[]; cur: number | string | null; onPick: (v: number | string) => void; fmtv?: (v: number | string) => string }) => (
            <div className="flex gap-1.5 flex-wrap">{values.map((v) => <button key={String(v)} onClick={() => { onPick(v); haptic(6); }} className="press rounded-xl px-3 min-h-10 text-sm font-semibold border"
              style={{ background: String(cur) === String(v) ? R : "#1a0909", color: String(cur) === String(v) ? "#fff" : undefined, borderColor: String(cur) === String(v) ? R : "rgba(255,178,30,.25)", boxShadow: String(cur) === String(v) ? `0 0 14px -4px ${R}` : "none" }}>{fmtv(v)}</button>)}</div>
          );
          return (
            <div key={i} className="rounded-[8px] border step-in-right min-w-0 overflow-hidden" style={{ borderColor: isOpen ? R : "rgba(255,178,30,.18)", background: "#140808", boxShadow: isOpen ? `0 0 22px -10px ${R}` : "none", animationDelay: `${i * 30}ms` }}>
              <button className="w-full flex items-center gap-3 p-3 text-left" onClick={() => { setOpen(isOpen ? null : i); haptic(6); }} aria-expanded={isOpen}>
                <span className="num text-xs text-faint w-4">{i + 1}</span>
                <span className="flex-1 min-w-0"><span className="block font-semibold leading-snug line-clamp-2 break-words">{e.name || "Novo exercício"}</span>
                  <span className="block text-xs text-muted truncate">{MUSCLES[e.muscle]}{rest && !cardio ? ` · ${rest}` : ""}{e.notes ? ` · ${e.notes}` : ""}</span></span>
                <span className="num text-sm shrink-0" style={{ color: R }}>{cardio ? e.reps : `${e.sets}×${e.reps}`}{e.rpe ? ` @${String(e.rpe).replace(".", ",")}` : ""}</span>
                <span className="text-muted text-xs">{isOpen ? "▴" : "▾"}</span>
              </button>
              {isOpen && (
                <div className="px-3 pb-3 grid gap-3 step-in-right">
                  <input className="field !min-h-11" value={e.name} onChange={(ev) => upd(i, { name: ev.target.value, muscle: guessMuscle(ev.target.value, overrides) })} aria-label="Nome do exercício" />
                  {!cardio && (
                    <div className="flex items-center gap-3"><span className="text-sm text-muted w-16">Séries</span>
                      <div className="flex items-center rounded-xl bg-white/[.06] h-11">
                        <button className="w-11 h-full text-xl" onClick={() => upd(i, { sets: Math.max(1, e.sets - 1) })} aria-label="Menos séries">−</button>
                        <span className="num text-lg w-8 text-center">{e.sets}</span>
                        <button className="w-11 h-full text-xl" onClick={() => upd(i, { sets: Math.min(20, e.sets + 1) })} aria-label="Mais séries">+</button></div></div>
                  )}
                  <div><p className="text-sm text-muted mb-1.5">{cardio ? "Tempo" : "Repetições"}</p>
                    <Quick values={cardio ? ["10 min", "20 min", "25 min", "30 min", "45 min"] : ["3", "5", "6", "8", "10", "12", "15", "6-8", "8-12"]} cur={e.reps} onPick={(v) => upd(i, { reps: String(v) })} />
                    <input className="field !min-h-10 mt-1.5 text-sm" value={e.reps} onChange={(ev) => upd(i, { reps: ev.target.value })} aria-label="Repetições personalizadas" placeholder="Outro (ex.: 4-6)" /></div>
                  <div><p className="text-sm text-muted mb-1.5">Intensidade (RPE)</p>
                    <Quick values={cardio ? [4, 5, 6, 7] : [6, 7, 7.5, 8, 8.5, 9]} cur={e.rpe} onPick={(v) => upd(i, { rpe: Number(v), rir: Math.max(0, Math.round(10 - Number(v))) })} fmtv={(v) => String(v).replace(".", ",")} /></div>
                  {!cardio && <div><p className="text-sm text-muted mb-1.5">Descanso</p>
                    <Quick values={[60, 90, 120, 150, 180, 240]} cur={e.rest} onPick={(v) => upd(i, { rest: Number(v) })} fmtv={(v) => { const n = Number(v); return n % 60 ? `${Math.floor(n / 60)}:${n % 60}` : `${n / 60} min`; }} /></div>}
                  {!cardio && <label className="grid gap-1 text-sm text-muted">Carga fixa (kg)
                    <input type="number" min="0" step="any" className="field !min-h-10" value={e.kg ?? ""} placeholder="Usar sugestão do Mestre" onChange={(ev) => upd(i, { kg: ev.target.value === "" ? null : Math.max(0, Number(ev.target.value)) })} />
                  </label>}
                  <input className="field !min-h-10 text-sm" placeholder="Observação técnica (opcional)" value={e.notes} onChange={(ev) => upd(i, { notes: ev.target.value })} />
                  <div className="flex gap-1.5">
                    <button className="btn !min-h-10 flex-1" disabled={i === 0} onClick={() => { move(i, -1); setOpen(i - 1); }}>↑ Subir</button>
                    <button className="btn !min-h-10 flex-1" disabled={i === list.length - 1} onClick={() => { move(i, 1); setOpen(i + 1); }}>↓ Descer</button>
                    <button className="btn !min-h-10 flex-1 text-[#ff453a]" onClick={() => { setList(list.filter((_, j) => j !== i)); setOpen(null); }}>Remover</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <button className="btn !min-h-12 font-semibold text-white" style={{ background: "linear-gradient(160deg,#ffb21e,#3a2a0a)", boxShadow: "0 10px 26px -12px #ffb21e" }} onClick={() => setLib(true)}>+ Adicionar exercício</button>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn !min-h-10 text-sm" onClick={() => setCopyDay(true)} disabled={!list.length}>Copiar dia</button>
          <button className="btn !min-h-10 text-sm" onClick={copyToFollowing} disabled={ph >= p.phases.length - 1}>Replicar nas fases</button>
        </div>
      </div>

      </>}
      {/* Volume da fase */}
      <div className="mt-4 rounded-[8px] p-3 bg-white/[.03]">
        <p className="text-[10px] font-semibold tracking-[.25em] text-muted">SÉRIES DIRETAS / SEMANA NESTA FASE</p>
        <div className="flex flex-wrap gap-1.5 mt-2">{Object.entries(vol).filter(([, v]) => v).sort((a, b) => b[1]! - a[1]!).map(([m, v]) => <span key={m} className="tag">{MUSCLES[m as Muscle]} <b className="text-ink">{v}</b></span>)}</div>
      </div>

      {/* Configurações */}
      <button className="text-sm text-muted mt-4 min-h-10" onClick={() => setSettings(!settings)}>{settings ? "▾" : "▸"} Configurações da campanha</button>
      {settings && (
        <div className="grid gap-2 mt-1 step-in-right">
          <input className="field" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} aria-label="Nome da campanha" />
          <div className="grid grid-cols-2 gap-2">
            <input type="date" className="field" value={p.start_date} onChange={(e) => setP({ ...p, start_date: e.target.value })} aria-label="Início" />
            <select className="field" value={p.goal} onChange={(e) => setP({ ...p, goal: e.target.value as Goal })} aria-label="Objetivo">{(Object.keys(GOALS) as Goal[]).map((g) => <option key={g} value={g}>{GOALS[g]}</option>)}</select>
          </div>
          <textarea className="field" rows={2} placeholder="Observações" value={p.notes ?? ""} onChange={(e) => setP({ ...p, notes: e.target.value })} />
        </div>
      )}

      <Sheet tone="war" accent={R} open={lib} onClose={() => setLib(false)} title={`Adicionar · ${weekdayShort[+day]}`}>
        {lib && <Library existing={list.map((e) => e.name.toLowerCase())} onAdd={(name) => { setList([...(phase.days[day] ?? []), fromLibrary(name, phase.kind, overrides)]); haptic(10); }} onDone={() => setLib(false)} />}
      </Sheet>
      <Sheet tone="war" accent={R} open={copyDay} onClose={() => setCopyDay(false)} title="Copiar dia para…">
        {copyDay && (
          <div className="grid gap-2">
            <p className="text-sm text-muted">Os exercícios de {weekdayShort[+day]} vão substituir os do dia escolhido, nesta fase.</p>
            <div className="grid grid-cols-4 gap-2">
              {DAYS.filter((d) => d !== day).map((d) => <button key={d} className="btn !min-h-12" onClick={() => { setPhase({ days: { ...phase.days, [d]: clone(list) }, dayNames: { ...(phase.dayNames ?? {}), [d]: phase.dayNames?.[day] ?? "" } }); setCopyDay(false); setDay(d); haptic(15); }}>{weekdayShort[+d]}</button>)}
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}

/** Biblioteca com busca e filtro por grupo; adiciona vários seguidos. */
function Library({ existing, onAdd, onDone }: { existing: string[]; onAdd: (name: string) => void; onDone: () => void }) {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<string | null>(null);
  const [added, setAdded] = useState<string[]>([]);
  const all = LIBRARY.flatMap(([g, l]) => l.map((n) => ({ g, n })));
  const shown = all.filter((x) => (!group || x.g === group) && (!q || x.n.toLowerCase().includes(q.toLowerCase())));
  const custom = q.trim() && !all.some((x) => x.n.toLowerCase() === q.trim().toLowerCase());
  return (
    <div className="grid gap-3">
      <input className="field" placeholder="Buscar ou digitar um exercício novo…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button className="chip shrink-0" aria-pressed={!group} onClick={() => setGroup(null)}>Todos</button>
        {LIBRARY.map(([g]) => <button key={g} className="chip shrink-0" aria-pressed={group === g} onClick={() => setGroup(group === g ? null : g)}>{g}</button>)}
      </div>
      {custom && <button className="btn !min-h-12 justify-start" onClick={() => { onAdd(q.trim()); setAdded([...added, q.trim().toLowerCase()]); setQ(""); }}>+ Criar “{q.trim()}”</button>}
      <ul className="grid gap-1.5 max-h-[46dvh] overflow-y-auto">
        {shown.map((x) => {
          const has = existing.includes(x.n.toLowerCase()) || added.includes(x.n.toLowerCase());
          return (
            <li key={x.n}><button disabled={has} onClick={() => { onAdd(x.n); setAdded([...added, x.n.toLowerCase()]); }}
              className="press w-full flex items-center gap-3 rounded-xl px-3 min-h-12 text-left border disabled:opacity-40" style={{ borderColor: "rgba(255,178,30,.2)", background: "#140808" }}>
              <span className="flex-1">{x.n}</span><span className="text-[11px] text-muted">{x.g}</span><span className="text-lg" style={{ color: has ? "#30d158" : R }}>{has ? "✓" : "+"}</span>
            </button></li>
          );
        })}
      </ul>
      <button className="btn btn-accent !min-h-12" onClick={onDone}>Pronto{added.length ? ` · ${added.length} adicionado${added.length > 1 ? "s" : ""}` : ""}</button>
    </div>
  );
}
