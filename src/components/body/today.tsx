"use client";
import { useOptimistic, useState, useTransition } from "react";
import { addWater, saveMeal, saveSleep, undoWater } from "@/app/(app)/corpo/actions";
import { Card } from "@/components/ui";
import { shortDate } from "@/lib/date";

const ACC = "#8ac295";
const L = (ml: number) => (ml / 1000).toFixed(2).replace(/0$/, "").replace(".", ",");
type Meal = { slot: string; done: boolean; kcal: number | null; protein_g: number | null };
const SLOTS = [["cafe", "Café da manhã"], ["almoco", "Almoço"], ["lanche", "Lanche"], ["jantar", "Jantar"]] as const;

function Bottle({ pct }: { pct: number }) {
  const h = 150, fill = Math.max(0, Math.min(1, pct)) * (h - 20);
  return (
    <svg width="84" height={h + 10} viewBox={`0 0 84 ${h + 10}`} aria-hidden>
      <defs><clipPath id="bottle"><path d="M28 6h28v14c0 6 12 10 12 22v100a10 10 0 0 1-10 10H26a10 10 0 0 1-10-10V42c0-12 12-16 12-22z" /></clipPath></defs>
      <g clipPath="url(#bottle)">
        <rect x="0" y="0" width="84" height={h + 10} fill="rgba(255,255,255,.04)" />
        <rect x="0" y={h + 2 - fill} width="84" height={fill + 10} fill={ACC} opacity=".85"
          style={{ transition: "y .9s cubic-bezier(.34,1.56,.64,1), height .9s cubic-bezier(.34,1.56,.64,1)" }} />
      </g>
      <path d="M28 6h28v14c0 6 12 10 12 22v100a10 10 0 0 1-10 10H26a10 10 0 0 1-10-10V42c0-12 12-16 12-22z" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="1.5" />
    </svg>
  );
}

export function BodyToday(props: {
  today: string; waterMl: number; waterGoal: number; water7: { date: string; ml: number }[];
  meals: Meal[]; kcalGoal: number; proteinGoal: number;
  split: { label: string; focus: string }; sleepHours: number | null; sleepAvg: number | null;
}) {
  const [pending, start] = useTransition();
  const [ml, addOpt] = useOptimistic(props.waterMl, (s: number, d: number) => s + d);
  const [meals, setMeals] = useState<Record<string, Meal>>(() =>
    Object.fromEntries(SLOTS.map(([k]) => [k, props.meals.find((m) => m.slot === k) ?? { slot: k, done: false, kcal: null, protein_g: null }])));
  const [sleep, setSleep] = useState(props.sleepHours?.toString().replace(".", ",") ?? "");

  const water = (d: number) => start(async () => { addOpt(d); await addWater(d); });
  const updateMeal = (k: string, patch: Partial<Meal>, persist = true) => {
    const next = { ...meals[k], ...patch };
    setMeals({ ...meals, [k]: next });
    if (persist) start(() => saveMeal({ date: props.today, slot: k, done: next.done, kcal: next.kcal, protein_g: next.protein_g }));
  };
  const kcal = Object.values(meals).reduce((a, m) => a + (m.kcal ?? 0), 0);
  const prot = Object.values(meals).reduce((a, m) => a + (m.protein_g ?? 0), 0);
  const max7 = Math.max(props.waterGoal, ...props.water7.map((w) => w.ml));

  return (
    <div style={{ ["--accent" as string]: ACC }}>
      <Card>
        <p className="label" style={{ color: ACC }}>Treino de hoje</p>
        <p className="font-display text-2xl mt-1">{props.split.label} · {props.split.focus}</p>
      </Card>

      <Card className="mt-4">
        <p className="label">Água</p>
        <div className="flex items-center gap-6 mt-3">
          <Bottle pct={ml / props.waterGoal} />
          <div className="flex-1">
            <p><span className="num text-4xl">{L(ml)}</span> <span className="text-muted">/ {L(props.waterGoal)} L</span></p>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[250, 500, 1000].map((v) => <button key={v} className="btn" onClick={() => water(v)}>+{v >= 1000 ? "1 L" : v + " ml"}</button>)}
            </div>
            <button className="text-sm text-muted mt-2 min-h-11" disabled={pending} onClick={() => start(() => undoWater())}>Desfazer último</button>
          </div>
        </div>
        <div className="flex items-end gap-2 h-20 mt-4">
          {props.water7.map((w) => (
            <div key={w.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <div className="w-full rounded-md" style={{ height: `${(w.ml / max7) * 100}%`, minHeight: 2, background: w.ml >= props.waterGoal ? ACC : ACC + "55" }} />
              <span className="text-[10px] text-muted">{shortDate(w.date).slice(0, 2)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-4">
        <p className="label">Dieta</p>
        <div className="grid gap-3 mt-3">
          <div><div className="flex justify-between text-sm"><span>Calorias</span><span className="num">{kcal} / {props.kcalGoal} kcal</span></div>
            <div className="bar mt-1"><i style={{ width: `${Math.min(100, (kcal / props.kcalGoal) * 100)}%` }} /></div></div>
          <div><div className="flex justify-between text-sm"><span>Proteína</span><span className="num">{prot} / {props.proteinGoal} g</span></div>
            <div className="bar mt-1"><i style={{ width: `${Math.min(100, (prot / props.proteinGoal) * 100)}%` }} /></div></div>
        </div>
        <ul className="mt-4 grid gap-2">
          {SLOTS.map(([k, label]) => {
            const m = meals[k];
            return (
              <li key={k} className="grid grid-cols-[auto_1fr_4.5rem_4.5rem] items-center gap-2">
                <button aria-pressed={m.done} aria-label={`Marcar ${label}`} onClick={() => updateMeal(k, { done: !m.done })}
                  className="h-11 w-11 grid place-items-center rounded-xl border" style={{ borderColor: m.done ? ACC : "rgba(255,255,255,.15)", background: m.done ? ACC : "transparent" }}>
                  {m.done && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#120f08" strokeWidth="3" aria-hidden><path d="M5 12l5 5L20 7" /></svg>}
                </button>
                <span className="text-sm">{label}</span>
                <input className="field !px-2 text-sm text-center" inputMode="numeric" placeholder="kcal" aria-label={`kcal ${label}`}
                  value={m.kcal ?? ""} onChange={(e) => updateMeal(k, { kcal: e.target.value ? Number(e.target.value) || 0 : null }, false)}
                  onBlur={() => updateMeal(k, {})} />
                <input className="field !px-2 text-sm text-center" inputMode="numeric" placeholder="prot g" aria-label={`proteína ${label}`}
                  value={m.protein_g ?? ""} onChange={(e) => updateMeal(k, { protein_g: e.target.value ? Number(e.target.value) || 0 : null }, false)}
                  onBlur={() => updateMeal(k, {})} />
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="mt-4">
        <p className="label">Sono (última noite)</p>
        <div className="flex gap-2 mt-3 items-center">
          <input className="field max-w-28 text-center num text-lg" inputMode="decimal" placeholder="7,5" value={sleep} onChange={(e) => setSleep(e.target.value)} aria-label="Horas dormidas" />
          <button className="btn btn-accent" disabled={pending || !sleep}
            onClick={() => start(() => saveSleep(props.today, Number(sleep.replace(",", "."))))}>Salvar</button>
          {props.sleepAvg != null && <span className="text-sm text-muted ml-auto">Média 7 dias: <span className="num text-ink">{props.sleepAvg.toFixed(1).replace(".", ",")} h</span></span>}
        </div>
      </Card>
    </div>
  );
}
