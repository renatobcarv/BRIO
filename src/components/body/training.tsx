"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { deleteWorkout, saveWorkout } from "@/app/(app)/corpo/actions";
import { updateSettings } from "@/app/settings-actions";
import { Empty } from "@/components/ui";
import { Field, LinkBtn, SectionTitle, Sheet, Stat, fmt, n } from "@/components/kit";
import { addDays, daysInMonth, diffDays, dow, monthStart, shortDate, weekdayShort } from "@/lib/date";
import type { PlanExercise, SplitDay, WorkoutPlan } from "@/lib/settings";

const G = "#8ac295";
type DbSet = { exercise: string; set_no: number; reps: number; kg: number };
export type Workout = { id: string; date: string; split_label: string | null; notes: string | null; duration_min: number | null; sets: DbSet[] };
type LSet = { kg: string; reps: string; done: boolean };
type LEx = { name: string; target?: PlanExercise; sets: LSet[] };
type Session = { date: string; label: string; exercises: LEx[]; notes: string; startedAt: number | null; editingId?: string };

const e1rm = (kg: number, reps: number) => (reps <= 0 ? 0 : reps === 1 ? kg : kg * (1 + Math.min(reps, 12) / 30));
const volume = (sets: DbSet[]) => sets.reduce((a, s) => a + Number(s.kg) * s.reps, 0);
const firstNum = (s: string) => Number((s.match(/\d+/) ?? ["0"])[0]);
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const ORDER = [1, 2, 3, 4, 5, 6, 0];

function lastFor(workouts: Workout[], name: string, beforeDate: string) {
  const w = workouts.find((w) => w.date <= beforeDate && w.sets.some((s) => s.exercise.toLowerCase() === name.toLowerCase()));
  return w ? { date: w.date, sets: w.sets.filter((s) => s.exercise.toLowerCase() === name.toLowerCase()) } : null;
}

function buildSession(date: string, day: SplitDay, plan: PlanExercise[], workouts: Workout[]): Session {
  return {
    date, label: `${day.label} · ${day.focus}`, notes: "", startedAt: null,
    exercises: plan.map((p) => {
      const last = lastFor(workouts, p.name, date);
      return { name: p.name, target: p, sets: Array.from({ length: p.sets }, (_, i) => ({
        kg: last?.sets[i] ? String(last.sets[i].kg) : last?.sets.at(-1) ? String(last.sets.at(-1)!.kg) : "", reps: String(firstNum(p.reps) || ""), done: false })) };
    }),
  };
}

/* ───────────── Cronômetro de descanso ───────────── */
function RestTimer({ until, onDone, onAdd }: { until: number; onDone: () => void; onAdd: (s: number) => void }) {
  const [now, setNow] = useState(Date.now());
  const fired = useRef(false);
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(id); }, []);
  const left = Math.max(0, Math.ceil((until - now) / 1000));
  useEffect(() => {
    if (left === 0 && !fired.current) { fired.current = true; try { navigator.vibrate?.([200, 100, 200]); } catch {} setTimeout(onDone, 1500); }
  }, [left, onDone]);
  return (
    <div className="fixed left-3 right-3 md:left-auto md:right-6 md:w-80 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-6 z-40 sheet-up">
      <div className="rounded-2xl border border-white/10 bg-[#0e1015]/95 backdrop-blur-xl p-3 flex items-center gap-3 shadow-2xl">
        <div className="flex-1"><p className="label">{left ? "Descanso" : "Bora!"}</p><p className="num text-3xl" style={{ color: left ? G : "#e0ac53" }}>{mmss(left)}</p></div>
        <button className="btn !px-3" onClick={() => onAdd(15)}>+15s</button>
        <button className="btn" onClick={onDone}>Pular</button>
      </div>
    </div>
  );
}

