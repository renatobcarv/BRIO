"use client";
import Image from "next/image";
import { useEffect, useRef, useState, useTransition, type CSSProperties } from "react";
import { createFromConsult, previewProgram } from "@/app/(app)/treino/coach-actions";
import { ExerciseThumb } from "@/components/body/exercise-media";
import { FOCUS, REFS, type Focus, type TrainAnswers } from "@/lib/coach";
import { GREET, HANDOFF, reactTo } from "@/lib/consult-talk";
import { GOALS, MUSCLES, PHASE_KINDS, type Goal, type Muscle } from "@/lib/training";

const A = "#ffb21e";
type Diet = { sex: "m" | "f"; age: number; cm: number; kg: number; meals: number; likes: string; dislikes: string; restrictions: string; budget: "economico" | "normal" | "livre"; cook: "pouco" | "medio" | "muito" };
type Opt<T> = { v: T; l: string; d?: string };
type Q = { who: "treino" | "dieta"; key: string; ask: string; why?: string; opts?: Opt<unknown>[]; multi?: number; input?: "number" | "text"; unit?: string; skip?: boolean };

/** O plano começa JÁ: semana 1 = esta semana (segunda-feira atual, no horário de Brasília). */
const thisMonday = () => { const d = new Date(Date.now() - 3 * 36e5); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); };
const Qs: Q[] = [
  { who: "treino", key: "goal", ask: "Qual é o seu objetivo principal agora?", opts: (Object.keys(GOALS) as Goal[]).map((g) => ({ v: g, l: GOALS[g] })) },
  { who: "treino", key: "focus", ask: "Quer um foco nos levantamentos básicos?", why: "Especializar = treinar o levantamento mais vezes por semana, com pesado, volume e técnica.", opts: (Object.keys(FOCUS) as Focus[]).map((f) => ({ v: f, l: FOCUS[f].label, d: FOCUS[f].hint })) },
  { who: "treino", key: "level", ask: "Há quanto tempo você treina com consistência?", why: "Define o volume inicial: iniciantes crescem com menos.", opts: [{ v: "iniciante", l: "Menos de 1 ano" }, { v: "intermediario", l: "1 a 3 anos" }, { v: "avancado", l: "Mais de 3 anos" }] },
  { who: "treino", key: "days", ask: "Quantos dias por semana você consegue treinar de verdade?", why: "Melhor um plano que você cumpre do que um perfeito que abandona.", opts: [2, 3, 4, 5, 6].map((n) => ({ v: n, l: `${n} dias` })) },
  { who: "treino", key: "minutes", ask: "Quanto tempo por treino?", opts: [45, 60, 75, 90].map((n) => ({ v: n, l: `${n} min` })) },
  { who: "treino", key: "equipment", ask: "Onde você vai treinar?", opts: [{ v: "academia", l: "Academia completa" }, { v: "halteres", l: "Halteres e banco" }, { v: "casa", l: "Em casa (peso do corpo)" }] },
  { who: "treino", key: "priority", ask: "Algum grupo que você quer priorizar? (até 3)", why: "Prioridade ganha +4 séries por semana. Escolher tudo é o mesmo que não priorizar nada.", multi: 3, opts: (["peito", "costas", "ombro_anterior", "ombro_lateral", "ombro_posterior", "biceps", "triceps", "quadriceps", "posteriores", "gluteos", "panturrilhas", "abdomen"] as Muscle[]).map((m) => ({ v: m, l: MUSCLES[m] })) },
  { who: "treino", key: "sleep", ask: "Quantas horas você dorme por noite, em média?", why: "Sono curto reduz a recuperação: o volume começa menor.", opts: [5, 6, 7, 8, 9].map((n) => ({ v: n, l: `${n}h${n === 9 ? "+" : ""}` })) },
  { who: "treino", key: "stress", ask: "Como está o estresse no dia a dia?", opts: [{ v: "baixo", l: "Baixo" }, { v: "medio", l: "Médio" }, { v: "alto", l: "Alto" }] },
  { who: "treino", key: "injuries", ask: "Alguma lesão ou dor que eu deva saber?", input: "text", skip: true },
  { who: "treino", key: "weeks", ask: "Quanto tempo de campanha?", opts: [8, 12, 16].map((n) => ({ v: n, l: `${n} semanas` })) },
  { who: "dieta", key: "sex", ask: "Agora é comigo, a nutricionista. Sexo biológico?", why: "Entra na fórmula do gasto calórico (Mifflin–St Jeor).", opts: [{ v: "m", l: "Masculino" }, { v: "f", l: "Feminino" }] },
  { who: "dieta", key: "age", ask: "Idade?", input: "number", unit: "anos" },
  { who: "dieta", key: "cm", ask: "Altura?", input: "number", unit: "cm" },
  { who: "dieta", key: "kg", ask: "Peso atual?", input: "number", unit: "kg" },
  { who: "dieta", key: "meals", ask: "Quantas refeições por dia combinam com sua rotina?", opts: [3, 4, 5, 6].map((n) => ({ v: n, l: `${n}` })) },
  { who: "dieta", key: "likes", ask: "O que você gosta de comer?", input: "text", skip: true },
  { who: "dieta", key: "dislikes", ask: "E o que não come de jeito nenhum?", input: "text", skip: true },
  { who: "dieta", key: "restrictions", ask: "Alergia, intolerância ou restrição?", input: "text", skip: true },
  { who: "dieta", key: "budget", ask: "Orçamento para comida?", opts: [{ v: "economico", l: "Econômico" }, { v: "normal", l: "Normal" }, { v: "livre", l: "Sem aperto" }] },
  { who: "dieta", key: "cook", ask: "Quanto tempo para cozinhar?", opts: [{ v: "pouco", l: "Pouco" }, { v: "medio", l: "Médio" }, { v: "muito", l: "Bastante" }] },
];
const WHO = {
  treino: { name: "Treinador", role: "Planejamento do treino", art: "/cards/mestre.webp", color: "#ffc369" },
  dieta: { name: "Nutricionista", role: "Nutrição esportiva", art: "/cards/nutricionista.webp", color: "#9de3ac" },
};
const FIRST_DIET_STEP = Qs.findIndex((q) => q.who === "dieta");
type Msg = { id: number; from: "treino" | "dieta" | "me"; text: string };
let msgId = 0;
/** Texto da resposta como a pessoa "falaria" no chat. */
const said = (q: Q, val: unknown) => {
  if (q.opts) { const l = (Array.isArray(val) ? val : [val]).map((v) => q.opts!.find((o) => o.v === v)?.l).filter(Boolean); return l.length ? l.join(", ") : "Sem prioridade"; }
  const t = String(val ?? "").trim(); return t ? `${t}${q.unit ? ` ${q.unit}` : ""}` : "Pular";
};
const TEXT_HINTS: Record<string, string> = {
  injuries: "Ex.: dor no joelho ao agachar",
  likes: "Ex.: arroz, feijão e frango",
  dislikes: "Ex.: batata-doce e beterraba",
  restrictions: "Ex.: intolerância à lactose",
};

