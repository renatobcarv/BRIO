"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { saveWorkout } from "@/app/(app)/corpo/actions";
import { useXp, haptic } from "@/components/game/xp";
import { CountUp } from "@/components/count-up";
import { fmt, n } from "@/components/kit";
import { e1rm, isTimed, lastFor, mmss, type Session, type Workout } from "./training";

const G = "#e0393e";

function Rest({ total, onDone }: { total: number; onDone: () => void }) {
  const [left, setLeft] = useState(total);
  const end = useRef(Date.now() + total * 1000);
  useEffect(() => { end.current = Date.now() + total * 1000; setLeft(total); }, [total]);
  useEffect(() => {
    const id = setInterval(() => { const l = Math.max(0, Math.ceil((end.current - Date.now()) / 1000)); setLeft(l); if (l === 0) { clearInterval(id); haptic([200, 100, 200]); setTimeout(onDone, 900); } }, 200);
    return () => clearInterval(id);
  }, [onDone, total]);
  const r = 70, c = 2 * Math.PI * r, p = total ? left / total : 0;
  return (
    <div className="grid place-items-center py-4 reward-in">
      <div className="relative h-[180px] w-[180px] grid place-items-center">
        <svg width="180" height="180" className="-rotate-90 absolute" aria-hidden>
          <circle cx="90" cy="90" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="10" />
          <circle cx="90" cy="90" r={r} fill="none" stroke={left ? G : "#ffb340"} strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - p)}
            style={{ transition: "stroke-dashoffset .25s linear", filter: `drop-shadow(0 0 10px ${left ? G : "#ffb340"})` }} />
        </svg>
        <div className="text-center"><p className="text-xs text-muted">{left ? "Descanso" : "Bora!"}</p><p className="num text-5xl">{mmss(left)}</p></div>
      </div>
      <div className="flex gap-2 mt-3">
        <button className="btn !min-h-11" onClick={() => { end.current += 15000; setLeft((l) => l + 15); }}>+15s</button>
        <button className="btn btn-accent !min-h-11 !px-6" onClick={onDone}>Pular descanso</button>
      </div>
    </div>
  );
}

function Big({ label, value, onChange, step, unit }: { label: string; value: string; onChange: (v: string) => void; step: number; unit: string }) {
  const v = n(value);
  return (
    <div className="rounded-2xl bg-[#141416] border border-white/[.06] p-3">
      <p className="label text-center">{label}</p>
      <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-1 mt-1">
        <button className="press h-11 w-11 rounded-full bg-white/[.07] text-2xl grid place-items-center" onClick={() => { haptic(6); onChange(String(Math.max(0, +(v - step).toFixed(2)))); }} aria-label={`Menos ${label}`}>−</button>
        <input className="bg-transparent text-center num text-4xl w-full min-w-0 outline-none" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} />
        <button className="press h-11 w-11 rounded-full bg-white/[.07] text-2xl grid place-items-center" onClick={() => { haptic(6); onChange(String(+(v + step).toFixed(2))); }} aria-label={`Mais ${label}`}>+</button>
      </div>
      <p className="text-[11px] text-faint text-center">{unit}</p>
    </div>
  );
}

