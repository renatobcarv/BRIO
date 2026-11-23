"use client";
import Link from "next/link";
import { HI, Ico } from "@/components/hunt-icons";
import { useOptimistic, useState, useTransition } from "react";
import { addWater, saveSleep, undoWater } from "@/app/(app)/corpo/actions";
import { updateSettings } from "@/app/settings-actions";
import { Field, LinkBtn, SectionTitle, Sheet, fmt, n } from "@/components/kit";
import { shortDate, weekdayShort, dow } from "@/lib/date";

const G = "#30d158";
const L = (ml: number) => fmt(ml / 1000, 2);

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

  const R = "#ffb21e";
  const clamp = (x: number) => Math.max(0, Math.min(1, x || 0));
  const parts = [
    { k: "Água", v: clamp(ml / props.waterGoal) },
    { k: "Sono", v: props.sleepHours != null ? clamp(props.sleepHours / 8) : 0 },
    { k: "Energia", v: clamp(props.food.kcal / props.food.kcalGoal) },
    { k: "Proteína", v: clamp(props.food.protein / props.food.proteinGoal) },
  ];
  const ready = Math.round((parts.reduce((a, x) => a + x.v, 0) / parts.length) * 100);
  const verdict = ready >= 85 ? "Pronto para caçar." : ready >= 55 ? "Em posição. Feche as lacunas." : "Abastecimento baixo. Corrija agora.";
  const Seg = ({ v, n = 10 }: { v: number; n?: number }) => (
    <div className="flex gap-[3px]" aria-hidden>{Array.from({ length: n }, (_, i) => <i key={i} className="h-2 flex-1" style={{ background: i < Math.round(v * n) ? R : "rgba(255,255,255,.08)" }} />)}</div>);

  return (
    <div className="dash-auto" style={{ ["--accent" as string]: R }}>
      {/* Prontidão: o placar do corpo hoje */}
      <section className="hunt-card rise relative overflow-hidden p-5">
        <span aria-hidden className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: R, boxShadow: `0 0 18px ${R}` }} />
        <div className="flex items-end justify-between gap-4">
          <div><p className="label flex items-center gap-1.5"><Ico d={HI.target} size={13} color={R} />Prontidão de hoje</p><p className="font-display text-2xl mt-1">{verdict}</p></div>
          <p className="num text-6xl leading-none" style={{ color: R }}>{ready}<span className="text-2xl text-white/40">%</span></p>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-5">
          {parts.map((x) => <div key={x.k}><div className="flex justify-between"><span className="label !text-[9px]">{x.k}</span><span className="font-mono text-[11px] text-white/60">{Math.round(x.v * 100)}%</span></div><div className="mt-1.5"><Seg v={x.v} /></div></div>)}
        </div>
      </section>

      {/* Treino de hoje */}
      <Link href="/treino" className="glass rise block p-5 mt-4 relative overflow-hidden">
        <svg aria-hidden className="absolute -right-4 -bottom-6 opacity-[.07]" width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.2"><path d="M3 10v4M21 10v4M6 7v10M18 7v10M6 12h12" /></svg>
        <p className="label" style={{ color: R }}>Alvo de hoje · treino</p>
        <p className="font-display text-4xl mt-2">{props.split.label}<span className="eye">.</span></p>
        <p className="text-sm text-muted mt-1">{props.exercises ? `${props.exercises} exercícios planejados` : "Dia de descanso"}</p>
        <span className="btn btn-accent mt-4 inline-flex items-center">{props.exercises ? "Entrar no Covil →" : "Dia de descanso · ver plano"}</span>
      </Link>

      {/* Combustível */}
      <Link href="/perfil?aba=corpo&sub=alimentacao" className="glass rise block p-5 mt-4">
        <div className="flex items-center justify-between"><p className="label flex items-center gap-1.5"><Ico d={HI.flame} size={13} />Combustível</p><span className="label !text-[10px]">dieta ›</span></div>
        <div className="grid grid-cols-2 gap-px bg-white/[.08] mt-3 border border-white/[.08]">
          <div className="bg-[#0b0b0b] p-3"><div className="flex items-center gap-2"><Ico d={HI.flame} size={13} /><span className="label !text-[9px]">Calorias</span></div><p className="num text-3xl mt-2">{props.food.kcal}<span className="text-sm text-white/40"> / {props.food.kcalGoal}</span></p><div className="mt-2"><Seg v={clamp(props.food.kcal / props.food.kcalGoal)} /></div></div>
          <div className="bg-[#0b0b0b] p-3"><div className="flex items-center gap-2"><Ico d={HI.protein} size={13} /><span className="label !text-[9px]">Proteína</span></div><p className="num text-3xl mt-2">{Math.round(props.food.protein)}<span className="text-sm text-white/40"> / {props.food.proteinGoal} g</span></p><div className="mt-2"><Seg v={clamp(props.food.protein / props.food.proteinGoal)} /></div></div>
        </div>
      </Link>

      {/* Água */}
      <section className="glass rise p-5 mt-4">
        <SectionTitle action={<LinkBtn onClick={() => setGoalSheet(true)}>Meta</LinkBtn>}><span className="inline-flex items-center gap-1.5"><Ico d={HI.drop} size={14} />Água</span></SectionTitle>
        <div className="flex items-end justify-between">
          <p><span className="num text-5xl">{L(ml)}</span> <span className="text-muted">/ {L(props.waterGoal)} L</span></p>
          <p className="text-sm" style={{ color: ml >= props.waterGoal ? G : "#8a8a8f" }}>{ml >= props.waterGoal ? "Meta batida" : `faltam ${L(props.waterGoal - ml)} L`}</p>
        </div>
        <div className="mt-3"><Seg v={clamp(ml / props.waterGoal)} n={Math.max(4, Math.round(props.waterGoal / 250))} /></div>
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[250, 500, 1000].map((v) => <button key={v} className="btn !px-1 num" onClick={() => water(v)}>+{v >= 1000 ? "1 L" : v}</button>)}
          <button className="btn text-muted" disabled={pending} onClick={() => start(() => undoWater())} aria-label="Desfazer último">↶</button>
        </div>
        <div className="flex gap-2 mt-2">
          <input className="field !min-h-11 num" inputMode="numeric" placeholder="outra quantidade (ml)" value={custom} onChange={(e) => setCustom(e.target.value)} aria-label="Quantidade personalizada em ml" />
          <button className="btn" disabled={!n(custom)} onClick={() => { water(Math.round(n(custom))); setCustom(""); }}>Adicionar</button>
        </div>
      </section>

      {/* Sono */}
      <section className="glass rise p-5 mt-4">
        <div className="flex items-center justify-between"><SectionTitle><span className="inline-flex items-center gap-1.5"><Ico d={HI.bed} size={14} />Sono</span></SectionTitle></div>
        <div className="flex gap-2 items-center">
          <input className="field max-w-24 text-center num text-lg" inputMode="decimal" placeholder="7,5" value={sleep} onChange={(e) => setSleep(e.target.value)} aria-label="Horas dormidas na última noite" />
          <span className="text-muted text-sm">h na última noite</span>
          <button className="btn btn-accent ml-auto" disabled={pending || !sleep} onClick={() => start(() => saveSleep(props.today, n(sleep)))}>Salvar</button>
        </div>
        <p className="text-xs text-muted mt-3">{avg != null ? `Média ${fmt(avg)} h · ${slept.filter((h) => h >= 7).length} de ${slept.length} noites com 7h+` : "Registre o sono para ver sua média."}</p>
      </section>

      {/* Semana: água e sono lado a lado */}
      <section className="glass rise p-5 mt-4">
        <SectionTitle><span className="inline-flex items-center gap-1.5"><Ico d={HI.chart} size={14} />Últimos 7 dias</span></SectionTitle>
        <div className="grid grid-cols-7 gap-2 items-end h-28">
          {props.water7.map((w, i) => { const sl = props.sleep7[i]?.hours ?? 0; return (
            <div key={w.date} className="flex flex-col items-center gap-1 h-full justify-end" title={`${L(w.ml)} L · ${fmt(sl)} h`}>
              <div className="flex items-end gap-[3px] h-full w-full justify-center">
                <i className="w-2.5" style={{ height: `${(w.ml / max7) * 100}%`, minHeight: 2, background: w.ml >= props.waterGoal ? R : R + "55" }} />
                <i className="w-2.5" style={{ height: `${(sl / 10) * 100}%`, minHeight: 2, background: sl >= 7 ? "#ffb21e" : "#ffb21e44" }} />
              </div>
              <span className="text-[10px] text-muted">{weekdayShort[dow(w.date)]}</span>
            </div>); })}
        </div>
        <div className="flex gap-4 mt-3 text-[11px] text-muted"><span className="flex items-center gap-1.5"><i className="h-2 w-2" style={{ background: R }} />água (meta batida)</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 bg-[#ffb21e]" />sono 7h+</span></div>
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