/** Cartão visual de um dia do plano: exercício, séries×reps em destaque e técnicas marcadas. */
function WeekDayCard({ name, wd, list }: { name: string; wd: string; list: { name: string; sets: number; reps: string; notes: string }[] }) {
  const sets = list.reduce((a, e) => a + e.sets, 0);
  return (
    <div className="chat-in min-w-0 overflow-hidden rounded-[14px] border border-white/10 bg-white/[.03] p-3">
      <div className="flex items-baseline justify-between"><p className="font-semibold">{name}</p><p className="text-[11px] text-white/45">{wd} · {list.length} exerc. · {sets} séries</p></div>
      <ul className="mt-2 grid gap-1.5">{list.map((e, i) => {
        const biset = e.notes.startsWith("Superset"), drop = /drop set/.test(e.notes), cluster = /cluster/.test(e.notes), heavy = e.notes.startsWith("Dia pesado");
        return (
          <li key={i} className={`flex min-w-0 items-center gap-2 rounded-[10px] px-2.5 py-1.5 ${biset ? "border-l-2 border-[var(--consult-accent)] bg-white/[.04]" : "bg-white/[.02]"}`}>
            <ExerciseThumb name={e.name} size={28} />
            <span className="min-w-0 flex-1 truncate text-[13px]">{e.name}</span>
            {(biset || drop || heavy || cluster) && <span className="shrink-0 rounded-full px-1.5 text-[9.5px] font-bold uppercase" style={{ background: "var(--consult-accent)", color: "#141414" }}>{biset ? "Superset" : cluster ? "Cluster" : drop ? "Drop" : "Pesado"}</span>}
            <span className="w-[68px] shrink-0 text-right font-mono text-[12px] text-white/80">{e.sets}×{e.reps}</span>
          </li>); })}</ul>
    </div>);
}

