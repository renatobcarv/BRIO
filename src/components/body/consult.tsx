"use client";
import { useState, useTransition } from "react";
import { createFromConsult, previewProgram } from "@/app/(app)/treino/coach-actions";
import { REFS, type TrainAnswers } from "@/lib/coach";
import { GOALS, MUSCLES, PHASE_KINDS, type Goal, type Muscle } from "@/lib/training";

const A = "#ffb21e";
type Diet = { sex: "m" | "f"; age: number; cm: number; kg: number; meals: number; likes: string; dislikes: string; restrictions: string; budget: "economico" | "normal" | "livre"; cook: "pouco" | "medio" | "muito" };
type Opt<T> = { v: T; l: string; d?: string };
type Q = { who: "treino" | "dieta"; key: string; ask: string; why?: string; opts?: Opt<unknown>[]; multi?: number; input?: "number" | "text"; unit?: string; skip?: boolean };

const nextMonday = () => { const d = new Date(); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); return d.toISOString().slice(0, 10); };
const Qs: Q[] = [
  { who: "treino", key: "goal", ask: "Qual é o seu objetivo principal agora?", opts: (Object.keys(GOALS) as Goal[]).map((g) => ({ v: g, l: GOALS[g] })) },
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
const WHO = { treino: { name: "Treinador", role: "Especialista em periodização", ini: "T" }, dieta: { name: "Nutricionista", role: "Nutrição esportiva", ini: "N" } };

export function Consult() {
  const [open, setOpen] = useState(false), [i, setI] = useState(0), [ans, setAns] = useState<Record<string, unknown>>({ priority: [], injuries: "", likes: "", dislikes: "", restrictions: "" });
  const [txt, setTxt] = useState(""), [res, setRes] = useState<Awaited<ReturnType<typeof previewProgram>> | null>(null), [msg, setMsg] = useState(""), [busy, start] = useTransition();
  const q = Qs[i];
  const train = (): TrainAnswers => ({ goal: ans.goal as Goal, level: ans.level as TrainAnswers["level"], days: ans.days as number, minutes: ans.minutes as number, equipment: ans.equipment as TrainAnswers["equipment"], weeks: ans.weeks as number, priority: ans.priority as Muscle[], injuries: String(ans.injuries ?? ""), sleep: ans.sleep as number, stress: ans.stress as TrainAnswers["stress"], start: nextMonday() });
  const diet = (): Diet => ({ sex: ans.sex as "m", age: +String(ans.age), cm: +String(ans.cm), kg: +String(ans.kg), meals: ans.meals as number, likes: String(ans.likes), dislikes: String(ans.dislikes), restrictions: String(ans.restrictions), budget: ans.budget as "normal", cook: ans.cook as "medio" });
  const next = (val: unknown) => {
    const a = { ...ans, [q.key]: val }; setAns(a); setTxt("");
    if (i + 1 < Qs.length) setI(i + 1);
    else start(async () => setRes(await previewProgram({ ...train(), ...{ goal: a.goal } })));
  };
  const finish = () => start(async () => {
    const r = await createFromConsult(train(), diet(), true);
    if (r.error) return setMsg(r.error);
    setMsg(`Campanha ativada${r.diet ? ` e plano alimentar de ${r.diet.kcal} kcal / ${r.diet.protein} g de proteína salvo` : ""}.${r.dietError ? ` Dieta: ${r.dietError}` : ""}`);
    setTimeout(() => { setOpen(false); location.reload(); }, 1800);
  });
  return (
    <>
      <button onClick={() => { setOpen(true); setI(0); setRes(null); setMsg(""); }} className="w-full mt-4 rounded-[16px] p-4 text-left border flex items-center gap-3" style={{ borderColor: A + "55", background: `linear-gradient(120deg, ${A}1a, transparent 60%)` }}>
        <span className="grid place-items-center h-11 w-11 rounded-full font-bold text-black" style={{ background: A }}>+</span>
        <span><span className="block font-semibold">Criar plano novo com especialistas</span><span className="block text-[12px] text-white/55">Treinador de periodização + nutricionista · perguntas, estudos e um plano feito para você</span></span>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-[#050505] overflow-y-auto" role="dialog" aria-modal aria-label="Consulta com especialistas">
          <div className="max-w-lg mx-auto p-4 pb-24">
            <div className="flex items-center justify-between"><p className="label">Consulta · {res ? "seu plano" : `${i + 1}/${Qs.length}`}</p><button className="btn !min-h-9 !px-3" onClick={() => setOpen(false)}>Fechar</button></div>
            {!res && <div className="h-1 rounded-full bg-white/10 mt-3"><i className="block h-1 rounded-full" style={{ width: `${((i + 1) / Qs.length) * 100}%`, background: A }} /></div>}
            {!res && q && (
              <div className="mt-8">
                <div className="flex items-center gap-3">
                  <span className="grid place-items-center h-12 w-12 rounded-full border text-lg font-display" style={{ borderColor: A, color: A }}>{WHO[q.who].ini}</span>
                  <span><span className="block font-semibold">{WHO[q.who].name}</span><span className="block text-[12px] text-white/50">{WHO[q.who].role}</span></span>
                </div>
                <p className="text-[24px] font-semibold leading-snug mt-4">{q.ask}</p>
                {q.why && <p className="text-[13px] text-white/50 mt-1">{q.why}</p>}
                {q.opts && !q.multi && <div className="grid gap-2 mt-5">{q.opts.map((o) => <button key={String(o.v)} onClick={() => next(o.v)} className="text-left rounded-[14px] p-4 bg-white/[.05] hover:bg-white/[.09] text-[16px]">{o.l}</button>)}</div>}
                {q.opts && q.multi && <>
                  <div className="flex flex-wrap gap-2 mt-5">{q.opts.map((o) => { const sel = (ans[q.key] as unknown[]).includes(o.v); return <button key={String(o.v)} aria-pressed={sel} onClick={() => setAns({ ...ans, [q.key]: sel ? (ans[q.key] as unknown[]).filter((x) => x !== o.v) : [...(ans[q.key] as unknown[]), o.v].slice(-q.multi!) })} className={`rounded-full px-4 min-h-10 ${sel ? "bg-[#f5f5f7] text-black font-semibold" : "bg-white/[.06]"}`}>{o.l}</button>; })}</div>
                  <button className="btn btn-accent w-full mt-5" onClick={() => next(ans[q.key])}>{(ans[q.key] as unknown[]).length ? "Continuar" : "Sem prioridade"}</button></>}
                {q.input && <form className="mt-5 grid gap-2" onSubmit={(e) => { e.preventDefault(); if (q.input === "number" && !(+txt > 0)) return; next(q.input === "number" ? +txt.replace(",", ".") : txt); }}>
                  <div className="flex items-baseline gap-2 rounded-[14px] bg-white/[.05] px-4 py-3"><input autoFocus inputMode={q.input === "number" ? "decimal" : "text"} value={txt} onChange={(e) => setTxt(e.target.value)} className="flex-1 bg-transparent outline-none text-[20px]" placeholder={q.input === "number" ? "0" : "Escreva aqui"} aria-label={q.ask} />{q.unit && <span className="text-white/45">{q.unit}</span>}</div>
                  <button className="btn btn-accent">Continuar</button>
                  {q.skip && <button type="button" className="btn" onClick={() => next("")}>Pular</button>}
                </form>}
                {i > 0 && <button className="text-[13px] text-white/45 mt-6" onClick={() => setI(i - 1)}>‹ Voltar</button>}
                {busy && <p className="text-[13px] mt-4" style={{ color: A }}>Os especialistas estão montando seu plano…</p>}
              </div>)}
            {res && "program" in res && res.program && (
              <div className="mt-6 grid gap-4">
                <div><p className="text-[12px]" style={{ color: A }}>Treinador · plano proposto</p><p className="font-display text-3xl leading-tight">{res.program.name}</p><p className="text-[13px] text-white/55">Começa {res.program.start_date.split("-").reverse().join("/")} · o Mestre ajusta cada semana pelo seu registro</p></div>
                <div className="flex gap-1">{res.program.phases.map((p) => <div key={p.id} className="rounded-[8px] py-2 text-center text-[11px]" style={{ flex: p.weeks, background: PHASE_KINDS[p.kind].color + "22", color: PHASE_KINDS[p.kind].color }}>{p.name}<br />{p.weeks}s</div>)}</div>
                <div className="rounded-[14px] bg-white/[.04] p-4"><p className="label mb-2">Semana tipo</p>
                  {Object.entries(res.program.phases[0].days).map(([d, l]) => <div key={d} className="py-2 border-b border-white/[.06] last:border-0"><p className="text-[13px] font-semibold">{res.program.phases[0].dayNames?.[d]}</p><p className="text-[12px] text-white/55">{l.map((e) => `${e.name} ${e.sets}×${e.reps}`).join(" · ")}</p></div>)}</div>
                <div className="rounded-[14px] bg-white/[.04] p-4"><p className="label mb-2">Por que assim</p>
                  <ul className="grid gap-2">{res.why.map((w, k) => <li key={k} className="text-[13px]"><span>{w.text}</span><span className="block text-[11px] text-white/40 mt-0.5">{REFS[w.ref]}</span></li>)}</ul></div>
                <div className="rounded-[14px] bg-white/[.04] p-4"><p className="text-[12px]" style={{ color: A }}>Nutricionista</p><p className="text-[13px] text-white/70 mt-1">Ao ativar, eu calculo seu gasto pela fórmula de Mifflin–St Jeor, defino a proteína pela meta (até ~2,2 g/kg) e monto um cardápio brasileiro com o que você gosta. As calorias acompanham as fases do treino, e o Mestre corrige pela tendência do seu peso.</p>
                  <p className="text-[11px] text-white/40 mt-2">{REFS.bmr}<br />{REFS.protein}<br />{REFS.diets}</p></div>
                <button className="btn btn-accent w-full" disabled={busy} onClick={finish}>{busy ? "Montando treino e dieta…" : "Ativar plano (treino + dieta)"}</button>
                <p className="text-[11.5px] text-white/40">Isto é orientação geral baseada em estudos, não substitui avaliação médica ou de um nutricionista. Com lesão, dor ou condição de saúde, consulte um profissional.</p>
                {msg && <p className="text-sm" style={{ color: A }}>{msg}</p>}
              </div>)}
            {res && "error" in res && res.error && <p className="mt-6 text-sm" style={{ color: A }}>{res.error}</p>}
          </div>
        </div>)}
    </>
  );
}