/* ───────────── Registro da sessão ───────────── */
function Logger({ s, setS, workouts, onSaved, split, plan }: {
  s: Session; setS: (s: Session | null) => void; workouts: Workout[]; onSaved: () => void; split: SplitDay[]; plan: WorkoutPlan;
}) {
  const [pending, start] = useTransition();
  const [rest, setRest] = useState<number | null>(null);
  const [newEx, setNewEx] = useState("");
  const set = (p: Partial<Session>) => setS({ ...s, ...p });
  const updSet = (ei: number, si: number, p: Partial<LSet>) =>
    set({ exercises: s.exercises.map((e, i) => (i !== ei ? e : { ...e, sets: e.sets.map((x, j) => (j === si ? { ...x, ...p } : x)) })), startedAt: s.startedAt ?? Date.now() });
  const toggle = (ei: number, si: number) => {
    const x = s.exercises[ei].sets[si], on = !x.done;
    updSet(ei, si, { done: on });
    const r = s.exercises[ei].target?.rest ?? 90;
    if (on && r > 0) setRest(Date.now() + r * 1000);
  };
  const doneSets = s.exercises.flatMap((e) => e.sets.filter((x) => x.done));
  const total = s.exercises.reduce((a, e) => a + e.sets.length, 0);
  const vol = s.exercises.reduce((a, e) => a + e.sets.filter((x) => x.done).reduce((b, x) => b + n(x.kg) * n(x.reps), 0), 0);

  const finish = () => start(async () => {
    const pick = (x: LSet) => (doneSets.length ? x.done : n(x.reps) > 0);
    const sets = s.exercises.flatMap((e) => e.sets.filter(pick).map((x) => ({ exercise: e.name, kg: n(x.kg), reps: Math.round(n(x.reps)) })));
    const duration = s.startedAt && !s.editingId ? Math.round((Date.now() - s.startedAt) / 60000) : null;
    await saveWorkout({ date: s.date, split_label: s.label, notes: s.notes, duration_min: duration, sets }, s.editingId);
    onSaved();
  });

  const loadDay = (d: number) => {
    const day = split.find((x) => x.dow === d) ?? { dow: d, label: "Treino", focus: "" };
    setS(buildSession(s.date, day, plan.days[String(d)] ?? [], workouts));
  };

  return (
    <>
      {!s.editingId && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {ORDER.map((d) => { const day = split.find((x) => x.dow === d); const cnt = plan.days[String(d)]?.length ?? 0;
            return <button key={d} className="chip shrink-0" onClick={() => { if (!doneSets.length || confirm("Trocar o treino? As séries marcadas serão perdidas.")) loadDay(d); }}
              aria-pressed={s.label.startsWith(`${day?.label} ·`) && (day?.dow === dow(s.date) || cnt > 0)}>{weekdayShort[d]} · {day?.label ?? "—"}</button>; })}
        </div>
      )}
      <div className="flex items-center gap-3 mt-4">
        <div className="flex-1">
          {s.editingId && <p className="label text-gold">Editando sessão de {shortDate(s.date)}</p>}
          <input className="font-display text-2xl bg-transparent outline-none w-full" value={s.label} onChange={(e) => set({ label: e.target.value })} aria-label="Nome do treino" />
          <p className="text-sm text-muted">{doneSets.length}/{total} séries · volume {Math.round(vol).toLocaleString("pt-BR")} kg</p>
        </div>
        {s.editingId && <input type="date" className="field !w-40" value={s.date} onChange={(e) => set({ date: e.target.value })} aria-label="Data" />}
      </div>

      <div className="grid gap-3 mt-4">
        {s.exercises.length === 0 && <Empty>Dia de descanso. Adicione um exercício se for treinar mesmo assim.</Empty>}
        {s.exercises.map((e, ei) => {
          const last = lastFor(workouts.filter((w) => w.id !== s.editingId), e.name, s.editingId ? addDays(s.date, -1) : s.date);
          const best = Math.max(0, ...e.sets.map((x) => e1rm(n(x.kg), n(x.reps))));
          return (
            <div key={ei} className="rounded-2xl border border-white/[.07] bg-white/[.02] p-4">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{e.name}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {e.target ? `${e.target.sets}×${e.target.reps}${e.target.rest ? ` · ${mmss(e.target.rest)} desc.` : ""}` : "extra"}
                    {last && ` · última (${shortDate(last.date)}): ${last.sets.map((x) => `${fmt(Number(x.kg))}×${x.reps}`).join(", ")}`}
                  </p>
                </div>
                <button className="btn !min-h-9 !px-3 text-muted" aria-label={`Remover ${e.name}`} onClick={() => set({ exercises: s.exercises.filter((_, i) => i !== ei) })}>✕</button>
              </div>
              <div className="grid grid-cols-[1.75rem_1fr_1fr_2.75rem] gap-2 items-center mt-3 label"><span>#</span><span>kg</span><span>reps</span><span /></div>
              {e.sets.map((x, si) => (
                <div key={si} className="grid grid-cols-[1.75rem_1fr_1fr_2.75rem] gap-2 items-center mt-1.5">
                  <span className="num text-muted">{si + 1}</span>
                  <input className="field !min-h-11 text-center num" inputMode="decimal" value={x.kg} onChange={(ev) => updSet(ei, si, { kg: ev.target.value })} aria-label={`Carga série ${si + 1}`} />
                  <input className="field !min-h-11 text-center num" inputMode="numeric" value={x.reps} onChange={(ev) => updSet(ei, si, { reps: ev.target.value })} aria-label={`Repetições série ${si + 1}`} />
                  <button aria-pressed={x.done} aria-label={`Concluir série ${si + 1}`} onClick={() => toggle(ei, si)}
                    className="h-11 w-11 grid place-items-center rounded-xl border transition-colors" style={{ borderColor: x.done ? G : "rgba(255,255,255,.15)", background: x.done ? G : "transparent" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={x.done ? "#120f08" : "#5d5b56"} strokeWidth="3" aria-hidden><path d="M5 12l5 5L20 7" /></svg>
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-2">
                <button className="btn !min-h-9 text-sm" onClick={() => set({ exercises: s.exercises.map((y, i) => (i !== ei ? y : { ...y, sets: [...y.sets, { ...(y.sets.at(-1) ?? { kg: "", reps: "" }), done: false }] })) })}>+ Série</button>
                {e.sets.length > 1 && <button className="btn !min-h-9 text-sm text-muted" onClick={() => set({ exercises: s.exercises.map((y, i) => (i !== ei ? y : { ...y, sets: y.sets.slice(0, -1) })) })}>− Série</button>}
                {best > 0 && <span className="ml-auto text-xs text-muted">1RM est. <span className="num text-ink">{fmt(best, 0)} kg</span></span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 mt-3">
        <input className="field flex-1" placeholder="Adicionar exercício" value={newEx} onChange={(e) => setNewEx(e.target.value)} list="ex-names" />
        <button className="btn" disabled={!newEx.trim()} onClick={() => { set({ exercises: [...s.exercises, { name: newEx.trim(), sets: [{ kg: "", reps: "", done: false }] }] }); setNewEx(""); }}>Adicionar</button>
      </div>
      <datalist id="ex-names">{[...new Set(workouts.flatMap((w) => w.sets.map((x) => x.exercise)))].map((x) => <option key={x} value={x} />)}</datalist>
      <textarea className="field mt-3" placeholder="Observações (como se sentiu, dores, técnica…)" value={s.notes} onChange={(e) => set({ notes: e.target.value })} />
      <div className="flex gap-2 mt-3">
        <button className="btn" onClick={() => { if (confirm(s.editingId ? "Descartar alterações?" : "Descartar o treino em andamento?")) setS(null); }}>Descartar</button>
        <button className="btn btn-accent flex-1" disabled={pending} onClick={finish}>{pending ? "Salvando…" : s.editingId ? "Salvar alterações" : "Finalizar treino"}</button>
      </div>
      {rest && <RestTimer until={rest} onDone={() => setRest(null)} onAdd={(sec) => setRest(rest + sec * 1000)} />}
    </>
  );
}

/* ───────────── Editor do plano ───────────── */
function PlanEditor({ split, plan, onDone }: { split: SplitDay[]; plan: WorkoutPlan; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [days, setDays] = useState(() => ORDER.map((d) => split.find((x) => x.dow === d) ?? { dow: d, label: "Off", focus: "" }));
  const [ex, setEx] = useState<Record<string, PlanExercise[]>>(() => Object.fromEntries(ORDER.map((d) => [String(d), plan.days[String(d)] ?? []])));
  const [prs, setPrs] = useState(plan.prs.join(", "));
  const [sel, setSel] = useState(1);
  const di = days.findIndex((d) => d.dow === sel), day = days[di], list = ex[String(sel)] ?? [];
  const setList = (l: PlanExercise[]) => setEx({ ...ex, [String(sel)]: l });
  const upd = (i: number, p: Partial<PlanExercise>) => setList(list.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const move = (i: number, d: number) => { const l = [...list]; [l[i], l[i + d]] = [l[i + d], l[i]]; setList(l); };
  return (
    <div className="grid gap-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {ORDER.map((d) => <button key={d} className="chip shrink-0" aria-pressed={sel === d} onClick={() => setSel(d)}>{weekdayShort[d]} · {days.find((x) => x.dow === d)?.label}</button>)}
      </div>
      <div className="grid grid-cols-[5rem_1fr] gap-2">
        <Field label="Rótulo"><input className="field" value={day.label} onChange={(e) => setDays(days.map((x, j) => (j === di ? { ...x, label: e.target.value } : x)))} /></Field>
        <Field label="Foco"><input className="field" value={day.focus} onChange={(e) => setDays(days.map((x, j) => (j === di ? { ...x, focus: e.target.value } : x)))} /></Field>
      </div>
      <div>
        <div className="grid grid-cols-[1fr_3rem_4rem_3.5rem_auto] gap-1.5 label mb-1"><span>Exercício</span><span>Sér.</span><span>Reps</span><span>Desc.</span><span className="w-[6.5rem]" /></div>
        {list.map((x, i) => (
          <div key={i} className="grid grid-cols-[1fr_3rem_4rem_3.5rem_auto] gap-1.5 mt-1.5">
            <input className="field !px-2 !min-h-11" value={x.name} onChange={(e) => upd(i, { name: e.target.value })} aria-label="Exercício" />
            <input className="field !px-1 !min-h-11 text-center num" inputMode="numeric" value={x.sets} onChange={(e) => upd(i, { sets: Math.max(1, Math.round(n(e.target.value))) })} aria-label="Séries" />
            <input className="field !px-1 !min-h-11 text-center" value={x.reps} onChange={(e) => upd(i, { reps: e.target.value })} aria-label="Repetições" />
            <input className="field !px-1 !min-h-11 text-center num" inputMode="numeric" value={x.rest} onChange={(e) => upd(i, { rest: Math.round(n(e.target.value)) })} aria-label="Descanso em segundos" />
            <div className="flex">
              <button className="btn !px-2 !min-h-11" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Subir">↑</button>
              <button className="btn !px-2 !min-h-11" disabled={i === list.length - 1} onClick={() => move(i, 1)} aria-label="Descer">↓</button>
              <button className="btn !px-2 !min-h-11 text-muted" onClick={() => setList(list.filter((_, j) => j !== i))} aria-label="Remover">✕</button>
            </div>
          </div>
        ))}
        <button className="btn w-full mt-2" onClick={() => setList([...list, { name: "Novo exercício", sets: 3, reps: "10", rest: 90 }])}>+ Exercício</button>
        <p className="text-xs text-faint mt-1">Descanso em segundos. Deixe a lista vazia para dia de descanso.</p>
      </div>
      <Field label="Recordes acompanhados" hint="Separe por vírgula. Ex.: Agachamento, Supino, Levantamento terra">
        <input className="field" value={prs} onChange={(e) => setPrs(e.target.value)} /></Field>
      <button className="btn btn-accent" disabled={pending} onClick={() => start(async () => {
        await updateSettings({ workout_split: days, workout_plan: { days: Object.fromEntries(Object.entries(ex).map(([k, v]) => [k, v.filter((y) => y.name.trim())])), prs: prs.split(",").map((p) => p.trim()).filter(Boolean) } });
        onDone();
      })}>{pending ? "Salvando…" : "Salvar plano"}</button>
    </div>
  );
}

/* ───────────── Tela ───────────── */
export function Training({ today, split, plan, workouts }: { today: string; split: SplitDay[]; plan: WorkoutPlan; workouts: Workout[] }) {
  const [pending, start] = useTransition();
  const KEY = "brio-treino-em-andamento";
  const [session, setSessionState] = useState<Session | null>(null);
  const [sheet, setSheet] = useState<null | "plan" | Workout>(null);
  const [exSel, setExSel] = useState(plan.prs[0] ?? "");
  const todayDay = split.find((d) => d.dow === dow(today)) ?? { dow: dow(today), label: "Off", focus: "Descanso" };

  useEffect(() => { try { const raw = localStorage.getItem(KEY); if (raw) setSessionState(JSON.parse(raw)); } catch {} }, []);
  const setSession = (s: Session | null) => { setSessionState(s); try { if (s && !s.editingId) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY); } catch {} };

  // Estatísticas
  const m = monthStart(today), dim = daysInMonth(m);
  const monthW = workouts.filter((w) => w.date >= m);
  const weekStart = addDays(today, -((dow(today) + 6) % 7));
  const weekW = workouts.filter((w) => w.date >= weekStart);
  const planned = ORDER.filter((d) => (plan.days[String(d)] ?? []).some((x) => x.name.toLowerCase() !== "cardio")).length;
  const trained = new Set(workouts.map((w) => w.date));
  const all = workouts.flatMap((w) => w.sets.map((s) => ({ ...s, kg: Number(s.kg), date: w.date })));
  const names = [...new Set(all.map((s) => s.exercise))].sort((a, b) => a.localeCompare(b));
  const prOf = (name: string) => {
    const re = new RegExp(name.split(/\s+/)[0].slice(0, 6), "i");
    const sets = all.filter((s) => s.exercise.toLowerCase() === name.toLowerCase() || re.test(s.exercise));
    const top = sets.reduce<(typeof sets)[number] | null>((b, s) => (!b || s.kg > b.kg ? s : b), null);
    const est = sets.reduce((b, s) => Math.max(b, e1rm(s.kg, s.reps)), 0);
    return { top, est };
  };
  const series = useMemo(() => {
    const byDate = new Map<string, number>();
    for (const s of all.filter((s) => s.exercise === exSel)) byDate.set(s.date, Math.max(byDate.get(s.date) ?? 0, e1rm(s.kg, s.reps)));
    return [...byDate].sort((a, b) => a[0].localeCompare(b[0])).slice(-20);
  }, [all, exSel]);

  const W = 600, H = 160, P = 22;
  const sv = series.map((x) => x[1]), smin = Math.min(...sv) * 0.97, smax = Math.max(...sv) * 1.03;
  const sx = (i: number) => P + (series.length > 1 ? (i / (series.length - 1)) * (W - 2 * P) : (W - 2 * P) / 2);
  const sy = (v: number) => P + ((smax - v) / (smax - smin || 1)) * (H - 2 * P);
  const viewing = sheet && typeof sheet === "object" ? sheet : null;

  return (
    <div style={{ ["--accent" as string]: G }}>
      <section className="glass rise p-5">
        <div className="grid grid-cols-3 gap-3">
          <Stat big label="Semana" value={`${weekW.length}/${planned}`} sub="treinos" />
          <Stat big label="Mês" value={monthW.length} sub="sessões" />
          <Stat big label="Volume sem." value={`${fmt(weekW.reduce((a, w) => a + volume(w.sets), 0) / 1000)} t`} sub="kg × reps" />
        </div>
      </section>

      <section className="glass rise p-5 mt-4">
        <SectionTitle action={<LinkBtn onClick={() => setSheet("plan")}>Editar plano</LinkBtn>}>{session ? "Treino em andamento" : "Treino de hoje"}</SectionTitle>
        {session ? (
          <Logger s={session} setS={setSession} workouts={workouts} split={split} plan={plan} onSaved={() => setSession(null)} />
        ) : (
          <>
            <p className="font-display text-2xl">{todayDay.label} · {todayDay.focus}</p>
            <ul className="mt-3 grid gap-1">
              {(plan.days[String(todayDay.dow)] ?? []).map((x, i) => (
                <li key={i} className="flex justify-between text-sm py-1.5 border-b border-white/5 last:border-0"><span>{x.name}</span><span className="text-muted num">{x.sets}×{x.reps}</span></li>
              ))}
            </ul>
            <button className="btn btn-accent w-full mt-4" onClick={() => setSession(buildSession(today, todayDay, plan.days[String(todayDay.dow)] ?? [], workouts))}>
              {(plan.days[String(todayDay.dow)] ?? []).length ? "Começar treino" : "Registrar treino extra"}</button>
          </>
        )}
      </section>

      <section className="glass rise p-5 mt-4">
        <SectionTitle>Recordes pessoais</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          {plan.prs.map((name) => { const { top, est } = prOf(name); return (
            <button key={name} className="text-left rounded-2xl bg-white/[.03] p-3" onClick={() => setExSel(names.find((x) => x.toLowerCase() === name.toLowerCase()) ?? names.find((x) => new RegExp(name.split(/\s+/)[0].slice(0, 6), "i").test(x)) ?? name)}>
              <p className="text-xs text-muted leading-tight min-h-[2lh]">{name}</p>
              <p className="num text-2xl mt-1" style={{ color: G }}>{top ? fmt(top.kg) : "—"}</p>
              {top && <p className="text-[11px] text-muted">{top.reps} reps · {shortDate(top.date)}</p>}
              {est > 0 && <p className="text-[11px] text-faint">1RM est. {fmt(est, 0)}</p>}
            </button>
          ); })}
        </div>
      </section>

      <section className="glass rise p-5 mt-4">
        <SectionTitle>Evolução</SectionTitle>
        {names.length === 0 ? <Empty>Registre treinos para ver sua evolução.</Empty> : (
          <>
            <select className="field" value={exSel} onChange={(e) => setExSel(e.target.value)} aria-label="Exercício">
              {!names.includes(exSel) && <option value={exSel}>{exSel}</option>}
              {names.map((x) => <option key={x}>{x}</option>)}
            </select>
            {series.length > 0 ? (
              <>
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full mt-3" role="img" aria-label={`Evolução do 1RM estimado em ${exSel}`}>
                  <path d={series.map((x, i) => `${i ? "L" : "M"}${sx(i)},${sy(x[1])}`).join(" ")} fill="none" stroke={G} strokeWidth="2.5" strokeLinejoin="round" />
                  {series.map((x, i) => <circle key={x[0]} cx={sx(i)} cy={sy(x[1])} r="3.5" fill="#07080b" stroke={G} strokeWidth="2"><title>{`${shortDate(x[0])}: ${fmt(x[1], 0)} kg`}</title></circle>)}
                </svg>
                <p className="text-xs text-muted">1RM estimado (Epley) por sessão · melhor: <span className="num text-ink">{fmt(Math.max(...sv), 0)} kg</span></p>
              </>
            ) : <p className="font-display italic text-muted mt-3">Sem registros deste exercício ainda.</p>}
          </>
        )}
      </section>

      <section className="glass rise p-5 mt-4">
        <SectionTitle>Frequência no mês</SectionTitle>
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {weekdayShort.map((d) => <span key={d} className="label text-[10px]">{d}</span>)}
          {Array.from({ length: dow(m) }).map((_, i) => <span key={"b" + i} />)}
          {Array.from({ length: dim }).map((_, i) => { const d = addDays(m, i); return (
            <span key={d} className={`aspect-square rounded-lg grid place-items-center text-xs ${d === today ? "ring-1 ring-white/50" : ""}`}
              style={{ background: trained.has(d) ? G : "rgba(255,255,255,.04)", color: trained.has(d) ? "#0b0c10" : undefined }}>{i + 1}</span>); })}
        </div>
      </section>

      <section className="glass rise p-5 mt-4">
        <SectionTitle>Histórico</SectionTitle>
        {workouts.length === 0 ? <Empty>Sua primeira sessão aparecerá aqui.</Empty> : (
          <ul>
            {workouts.slice(0, 30).map((w) => (
              <li key={w.id}><button className="row-hover w-full flex items-center gap-3 min-h-14 px-2 text-left" onClick={() => setSheet(w)}>
                <span className="w-16 shrink-0 text-sm text-muted whitespace-nowrap">{shortDate(w.date)}</span>
                <span className="flex-1 min-w-0"><span className="block truncate">{w.split_label}</span>
                  <span className="text-xs text-muted">{new Set(w.sets.map((s) => s.exercise)).size} exercícios · {w.sets.length} séries{w.duration_min ? ` · ${w.duration_min} min` : ""}</span></span>
                <span className="num text-sm text-muted">{Math.round(volume(w.sets)).toLocaleString("pt-BR")} kg</span>
              </button></li>
            ))}
          </ul>
        )}
      </section>

      <Sheet accent={G} open={sheet === "plan"} onClose={() => setSheet(null)} title="Plano semanal"><PlanEditor split={split} plan={plan} onDone={() => setSheet(null)} /></Sheet>
      <Sheet accent={G} open={!!viewing} onClose={() => setSheet(null)} title={viewing ? `${shortDate(viewing.date)} · ${viewing.split_label ?? "Treino"}` : ""}>
        {viewing && (
          <div className="grid gap-3">
            {[...new Set(viewing.sets.map((s) => s.exercise))].map((ex) => (
              <div key={ex}><p className="font-medium">{ex}</p>
                <p className="text-sm text-muted num">{viewing.sets.filter((s) => s.exercise === ex).map((s) => `${fmt(Number(s.kg))}×${s.reps}`).join("  ·  ")}</p></div>
            ))}
            {viewing.notes && <p className="font-display italic">{viewing.notes}</p>}
            <p className="text-xs text-muted">Volume {Math.round(volume(viewing.sets)).toLocaleString("pt-BR")} kg{viewing.duration_min ? ` · ${viewing.duration_min} min` : ""}</p>
            <div className="flex gap-2 mt-2">
              <button className="btn text-muted" disabled={pending} onClick={() => { if (confirm("Excluir sessão?")) start(async () => { await deleteWorkout(viewing.id); setSheet(null); }); }}>Excluir</button>
              <button className="btn btn-accent flex-1" onClick={() => {
                const exs = [...new Set(viewing.sets.map((s) => s.exercise))].map((ex) => ({ name: ex, sets: viewing.sets.filter((s) => s.exercise === ex).map((s) => ({ kg: String(Number(s.kg)), reps: String(s.reps), done: true })) }));
                setSession({ date: viewing.date, label: viewing.split_label ?? "Treino", notes: viewing.notes ?? "", startedAt: null, exercises: exs, editingId: viewing.id });
                setSheet(null); window.scrollTo({ top: 0, behavior: "smooth" });
              }}>Editar sessão</button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
export { diffDays };
