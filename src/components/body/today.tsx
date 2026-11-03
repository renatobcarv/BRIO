"use client";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { addWater, saveSleep, undoWater } from "@/app/(app)/corpo/actions";
import { updateSettings } from "@/app/settings-actions";
import { Field, LinkBtn, Progress, SectionTitle, Sheet, fmt, n } from "@/components/kit";
import { shortDate, weekdayShort, dow } from "@/lib/date";

const G = "#8ac295";
const L = (ml: number) => fmt(ml / 1000, 2);

function Bottle({ pct }: { pct: number }) {
  const h = 160, fill = Math.max(0, Math.min(1, pct)) * (h - 22);
  return (
    <svg width="88" height={h + 10} viewBox={`0 0 88 ${h + 10}`} aria-hidden>
      <defs>
        <clipPath id="bt"><path d="M30 6h28v14c0 6 13 10 13 23v106a11 11 0 0 1-11 11H28a11 11 0 0 1-11-11V43c0-13 13-17 13-23z" /></clipPath>
        <linearGradient id="wg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#a6dbb2" /><stop offset="1" stopColor="#5f9e6d" /></linearGradient>
      </defs>
      <g clipPath="url(#bt)">
        <rect width="88" height={h + 10} fill="rgba(255,255,255,.04)" />
        <rect x="0" y={h + 2 - fill} width="88" height={fill + 10} fill="url(#wg)" style={{ transition: "all .9s cubic-bezier(.34,1.56,.64,1)" }} />
        <rect x="24" y="30" width="5" height="110" rx="2.5" fill="rgba(255,255,255,.12)" />
      </g>
      <path d="M30 6h28v14c0 6 13 10 13 23v106a11 11 0 0 1-11 11H28a11 11 0 0 1-11-11V43c0-13 13-17 13-23z" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="1.5" />
    </svg>
  );
}

