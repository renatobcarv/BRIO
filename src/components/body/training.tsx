"use client";
import { HI, Ico } from "@/components/hunt-icons";
import { ExerciseThumb } from "@/components/body/exercise-media";
import { WorkoutPreview } from "@/components/body/exercise-swap";
import { MuscleMap } from "@/components/body/muscle-map";
import { CardioStats, isMobility } from "@/components/body/cardio";
import { isMainLift, MAIN_LIFTS } from "@/lib/training";
import { useEffect, useMemo, useState, useTransition } from "react";
import { deleteWorkout } from "@/app/(app)/corpo/actions";

import { Empty } from "@/components/ui";
import { LinkBtn, SectionTitle, Sheet, fmt } from "@/components/kit";
import { addDays, daysInMonth, diffDays, dow, monthStart, shortDate, weekdayShort } from "@/lib/date";
import type { SplitDay, WorkoutPlan } from "@/lib/settings";
import { PHASE_KINDS, dayShort, programPosition, type Program } from "@/lib/training";
import { GuidedLogger } from "./guided";
import { CreaturePortrait } from "./creature-portrait";
import { BattleIntro } from "./battle-intro";
import { beastFor, beastOfWeek, type Beast } from "@/lib/bestiary";
import { TrainingSystem } from "./training-system";

import { totalWeeks } from "@/lib/training";
import { Timeline } from "./program";
import { NextWeeks } from "./next-weeks";
import { startProgramNow } from "@/app/(app)/corpo/program-actions";
import { MasterCard, type MasterDay, type Nutrition } from "./master-card";
import { Consult } from "./consult";
import { LiftRanks } from "./lift-ranks";

import { G, ORDER, buildSession, dayPlan, volume, e1rm, firstNum, isTimed, suggestionFor, type Session, type Workout , type Maxes } from "./training-core";
import { Logger } from "./training-logger";
import { PlanEditor } from "./plan-editor";
export { e1rm, firstNum, historyOf, isTimed, lastFor, mmss, suggestionFor, type LEx, type LSet, type Session, type Target, type Workout } from "./training-core";

