"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { eatPlannedMeal, generateDietPlan, saveDietPlan, toggleIntake, type DietPlan, type QuizAnswers } from "@/app/(app)/corpo/diet-actions";
import { ACTIVITY, GOALS, adjustForPhase, targets, type Activity, type Goal } from "@/lib/diet-plan";
import { HI, Ico } from "@/components/hunt-icons";
import { Sheet } from "@/components/kit";
import { useXp } from "@/components/game/xp";

const R = "#ffb21e", A = "#ffb21e";
const COMMON_SUPS = ["Whey protein", "Creatina", "Multivitamínico", "Ômega 3", "Vitamina D", "Magnésio", "Cafeína", "Colágeno"];

/** Card do plano alimentar no topo da Dieta: sem plano → definir; com plano → seguir o dia. */
export function DietPlanCard({ plan, ready, date, doneSlots, intakes, phase }: { plan: DietPlan | null; ready: boolean; date: string; doneSlots: string[]; intakes: { kind: string; name: string }[]; phase: { kind: string; name: string } | null }) {
  const router = useRouter();
  const { gain } = useXp();
  const [quiz, setQuiz] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [taken, setTaken] = useState(new Set(intakes.map((x) => `${x.kind}|${x.name}`)));

  if (!ready) return <section className="hunt-card p-5 mb-4 span-all text-sm">Rode a migração <code className="text-[#ffb21e]">20261124000000_plano_dieta.sql</code> no Supabase para ativar o plano alimentar.</section>;
  if (!plan) return (
    <section className="hunt-card relative p-6 mb-4 span-all text-center">
      <span aria-hidden className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#ffb21e]" />
      <p className="label">Plano alimentar</p>
      <p className="font-display text-4xl mt-2">Sem dieta definida<span className="text-[#ffb21e]">.</span></p>
      <p className="text-[14px] text-white/60 mt-2 max-w-md mx-auto">Responda um quiz rápido: objetivo, corpo, rotina, o que gosta, suplementos, remédios e água. O BRIO monta o cardápio do dia e ajusta pela fase do seu treino.</p>
      <button className="btn btn-accent mt-5" onClick={() => setQuiz(true)}>Definir minha dieta →</button>
      <DietQuiz open={quiz} onClose={() => setQuiz(false)} onSaved={() => { setQuiz(false); router.refresh(); }} />
    </section>);

  const adj = plan.follow_phase ? adjustForPhase({ kcal: plan.kcal, protein: plan.protein_g, carbs: plan.carbs_g, fat: plan.fat_g }, phase?.kind) : { kcal: plan.kcal, protein: plan.protein_g, carbs: plan.carbs_g, fat: plan.fat_g, note: null };
  const doneMeals = plan.meals.filter((m) => doneSlots.includes(m.key)).length;
  const toggle = (kind: "suplemento" | "remedio", name: string) => {
    const k = `${kind}|${name}`, on = !taken.has(k);
    setTaken((s) => { const n = new Set(s); if (on) n.add(k); else n.delete(k); return n; });
    if (on) gain(2, kind === "remedio" ? "Remédio tomado" : "Suplemento", A);
    start(async () => { const e = await toggleIntake(date, kind, name, on); if (e) setErr(e); });
  };
  const checks = [...plan.supplements.map((s) => ({ ...s, kind: "suplemento" as const })), ...plan.meds.map((s) => ({ ...s, kind: "remedio" as const }))];

  return (
    <section className="hunt-card relative p-5 lg:p-6 mb-4 span-all">
      <span aria-hidden className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#ffb21e]" style={{ boxShadow: "0 0 18px #ffb21e" }} />
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="label flex items-center gap-1.5"><Ico d={HI.list} size={13} />Plano do dia · {GOALS[plan.goal].label}</p>
          <p className="num text-5xl leading-none mt-2">{adj.kcal.toLocaleString("pt-BR")}<span className="text-lg text-white/40"> kcal</span></p>
          <p className="font-mono text-[12px] text-white/55 mt-1.5">P {adj.protein} g · C {adj.carbs} g · G {adj.fat} g · água {(plan.water_ml / 1000).toLocaleString("pt-BR")} L</p>
          {adj.note && phase && <p className="text-[12px] mt-1" style={{ color: A }}>Fase {phase.name} · {adj.note}</p>}
        </div>
        <button className="btn !min-h-10" onClick={() => setQuiz(true)}>Refazer plano</button>
      </div>

      <div className="flex justify-between label !text-[9px] mt-5"><span>Refeições do plano</span><span style={{ color: A }}>{doneMeals}/{plan.meals.length}</span></div>
      <div className="flex gap-[3px] mt-1.5" aria-hidden>{plan.meals.map((m) => <i key={m.key} className="h-[5px] flex-1" style={{ background: doneSlots.includes(m.key) ? R : "rgba(255,255,255,.08)" }} />)}</div>

      <ol className="grid lg:grid-cols-2 gap-px bg-white/[.06] border border-white/[.06] mt-3">
        {plan.meals.map((m) => { const on = doneSlots.includes(m.key), kc = m.items.reduce((a, x) => a + x.kcal, 0), pr = m.items.reduce((a, x) => a + x.p, 0); return (
          <li key={m.key} className={`bg-[#080808] p-4 ${on ? "opacity-70" : ""}`}>
            <div className="flex items-baseline gap-2">
              {m.time && <span className="font-mono text-[12px] text-[#ffb21e]">{m.time}</span>}
              <p className="font-semibold flex-1">{m.label}</p>
              <span className="font-mono text-[11px] text-white/50">{kc} kcal · {pr} g P</span>
            </div>
            <ul className="mt-2 grid gap-0.5">{m.items.map((x, i) => <li key={i} className="text-[13px] text-white/70 flex gap-2"><span className="text-[#ffb21e]">▪</span><span className="flex-1">{x.name}{x.qty ? <span className="text-white/40"> · {x.qty}</span> : null}</span></li>)}</ul>
            {on ? <p className="text-[12px] mt-3" style={{ color: "#30d158" }}>✓ Feita</p>
              : <button className="btn btn-accent w-full mt-3 !min-h-10" disabled={pending} onClick={() => start(async () => { const e = await eatPlannedMeal(date, m.key); if (e) setErr(e); else { gain(10, `${m.label} no plano`, R); router.refresh(); } })}>Comi o planejado</button>}
          </li>); })}
      </ol>

      {checks.length > 0 && <>
        <p className="label !text-[9px] mt-5 mb-2">Suplementos e remédios de hoje</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {checks.map((s) => { const on = taken.has(`${s.kind}|${s.name}`); return (
            <button key={s.kind + s.name} onClick={() => toggle(s.kind, s.name)} aria-pressed={on} className={`flex items-center gap-3 text-left border px-3 py-2.5 rounded-[6px] ${on ? "border-[#30d15866] bg-[#30d15810]" : "border-white/10 bg-[#080808]"}`}>
              <span className="h-5 w-5 grid place-items-center border shrink-0" style={{ borderColor: on ? "#30d158" : "rgba(255,255,255,.25)", background: on ? "#30d158" : "transparent" }}>{on && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" aria-hidden><path d="M5 12l5 5L20 7" /></svg>}</span>
              <span className="min-w-0"><span className="block text-[13.5px] truncate">{s.name}{s.dose ? <span className="text-white/45"> · {s.dose}</span> : null}</span><span className="block text-[10.5px] font-mono text-white/40">{s.kind === "remedio" ? "remédio" : "suplemento"}{s.time ? ` · ${s.time}` : ""}</span></span>
            </button>); })}
        </div>
      </>}
      {err && <p className="text-[12.5px] text-[#ff453a] mt-3" role="alert">{err}</p>}
      <DietQuiz open={quiz} initial={plan} onClose={() => setQuiz(false)} onSaved={() => { setQuiz(false); router.refresh(); }} />
    </section>
  );
}

type Draft = Omit<QuizAnswers, "times"> & { times: string[] };
const DEF_TIMES = ["07:00", "10:00", "12:30", "16:00", "19:30", "22:00"];

function DietQuiz({ open, onClose, onSaved, initial }: { open: boolean; onClose: () => void; onSaved: () => void; initial?: DietPlan }) {
  const pr = (initial?.profile ?? {}) as Record<string, unknown>;
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>({
    sex: (pr.sex as "m" | "f") ?? "m", age: Number(pr.age ?? 30), cm: Number(pr.cm ?? 175), kg: Number(pr.kg ?? 80), activity: (pr.activity as Activity) ?? "moderado", goal: (initial?.goal as Goal) ?? "perder",
    meals: initial?.meals.length ?? 4, times: initial?.meals.map((m) => m.time) ?? [], likes: String(pr.likes ?? ""), dislikes: String(pr.dislikes ?? ""), restrictions: String(pr.restrictions ?? ""),
    budget: (pr.budget as Draft["budget"]) ?? "normal", cook: (pr.cook as Draft["cook"]) ?? "medio", supplements: initial?.supplements ?? [], meds: initial?.meds ?? [], water_ml: initial?.water_ml,
  });
  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [ai, setAi] = useState(true);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const t = targets({ sex: d.sex, kg: d.kg, cm: d.cm, age: d.age, activity: d.activity, goal: d.goal });
  const set = (p: Partial<Draft>) => setD({ ...d, ...p });
  const STEPS = ["Objetivo", "Seu corpo", "Rotina", "Refeições", "Alimentos", "Suplementos", "Remédios", "Água"];
  const opt = (on: boolean) => `text-left border px-3 py-3 rounded-[6px] ${on ? "border-[#ffb21e] bg-[#ffb21e12] text-white" : "border-white/10 bg-[#080808] text-white/75 hover:text-white"}`;
  const num = (k: "age" | "cm" | "kg", l: string, u: string) => <label className="grid gap-1"><span className="label !text-[9px]">{l}</span><div className="flex items-center gap-2"><input className="field num text-lg" inputMode="decimal" value={String(d[k])} onChange={(e) => set({ [k]: Number(e.target.value.replace(",", ".")) || 0 } as Partial<Draft>)} /><span className="text-white/45 text-sm">{u}</span></div></label>;

  const body = plan ? (
    <div className="grid gap-4">
      {!ai && <p className="text-[12.5px] text-[#ffb21e]">A IA não respondeu; montei um cardápio base com as suas metas. Você pode salvar e ajustar, ou tentar gerar de novo.</p>}
      <div className="hunt-card p-4"><p className="num text-4xl">{plan.kcal} <span className="text-base text-white/45">kcal</span></p><p className="font-mono text-[12px] text-white/55 mt-1">P {plan.protein_g} · C {plan.carbs_g} · G {plan.fat_g} · água {plan.water_ml} ml · gasto estimado {String((plan.profile as Record<string, unknown>).tdee ?? "")} kcal</p></div>
      {plan.meals.map((m, mi) => (
        <div key={m.key} className="border border-white/10 rounded-[8px] p-3">
          <div className="flex gap-2 items-center"><input className="field !min-h-9 !w-20 font-mono text-[12px]" value={m.time} onChange={(e) => setPlan({ ...plan, meals: plan.meals.map((x, k) => (k === mi ? { ...x, time: e.target.value } : x)) })} aria-label="Horário" /><p className="font-semibold flex-1">{m.label}</p><span className="font-mono text-[11px] text-white/50">{m.items.reduce((a, x) => a + x.kcal, 0)} kcal</span></div>
          <ul className="mt-2 grid gap-1">{m.items.map((x, i) => (
            <li key={i} className="flex items-center gap-2 text-[13px]"><span className="flex-1">{x.name} <span className="text-white/40">· {x.qty}</span></span><span className="font-mono text-[11px] text-white/45">{x.kcal} kcal · {x.p}P</span>
              <button className="text-white/35 hover:text-[#ff453a] px-1" aria-label={`Remover ${x.name}`} onClick={() => setPlan({ ...plan, meals: plan.meals.map((y, k) => (k === mi ? { ...y, items: y.items.filter((_, j) => j !== i) } : y)) })}>✕</button></li>))}</ul>
        </div>))}
      {(plan.supplements.length > 0 || plan.meds.length > 0) && <p className="text-[12.5px] text-white/60">Também no plano: {[...plan.supplements, ...plan.meds].map((s) => s.name).join(", ")}.</p>}
      <p className="text-[11.5px] text-white/40">Estimativa educativa, não substitui nutricionista ou médico. Remédios ficam só como lembrete: siga a orientação de quem prescreveu.</p>
      {err && <p className="text-[12.5px] text-[#ff453a]" role="alert">{err}</p>}
      <div className="flex gap-2 sticky bottom-0 bg-[#0b0b0b] pt-2">
        <button className="btn" onClick={() => setPlan(null)}>Voltar</button>
        <button className="btn" disabled={pending} onClick={() => start(async () => { const r = await generateDietPlan(d).catch(() => ({ error: "Sem conexão.", ai: false }) as { plan?: DietPlan; error?: string; ai: boolean }); if (r.plan) { setPlan(r.plan); setAi(r.ai); } else setErr(r.error ?? "Erro."); })}>Gerar de novo</button>
        <button className="btn btn-accent flex-1" disabled={pending} onClick={() => start(async () => { const e = await saveDietPlan(plan); if (e) setErr(e); else onSaved(); })}>Salvar plano</button>
      </div>
    </div>
  ) : (
    <div className="grid gap-4">
      <div className="flex gap-1" aria-hidden>{STEPS.map((s, i) => <i key={s} className="h-[4px] flex-1" style={{ background: i <= step ? R : "rgba(255,255,255,.08)" }} />)}</div>
      <p className="label">Passo {step + 1} de {STEPS.length} · {STEPS[step]}</p>
      {step === 0 && <div className="grid sm:grid-cols-2 gap-2">{(Object.keys(GOALS) as Goal[]).map((g) => <button key={g} className={opt(d.goal === g)} onClick={() => set({ goal: g })}><span className="block font-semibold">{GOALS[g].label}</span><span className="block text-[11.5px] text-white/50">{GOALS[g].delta > 0 ? `+${GOALS[g].delta * 100}%` : `${GOALS[g].delta * 100}%`} das calorias · {GOALS[g].protPerKg} g/kg de proteína</span></button>)}</div>}
      {step === 1 && <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-2">{([["m", "Masculino"], ["f", "Feminino"]] as const).map(([k, l]) => <button key={k} className={opt(d.sex === k)} onClick={() => set({ sex: k })}>{l}</button>)}</div>
        <div className="grid grid-cols-3 gap-2">{num("age", "Idade", "anos")}{num("cm", "Altura", "cm")}{num("kg", "Peso", "kg")}</div>
      </div>}
      {step === 2 && <div className="grid gap-2">{(Object.keys(ACTIVITY) as Activity[]).map((a) => <button key={a} className={opt(d.activity === a)} onClick={() => set({ activity: a })}>{ACTIVITY[a].label}</button>)}</div>}
      {step === 3 && <div className="grid gap-3">
        <div className="grid grid-cols-4 gap-2">{[3, 4, 5, 6].map((n) => <button key={n} className={opt(d.meals === n)} onClick={() => set({ meals: n })}><span className="num text-2xl">{n}</span><span className="block text-[11px] text-white/50">refeições</span></button>)}</div>
        <p className="label !text-[9px]">Horários</p>
        <div className="grid grid-cols-3 gap-2">{Array.from({ length: d.meals }, (_, i) => <input key={i} type="time" className="field font-mono" value={d.times[i] ?? DEF_TIMES[[0, 2, 4].concat([1, 3, 5])[i] ?? i]} onChange={(e) => { const tt = [...d.times]; tt[i] = e.target.value; set({ times: tt }); }} aria-label={`Horário da refeição ${i + 1}`} />)}</div>
      </div>}
      {step === 4 && <div className="grid gap-3">
        {([["likes", "O que você gosta de comer", "frango, arroz, feijão, ovos, banana, pão…"], ["dislikes", "O que não come de jeito nenhum", "peixe, fígado…"], ["restrictions", "Restrições, alergias ou intolerâncias", "lactose, glúten, vegetariano…"]] as const).map(([k, l, ph]) => <label key={k} className="grid gap-1"><span className="label !text-[9px]">{l}</span><input className="field" placeholder={ph} value={d[k]} onChange={(e) => set({ [k]: e.target.value } as Partial<Draft>)} /></label>)}
        <div className="grid grid-cols-3 gap-2">{([["economico", "Econômico"], ["normal", "Normal"], ["livre", "Sem limite"]] as const).map(([k, l]) => <button key={k} className={opt(d.budget === k)} onClick={() => set({ budget: k })}><span className="block text-[11px] text-white/50">orçamento</span>{l}</button>)}</div>
        <div className="grid grid-cols-3 gap-2">{([["pouco", "Pouco"], ["medio", "Médio"], ["muito", "Gosto"]] as const).map(([k, l]) => <button key={k} className={opt(d.cook === k)} onClick={() => set({ cook: k })}><span className="block text-[11px] text-white/50">cozinhar</span>{l}</button>)}</div>
      </div>}
      {step === 5 && <ListEditor label="suplemento" items={d.supplements} common={COMMON_SUPS} onChange={(v) => set({ supplements: v })} />}
      {step === 6 && <><p className="text-[12.5px] text-white/55">Só como lembrete diário. O BRIO não altera doses: siga a orientação médica.</p><ListEditor label="remédio" items={d.meds.map(({ notes, ...x }) => ({ ...x, notes }))} onChange={(v) => set({ meds: v.map((x) => ({ ...x, notes: (x as { notes?: string }).notes ?? "" })) })} /></>}
      {step === 7 && <div className="grid gap-3">
        <p className="text-[13px] text-white/65">Sugestão: 35 ml por kg = <b className="text-white">{t.water} ml</b>. Em dias de treino forte ou calor, um pouco mais.</p>
        <label className="grid gap-1"><span className="label !text-[9px]">Meta de água (ml)</span><input className="field num text-lg" inputMode="numeric" value={String(d.water_ml ?? t.water)} onChange={(e) => set({ water_ml: Number(e.target.value) || t.water })} /></label>
        <div className="hunt-card p-4"><p className="label !text-[9px]">Suas metas</p><p className="num text-3xl mt-1">{t.kcal} kcal</p><p className="font-mono text-[12px] text-white/55">gasto {t.tdee} · P {t.protein} · C {t.carbs} · G {t.fat}</p></div>
      </div>}
      {err && <p className="text-[12.5px] text-[#ff453a]" role="alert">{err}</p>}
      <div className="flex gap-2">
        {step > 0 && <button className="btn" onClick={() => setStep(step - 1)}>Voltar</button>}
        {step < STEPS.length - 1 ? <button className="btn btn-accent flex-1" disabled={step === 1 && (!d.age || !d.cm || !d.kg)} onClick={() => setStep(step + 1)}>Continuar</button>
          : <button className="btn btn-accent flex-1" disabled={pending} onClick={() => start(async () => { setErr(null); const r = await generateDietPlan({ ...d, times: Array.from({ length: d.meals }, (_, i) => d.times[i] ?? "") }).catch(() => ({ error: "Sem conexão.", ai: false }) as { plan?: DietPlan; error?: string; ai: boolean }); if (r.plan) { setPlan(r.plan); setAi(r.ai); } else setErr(r.error ?? "Erro."); })}>{pending ? "Montando seu cardápio…" : "Gerar meu plano"}</button>}
      </div>
    </div>);
  return <Sheet open={open} onClose={onClose} title={plan ? "Revise seu plano" : "Definir dieta"}>{body}</Sheet>;
}

function ListEditor({ label, items, common = [], onChange }: { label: string; items: { name: string; dose: string; time: string; notes?: string }[]; common?: string[]; onChange: (v: { name: string; dose: string; time: string; notes?: string }[]) => void }) {
  const [n, setN] = useState({ name: "", dose: "", time: "" });
  const add = (name: string, dose = "", time = "") => { if (name.trim() && !items.some((x) => x.name.toLowerCase() === name.trim().toLowerCase())) onChange([...items, { name: name.trim(), dose, time }]); };
  return (
    <div className="grid gap-3">
      {common.length > 0 && <div className="flex flex-wrap gap-1.5">{common.map((c) => <button key={c} className="chip" disabled={items.some((x) => x.name === c)} onClick={() => add(c)}>+ {c}</button>)}</div>}
      {items.length === 0 ? <p className="text-[13px] text-white/45">Nenhum {label}. Pode pular.</p> : (
        <ul className="grid gap-2">{items.map((x, i) => (
          <li key={i} className="grid grid-cols-[1fr_6rem_6rem_auto] gap-2 items-center">
            <span className="text-[14px] truncate">{x.name}</span>
            <input className="field !min-h-9 text-[12px]" placeholder="dose" value={x.dose} onChange={(e) => onChange(items.map((y, k) => (k === i ? { ...y, dose: e.target.value } : y)))} />
            <input className="field !min-h-9 text-[12px]" placeholder="quando" value={x.time} onChange={(e) => onChange(items.map((y, k) => (k === i ? { ...y, time: e.target.value } : y)))} />
            <button className="text-white/40 hover:text-[#ff453a] px-1" aria-label={`Remover ${x.name}`} onClick={() => onChange(items.filter((_, k) => k !== i))}>✕</button>
          </li>))}</ul>)}
      <form className="grid grid-cols-[1fr_6rem_6rem_auto] gap-2" onSubmit={(e) => { e.preventDefault(); add(n.name, n.dose, n.time); setN({ name: "", dose: "", time: "" }); }}>
        <input className="field" placeholder={`Outro ${label}`} value={n.name} onChange={(e) => setN({ ...n, name: e.target.value })} />
        <input className="field" placeholder="dose" value={n.dose} onChange={(e) => setN({ ...n, dose: e.target.value })} />
        <input className="field" placeholder="quando" value={n.time} onChange={(e) => setN({ ...n, time: e.target.value })} />
        <button className="btn" disabled={!n.name.trim()}>+</button>
      </form>
    </div>);
}