/** Treino guiado: um exercício e uma série por vez, com recompensa a cada série. */
export function GuidedLogger({ s, setS, workouts, onSaved }: { s: Session; setS: (s: Session | null) => void; workouts: Workout[]; onSaved: () => void }) {
  const { gain, celebrate } = useXp();
  const [pending, start] = useTransition();
  const firstOpen = () => { for (let e = 0; e < s.exercises.length; e++) { const k = s.exercises[e].sets.findIndex((x) => !x.done); if (k >= 0) return { e, k }; } return null; };
  const [cur, setCur] = useState(firstOpen() ?? { e: 0, k: 0 });
  const [rest, setRest] = useState<number | null>(null);
  const [finished, setFinished] = useState<null | { sets: number; vol: number; prs: string[]; xp: number; min: number }>(null);
  const [clock, setClock] = useState(0);
  const top = useRef<HTMLDivElement>(null);
  useEffect(() => { top.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, []);
  useEffect(() => { const id = setInterval(() => setClock(s.startedAt ? Date.now() - s.startedAt : 0), 1000); return () => clearInterval(id); }, [s.startedAt]);
  const ex = s.exercises[cur.e], set = ex?.sets[cur.k];
  const timed = ex ? isTimed(ex.name, (ex.target as { muscle?: string } | undefined)?.muscle) : false;
  const totalSets = s.exercises.reduce((a, e) => a + e.sets.length, 0), doneSets = s.exercises.reduce((a, e) => a + e.sets.filter((x) => x.done).length, 0);
  const vol = s.exercises.filter((e) => !isTimed(e.name)).reduce((a, e) => a + e.sets.filter((x) => x.done).reduce((b, x) => b + n(x.kg) * n(x.reps), 0), 0);
  const last = useMemo(() => (ex ? lastFor(workouts, ex.name, s.date) : null), [ex, workouts, s.date]);
  const bestBefore = (name: string) => Math.max(0, ...workouts.flatMap((w) => w.sets).filter((x) => x.exercise.toLowerCase() === name.toLowerCase()).map((x) => e1rm(Number(x.kg), x.reps)));

  const upd = (p: Partial<{ kg: string; reps: string; rpe: string }>) =>
    setS({ ...s, startedAt: s.startedAt ?? Date.now(), exercises: s.exercises.map((e, i) => (i !== cur.e ? e : { ...e, sets: e.sets.map((x, j) => (j === cur.k ? { ...x, ...p } : x)) })) });

  const complete = () => {
    if (!ex || !set) return;
    const kg = n(set.kg), reps = n(set.reps);
    const next = { ...s, startedAt: s.startedAt ?? Date.now(), exercises: s.exercises.map((e, i) => (i !== cur.e ? e : { ...e, sets: e.sets.map((x, j) => (j === cur.k ? { ...x, done: true } : x)) })) };
    // Próxima série ainda não feita; se o exercício terminou, pré-preenche a próxima com a mesma carga.
    if (ex.sets[cur.k + 1] && !ex.sets[cur.k + 1].kg) next.exercises[cur.e].sets[cur.k + 1].kg = set.kg;
    setS(next);
    gain(timed ? Math.min(30, Math.max(5, Math.round(reps))) : Math.max(1, Math.round((kg * reps) / 100)), timed ? `${ex.name} · ${reps} min${kg ? ` · ${fmt(kg)} km` : ""}` : `${ex.name} ${fmt(kg)}×${reps}`, G);
    const old = timed ? 0 : bestBefore(ex.name), now = e1rm(kg, reps);
    if (old > 0 && now > old) setTimeout(() => celebrate("Novo recorde!", `${ex.name}: ${fmt(kg)} kg × ${reps}`), 300);
    else if (next.exercises[cur.e].sets.every((x) => x.done)) { setTimeout(() => { gain(15, `${ex.name} conquistado`, "#ffd27a"); haptic([30, 30, 80]); }, 450); }
    let nx: { e: number; k: number } | null = null;
    for (let e = cur.e; e < next.exercises.length && !nx; e++) { const k = next.exercises[e].sets.findIndex((x) => !x.done); if (k >= 0) nx = { e, k }; }
    if (!nx) for (let e = 0; e < next.exercises.length && !nx; e++) { const k = next.exercises[e].sets.findIndex((x) => !x.done); if (k >= 0) nx = { e, k }; }
    if (nx) { setCur(nx); const r = ex.target?.rest ?? 90; if (r > 0) setRest(r); }
  };

  const finish = () => start(async () => {
    const sets = s.exercises.flatMap((e) => e.sets.filter((x) => x.done).map((x) => ({ exercise: e.name, kg: n(x.kg), reps: Math.round(n(x.reps)), rpe: x.rpe && n(x.rpe) ? Math.min(10, Math.max(1, n(x.rpe))) : null })));
    const min = s.startedAt ? Math.round((Date.now() - s.startedAt) / 60000) : 0;
    const prs = s.exercises.filter((e) => !isTimed(e.name)).filter((e) => { const b = bestBefore(e.name); const top = Math.max(0, ...e.sets.filter((x) => x.done).map((x) => e1rm(n(x.kg), n(x.reps)))); return b > 0 && top > b; }).map((e) => e.name);
    await saveWorkout({ date: s.date, split_label: s.label, notes: s.notes, duration_min: s.editingId ? null : min || null, sets,
      program_id: s.programId ?? null, week_no: s.weekNo ?? null, phase: s.phase ?? null, planned: s.planned ?? null }, s.editingId);
    const xp = Math.min(300, Math.round(vol / 100)) + prs.length * 100;
    setFinished({ sets: sets.length, vol, prs, xp, min });
    celebrate("Treino concluído", `${sets.length} séries · ${Math.round(vol).toLocaleString("pt-BR")} kg`);
  });

  if (finished) return (
    <div className="text-center py-4 reward-in">
      <div className="mx-auto h-24 w-24 rounded-full grid place-items-center glow" style={{ background: G, ["--glow" as string]: G } as React.CSSProperties}>
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.8" strokeLinecap="round" aria-hidden><path d="M5 12.5l4.5 4.5L19 7.5" className="check-draw" /></svg>
      </div>
      <p className="font-display text-3xl mt-4">Treino concluído</p>
      <div className="grid grid-cols-3 gap-2 mt-5">
        <div className="rounded-2xl bg-[#141416] p-3"><p className="num text-2xl"><CountUp value={finished.sets} /></p><p className="text-xs text-muted">séries</p></div>
        <div className="rounded-2xl bg-[#141416] p-3"><p className="num text-2xl"><CountUp value={finished.vol / 1000} format={(v) => v.toFixed(1).replace(".", ",")} /> t</p><p className="text-xs text-muted">volume</p></div>
        <div className="rounded-2xl bg-[#141416] p-3"><p className="num text-2xl"><CountUp value={finished.min} /></p><p className="text-xs text-muted">minutos</p></div>
      </div>
      {finished.prs.length > 0 && <p className="mt-4 rounded-2xl p-3 text-sm font-semibold" style={{ background: "#ffb34022", color: "#ffb340", boxShadow: "0 0 24px -8px #ffb340" }}>🏆 Recorde em {finished.prs.join(", ")}</p>}
      <p className="mt-5"><span className="num text-5xl text-glow" style={{ color: G, ["--glow" as string]: G } as React.CSSProperties}>+<CountUp value={finished.xp} /></span> <span className="text-muted">XP de Força</span></p>
      <button className="btn btn-accent w-full mt-6 !min-h-12" onClick={() => { onSaved(); }}>Continuar</button>
    </div>
  );

  if (!ex) return <p className="text-muted">Adicione exercícios para começar.</p>;
  return (
    <div>
      <div ref={top} className="flex items-center justify-between mb-3 scroll-mt-24">
        <span className="flex items-center gap-2 text-xs text-muted"><span className="h-2 w-2 rounded-full war-pulse" style={{ background: "#e0393e" }} />EM COMBATE</span>
        <span className="num text-2xl tabular-nums" aria-label="Tempo de treino">{s.startedAt ? `${Math.floor(clock / 3600000) ? Math.floor(clock / 3600000) + ":" : ""}${String(Math.floor(clock / 60000) % 60).padStart(2, "0")}:${String(Math.floor(clock / 1000) % 60).padStart(2, "0")}` : "00:00"}</span>
      </div>
      <div className="flex gap-1 mb-4" aria-label={`${doneSets} de ${totalSets} séries`}>
        {s.exercises.flatMap((e, i) => e.sets.map((x, j) => <i key={`${i}-${j}`} className="h-1.5 flex-1 rounded-full transition-all duration-500" style={{ background: x.done ? G : i === cur.e && j === cur.k ? "rgba(48,209,88,.4)" : "rgba(255,255,255,.08)", boxShadow: x.done ? `0 0 8px ${G}` : "none" }} />))}
      </div>

      {rest != null ? <Rest total={rest} onDone={() => setRest(null)} /> : (
        <div key={`${cur.e}-${cur.k}`} className="step-in-right">
          <p className="text-sm text-muted">Exercício {cur.e + 1} de {s.exercises.length}</p>
          <p className="font-display text-[28px] leading-tight mt-0.5">{ex.name}</p>
          <p className="text-sm mt-1" style={{ color: G }}>{timed ? `Meta: ${ex.target?.reps ?? "livre"}` : `Série ${cur.k + 1} de ${ex.sets.length}${ex.target ? ` · meta ${ex.target.reps} reps` : ""}`}{ex.target?.rpe ? ` · RPE ${fmt(ex.target.rpe)}` : ""}</p>
          {last && <p className="text-xs text-muted mt-1">Última vez ({last.date.split("-").reverse().slice(0, 2).join("/")}): {last.sets.map((x) => (timed ? `${x.reps} min${Number(x.kg) ? ` · ${fmt(Number(x.kg))} km` : ""}` : `${fmt(Number(x.kg))}×${x.reps}`)).join(" · ")}</p>}
          {ex.target?.notes && <p className="text-xs text-gold mt-1">{ex.target.notes}</p>}
          {timed ? (
            <div className="grid grid-cols-2 gap-2.5 mt-4">
              <Big label="Duração" value={set.reps} onChange={(v) => upd({ reps: v })} step={5} unit="minutos" />
              <Big label="Distância" value={set.kg} onChange={(v) => upd({ kg: v })} step={0.5} unit="km · opcional" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 mt-4">
              <Big label="Carga" value={set.kg} onChange={(v) => upd({ kg: v })} step={2.5} unit="kg" />
              <Big label="Repetições" value={set.reps} onChange={(v) => upd({ reps: v })} step={1} unit="reps" />
            </div>
          )}
          <div className="mt-3">
            <p className="label mb-1.5">Esforço (RPE)</p>
            <div className="flex gap-1.5">{["6", "7", "8", "9", "10"].map((r) => <button key={r} className="chip flex-1 justify-center !min-h-11" aria-pressed={set.rpe === r} onClick={() => upd({ rpe: set.rpe === r ? "" : r })}>{r}</button>)}</div>
          </div>
          <button className="btn w-full mt-4 !min-h-16 text-lg font-semibold text-black" style={{ background: G, boxShadow: `0 10px 30px -10px ${G}` }} disabled={!n(set.reps)} onClick={complete}>
            {timed ? "Concluído" : "Série feita"} <span className="opacity-60 text-sm ml-1">+{timed ? Math.min(30, Math.max(5, Math.round(n(set.reps)))) : Math.max(1, Math.round((n(set.kg) * n(set.reps)) / 100))} XP</span></button>
        </div>
      )}

      <div className="flex items-center justify-between mt-5 text-sm">
        <span className="text-muted">{doneSets}/{totalSets} séries · {Math.round(vol).toLocaleString("pt-BR")} kg</span>
        <button className="btn !min-h-10 text-sm" disabled={pending || doneSets === 0} onClick={finish}>{pending ? "Salvando…" : "Finalizar treino"}</button>
      </div>
      <details className="mt-3">
        <summary className="text-sm text-muted cursor-pointer min-h-10 flex items-center">Ir para outro exercício</summary>
        <ul className="grid gap-1.5 mt-2">
          {s.exercises.map((e, i) => {
            const d = e.sets.filter((x) => x.done).length;
            return <li key={i}><button className="row-hover w-full flex items-center gap-3 min-h-11 px-2 text-left" onClick={() => { setRest(null); const k = e.sets.findIndex((x) => !x.done); setCur({ e: i, k: k >= 0 ? k : e.sets.length - 1 }); }}>
              <span className="h-6 w-6 rounded-full grid place-items-center text-[11px] num" style={{ background: d === e.sets.length ? G : "rgba(255,255,255,.08)", color: d === e.sets.length ? "#000" : undefined }}>{d === e.sets.length ? "✓" : i + 1}</span>
              <span className="flex-1">{e.name}</span><span className="text-xs text-muted num">{d}/{e.sets.length}</span></button></li>;
          })}
        </ul>
      </details>
    </div>
  );
}