export function Training({ today, split, plan, workouts, program = null, programSlot, openProgram = false, bodyweight = null, nutrition, maxes = {} }: { maxes?: Maxes; nutrition?: Nutrition; today: string; split: SplitDay[]; plan: WorkoutPlan; workouts: Workout[]; program?: Program | null; programSlot?: React.ReactNode; openProgram?: boolean; bodyweight?: number | null }) {
  const [pending, start] = useTransition();
  const KEY = "brio-treino-em-andamento";
  const [session, setSessionState] = useState<Session | null>(null);
  const [sheet, setSheet] = useState<null | "plan" | "program" | Workout>(openProgram ? "program" : null);
  const [mode, setMode] = useState<"guiado" | "lista">("guiado");
  const [exSel, setExSel] = useState(plan.prs[0] ?? "");
  const todayDay = split.find((d) => d.dow === dow(today)) ?? { dow: dow(today), label: "Off", focus: "Descanso" };
  const monday = addDays(today, -((dow(today) + 6) % 7));
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i), d = dow(date), dp = dayPlan(d, plan, program, date, workouts), sd = split.find((x) => x.dow === d);
    const done = workouts.some((w) => w.date === date);
    const status: "done" | "today" | "missed" | "rest" | "next" = done ? "done" : date === today ? "today" : !dp.list.length ? "rest" : date < today ? "missed" : "next";
    return { date, d, dp, label: dp.title ? dayShort(dp.title) : sd?.label ?? "—", focus: dp.title ?? sd?.focus ?? "", title: dp.title, status };
  });
  const [selDate, setSelDate] = useState(today);
  const [preview, setPreview] = useState(false);
  const [exView, setExView] = useState<string | null>(null);
  const currentDay = weekDays.find((w) => w.date === today)!;
  const sel = weekDays.find((w) => w.date === selDate) ?? currentDay;
  const masterDay: MasterDay = session && !session.editingId ? "andamento"
    : currentDay.status === "done" ? "feito" : currentDay.dp.list.length ? "treino" : "descanso";

  useEffect(() => { try { const raw = localStorage.getItem(KEY); if (raw) setSessionState(JSON.parse(raw)); } catch {} }, []);
  const setSession = (s: Session | null) => { setSessionState(s); try { if (s && !s.editingId) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY); } catch {} };

  const [intro, setIntro] = useState<{ s: Session; beast: Beast } | null>(null);
  // Estatísticas
  const m = monthStart(today), dim = daysInMonth(m);
  const monthW = workouts.filter((w) => w.date >= m);
  const weekStart = addDays(today, -((dow(today) + 6) % 7));
  const weekW = workouts.filter((w) => w.date >= weekStart);
  const planned = ORDER.filter((d) => (plan.days[String(d)] ?? []).some((x) => x.name.toLowerCase() !== "cardio")).length;
  const trained = new Set(workouts.map((w) => w.date));
  const all = workouts.flatMap((w) => w.sets.filter((s) => !isTimed(s.exercise)).map((s) => ({ ...s, kg: Number(s.kg), date: w.date })));
  // Os 3 grandes (agachamento, supino, terra) sempre em primeiro.
  const bigRank = (n: string) => { const i = MAIN_LIFTS.findIndex((l) => l.re.test(n) && isMainLift(n)); return i < 0 ? 99 : i; };
  const names = [...new Set(all.map((s) => s.exercise))].sort((a, b) => bigRank(a) - bigRank(b) || a.localeCompare(b));
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
    <div className="dash-auto" style={{ ["--accent" as string]: G }}>
      {intro && <BattleIntro title={intro.s.label.split(" · ")[0]} beast={intro.beast} onDone={() => { setMode("guiado"); setSession(intro.s); setIntro(null); }} />}
      {(() => {
        const total = program ? weekDays.filter((w) => w.dp.list.length).length : planned, done = new Set(weekW.map((w) => w.date)).size;
        const prevStart = addDays(weekStart, -7), lastVol = workouts.filter((w) => w.date >= prevStart && w.date < weekStart).reduce((a, w) => a + volume(w.sets), 0);
        const vol = weekW.reduce((a, w) => a + volume(w.sets), 0), R = "#ffb21e";
        const pos = program ? programPosition(program, today) : null, ph = program && pos ? program.phases[pos.phaseIndex] : null;
        return (<>
          <section className="span-all hunt-card rise relative overflow-hidden p-5">
            <span aria-hidden className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: R, boxShadow: `0 0 18px ${R}` }} />
            <button onClick={() => programSlot && setSheet("program")} className="w-full text-left">
              <p className="label flex items-center gap-1.5"><Ico d={HI.target} size={13} color={R} />Campanha{program && pos?.status === "andamento" ? ` · semana ${pos.week} de ${pos.total}` : ""}</p>
              <p className="font-display text-3xl mt-1 truncate">{program ? program.name : "Monte sua campanha"}</p>
              <p className="text-sm mt-1" style={{ color: ph ? PHASE_KINDS[ph.kind].color : "#8a8a8f" }}>{program && pos ? (pos.status === "andamento" ? ph?.name : pos.status === "futuro" ? `Começa em ${pos.startsIn} dias` : "Campanha concluída") : "Fases, semanas e progressão de carga · criar ›"}</p>
              {program && <div className="mt-3"><Timeline p={program} today={today} /></div>}
            </button>
            {program && pos?.status === "andamento" && <NextWeeks p={program} week={pos.week} />}
            {program && pos?.status === "futuro" && <button className="btn btn-accent w-full mt-3" onClick={async () => { const e = await startProgramNow(program.id); if (e) alert(e); else location.reload(); }}>Começar agora (semana 1 = esta semana)</button>}
            <div className="mt-5 flex justify-between label !text-[9px]"><span>Sessões da semana</span><span style={{ color: R }}>{done}/{total}</span></div>
            <div className="flex gap-1 mt-1.5" aria-hidden>{Array.from({ length: Math.max(total, 1) }, (_, i) => <i key={i} className="h-3 flex-1" style={{ background: i < done ? R : "rgba(255,255,255,.08)" }} />)}</div>
            <div className="grid grid-cols-3 mt-5 border-t border-white/[.08] divide-x divide-white/[.08]">
              {[[HI.dumbbell, "Semana", `${done}/${total}`, "treinos"], [HI.list, "Mês", String(monthW.length), "sessões"], [HI.bolt, "Volume", vol >= 1000 ? `${fmt(vol / 1000)} t` : `${Math.round(vol)} kg`, lastVol ? `${Math.round((vol / lastVol) * 100)}% da passada` : "na semana"]].map(([ic, l, v, u]) => (
                <div key={l} className="pt-3 text-center"><p className="label !text-[9px] flex items-center justify-center gap-1"><Ico d={ic} size={11} />{l}</p><p className="num text-2xl mt-1">{v}</p><p className="text-[10px] text-white/45">{u}</p></div>))}
            </div>
          </section>
          {program && <MasterCard program={program} workouts={workouts} today={today} nutrition={nutrition} day={masterDay} onViewDay={() => setSelDate(today)} />}
          <div className="span-all"><Consult /></div>
          </>);
      })()}

      <nav aria-label="Ir para" className="span-all sticky top-14 md:top-0 z-20 -mx-4 px-4 py-2 mt-3 bg-[#050505]/90 backdrop-blur-xl md:static md:mx-0 md:px-0 md:bg-transparent">
        <div className="flex gap-1.5 overflow-x-auto">
          {[["tr-hoje", "Treino do dia"], ["tr-recordes", "Recordes"], ["tr-evolucao", "Evolução"], ["tr-frequencia", "Frequência"], ["tr-historico", "Histórico"]].map(([id, l]) => (
            <button key={id} className="chip shrink-0 !min-h-10" onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })}>{l}</button>))}
          {programSlot && <button className="chip shrink-0 !min-h-10" onClick={() => setSheet("program")}>Campanha</button>}
        </div>
      </nav>
      <section id="tr-hoje" tabIndex={-1} className="glass rise p-5 mt-4 scroll-mt-20">
        <SectionTitle action={<LinkBtn onClick={() => setSheet(program ? "program" : "plan")}>{program ? "Editar campanha" : "Editar plano"}</LinkBtn>}>{session ? "Missão em andamento" : "Esta semana"}</SectionTitle>
        {session ? (
          <>
            {!session.editingId && (
              <div className="inline-flex p-1 rounded-[8px] bg-white/[.04] border border-white/[.06] gap-1 mb-4">
                {(["guiado", "lista"] as const).map((m) => <button key={m} onClick={() => setMode(m)} className={`min-h-9 px-4 rounded-xl text-sm ${mode === m ? "bg-white/[.1] text-ink" : "text-muted"}`}>{m === "guiado" ? "Guiado" : "Lista completa"}</button>)}
              </div>
            )}
            {mode === "guiado" && !session.editingId
              ? <GuidedLogger s={session} setS={setSession} workouts={workouts} onSaved={() => setSession(null)} />
              : <Logger s={session} setS={setSession} workouts={workouts} split={split} plan={plan} program={program} onSaved={() => setSession(null)} />}
          </>
        ) : (
          <>
            {/* Semana: calendário estilo app de treino */}
            <div className="grid grid-cols-7 gap-1 mb-5" role="tablist" aria-label="Dias da semana">
              {weekDays.map((w) => {
                const on = w.date === sel.date, isToday = w.date === today;
                return (
                  <button key={w.date} role="tab" onClick={() => setSelDate(w.date)} aria-selected={on} aria-label={`${weekdayShort[w.d]} ${Number(w.date.slice(8))}: ${w.status === "done" ? "feito" : w.status === "rest" ? "descanso" : w.title ?? w.label}`}
                    className={`press flex flex-col items-center pt-2 pb-2.5 rounded-[10px] transition-colors ${on ? "bg-[#f5f5f7] text-black" : "hover:bg-white/[.04]"}`}>
                    <span className={`text-[10.5px] uppercase tracking-wider ${on ? "text-black/60" : "text-white/45"}`}>{weekdayShort[w.d]}</span>
                    <span className={`num text-[22px] leading-none mt-1 ${on ? "" : isToday ? "text-[#ffb21e]" : "text-white"}`}>{Number(w.date.slice(8))}</span>
                    <span className="h-1.5 mt-2 flex items-center">
                      {w.status === "done" ? <i className="h-1.5 w-1.5 rounded-full" style={{ background: on ? "#16a34a" : "#30d158" }} />
                        : w.status === "rest" ? <i className={`h-[2px] w-2.5 ${on ? "bg-black/30" : "bg-white/20"}`} />
                        : w.status === "missed" ? <i className="h-1.5 w-1.5 rounded-full border border-[#ff453a]" />
                        : <i className="h-1.5 w-1.5 rounded-full" style={{ background: on ? "#ffb21e" : "rgba(255,178,30,.7)" }} />}
                    </span>
                  </button>);
              })}
            </div>
            {(() => {
              const list = sel.dp.list, ctx = sel.dp.ctx, sets = list.reduce((a, x) => a + x.sets, 0);
              const min = Math.round(list.reduce((a, x) => a + (isTimed(x.name, (x as { muscle?: string }).muscle) ? (parseFloat(String(x.reps)) || 20) * 60 : x.sets * ((x.rest || 60) + 45)), 0) / 60);
              const doneW = workouts.find((w) => w.date === sel.date);
              const b = program && ctx && list.length ? beastOfWeek(program, ctx.weekNo) : null;
              const when = sel.date === today ? "Hoje" : sel.date < today ? "Treino anterior" : `${weekdayShort[sel.d]}, ${sel.date.split("-").reverse().slice(0, 2).join("/")}`;
              return (
                <div key={sel.date} className="step-in-right">
                  {/* Cabeçalho do treino */}
                  <div className="min-w-0">
                    <div className="min-w-0">
                      <p className="text-[12px] text-white/50">{when}{ctx ? ` · Semana ${ctx.weekNo}` : ""}{ctx?.phase ? ` · ${ctx.phase}` : ""}</p>
                      <h3 className="font-display text-[34px] sm:text-[40px] leading-[1.02] mt-1">{sel.title ?? (list.length ? "Treino" : "Descanso")}</h3>
                      {list.length > 0 && (
                        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-[13px] text-white/70">
                          <span className="inline-flex items-center gap-1.5"><Ico d={HI.clock} size={14} />~{min} min</span>
                          <span className="inline-flex items-center gap-1.5"><Ico d={HI.dumbbell} size={14} />{list.length} exercícios</span>
                          <span className="inline-flex items-center gap-1.5"><Ico d={HI.list} size={14} />{sets} séries</span>
                        </div>)}
                      {ctx?.deload && <p className="text-[12px] mt-2" style={{ color: "#30d158" }}>Semana de recuperação: cargas reduzidas</p>}
                      {b && (() => { const planned = Math.max(1, weekDays.filter((w) => w.dp.list.length).length), done = Math.min(planned, new Set(weekDays.filter((w) => w.status === "done").map((w) => w.date)).size); return (
  <a href="/bestiario" className="flex items-center gap-3 mt-3 max-w-sm rounded-[12px] bg-white/[.04] px-3 py-2 hover:bg-white/[.07]">
    <CreaturePortrait id={b.id} className="h-9 w-9 object-contain" />
    <span className="flex-1 min-w-0"><span className="block text-[12px] text-white/70 truncate">{b.angel ? `Virtude da semana: ${b.name}` : `Fera da semana: ${b.name}`}</span>
      <span className="flex gap-0.5 mt-1">{Array.from({ length: planned }, (_, k) => <i key={k} className="h-1.5 flex-1 rounded-full" style={{ background: k < done ? "#ffb21e" : "rgba(255,255,255,.12)" }} />)}</span></span>
    <span className="text-[11px] shrink-0" style={{ color: done ? "#ffb21e" : "rgba(255,255,255,.5)" }}>{done ? `abatido ${done}×` : "treine para abater"}</span>
  </a>); })()}
                    </div>
                  </div>

                  {list.length > 0 ? (
                    <>
                      <div className="mt-4"><MuscleMap list={list} /></div>
                      <ol className="mt-5 divide-y divide-white/[.06] border-y border-white/[.06]">
                        {list.map((x, i) => {
                          const sg = x.kg == null ? suggestionFor(workouts, x, sel.date < today ? sel.date : today, !!ctx?.deload) : null;
                          const timed = isTimed(x.name, (x as { muscle?: string }).muscle);
                          const kg = x.kg ?? sg?.kg;
                          return (
                            <li key={i}>
                              <button className="w-full flex items-center gap-4 py-3 text-left hover:bg-white/[.02]" onClick={() => setExView(x.name)}>
                                <ExerciseThumb name={x.name} size={56} />
                                <span className="flex-1 min-w-0">
                                  <span className="block text-[15px] font-semibold leading-snug">{x.name}</span>
                                  <span className="block text-[13px] text-white/55 mt-0.5">{timed ? `${x.reps} min` : `${x.sets} séries × ${x.reps} reps`}{!timed && kg ? ` · ${fmt(kg)} kg` : ""}{x.rpe ? ` · RPE ${fmt(x.rpe)}` : ""}</span>
                                  {sg && !timed && <span className="block text-[11.5px] text-[#ffb21e] mt-0.5">Sugestão: {sg.reason}</span>}
                                </span>
                                <span className="text-white/30 text-lg" aria-hidden>›</span>
                              </button>
                            </li>);
                        })}
                      </ol>
                    </>
                  ) : <div className="mt-5 rounded-[10px] border border-white/[.06] p-6 text-center"><p className="text-[15px] text-white/70">Dia de descanso.</p><p className="text-[13px] text-white/45 mt-1">A adaptação acontece agora: sono, proteína e água.</p></div>}

                  {doneW ? <p className="text-[14px] mt-5 font-semibold" style={{ color: "#30d158" }}>✓ Treino concluído neste dia</p> : (
                    <div className="grid grid-cols-[auto_1fr] gap-2 mt-5">
                      {list.length > 0 && <button className="btn !min-h-14 !px-5" onClick={() => setPreview(true)}>Ver</button>}
                      <button className="btn btn-accent !min-h-14 !text-[15px] col-start-2" onClick={() => { const base = split.find((x) => x.dow === sel.d) ?? todayDay; const day = sel.title ? { ...base, label: sel.title, focus: "" } : base; const ns = buildSession(sel.date <= today ? sel.date : today, day, list, workouts, ctx, bodyweight, maxes); if (sel.date === today && list.length) { setIntro({ s: { ...ns, startedAt: Date.now() }, beast: b ?? beastFor(undefined) }); } else setSession(ns); }}>
                        {list.length ? (sel.date === today ? "Começar treino" : sel.date < today ? "Registrar este treino" : "Fazer hoje") : "Registrar treino extra"}</button>
                    </div>)}
                  {list.length > 0 && <WorkoutPreview open={preview} onClose={() => setPreview(false)} title={sel.title ?? "Treino"} items={list.map((x) => ({ name: x.name, detail: isTimed(x.name, (x as { muscle?: string }).muscle) ? `${x.reps} min` : `${x.sets}×${x.reps}${x.kg != null ? ` · ${fmt(x.kg)} kg` : ""}` }))} />}
                  <WorkoutPreview open={!!exView} onClose={() => setExView(null)} title={exView ?? ""} items={exView ? [{ name: exView, detail: (() => { const x = list.find((y) => y.name === exView); return x ? `${x.sets}×${x.reps}` : ""; })() }] : []} />
                </div>
              );
            })()}
          </>
        )}
      </section>

      <CardioStats today={today} runs={workouts.flatMap((w) => w.sets.filter((x) => isTimed(x.exercise) && !isMobility(x.exercise)).map((x) => ({ date: w.date, name: x.exercise, km: Number(x.kg) || 0, min: Number(x.reps) || 0 })))} />
      <TrainingSystem today={today} bodyweight={bodyweight} plannedPerWeek={planned}
        sessions={workouts.map((w) => ({ date: w.date, week_no: w.week_no ?? null, duration_min: w.duration_min, sets: w.sets.map((x) => ({ exercise: x.exercise, kg: Number(x.kg), reps: x.reps, rpe: x.rpe ?? null })) }))}
        program={program ? { totalWeeks: totalWeeks(program), ended: programPosition(program, today).status === "concluido" } : null} />
      <LiftRanks sets={workouts.flatMap((w) => w.sets.map((x) => ({ exercise: x.exercise, kg: Number(x.kg), reps: x.reps })))} bodyweight={bodyweight} sex={nutrition?.sex} />
      <section id="tr-recordes" className="glass rise p-5 mt-4 scroll-mt-20">
        <SectionTitle><span className="inline-flex items-center gap-1.5"><Ico d={HI.star} size={14} />Recordes pessoais</span></SectionTitle>
                {(() => {
          const big = MAIN_LIFTS.map((l, k) => { const ex = names.find((n) => bigRank(n) === k) ?? l.label; return { label: l.label, ex, ...prOf(ex) }; });
          const total = big.reduce((a, b) => a + (b.est || 0), 0);
          const others = plan.prs.filter((n) => bigRank(n) === 99);
          return (<>
            <div className="rounded-[16px] p-4 border border-[#ffb21e44]" style={{ background: "radial-gradient(90% 120% at 50% 0%, rgba(255,178,30,.14), transparent 70%), #0b0b0c" }}>
              <div className="flex items-baseline justify-between"><p className="text-[12px] uppercase tracking-[.25em] text-[#ffb21e] font-semibold">★ Os 3 grandes</p>
                <p className="text-[12px] text-white/55">Total <b className="text-[20px] text-white ml-1">{total ? `${fmt(total, 0)} kg` : "—"}</b></p></div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {big.map((b) => (
                  <button key={b.label} className="text-left rounded-[12px] bg-black/40 p-3 border border-white/[.06] hover:border-[#ffb21e66]" onClick={() => setExSel(b.ex)}>
                    <p className="text-[12px] font-semibold text-white/80">{b.label}</p>
                    <p className="text-[28px] font-bold mt-1 leading-none" style={{ color: "#ffb21e" }}>{b.top ? fmt(b.top.kg) : "—"}<span className="text-[13px] text-white/40"> kg</span></p>
                    {b.top ? <p className="text-[11px] text-white/50 mt-1">{b.top.reps} reps · 1RM {fmt(b.est, 0)} kg</p> : <p className="text-[11px] text-white/40 mt-1">sem registro</p>}
                  </button>))}
              </div>
              <p className="text-[11px] text-white/40 mt-2">O total soma a força estimada (1RM) dos três. É o placar dos fortes.</p>
            </div>
            {others.length > 0 && <div className="grid grid-cols-3 gap-3 mt-3">
          {others.map((name) => { const { top, est } = prOf(name); return (
            <button key={name} className="text-left rounded-[8px] bg-white/[.03] p-3" onClick={() => setExSel(names.find((x) => x.toLowerCase() === name.toLowerCase()) ?? names.find((x) => new RegExp(name.split(/\s+/)[0].slice(0, 6), "i").test(x)) ?? name)}>
              <p className="text-xs text-muted leading-tight min-h-[2lh]">{name}</p>
              <p className="num text-2xl mt-1" style={{ color: G }}>{top ? fmt(top.kg) : "—"}</p>
              {top && <p className="text-[11px] text-muted">{top.reps} reps · {shortDate(top.date)}</p>}
              {est > 0 && <p className="text-[11px] text-faint">1RM est. {fmt(est, 0)}</p>}
            </button>
          ); })}
            </div>}
          </>); })()}
      </section>

      <section id="tr-evolucao" className="glass rise p-5 mt-4 scroll-mt-20">
        <SectionTitle><span className="inline-flex items-center gap-1.5"><Ico d={HI.chart} size={14} />Evolução</span></SectionTitle>
        {names.length === 0 ? <Empty>Registre treinos para ver sua evolução.</Empty> : (
          <>
            <select className="field" value={exSel} onChange={(e) => setExSel(e.target.value)} aria-label="Exercício">
              {!names.includes(exSel) && <option value={exSel}>{exSel}</option>}
              {names.some((x) => bigRank(x) < 99) && <optgroup label="★ Os 3 grandes">{names.filter((x) => bigRank(x) < 99).map((x) => <option key={x} value={x}>★ {x}</option>)}</optgroup>}
              <optgroup label="Outros exercícios">{names.filter((x) => bigRank(x) === 99).map((x) => <option key={x}>{x}</option>)}</optgroup>
            </select>
            {series.length > 0 ? (() => {
              const first = series[0][1], last = series.at(-1)![1], best = Math.max(...sv), diff = last - first;
              return (
              <>
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  {[["Força estimada", `${fmt(last, 0)} kg`, "última sessão"], ["Melhor", `${fmt(best, 0)} kg`, "recorde"], ["Evolução", series.length > 1 ? `${diff >= 0 ? "+" : ""}${fmt(diff, 0)} kg` : "—", series.length > 1 ? `em ${series.length} sessões` : "1 sessão"]].map(([l, v, u]) => (
                    <div key={l} className="rounded-[12px] bg-white/[.04] py-3"><p className="text-[11px] text-white/45">{l}</p><p className="text-[20px] font-bold" style={{ color: l === "Evolução" && diff < 0 ? "#ff453a" : "#ffb21e" }}>{v}</p><p className="text-[10.5px] text-white/40">{u}</p></div>))}
                </div>
                {series.length > 1 ? (
                  <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full mt-4" role="img" aria-label={`Evolução da força estimada em ${exSel}`}>
                    {[0, 0.5, 1].map((t) => { const v = smin + (smax - smin) * t; return <g key={t}><line x1={P} x2={W - P} y1={sy(v)} y2={sy(v)} stroke="rgba(255,255,255,.06)" /><text x={W - P + 4} y={sy(v) + 4} fontSize="11" fill="#6b6b70">{fmt(v, 0)}</text></g>; })}
                    <path d={`${series.map((x, i) => `${i ? "L" : "M"}${sx(i)},${sy(x[1])}`).join(" ")} L${sx(series.length - 1)},${H - P} L${sx(0)},${H - P} Z`} fill="#ffb21e" opacity=".08" />
                    <path d={series.map((x, i) => `${i ? "L" : "M"}${sx(i)},${sy(x[1])}`).join(" ")} fill="none" stroke="#ffb21e" strokeWidth="2.5" strokeLinejoin="round" />
                    {series.map((x, i) => <circle key={x[0]} cx={sx(i)} cy={sy(x[1])} r={x[1] === best ? 5 : 3.5} fill={x[1] === best ? "#ffb21e" : "#0b0b0c"} stroke="#ffb21e" strokeWidth="2"><title>{`${shortDate(x[0])}: ${fmt(x[1], 0)} kg`}</title></circle>)}
                    {[0, series.length - 1].map((i) => <text key={i} x={sx(i)} y={H + 12} fontSize="11" fill="#8e8e93" textAnchor={i ? "end" : "start"}>{shortDate(series[i][0])}</text>)}
                  </svg>
                ) : <p className="text-[13px] text-white/55 mt-4 rounded-[12px] border border-dashed border-white/10 p-4 text-center">Uma sessão registrada. Faça este exercício de novo para ver a linha de evolução.</p>}
                <p className="text-[11.5px] text-white/45 mt-2">Força estimada = quanto você levantaria em 1 repetição máxima (1RM), calculado pela fórmula de Epley a partir da sua melhor série de cada treino.</p>
              </>); })() : <p className="text-[13px] text-white/55 mt-3">Sem registros deste exercício ainda.</p>}
          </>
        )}
      </section>

      <section id="tr-frequencia" className="glass rise p-5 mt-4 scroll-mt-20">
        <SectionTitle><span className="inline-flex items-center gap-1.5"><Ico d={HI.list} size={14} />Frequência no mês</span></SectionTitle>
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {weekdayShort.map((d) => <span key={d} className="label text-[10px]">{d}</span>)}
          {Array.from({ length: dow(m) }).map((_, i) => <span key={"b" + i} />)}
          {Array.from({ length: dim }).map((_, i) => { const d = addDays(m, i); return (
            <span key={d} className={`aspect-square rounded-lg grid place-items-center text-xs ${d === today ? "ring-1 ring-white/50" : ""}`}
              style={{ background: trained.has(d) ? G : "rgba(255,255,255,.04)", color: trained.has(d) ? "#0b0c10" : undefined }}>{i + 1}</span>); })}
        </div>
      </section>

      <section id="tr-historico" className="glass rise p-5 mt-4 scroll-mt-20">
        <SectionTitle><span className="inline-flex items-center gap-1.5"><Ico d={HI.list} size={14} />Histórico</span></SectionTitle>
        {workouts.length === 0 ? <Empty>Sua primeira sessão aparecerá aqui.</Empty> : (
          <ul>
            {workouts.slice(0, 30).map((w) => (
              <li key={w.id}><button className="row-hover w-full flex items-center gap-3 min-h-14 px-2 text-left" onClick={() => setSheet(w)}>
                <span className="w-11 shrink-0 text-center leading-tight"><span className="block num text-lg">{w.date.slice(8)}</span><span className="block text-[10px] text-muted uppercase">{shortDate(w.date).split(" ").pop()}</span></span>
                <span className="flex-1 min-w-0"><span className="block truncate font-medium">{w.split_label}</span>
                  <span className="block text-xs text-muted truncate">{new Set(w.sets.map((s) => s.exercise)).size} exerc. · {w.sets.length} séries{w.duration_min ? ` · ${w.duration_min} min` : ""}</span></span>
                {volume(w.sets) > 0 && <span className="num text-sm text-muted shrink-0">{volume(w.sets) >= 1000 ? `${fmt(volume(w.sets) / 1000)} t` : `${Math.round(volume(w.sets))} kg`}</span>}
              </button></li>
            ))}
          </ul>
        )}
      </section>

      <Sheet tone="war" accent={G} open={sheet === "plan"} onClose={() => setSheet(null)} title="Plano semanal"><PlanEditor split={split} plan={plan} onDone={() => setSheet(null)} /></Sheet>
      <Sheet tone="war" accent={G} open={sheet === "program"} onClose={() => setSheet(null)} title="Campanha">{programSlot}</Sheet>
      <Sheet tone="war" accent={G} open={!!viewing} onClose={() => setSheet(null)} title={viewing ? `${shortDate(viewing.date)} · ${viewing.split_label ?? "Treino"}` : ""}>
        {viewing && (
          <div className="grid gap-3">
            {viewing.week_no != null && <p className="label">Semana {viewing.week_no}{viewing.phase ? ` · ${viewing.phase}` : ""}</p>}
            {viewing.planned?.length ? <PlanVsDone w={viewing} /> : [...new Set(viewing.sets.map((s) => s.exercise))].map((ex) => (
              <div key={ex}><p className="font-medium">{ex}</p>
                <p className="text-sm text-muted num">{viewing.sets.filter((s) => s.exercise === ex).map((s) => (isTimed(ex) ? `${s.reps} min${Number(s.kg) ? ` · ${fmt(Number(s.kg))} km` : ""}` : `${fmt(Number(s.kg))}×${s.reps}`) + (s.rpe ? ` @${fmt(Number(s.rpe))}` : "")).join("  ·  ")}</p></div>
            ))}
            {viewing.notes && <p className="font-display italic">{viewing.notes}</p>}
            <p className="text-xs text-muted">Volume {Math.round(volume(viewing.sets)).toLocaleString("pt-BR")} kg{viewing.duration_min ? ` · ${viewing.duration_min} min` : ""}</p>
            <div className="flex gap-2 mt-2">
              <button className="btn text-muted" disabled={pending} onClick={() => { if (confirm("Excluir sessão?")) start(async () => { await deleteWorkout(viewing.id); setSheet(null); }); }}>Excluir</button>
              <button className="btn btn-accent flex-1" onClick={() => {
                const exs = [...new Set(viewing.sets.map((s) => s.exercise))].map((ex) => ({ name: ex, sets: viewing.sets.filter((s) => s.exercise === ex).map((s) => ({ kg: String(Number(s.kg)), reps: String(s.reps), done: true, rpe: s.rpe ? String(Number(s.rpe)) : "" })) }));
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

/** Tabela planejado × realizado. O planejado vem congelado da sessão. */
function PlanVsDone({ w }: { w: Workout }) {
  const planned = w.planned ?? [];
  const names = [...new Set([...planned.map((p) => p.name), ...w.sets.map((s) => s.exercise)])];
  return (
    <div className="grid gap-3">
      {names.map((name) => {
        const p = planned.find((x) => x.name === name), done = w.sets.filter((s) => s.exercise === name);
        const target = p ? firstNum(p.reps) : 0, top = done.reduce((a, s) => Math.max(a, Number(s.kg)), 0);
        const status = !p ? "extra" : done.length === 0 ? "não feito" : done.length < p.sets ? "parcial" : "completo";
        const color = status === "completo" ? G : status === "parcial" ? "#ffb21e" : status === "extra" ? "#f5f5f7" : "#ff453a";
        const rpes = done.filter((s) => s.rpe).map((s) => Number(s.rpe));
        const timed = isTimed(name, p?.muscle);
        return (
          <div key={name} className="rounded-[8px] bg-white/[.03] p-3">
            <div className="flex items-center gap-2"><p className="font-medium flex-1">{name}</p><span className="tag" style={{ color }}>{status}</span></div>
            <table className="w-full text-sm mt-2 num">
              <thead><tr className="label text-left"><th className="font-normal py-1"></th><th className="font-normal">Plan.</th><th className="font-normal">Feito</th></tr></thead>
              <tbody>
                {!timed && <tr><td className="text-muted py-0.5">Séries</td><td>{p?.sets ?? "—"}</td><td>{done.length}</td></tr>}
                <tr><td className="text-muted py-0.5">{timed ? "Duração" : "Reps"}</td><td>{p ? (timed ? `${firstNum(p.reps)} min` : p.reps) : "—"}</td><td>{done.map((s) => (timed ? `${s.reps} min` : s.reps)).join(", ") || "—"}</td></tr>
                {timed && done.some((s) => Number(s.kg) > 0) && <tr><td className="text-muted py-0.5">Distância</td><td>—</td><td>{done.map((s) => `${fmt(Number(s.kg))} km`).join(", ")}</td></tr>}
                {!timed && <tr><td className="text-muted py-0.5">Carga</td><td>{p?.kg != null ? `${fmt(p.kg)} kg` : "—"}</td>
                  <td style={{ color: p?.kg != null && top ? (top > p.kg ? G : top < p.kg ? "#ff453a" : undefined) : undefined }}>{done.length ? done.map((s) => fmt(Number(s.kg))).join(", ") : "—"}</td></tr>}
                <tr><td className="text-muted py-0.5">RPE</td><td>{p?.rpe ? fmt(p.rpe) : "—"}</td><td>{rpes.length ? rpes.map((r) => fmt(r)).join(", ") : "—"}</td></tr>
              </tbody>
            </table>
            {p && target > 0 && done.length > 0 && <p className="text-[11px] text-muted mt-1">{timed ? (done.reduce((a, s) => a + s.reps, 0) >= target ? "Tempo planejado cumprido" : `Faltaram ${target - done.reduce((a, s) => a + s.reps, 0)} min do planejado`) : `${done.filter((s) => s.reps >= target).length} de ${done.length} séries bateram a meta de repetições`}</p>}
          </div>
        );
      })}
    </div>
  );
}
