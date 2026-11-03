"use client";
import { useState, useTransition } from "react";
import { deleteWorkout, saveWorkout } from "@/app/(app)/corpo/actions";
import { Card, Empty } from "@/components/ui";
import { addDays, dow, monthStart, shortDate, weekdayShort, daysInMonth } from "@/lib/date";
import type { SplitDay } from "@/lib/settings";

const ACC = "#8ac295";
type SetRow = { exercise: string; reps: number; kg: number };
type Workout = { id: string; date: string; split_label: string | null; notes: string | null; sets: (SetRow & { set_no: number })[] };
const LIFTS = [["Agachamento", /agach|squat/i], ["Supino", /supino|bench/i], ["Terra", /terra|deadlift|levantamento/i]] as const;

export function Training({ today, split, todaySplit, workouts }: { today: string; split: SplitDay[]; todaySplit: SplitDay; workouts: Workout[] }) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(today);
  const [label, setLabel] = useState(`${todaySplit.label} · ${todaySplit.focus}`);
  const [notes, setNotes] = useState("");
  const [sets, setSets] = useState<SetRow[]>([{ exercise: "", reps: 8, kg: 0 }]);

  const upd = (i: number, p: Partial<SetRow>) => setSets(sets.map((s, j) => (j === i ? { ...s, ...p } : s)));
  const save = () => start(async () => {
    await saveWorkout({ date, split_label: label, notes, sets: sets.filter((s) => s.exercise.trim()) });
    setOpen(false); setSets([{ exercise: "", reps: 8, kg: 0 }]); setNotes("");
  });

  const all = workouts.flatMap((w) => w.sets.map((s) => ({ ...s, date: w.date })));
  const prs = LIFTS.map(([name, re]) => {
    const hist = all.filter((s) => re.test(s.exercise) && s.kg > 0);
    const best = hist.reduce<(typeof hist)[number] | null>((b, s) => (!b || s.kg > b.kg ? s : b), null);
    return { name, best, recent: hist.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4) };
  });

  const m = monthStart(today), dim = daysInMonth(m);
  const trained = new Set(workouts.map((w) => w.date));
  const ordered = [1, 2, 3, 4, 5, 6, 0].map((d) => split.find((s) => s.dow === d)).filter(Boolean) as SplitDay[];

  return (
    <div style={{ ["--accent" as string]: ACC }}>
      <Card>
        <p className="label mb-3">Divisão semanal</p>
        <ul className="grid gap-1">
          {ordered.map((s) => (
            <li key={s.dow} className={`flex gap-3 min-h-10 items-center px-3 rounded-xl ${s.dow === todaySplit.dow ? "bg-white/[.06]" : ""}`}>
              <span className="label w-9">{weekdayShort[s.dow]}</span>
              <span className="num w-10" style={{ color: s.label === "Off" ? undefined : ACC }}>{s.label}</span>
              <span className="text-sm text-muted">{s.focus}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mt-4">
        {!open ? (
          <button className="btn btn-accent w-full" onClick={() => setOpen(true)}>Registrar sessão</button>
        ) : (
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              <input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Data" />
              <input className="field" value={label} onChange={(e) => setLabel(e.target.value)} aria-label="Treino" />
            </div>
            <div className="grid grid-cols-[1fr_4rem_4.5rem_2.75rem] gap-2 label"><span>Exercício</span><span>Reps</span><span>Kg</span><span /></div>
            {sets.map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_4rem_4.5rem_2.75rem] gap-2">
                <input className="field !px-2" value={s.exercise} placeholder="Ex.: Agachamento" onChange={(e) => upd(i, { exercise: e.target.value })} aria-label="Exercício" />
                <input className="field !px-1 text-center" inputMode="numeric" value={s.reps} onChange={(e) => upd(i, { reps: Number(e.target.value) || 0 })} aria-label="Repetições" />
                <input className="field !px-1 text-center" inputMode="decimal" value={s.kg} onChange={(e) => upd(i, { kg: Number(e.target.value.replace(",", ".")) || 0 })} aria-label="Carga" />
                <button className="btn !px-0 text-muted" aria-label="Remover série" onClick={() => setSets(sets.filter((_, j) => j !== i))}>×</button>
              </div>
            ))}
            <button className="btn" onClick={() => setSets([...sets, { ...(sets.at(-1) ?? { exercise: "", reps: 8, kg: 0 }) }])}>+ Série</button>
            <textarea className="field" placeholder="Observação" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <div className="flex gap-2 justify-end">
              <button className="btn" onClick={() => setOpen(false)}>Cancelar</button>
              <button className="btn btn-accent" disabled={pending} onClick={save}>Salvar sessão</button>
            </div>
          </div>
        )}
      </Card>

      <Card className="mt-4">
        <p className="label mb-3">Recordes pessoais</p>
        <div className="grid grid-cols-3 gap-3">
          {prs.map((p) => (
            <div key={p.name}>
              <p className="text-sm text-muted">{p.name}</p>
              <p className="num text-3xl" style={{ color: ACC }}>{p.best ? p.best.kg.toString().replace(".", ",") : "—"}</p>
              {p.best && <p className="text-xs text-muted">{p.best.reps} reps · {shortDate(p.best.date)}</p>}
              <ul className="mt-2 text-xs text-muted grid gap-0.5">
                {p.recent.map((r, i) => <li key={i}>{shortDate(r.date)}: {r.kg}×{r.reps}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-4">
        <p className="label mb-3">Frequência no mês</p>
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {weekdayShort.map((d) => <span key={d} className="label text-[10px]">{d}</span>)}
          {Array.from({ length: dow(m) }).map((_, i) => <span key={"b" + i} />)}
          {Array.from({ length: dim }).map((_, i) => {
            const d = addDays(m, i);
            return <span key={d} className={`aspect-square rounded-lg grid place-items-center text-xs ${d === today ? "ring-1 ring-white/50" : ""}`}
              style={{ background: trained.has(d) ? ACC : "rgba(255,255,255,.04)", color: trained.has(d) ? "#0b0c10" : undefined }}>{i + 1}</span>;
          })}
        </div>
      </Card>

      <Card className="mt-4">
        <p className="label mb-2">Sessões recentes</p>
        {workouts.length === 0 ? <Empty>Nenhuma sessão registrada ainda.</Empty> : (
          <ul className="divide-y divide-white/5">
            {workouts.slice(0, 12).map((w) => (
              <li key={w.id} className="py-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted w-16">{shortDate(w.date)}</span>
                  <span className="flex-1">{w.split_label}</span>
                  <button className="btn !min-h-9 !px-3 text-muted" aria-label="Excluir sessão"
                    onClick={() => { if (confirm("Excluir esta sessão?")) start(() => deleteWorkout(w.id)); }}>×</button>
                </div>
                {w.sets.length > 0 && <p className="text-xs text-muted mt-1">
                  {[...new Set(w.sets.map((s) => s.exercise))].map((ex) =>
                    `${ex} ${w.sets.filter((s) => s.exercise === ex).map((s) => `${s.kg}×${s.reps}`).join(", ")}`).join(" · ")}</p>}
                {w.notes && <p className="text-sm mt-1 font-display italic">{w.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
