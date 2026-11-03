"use client";
import { useState, useTransition } from "react";
import { addWeight, deleteWeight } from "@/app/(app)/corpo/actions";
import { Card, Empty } from "@/components/ui";
import { addDays, diffDays, shortDate } from "@/lib/date";

const ACC = "#8ac295";
const f1 = (n: number) => n.toFixed(1).replace(".", ",");

export function Weight({ today, logs, goal, start: startKg }: { today: string; logs: { id: string; date: string; kg: number }[]; goal: number; start: number }) {
  const [pending, start] = useTransition();
  const [date, setDate] = useState(today);
  const [kg, setKg] = useState("");
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const cur = sorted.at(-1)?.kg ?? startKg;
  const left = cur - goal;

  // Ritmo atual: regressão linear das últimas 8 semanas
  const recent = sorted.filter((l) => diffDays(today, l.date) <= 56);
  let perWeek: number | null = null;
  if (recent.length >= 2) {
    const x = recent.map((l) => diffDays(l.date, recent[0].date)), y = recent.map((l) => l.kg);
    const mx = x.reduce((a, b) => a + b, 0) / x.length, my = y.reduce((a, b) => a + b, 0) / y.length;
    const num = x.reduce((a, xi, i) => a + (xi - mx) * (y[i] - my), 0), den = x.reduce((a, xi) => a + (xi - mx) ** 2, 0);
    if (den) perWeek = (num / den) * 7;
  }
  const eta = perWeek && perWeek < 0 && left > 0 ? addDays(today, Math.ceil((left / -perWeek) * 7)) : null;

  // Gráfico
  const W = 600, H = 180, P = 24;
  const ys = [...sorted.map((l) => l.kg), goal];
  const min = Math.min(...ys) - 0.5, max = Math.max(...ys) + 0.5;
  const t0 = sorted[0]?.date, span = sorted.length > 1 ? diffDays(sorted.at(-1)!.date, t0) || 1 : 1;
  const px = (d: string) => P + (diffDays(d, t0) / span) * (W - 2 * P);
  const py = (v: number) => P + ((max - v) / (max - min || 1)) * (H - 2 * P);
  const path = sorted.map((l, i) => `${i ? "L" : "M"}${px(l.date).toFixed(1)},${py(l.kg).toFixed(1)}`).join(" ");

  return (
    <div style={{ ["--accent" as string]: ACC }}>
      <Card>
        <div className="grid grid-cols-3 gap-3">
          <div><p className="label">Atual</p><p className="num text-3xl">{f1(cur)}</p></div>
          <div><p className="label">Meta</p><p className="num text-3xl">{f1(goal)}</p></div>
          <div><p className="label">Falta</p><p className="num text-3xl" style={{ color: ACC }}>{left > 0 ? f1(left) : "0"}</p></div>
        </div>
        <p className="text-sm text-muted mt-3">
          {perWeek == null ? "Registre ao menos dois pesos para ver o ritmo."
            : `Ritmo: ${perWeek > 0 ? "+" : ""}${f1(perWeek)} kg/semana${eta ? ` · previsão: ${shortDate(eta)} de ${eta.slice(0, 4)}` : ""}`}
        </p>
        {sorted.length > 1 && (
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full mt-4" role="img" aria-label="Tendência do peso">
            <line x1={P} x2={W - P} y1={py(goal)} y2={py(goal)} stroke={ACC} strokeDasharray="4 6" opacity=".5" />
            <path d={path} fill="none" stroke={ACC} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {sorted.map((l) => <circle key={l.id} cx={px(l.date)} cy={py(l.kg)} r="3.5" fill="#07080b" stroke={ACC} strokeWidth="2" />)}
          </svg>
        )}
      </Card>
      <Card className="mt-4">
        <p className="label mb-3">Registrar (ideal: mesmo dia e hora, 1× por semana)</p>
        <div className="grid grid-cols-[1fr_6rem_auto] gap-2">
          <input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Data" />
          <input className="field text-center num" inputMode="decimal" placeholder="kg" value={kg} onChange={(e) => setKg(e.target.value)} aria-label="Peso em kg" />
          <button className="btn btn-accent" disabled={pending || !kg}
            onClick={() => start(async () => { await addWeight(date, Number(kg.replace(",", "."))); setKg(""); })}>Salvar</button>
        </div>
      </Card>
      <Card className="mt-4">
        <p className="label mb-2">Histórico</p>
        {sorted.length === 0 ? <Empty>Nenhum peso registrado ainda.</Empty> : (
          <ul className="divide-y divide-white/5">
            {[...sorted].reverse().map((l) => (
              <li key={l.id} className="flex items-center gap-3 min-h-12">
                <span className="text-sm text-muted flex-1">{shortDate(l.date)} {l.date.slice(0, 4)}</span>
                <span className="num">{f1(l.kg)} kg</span>
                <button className="btn !min-h-9 !px-3 text-muted" aria-label="Excluir"
                  onClick={() => { if (confirm("Excluir este registro?")) start(() => deleteWeight(l.id)); }}>×</button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