export function Consult() {
  const [open, setOpen] = useState(false), [i, setI] = useState(0), [ans, setAns] = useState<Record<string, unknown>>({ priority: [], injuries: "", likes: "", dislikes: "", restrictions: "" });
  const [txt, setTxt] = useState(""), [res, setRes] = useState<Awaited<ReturnType<typeof previewProgram>> | null>(null), [msg, setMsg] = useState(""), [busy, start] = useTransition();
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const q = Qs[i];
  const specialist = WHO[q.who];
  const [chat, setChat] = useState<Msg[]>([]), [typing, setTyping] = useState<"treino" | "dieta" | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [chat, typing]);
  const say = (from: Msg["from"], text: string) => setChat((c) => [...c, { id: ++msgId, from, text }]);
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const value = Number(txt.trim().replace(",", "."));
  const valid = q.input === "number" ? Number.isFinite(value) && value > 0 : txt.trim().length > 0;
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    dialog.current?.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
  }, [open, i, res]);
  const goBack = () => {
    const previous = Qs[i - 1];
    if (!previous) return;
    setTxt(previous.input ? String(ans[previous.key] ?? "") : "");
    setI(i - 1);
  };
  const train = (): TrainAnswers => ({ goal: ans.goal as Goal, level: ans.level as TrainAnswers["level"], days: ans.days as number, minutes: ans.minutes as number, equipment: ans.equipment as TrainAnswers["equipment"], weeks: ans.weeks as number, priority: ans.priority as Muscle[], injuries: String(ans.injuries ?? ""), sleep: ans.sleep as number, stress: ans.stress as TrainAnswers["stress"], start: thisMonday(), focus: (ans.focus as Focus) ?? "geral" });
  const diet = (): Diet => ({ sex: ans.sex as "m", age: +String(ans.age), cm: +String(ans.cm), kg: +String(ans.kg), meals: ans.meals as number, likes: String(ans.likes), dislikes: String(ans.dislikes), restrictions: String(ans.restrictions), budget: ans.budget as "normal", cook: ans.cook as "medio" });
  const next = async (val: unknown) => {
    if (typing) return;
    const a = { ...ans, [q.key]: val }; setAns(a); setTxt(String(a[Qs[i + 1]?.key] ?? ""));
    say("me", said(q, val));
    const nq = Qs[i + 1], r = reactTo(q.key, val);
    setTyping(q.who); await wait(r ? 650 + Math.min(900, r.length * 12) : 450); setTyping(null);
    if (r) say(q.who, r);
    if (nq && nq.who !== q.who) {
      await wait(350); setTyping(q.who); await wait(700); setTyping(null); say(q.who, HANDOFF);
      await wait(400); setTyping(nq.who); await wait(1100); setTyping(null); say(nq.who, GREET[nq.who]);
    }
    if (nq) { await wait(250); setI(i + 1); }
    else start(async () => setRes(await previewProgram({ ...train(), ...{ goal: a.goal } })));
  };
  const finish = () => start(async () => {
    const r = await createFromConsult(train(), diet(), true);
    if (r.error) return setMsg(r.error);
    setMsg(`Campanha ativada${r.diet ? ` e plano alimentar de ${r.diet.kcal} kcal / ${r.diet.protein} g de proteína salvo` : ""}.${r.dietError ? ` Dieta: ${r.dietError}` : ""}`);
    setTimeout(() => { dialog.current?.close(); location.reload(); }, 1800);
  });
  return (
    <>
      <button type="button" onClick={() => { setOpen(true); setI(0); setTxt(""); setRes(null); setMsg(""); setChat([{ id: ++msgId, from: "treino", text: GREET.treino }]); }}
        className="press mt-4 flex w-full items-center gap-3 rounded-2xl border border-[#ffb21e55] bg-[linear-gradient(120deg,#2d2111,#111111_72%)] p-4 text-left">
        <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#ffc369] text-xl font-bold text-[#211400]">+</span>
        <span className="min-w-0"><span className="block font-semibold">Criar plano com especialistas</span><span className="block text-xs text-white/70">Treinador e nutricionista montam seu plano a partir das suas respostas.</span></span>
        <span aria-hidden="true" className="ml-auto text-xl text-[#ffc369]">↗</span>
      </button>
      {open && (
        <dialog ref={dialog} onClose={() => setOpen(false)} aria-label="Consulta com especialistas"
          style={{ "--consult-accent": specialist.color } as CSSProperties}
          className="fixed inset-0 m-auto h-dvh max-h-dvh w-full max-w-none overflow-y-auto bg-[#101011] text-white backdrop:bg-black/80 sm:h-auto sm:max-h-[92dvh] sm:w-[min(42rem,calc(100%_-_2rem))] sm:rounded-2xl sm:border sm:border-white/15">
          <div className="mx-auto max-w-2xl px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pt-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-white/70">Consulta com especialistas</p>
              <button type="button" className="min-h-11 rounded-xl border border-white/15 px-3 text-sm font-medium text-white/85 hover:bg-white/10" onClick={() => dialog.current?.close()}>Fechar</button>
            </div>
            {!res && (
              <div className="mt-3 grid grid-cols-2 gap-3" role="progressbar" aria-label="Progresso da consulta" aria-valuemin={0} aria-valuemax={Qs.length} aria-valuenow={i + 1} aria-valuetext={`Pergunta ${i + 1} de ${Qs.length}`}>
                {([[0, FIRST_DIET_STEP, "Treino"], [FIRST_DIET_STEP, Qs.length, "Nutrição"]] as const).map(([from, to, label]) => (
                  <div key={label}>
                    <div className="mb-1.5 flex justify-between gap-1 text-xs font-medium">
                      <span className={i >= from && i < to ? "text-[var(--consult-accent)]" : "text-white/65"}>{label}</span>
                      {i >= from && i < to && <span className="tabular-nums text-white/75">{i + 1}/{Qs.length}</span>}
                    </div>
                    <div className="flex gap-[3px]" aria-hidden="true">
                      {Qs.slice(from, to).map((item, index) => <span key={item.key} className="h-1 flex-1 rounded-full"
                        style={{ background: index + from <= i ? WHO[item.who].color : "#38383a" }} />)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!res && q && (
              <div className="mt-4">
                <div className="relative isolate flex min-h-[138px] flex-col justify-end overflow-hidden rounded-xl border border-white/10 p-4 sm:min-h-[168px] sm:p-5">
                  <Image src={specialist.art} fill alt="" unoptimized sizes="(max-width: 640px) 100vw, 630px" className="-z-20 object-cover object-[66%_28%] sm:object-[center_28%]" />
                  <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#0b0b0a_2%,#0b0b0abf_36%,transparent_80%),linear-gradient(0deg,#0b0b0a_0%,transparent_55%)]" />
                  <p className="text-xs font-semibold text-[var(--consult-accent)]">{specialist.role}</p>
                  <p className="font-display text-2xl font-bold sm:text-3xl">{specialist.name}</p>
                </div>
                {/* Conversa: histórico animado + "digitando…" */}
                <div className="consult-chat mt-3 grid gap-2" aria-live="polite">
                  {chat.slice(-8).map((m) => m.from === "me"
                    ? <p key={m.id} className="chat-in justify-self-end max-w-[82%] rounded-2xl rounded-br-md px-3.5 py-2 text-[14px] font-medium text-[#141414]" style={{ background: "var(--consult-accent)" }}>{m.text}</p>
                    : <div key={m.id} className="chat-in flex items-end gap-2 max-w-[90%]">
                        <span className="relative size-8 shrink-0 overflow-hidden rounded-full border" style={{ borderColor: WHO[m.from].color }}><Image src={WHO[m.from].art} alt="" fill unoptimized sizes="32px" className="object-cover object-[60%_20%]" /></span>
                        <p className="rounded-2xl rounded-bl-md bg-[#232325] px-3.5 py-2 text-[14px] leading-snug text-white/90"><span className="block text-[10px] font-semibold uppercase tracking-wider" style={{ color: WHO[m.from].color }}>{WHO[m.from].name}</span>{m.text}</p>
                      </div>)}
                  {typing && <div className="chat-in flex items-end gap-2">
                    <span className="relative size-8 shrink-0 overflow-hidden rounded-full border" style={{ borderColor: WHO[typing].color }}><Image src={WHO[typing].art} alt="" fill unoptimized sizes="32px" className="object-cover object-[60%_20%]" /></span>
                    <span className="typing-dots rounded-2xl rounded-bl-md bg-[#232325] px-4 py-3" aria-label={`${WHO[typing].name} está digitando`}><i /><i /><i /></span>
                  </div>}
                  <div ref={endRef} />
                </div>
                {!typing && <div key={i} className="chat-in mt-3 rounded-xl border border-white/10 bg-[#18181a] p-4 sm:p-5">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--consult-accent)]">
                    <span>Pergunta {i + 1} de {Qs.length}</span>
                    {q.skip && <span className="rounded-full border border-white/15 px-2 py-0.5 text-white/75">Opcional</span>}
                  </div>
                  <h2 ref={heading} tabIndex={-1} className="text-balance text-[clamp(1.35rem,4vw,1.85rem)] font-semibold leading-tight outline-none">{q.ask}</h2>
                  {q.why && <p className="mt-2 text-sm text-white/70">{q.why}</p>}
                  {q.opts && !q.multi && <div className="mt-4 grid gap-2 sm:grid-cols-2">{q.opts.map((o) => (
                    <button key={String(o.v)} type="button" disabled={busy} onClick={() => next(o.v)}
                      className="flex min-h-12 items-center justify-between gap-2 rounded-xl border border-white/15 bg-white/[.04] px-3 py-2 text-left text-sm font-medium hover:border-[var(--consult-accent)] hover:bg-white/[.08] focus-visible:outline-2 focus-visible:outline-[var(--consult-accent)] disabled:opacity-50">
                      <span>{o.l}{o.d && <span className="block text-[12px] font-normal text-white/55 mt-0.5">{o.d}</span>}</span><span aria-hidden="true" className="text-[var(--consult-accent)]">→</span>
                    </button>
                  ))}</div>}
                  {q.opts && q.multi && <>
                    <div className="mt-4 flex flex-wrap gap-2">{q.opts.map((o) => { const sel = (ans[q.key] as unknown[]).includes(o.v); return <button key={String(o.v)} type="button" aria-pressed={sel} onClick={() => setAns({ ...ans, [q.key]: sel ? (ans[q.key] as unknown[]).filter((x) => x !== o.v) : [...(ans[q.key] as unknown[]), o.v].slice(-q.multi!) })} className={`min-h-11 rounded-full border px-3 text-sm ${sel ? "border-transparent bg-[var(--consult-accent)] font-semibold text-[#141414]" : "border-white/15 bg-white/[.04]"}`}>{o.l}</button>; })}</div>
                    <button type="button" className="mt-4 min-h-11 w-full rounded-xl bg-[var(--consult-accent)] px-4 font-bold text-[#141414]" onClick={() => next(ans[q.key])}>{(ans[q.key] as unknown[]).length ? "Continuar" : "Sem prioridade"}</button>
                  </>}
                  {q.input && <form className="mt-4" onSubmit={(e) => { e.preventDefault(); if (valid && !busy) next(q.input === "number" ? value : txt.trim()); }}>
                    <label htmlFor="consult-answer" className="mb-1.5 block text-sm font-medium text-white/80">Sua resposta</label>
                    <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-[#101011] px-3 focus-within:border-[var(--consult-accent)] focus-within:ring-1 focus-within:ring-[var(--consult-accent)]">
                      <input key={q.key} id="consult-answer" inputMode={q.input === "number" ? "decimal" : "text"} value={txt} onChange={(e) => setTxt(e.target.value)} className="min-h-12 min-w-0 flex-1 bg-transparent text-base !text-white !outline-none placeholder:text-white/55" placeholder={q.input === "number" ? "0" : TEXT_HINTS[q.key]} />
                      {q.unit && <span className="text-sm text-white/65">{q.unit}</span>}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="submit" disabled={!valid || busy} className="min-h-11 flex-1 rounded-xl bg-[var(--consult-accent)] px-4 font-bold text-[#141414] disabled:opacity-45">Continuar <span aria-hidden="true">→</span></button>
                      {q.skip && <button type="button" disabled={busy} className="min-h-11 rounded-xl border border-white/20 px-4 text-sm font-medium text-white/80 hover:bg-white/10" onClick={() => next("")}>Pular</button>}
                    </div>
                  </form>}
                </div>}
                {i > 0 && <button type="button" className="mt-2 min-h-11 px-1 text-sm font-medium text-white/75 hover:text-white" disabled={busy} onClick={goBack}>← Voltar</button>}
                {busy && <p role="status" className="mt-2 text-sm text-[var(--consult-accent)]">Os especialistas estão montando seu plano…</p>}
              </div>)}
            {res && "program" in res && res.program && (
              <div className="mt-6 grid gap-4">
                <div><p className="text-[12px]" style={{ color: A }}>Treinador · plano proposto</p><h2 ref={heading} tabIndex={-1} className="font-display text-3xl leading-tight outline-none">{res.program.name}</h2><p className="text-[13px] text-white/55">Começa {res.program.start_date.split("-").reverse().join("/")} · o Mestre ajusta cada semana pelo seu registro</p></div>
                <div className="flex gap-1">{res.program.phases.map((p) => <div key={p.id} className="rounded-[8px] py-2 text-center text-[11px]" style={{ flex: p.weeks, background: PHASE_KINDS[p.kind].color + "22", color: PHASE_KINDS[p.kind].color }}>{p.name}<br />{p.weeks}s</div>)}</div>
                <div className="min-w-0"><p className="label mb-2">Semana tipo</p><div className="grid min-w-0 gap-3">
                  {Object.entries(res.program.phases[0].days).map(([d, l]) => <WeekDayCard key={d} name={res.program.phases[0].dayNames?.[d] ?? ""} wd={["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][+d]} list={l} />)}</div></div>
                <div className="rounded-[14px] bg-white/[.04] p-4"><p className="label mb-2">Por que assim</p>
                  <ul className="grid gap-2">{res.why.map((w, k) => <li key={k} className="text-[13px]"><span>{w.text}</span><span className="block text-[11px] text-white/40 mt-0.5">{REFS[w.ref]}</span></li>)}</ul></div>
                <div className="rounded-[14px] bg-white/[.04] p-4"><p className="text-[12px]" style={{ color: A }}>Nutricionista</p><p className="text-[13px] text-white/70 mt-1">Ao ativar, eu calculo seu gasto pela fórmula de Mifflin–St Jeor, defino a proteína pela meta (até ~2,2 g/kg) e monto um cardápio brasileiro com o que você gosta. As calorias acompanham as fases do treino, e o Mestre corrige pela tendência do seu peso.</p>
                  <p className="text-[11px] text-white/40 mt-2">{REFS.bmr}<br />{REFS.protein}<br />{REFS.diets}</p></div>
                <button className="btn btn-accent w-full" disabled={busy} onClick={finish}>{busy ? "Montando treino e dieta…" : "Ativar plano (treino + dieta)"}</button>
                <p className="text-[11.5px] text-white/40">Isto é orientação geral baseada em estudos, não substitui avaliação médica ou de um nutricionista. Com lesão, dor ou condição de saúde, consulte um profissional.</p>
                {msg && <p className="text-sm" style={{ color: A }}>{msg}</p>}
              </div>)}
            {res && "error" in res && res.error && <div className="mt-6" role="alert"><p className="text-sm" style={{ color: A }}>{res.error}</p><button type="button" className="btn mt-3" onClick={() => setRes(null)}>Voltar à última pergunta</button></div>}
          </div>
        </dialog>)}
    </>
  );
}
