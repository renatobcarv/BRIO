"use client";
import { Hourglass } from "@/components/meters";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { addPioneerEntry, deletePioneerEntry, saveWeekPlan, setMonthGoal } from "@/app/(app)/pioneiro/actions";
import { Card, Empty } from "@/components/ui";
import { addDays, addMonths, daysInMonth, diffDays, dow, fromHMM, monthEnd, monthLabel, shortDate, toHMM, weekdayShort } from "@/lib/date";
import { CATEGORIES, PRESETS, scalePreset, type Category } from "@/lib/pioneer";

type Entry = { id: string; date: string; category: Category; minutes: number };
const ACC = "#f5f5f7";

export function Pioneer(props: {
  month: string; today: string; goal: number; entries: Entry[]; plan: number[]; year: { month: string; minutes: number }[];
}) {
  const { month, today, goal, entries, plan } = props;
  const [pending, start] = useTransition();
  const [date, setDate] = useState(today.slice(0, 7) === month.slice(0, 7) ? today : month);
  const [cat, setCat] = useState<Category>("campo");
  const [hmm, setHmm] = useState("1:00");
  const [editGoal, setEditGoal] = useState(false);
  const [goalText, setGoalText] = useState(toHMM(goal));
  const [week, setWeek] = useState(plan);
  const [err, setErr] = useState("");

  const total = entries.reduce((a, e) => a + e.minutes, 0);
  const left = Math.max(0, goal - total);
  const dim = daysInMonth(month);
  const end = monthEnd(month);
  const daysLeft = today > end ? 0 : today < month ? dim : diffDays(end, today) + 1;
  const perDay = daysLeft ? left / daysLeft : 0;

  const byDay = useMemo(() => {
    const m = new Map<string, Record<string, number>>();
    for (const e of entries) { const r = m.get(e.date) ?? {}; r[e.category] = (r[e.category] ?? 0) + e.minutes; m.set(e.date, r); }
    return m;
  }, [entries]);
  const byCat = (Object.keys(CATEGORIES) as Category[]).map((c) => ({ c, m: entries.filter((e) => e.category === c).reduce((a, e) => a + e.minutes, 0) }));
  const maxCat = Math.max(1, ...byCat.map((x) => x.m));

  const weekTotal = week.reduce((a, b) => a + b, 0);
  const projected = Math.round((weekTotal * dim) / 7);
  const yearMax = Math.max(1, ...props.year.map((y) => y.minutes));
  const yearTotal = props.year.reduce((a, y) => a + y.minutes, 0);

  const submit = () => {
    setErr("");
    const minutes = fromHMM(hmm);
    if (!/^\d{1,2}(:\d{1,2})?$/.test(hmm) || !minutes) return setErr("Use o formato h:mm, ex.: 1:30");
    start(async () => { await addPioneerEntry({ date, minutes, category: cat }); });
  };
  const pickCat = (c: Category) => { setCat(c); if (c === "obra") setHmm("8:00"); };

  return (
    <div style={{ ["--accent" as string]: ACC }}>
      <nav className="flex items-center justify-between mb-4 rise">
        <Link className="btn" href={`/pioneiro?m=${addMonths(month, -1).slice(0, 7)}`} aria-label="Mês anterior">‹</Link>
        <p className="font-display text-xl capitalize">{monthLabel(month)}</p>
        <Link className="btn" href={`/pioneiro?m=${addMonths(month, 1).slice(0, 7)}`} aria-label="Próximo mês">›</Link>
      </nav>

      <Card>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-3">
            <Hourglass pct={goal ? total / goal : 0} size={62} color={ACC} />
            <span><span className="num text-3xl block">{toHMM(total)}</span><span className="label">de {toHMM(goal)}</span><span className="block text-xs mt-1" style={{ color: ACC }}>{goal ? Math.round((total / goal) * 100) : 0}% do mês</span></span>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 flex-1 min-w-48">
            <div><dt className="label">Restam</dt><dd className="num text-2xl">{toHMM(left)}</dd></div>
            <div><dt className="label">Dias</dt><dd className="num text-2xl">{daysLeft}</dd></div>
            <div><dt className="label">Por dia</dt><dd className="num text-xl">{toHMM(Math.ceil(perDay))}</dd></div>
            <div><dt className="label">Por semana</dt><dd className="num text-xl">{toHMM(Math.ceil(perDay * 7))}</dd></div>
          </dl>
        </div>
        <div className="mt-4 flex items-center gap-2">
          {editGoal ? (
            <>
              <input className="field max-w-28" value={goalText} onChange={(e) => setGoalText(e.target.value)} inputMode="numeric" aria-label="Meta do mês (h:mm)" />
              <button className="btn btn-accent" disabled={pending}
                onClick={() => start(async () => { await setMonthGoal(month, fromHMM(goalText)); setEditGoal(false); })}>Salvar meta</button>
            </>
          ) : <button className="btn" onClick={() => setEditGoal(true)}>Meta do mês: {toHMM(goal)}</button>}
        </div>
      </Card>

      <Card className="mt-4">
        <p className="label mb-3">Lançar</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(CATEGORIES) as Category[]).map((c) => (
            <button key={c} className="chip" aria-pressed={cat === c} onClick={() => pickCat(c)}
              style={cat === c ? { background: CATEGORIES[c].color } : undefined}>{CATEGORIES[c].label}</button>
          ))}
        </div>
        <div className="grid grid-cols-[1fr_7rem] gap-2 mt-3">
          <input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Data" />
          <input className="field text-center num text-lg" value={hmm} onChange={(e) => setHmm(e.target.value)} inputMode="numeric" aria-label="Horas (h:mm)" />
        </div>
        <div className="flex gap-2 mt-2">
          {["0:30", "1:00", "1:30", "2:00", "3:00"].map((v) => <button key={v} className="chip" onClick={() => setHmm(v)}>{v}</button>)}
        </div>
        {err && <p role="alert" className="text-sm text-[#ff453a] mt-2">{err}</p>}
        <button className="btn btn-accent w-full mt-3" disabled={pending} onClick={submit}>{pending ? "Salvando…" : "Adicionar"}</button>
      </Card>

      <Card className="mt-4">
        <p className="label mb-3">Calendário</p>
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {weekdayShort.map((d) => <span key={d} className="label text-[10px]">{d}</span>)}
          {Array.from({ length: dow(month) }).map((_, i) => <span key={"b" + i} />)}
          {Array.from({ length: dim }).map((_, i) => {
            const d = addDays(month, i), r = byDay.get(d);
            const sum = r ? Object.values(r).reduce((a, b) => a + b, 0) : 0;
            const main = r ? (Object.entries(r).sort((a, b) => b[1] - a[1])[0][0] as Category) : null;
            const a = Math.min(1, 0.25 + sum / 240);
            return (
              <span key={d} title={sum ? `${shortDate(d)} · ${toHMM(sum)}` : shortDate(d)}
                className={`aspect-square rounded-lg grid place-items-center text-xs ${d === today ? "ring-1 ring-white/50" : ""}`}
                style={{ background: main ? CATEGORIES[main].color + Math.round(a * 255).toString(16).padStart(2, "0") : "rgba(255,255,255,.04)",
                  color: main && a > .6 ? "#0b0c10" : undefined }}>{i + 1}</span>
            );
          })}
        </div>
      </Card>

      <Card className="mt-4">
        <p className="label mb-3">Por categoria</p>
        <div className="grid gap-3">
          {byCat.map(({ c, m }) => (
            <div key={c}>
              <div className="flex justify-between text-sm"><span>{CATEGORIES[c].label}</span><span className="num">{toHMM(m)}</span></div>
              <div className="bar mt-1"><i style={{ width: `${(m / maxCat) * 100}%`, background: CATEGORIES[c].color }} /></div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-4">
        <p className="label mb-3">Planejamento semanal</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => <button key={p.name} className="chip" onClick={() => setWeek(scalePreset(p.weights, goal, dim))}>{p.name}</button>)}
        </div>
        <div className="grid grid-cols-7 gap-1.5 mt-4">
          {week.map((m, i) => (
            <label key={i} className="grid gap-1 text-center">
              <span className="label text-[10px]">{weekdayShort[i]}</span>
              <input className="field !px-1 text-center text-sm num" value={toHMM(m)} inputMode="numeric"
                onChange={(e) => { const n = [...week]; n[i] = fromHMM(e.target.value) || 0; setWeek(n); }} />
            </label>
          ))}
        </div>
        <p className="mt-3 text-sm">
          <span className="num">{toHMM(weekTotal)}</span> por semana → <span className="num">{toHMM(projected)}</span> no mês ·{" "}
          {projected >= goal ? <span style={{ color: "#30d158" }}>fecha a meta</span> : <span className="text-gold">faltam {toHMM(goal - projected)}</span>}
        </p>
        <button className="btn mt-3" disabled={pending} onClick={() => start(() => saveWeekPlan(week))}>Salvar plano</button>
      </Card>

      <Card className="mt-4">
        <p className="label mb-3">Lançamentos</p>
        {entries.length === 0 ? <Empty>Nenhuma hora lançada neste mês ainda.</Empty> : (
          <ul className="divide-y divide-white/5">
            {[...entries].sort((a, b) => b.date.localeCompare(a.date)).map((e) => (
              <li key={e.id} className="flex items-center gap-3 min-h-12">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORIES[e.category].color }} />
                <span className="text-sm text-muted w-16">{shortDate(e.date)}</span>
                <span className="flex-1 text-sm">{CATEGORIES[e.category].label}</span>
                <span className="num">{toHMM(e.minutes)}</span>
                <button className="btn !min-h-9 !px-3 text-muted" aria-label="Excluir" disabled={pending}
                  onClick={() => { if (confirm("Excluir este lançamento?")) start(() => deletePioneerEntry(e.id)); }}>×</button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mt-4">
        <div className="flex justify-between items-baseline mb-3">
          <p className="label">Ano de serviço</p><p className="num text-lg">{toHMM(yearTotal)}</p>
        </div>
        <div className="flex items-end gap-1.5 h-32">
          {props.year.map((y) => (
            <div key={y.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <div className="w-full rounded-md" title={toHMM(y.minutes)}
                style={{ height: `${(y.minutes / yearMax) * 100}%`, minHeight: 2, background: y.month === month ? ACC : ACC + "55" }} />
              <span className="text-[10px] text-muted">{monthLabel(y.month).slice(0, 3)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