export function BodyToday(props: {
  today: string; waterMl: number; waterGoal: number; water7: { date: string; ml: number }[];
  split: { label: string; focus: string }; exercises: number;
  food: { kcal: number; protein: number; kcalGoal: number; proteinGoal: number };
  sleepHours: number | null; sleep7: { date: string; hours: number | null }[]; weightKg: number;
}) {
  const [pending, start] = useTransition();
  const [ml, addOpt] = useOptimistic(props.waterMl, (s: number, d: number) => s + d);
  const [custom, setCustom] = useState("");
  const [sleep, setSleep] = useState(props.sleepHours != null ? fmt(props.sleepHours) : "");
  const [goalSheet, setGoalSheet] = useState(false);
  const [goal, setGoal] = useState(String(props.waterGoal));
  const water = (d: number) => start(async () => { addOpt(d); await addWater(d); });
  const max7 = Math.max(props.waterGoal, ...props.water7.map((w) => w.ml));
  const slept = props.sleep7.filter((s) => s.hours != null).map((s) => s.hours!);
  const avg = slept.length ? slept.reduce((a, b) => a + b, 0) / slept.length : null;

  return (
    <div style={{ ["--accent" as string]: G }}>
      <Link href="/corpo?aba=treino" className="glass rise block p-5">
        <div className="flex items-center justify-between"><p className="label" style={{ color: G }}>Treino de hoje</p><span className="text-sm text-muted">abrir ›</span></div>
        <p className="font-display text-2xl mt-1">{props.split.label} · {props.split.focus}</p>
        <p className="text-sm text-muted">{props.exercises ? `${props.exercises} exercícios planejados` : "Dia de descanso"}</p>
      </Link>

      <Link href="/corpo?aba=alimentacao" className="glass rise block p-5 mt-4">
        <div className="flex items-center justify-between"><p className="label" style={{ color: G }}>Alimentação</p><span className="text-sm text-muted">abrir ›</span></div>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div><div className="flex justify-between text-sm"><span>Calorias</span><span className="num">{props.food.kcal}/{props.food.kcalGoal}</span></div><Progress value={props.food.kcal / props.food.kcalGoal} height={6} /></div>
          <div><div className="flex justify-between text-sm"><span>Proteína</span><span className="num">{Math.round(props.food.protein)}/{props.food.proteinGoal} g</span></div><Progress value={props.food.protein / props.food.proteinGoal} color="#e0ac53" height={6} /></div>
        </div>
      </Link>

      <section className="glass rise p-5 mt-4">
        <SectionTitle action={<LinkBtn onClick={() => setGoalSheet(true)}>Meta</LinkBtn>}>Água</SectionTitle>
        <div className="flex items-center gap-5">
          <Bottle pct={ml / props.waterGoal} />
          <div className="flex-1 min-w-0">
            <p><span className="num text-4xl">{L(ml)}</span> <span className="text-muted">/ {L(props.waterGoal)} L</span></p>
            <p className="text-sm text-muted">{ml >= props.waterGoal ? "Meta batida. Boa." : `Faltam ${L(props.waterGoal - ml)} L`}</p>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[250, 500, 1000].map((v) => <button key={v} className="btn !px-1" onClick={() => water(v)}>+{v >= 1000 ? "1 L" : v}</button>)}
            </div>
            <div className="flex gap-2 mt-2">
              <input className="field !min-h-11 num" inputMode="numeric" placeholder="ml" value={custom} onChange={(e) => setCustom(e.target.value)} aria-label="Quantidade personalizada em ml" />
              <button className="btn" disabled={!n(custom)} onClick={() => { water(Math.round(n(custom))); setCustom(""); }}>+</button>
              <button className="btn text-muted" disabled={pending} onClick={() => start(() => undoWater())} aria-label="Desfazer último">↶</button>
            </div>
          </div>
        </div>
        <div className="flex items-end gap-2 h-20 mt-5">
          {props.water7.map((w) => (
            <div key={w.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end" title={`${L(w.ml)} L`}>
              <div className="w-full rounded-md" style={{ height: `${(w.ml / max7) * 100}%`, minHeight: 2, background: w.ml >= props.waterGoal ? G : G + "55" }} />
              <span className="text-[10px] text-muted">{weekdayShort[dow(w.date)]}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="glass rise p-5 mt-4">
        <SectionTitle>Sono</SectionTitle>
        <div className="flex gap-2 items-center">
          <input className="field max-w-24 text-center num text-lg" inputMode="decimal" placeholder="7,5" value={sleep} onChange={(e) => setSleep(e.target.value)} aria-label="Horas dormidas na última noite" />
          <span className="text-muted text-sm">horas na última noite</span>
          <button className="btn btn-accent ml-auto" disabled={pending || !sleep} onClick={() => start(() => saveSleep(props.today, n(sleep)))}>Salvar</button>
        </div>
        <div className="flex items-end gap-2 h-16 mt-4">
          {props.sleep7.map((s) => (
            <div key={s.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end" title={s.hours != null ? `${fmt(s.hours)} h` : "sem registro"}>
              <div className="w-full rounded-md" style={{ height: `${((s.hours ?? 0) / 10) * 100}%`, minHeight: 2, background: (s.hours ?? 0) >= 7 ? "#84aed4" : "#84aed455" }} />
              <span className="text-[10px] text-muted">{weekdayShort[dow(s.date)]}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted mt-2">{avg != null ? `Média: ${fmt(avg)} h · ${slept.filter((h) => h >= 7).length} de ${slept.length} noites com 7h+` : "Registre o sono para ver sua média."}</p>
      </section>

      <Sheet open={goalSheet} onClose={() => setGoalSheet(false)} title="Meta de água" accent={G}>
        <Field label="Mililitros por dia" hint={`Sugestão: 35 ml × ${fmt(props.weightKg)} kg = ${Math.round(35 * props.weightKg)} ml`}>
          <input className="field num" inputMode="numeric" value={goal} onChange={(e) => setGoal(e.target.value)} /></Field>
        <div className="flex gap-2 mt-3">
          <button className="btn" onClick={() => setGoal(String(Math.round(35 * props.weightKg)))}>Usar sugestão</button>
          <button className="btn btn-accent flex-1" disabled={pending} onClick={() => start(async () => { await updateSettings({ water_goal_ml: Math.round(n(goal)) }); setGoalSheet(false); })}>Salvar</button>
        </div>
      </Sheet>
    </div>
  );
}
export { shortDate };
