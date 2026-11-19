"use client";
import { HI, Ico } from "@/components/hunt-icons";
import { useState, useTransition } from "react";
import { deleteWeight, saveWeight } from "@/app/(app)/corpo/actions";
import { updateSettings } from "@/app/settings-actions";
import { Empty } from "@/components/ui";
import { Field, SectionTitle, Sheet, fmt, n } from "@/components/kit";
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

  const R = "#ffb21e";
  const pctPath = Math.round(Math.max(0, Math.min(1, progress)) * 100);
  const onTrack = perWeek != null && rate > 0 ? (losing ? -perWeek >= rate * 0.8 : perWeek >= rate * 0.8) : null;
  const last7 = sorted.at(-2) ? cur - sorted.at(-2)!.kg : null;

  return (
    <div className="dash-auto" style={{ ["--accent" as string]: R }}>
      {/* Placar principal */}
      <section className="hunt-card rise relative overflow-hidden p-5">
        <span aria-hidden className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: R, boxShadow: `0 0 18px ${R}` }} />
        <div className="flex items-start justify-between gap-3">
          <div><p className="label flex items-center gap-1.5"><Ico d={HI.scale} size={13} color={R} />Peso atual</p><p className="num text-7xl leading-none mt-2">{fmt(cur)}<span className="text-2xl text-white/40"> kg</span></p>
            {last7 != null && <p className="font-mono text-xs mt-2" style={{ color: (last7 < 0) === losing ? G : "#ff453a" }}>{last7 > 0 ? "▲ +" : "▼ "}{fmt(last7)} kg desde o último registro</p>}</div>
          <button className="label !text-[10px] underline underline-offset-4 min-h-11" onClick={() => setSheet("goal")}>meta</button>
        </div>
        <div className="mt-5 flex justify-between label !text-[9px]"><span>início {fmt(startKg)}</span><span style={{ color: R }}>{pctPath}% do caminho</span><span>meta {fmt(goal)}</span></div>
        <div className="flex gap-[3px] mt-1.5" aria-hidden>{Array.from({ length: 20 }, (_, i) => <i key={i} className="h-2.5 flex-1" style={{ background: i < Math.round(pctPath / 5) ? R : "rgba(255,255,255,.08)" }} />)}</div>
        <div className="grid grid-cols-3 mt-5 border-t border-white/[.08] divide-x divide-white/[.08]">
          {[["Falta", left === 0 ? "0" : fmt(Math.abs(left)), "kg"], ["Ritmo", perWeek == null ? "—" : `${perWeek > 0 ? "+" : ""}${fmt(perWeek, 2)}`, "kg/sem"], ["Chegada", eta ? shortDate(eta) : "—", eta ? eta.slice(0, 4) : "previsão"]].map(([l, v, u]) => (
            <div key={l} className="pt-3 text-center"><p className="label !text-[9px]">{l}</p><p className="num text-2xl mt-1 eye">{v}</p><p className="text-[10px] text-white/45">{u}</p></div>))}
        </div>
        {onTrack != null && <p className="text-[12px] mt-4" style={{ color: onTrack ? G : "#ff453a" }}>{onTrack ? `No ritmo do plano (${fmt(rate, 2)} kg/sem). Mantenha.` : `Abaixo do plano de ${fmt(rate, 2)} kg/sem. Ajuste dieta ou treino.`}</p>}
        <button className="btn btn-accent w-full mt-5" onClick={() => openLog("new")}>+ Registrar peso</button>
      </section>

      {/* Gráfico */}
      {sorted.length > 1 && (
        <section className="glass rise p-5 mt-4">
          <SectionTitle><span className="inline-flex items-center gap-1.5"><Ico d={HI.chart} size={14} />Trajetória</span></SectionTitle>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Gráfico do peso com a linha do plano e a meta">
            {[0, 0.5, 1].map((t) => { const v = min + (max - min) * t; return <g key={t}><line x1={P} x2={W - P} y1={py(v)} y2={py(v)} stroke="rgba(255,255,255,.06)" /><text x={4} y={py(v) + 4} fontSize="11" fill="#6b6b70" fontFamily="monospace">{fmt(v, 0)}</text></g>; })}
            <line x1={P} x2={W - P} y1={py(goal)} y2={py(goal)} stroke="#ffb21e" strokeDasharray="4 6" opacity=".6" />
            {planEta && <line x1={px(t0)} y1={py(startKg)} x2={px(planEta)} y2={py(goal)} stroke="#ffb21e" strokeDasharray="2 5" opacity=".7" />}
            <path d={`${path} L${px(sorted.at(-1)!.date)},${H - P} L${px(t0)},${H - P} Z`} fill={R} opacity=".1" />
            <path d={path} fill="none" stroke={R} strokeWidth="2.5" strokeLinejoin="miter" />
            {sorted.map((l) => <rect key={l.id} x={px(l.date) - 3} y={py(l.kg) - 3} width="6" height="6" fill="#050505" stroke={R} strokeWidth="2" />)}
          </svg>
          <div className="flex flex-wrap gap-4 mt-2 text-[11px] text-muted"><span className="flex items-center gap-1.5"><i className="h-0.5 w-4" style={{ background: R }} />seu peso</span><span className="flex items-center gap-1.5"><i className="h-0 w-4 border-t border-dashed border-[#ffb21e]" />plano e meta</span></div>
        </section>
      )}

      {/* Histórico */}
      <section className="glass rise p-5 mt-4">
        <SectionTitle><span className="inline-flex items-center gap-1.5"><Ico d={HI.list} size={14} />Registros</span></SectionTitle>
        {sorted.length === 0 ? <Empty>Registre o peso uma vez por semana, no mesmo dia e horário.</Empty> : (
          <ul className="divide-y divide-white/[.06]">
            {[...sorted].reverse().map((l, i, arr) => {
              const prev = arr[i + 1], d = prev ? l.kg - prev.kg : null;
              return (
                <li key={l.id}><button className="row-hover w-full flex items-center gap-3 min-h-12 px-2" onClick={() => openLog(l)}>
                  <span className="font-mono text-xs text-muted flex-1 text-left">{l.date.split("-").reverse().join("/")}</span>
                  {d != null && <span className="text-xs font-mono" style={{ color: (d < 0) === losing ? G : "#ff453a" }}>{d > 0 ? "▲ +" : "▼ "}{fmt(d)}</span>}
                  <span className="num text-lg w-24 text-right">{fmt(l.kg)} kg</span>
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
