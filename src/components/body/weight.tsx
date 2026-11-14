"use client";
import { Scale } from "@/components/meters";
import { useState, useTransition } from "react";
import { deleteWeight, saveWeight } from "@/app/(app)/corpo/actions";
import { updateSettings } from "@/app/settings-actions";
import { Empty } from "@/components/ui";
import { Field, LinkBtn, Progress, SectionTitle, Sheet, Stat, fmt, n } from "@/components/kit";
import { addDays, diffDays, shortDate } from "@/lib/date";

const G = "#30d158";
type Log = { id: string; date: string; kg: number };

export function Weight({ today, logs, goal, startKg, rate }: { today: string; logs: Log[]; goal: number; startKg: number; rate: number }) {
  const [pending, start] = useTransition();
  const [sheet, setSheet] = useState<null | "goal" | "new" | Log>(null);
  const [f, setF] = useState({ date: today, kg: "" });
  const [g, setG] = useState({ start: fmt(startKg), goal: fmt(goal), rate: fmt(rate, 2) });
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const cur = sorted.at(-1)?.kg ?? startKg;
  const first = sorted[0];
  const left = cur - goal;
  const lost = startKg - cur;
  const progress = startKg !== goal ? (startKg - cur) / (startKg - goal) : 0;

  const recent = sorted.filter((l) => diffDays(today, l.date) <= 56);
  let perWeek: number | null = null;
  if (recent.length >= 2) {
    const x = recent.map((l) => diffDays(l.date, recent[0].date)), y = recent.map((l) => l.kg);
    const mx = x.reduce((a, b) => a + b, 0) / x.length, my = y.reduce((a, b) => a + b, 0) / y.length;
    const num = x.reduce((a, xi, i) => a + (xi - mx) * (y[i] - my), 0), den = x.reduce((a, xi) => a + (xi - mx) ** 2, 0);
    if (den) perWeek = (num / den) * 7;
  }
  const losing = goal < startKg;
  const eta = perWeek && left !== 0 && Math.sign(perWeek) === Math.sign(goal - cur) ? addDays(today, Math.ceil(Math.abs(left / perWeek) * 7)) : null;
  const planEta = rate > 0 ? addDays(first?.date ?? today, Math.ceil((Math.abs(startKg - goal) / rate) * 7)) : null;

  // Gráfico com linha ideal
  const W = 640, H = 220, P = 28;
  const endDate = [sorted.at(-1)?.date ?? today, planEta ?? today].sort().at(-1)!;
  const t0 = first?.date ?? today, span = Math.max(1, diffDays(endDate, t0));
  const ys = [...sorted.map((l) => l.kg), goal, startKg];
  const min = Math.min(...ys) - 1, max = Math.max(...ys) + 1;
  const px = (d: string) => P + (diffDays(d, t0) / span) * (W - 2 * P);
  const py = (v: number) => P + ((max - v) / (max - min || 1)) * (H - 2 * P);
  const path = sorted.map((l, i) => `${i ? "L" : "M"}${px(l.date).toFixed(1)},${py(l.kg).toFixed(1)}`).join(" ");

  const openLog = (l: Log | "new") => { setSheet(l); setF(l === "new" ? { date: today, kg: "" } : { date: l.date, kg: fmt(l.kg) }); };
  const editing = sheet && typeof sheet === "object" ? sheet : null;

  return (
    <div style={{ ["--accent" as string]: G }}>
      <section className="glass rise p-5">
        <SectionTitle action={<LinkBtn onClick={() => setSheet("goal")}>Editar meta</LinkBtn>}>Peso</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <Stat big label="Atual" value={fmt(cur)} sub="kg" />
          <Stat big label="Meta" value={fmt(goal)} sub={`início ${fmt(startKg)} kg`} />
          <Stat big label="Falta" value={fmt(Math.abs(left))} color={G} sub={left === 0 ? "chegou!" : "kg"} />
        </div>
        <div className="mt-4 flex items-center gap-3"><Scale pct={progress} size={56} /><div className="flex-1"><Progress value={progress} /></div></div>
        <div className="flex justify-between text-xs text-muted mt-1.5">
          <span>{Math.round(Math.max(0, progress) * 100)}% do caminho · {losing ? "perdeu" : "ganhou"} {fmt(Math.abs(lost))} kg</span>
          <span>plano: {fmt(rate, 2)} kg/sem</span>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
          <div className="rounded-xl bg-white/[.03] p-3"><p className="label">Ritmo real</p><p className="num text-lg mt-1">{perWeek == null ? "—" : `${perWeek > 0 ? "+" : ""}${fmt(perWeek, 2)} kg/sem`}</p></div>
          <div className="rounded-xl bg-white/[.03] p-3"><p className="label">Previsão</p><p className="num text-lg mt-1">{eta ? `${shortDate(eta)} ${eta.slice(2, 4)}` : "—"}</p></div>
        </div>
        {sorted.length > 1 && (
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full mt-4" role="img" aria-label="Gráfico do peso com a linha ideal">
            {[0, 0.5, 1].map((t) => { const v = min + (max - min) * t; return <g key={t}><line x1={P} x2={W - P} y1={py(v)} y2={py(v)} stroke="rgba(255,255,255,.05)" /><text x={4} y={py(v) + 4} fontSize="11" fill="#5d5b56">{fmt(v, 0)}</text></g>; })}
            <line x1={P} x2={W - P} y1={py(goal)} y2={py(goal)} stroke={G} strokeDasharray="4 6" opacity=".5" />
            {planEta && <line x1={px(t0)} y1={py(startKg)} x2={px(planEta)} y2={py(goal)} stroke="#ff4d8a" strokeDasharray="2 5" opacity=".6" />}
            <path d={`${path} L${px(sorted.at(-1)!.date)},${H - P} L${px(t0)},${H - P} Z`} fill={G} opacity=".08" />
            <path d={path} fill="none" stroke={G} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {sorted.map((l) => <circle key={l.id} cx={px(l.date)} cy={py(l.kg)} r="3.5" fill="#07080b" stroke={G} strokeWidth="2" />)}
          </svg>
        )}
        {sorted.length > 1 && <p className="text-[11px] text-faint mt-1">Verde: seu peso · dourado: plano ideal · tracejado: meta</p>}
      </section>

      <button className="btn btn-accent w-full mt-4" onClick={() => openLog("new")}>+ Registrar peso</button>

      <section className="glass rise p-5 mt-4">
        <SectionTitle>Histórico</SectionTitle>
        {sorted.length === 0 ? <Empty>Registre o peso uma vez por semana, no mesmo dia e horário.</Empty> : (
          <ul>
            {[...sorted].reverse().map((l, i, arr) => {
              const prev = arr[i + 1], d = prev ? l.kg - prev.kg : null;
              return (
                <li key={l.id}><button className="row-hover w-full flex items-center gap-3 min-h-12 px-2" onClick={() => openLog(l)}>
                  <span className="text-sm text-muted flex-1 text-left">{shortDate(l.date)} {l.date.slice(0, 4)}</span>
                  {d != null && <span className="text-xs num" style={{ color: (d < 0) === losing ? G : "#ff453a" }}>{d > 0 ? "+" : ""}{fmt(d)}</span>}
                  <span className="num w-20 text-right">{fmt(l.kg)} kg</span>
                </button></li>
              );
            })}
          </ul>
        )}
      </section>

      <Sheet accent={G} open={sheet === "new" || !!editing} onClose={() => setSheet(null)} title={editing ? "Editar registro" : "Registrar peso"}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data"><input type="date" className="field" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <Field label="Peso (kg)"><input className="field num text-lg" inputMode="decimal" value={f.kg} onChange={(e) => setF({ ...f, kg: e.target.value })} autoFocus /></Field>
        </div>
        <div className="flex gap-2 mt-4">
          {editing && <button className="btn text-muted" onClick={() => { if (confirm("Excluir registro?")) start(async () => { await deleteWeight(editing.id); setSheet(null); }); }}>Excluir</button>}
          <button className="btn btn-accent flex-1" disabled={pending || !n(f.kg)} onClick={() => start(async () => { await saveWeight(f.date, n(f.kg), editing?.id); setSheet(null); })}>Salvar</button>
        </div>
      </Sheet>

      <Sheet accent={G} open={sheet === "goal"} onClose={() => setSheet(null)} title="Meta de peso">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Início (kg)"><input className="field num" inputMode="decimal" value={g.start} onChange={(e) => setG({ ...g, start: e.target.value })} /></Field>
          <Field label="Meta (kg)"><input className="field num" inputMode="decimal" value={g.goal} onChange={(e) => setG({ ...g, goal: e.target.value })} /></Field>
          <Field label="kg/semana"><input className="field num" inputMode="decimal" value={g.rate} onChange={(e) => setG({ ...g, rate: e.target.value })} /></Field>
        </div>
        <p className="text-xs text-muted mt-2">Cutting saudável: 0,5–1% do peso por semana.</p>
        <button className="btn btn-accent w-full mt-4" disabled={pending} onClick={() => start(async () => {
          await updateSettings({ weight_start_kg: n(g.start), weight_goal_kg: n(g.goal), weight_rate_kg_week: n(g.rate) }); setSheet(null);
        })}>Salvar meta</button>
      </Sheet>
    </div>
  );
}
