"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteProject, evaluateProject, planProject, saveProject, setSteps, type Step } from "@/app/(app)/estudos/ia-actions";
import { MASTERY, masteryFromLevel } from "@/lib/learning";
import { HI, Ico } from "@/components/hunt-icons";
import { Sheet } from "@/components/kit";
import { useXp } from "@/components/game/xp";

type Project = { id: string; title: string; goal: string | null; skills: string | null; steps: Step[]; deliverables: string | null; difficulties: string | null; result: string | null; learnings: string | null; track_id: string | null; status: string; finished_at: string | null };
type Ev = { project_id: string | null; level: number; score: number | null; justification: string | null; date: string };
const STATUS: Record<string, string> = { planejando: "Planejando", construindo: "Construindo", concluido: "Concluído", pausado: "Pausado" };

export function Lab({ ready, projects, tracks, evidence }: { ready: boolean; projects: Project[]; tracks: { id: string; title: string }[]; evidence: Ev[] }) {
  const [sel, setSel] = useState<string | null>(projects.find((p) => p.status !== "concluido")?.id ?? projects[0]?.id ?? null);
  const [form, setForm] = useState<Project | "new" | null>(null);
  if (!ready) return <p className="hunt-card p-5 text-sm">Rode a migração <code className="text-[#ffb21e]">20261121000000_estudar_ia.sql</code> no Supabase para ativar o Build Lab.</p>;
  const p = projects.find((x) => x.id === sel) ?? null;

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)] items-start">
      <aside>
        <div className="flex items-center justify-between mb-2"><p className="label flex items-center gap-1.5"><Ico d={HI.dumbbell} size={13} />Projetos</p>
          <button className="btn !min-h-10 inline-flex items-center gap-1.5" onClick={() => setForm("new")}><Ico d={HI.plus} size={14} />Novo</button></div>
        {projects.length === 0 ? <p className="text-sm text-white/45 border border-dashed border-white/10 p-4">Aprender construindo: crie um projeto que use o que você está estudando.</p> : (
          <ul className="divide-y divide-white/[.06] border border-white/[.06] rounded-[8px] overflow-hidden">
            {projects.map((x) => { const steps = x.steps ?? [], d = steps.filter((s) => s.done).length; return (
              <li key={x.id}><button onClick={() => setSel(x.id)} aria-current={sel === x.id} className={`w-full text-left px-3.5 py-3 ${sel === x.id ? "bg-[#140303]" : "bg-[#080808] hover:bg-[#0e0e0e]"}`}>
                <span className="block font-medium truncate">{x.title}</span>
                <span className="block text-[10.5px] font-mono text-white/45 mt-0.5">{STATUS[x.status]} · {d}/{steps.length} etapas</span>
              </button></li>); })}
          </ul>)}
      </aside>
      <div className="min-w-0">{p ? <ProjectView key={p.id} p={p} ev={evidence.filter((e) => e.project_id === p.id)} track={tracks.find((t) => t.id === p.track_id)?.title ?? null} onEdit={() => setForm(p)} /> : null}</div>
      <Sheet open={!!form} onClose={() => setForm(null)} title={form === "new" ? "Novo projeto" : "Editar projeto"}>
        {form && <ProjectForm p={form === "new" ? null : form} tracks={tracks} onDone={(id) => { setForm(null); if (id) setSel(id); }} />}
      </Sheet>
    </div>
  );
}

function ProjectView({ p, ev, track, onEdit }: { p: Project; ev: Ev[]; track: string | null; onEdit: () => void }) {
  const { gain, celebrate } = useXp();
  const [steps, setLocal] = useState<Step[]>(p.steps ?? []);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newStep, setNewStep] = useState("");
  const done = steps.filter((s) => s.done).length, last = ev[0];
  const persist = (next: Step[]) => { setLocal(next); start(async () => { const e = await setSteps(p.id, next); if (e) setError(e); }); };

  return (
    <div className="grid gap-4">
      <section className="hunt-card relative p-5">
        <span aria-hidden className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#ff2800]" style={{ boxShadow: "0 0 18px #ff2800" }} />
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="label">{STATUS[p.status]}{track ? ` · ${track}` : ""}</p>
            <h1 className="font-display text-4xl mt-1">{p.title}<span className="text-[#ffb21e]">.</span></h1>
            {p.goal && <p className="text-[14px] text-white/65 mt-2">{p.goal}</p>}
          </div>
          <button className="label !text-[10px] underline underline-offset-4 min-h-11" onClick={onEdit}>editar</button>
        </div>
        <div className="flex justify-between label !text-[9px] mt-4"><span>Etapas</span><span className="text-[#ffb21e]">{done}/{steps.length}</span></div>
        <div className="flex gap-[3px] mt-1.5" aria-hidden>{(steps.length ? steps : [{ done: false }]).map((s, i) => <i key={i} className="h-[5px] flex-1" style={{ background: s.done ? "#ff2800" : "rgba(255,255,255,.08)" }} />)}</div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Link href={`/estudos/ia?project=${p.id}&t=${encodeURIComponent(p.title)}`} className="btn btn-accent inline-flex items-center gap-2"><Ico d={HI.bolt} size={14} />Construir com IA</Link>
          <button className="btn" disabled={pending} onClick={() => start(async () => { setError(null); const r = await planProject(p.id); if (r.error) setError(r.error); else if (r.steps) setLocal(r.steps); })}>{steps.length ? "Replanejar com IA" : "Planejar etapas com IA"}</button>
        </div>
        {error && <p className="text-[12.5px] text-[#ff453a] mt-3" role="alert">{error}</p>}
      </section>

      <section className="glass p-5">
        <p className="label mb-3">Etapas e tarefas</p>
        {steps.length === 0 && <p className="text-sm text-white/45 mb-3">Sem etapas. Peça um plano à IA ou adicione abaixo.</p>}
        <ol className="grid gap-px bg-white/[.06] border border-white/[.06]">
          {steps.map((s, i) => (
            <li key={i} className="bg-[#080808] px-3 py-2.5">
              <div className="flex items-start gap-3">
                <button aria-pressed={s.done} aria-label={`Concluir ${s.title}`} onClick={() => { persist(steps.map((x, k) => k === i ? { ...x, done: !x.done } : x)); if (!s.done) gain(5, "Etapa do projeto", "#ffb21e"); }}
                  className="h-6 w-6 mt-0.5 shrink-0 grid place-items-center border" style={{ borderColor: s.done ? "#ff2800" : "rgba(255,255,255,.25)", background: s.done ? "#ff2800" : "transparent" }}>
                  {s.done && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" aria-hidden><path d="M5 12l5 5L20 7" /></svg>}</button>
                <div className="flex-1 min-w-0">
                  <p className={`text-[14.5px] ${s.done ? "text-white/45 line-through" : ""}`}>{s.title}</p>
                  {s.tasks && s.tasks.length > 0 && <ul className="mt-1 grid gap-0.5">{s.tasks.map((t, k) => <li key={k} className="text-[12.5px] text-white/50">▪ {t}</li>)}</ul>}
                </div>
                <button className="text-white/30 hover:text-[#ff453a] px-1" aria-label={`Remover ${s.title}`} onClick={() => persist(steps.filter((_, k) => k !== i))}>✕</button>
              </div>
            </li>))}
        </ol>
        <form className="flex gap-2 mt-3" onSubmit={(e) => { e.preventDefault(); if (newStep.trim()) { persist([...steps, { title: newStep.trim(), done: false }]); setNewStep(""); } }}>
          <input className="field flex-1" placeholder="Nova etapa" value={newStep} onChange={(e) => setNewStep(e.target.value)} />
          <button className="btn" disabled={!newStep.trim()}>Adicionar</button>
        </form>
      </section>

      <section className="glass p-5 grid gap-3 sm:grid-cols-2">
        {([["Conhecimentos necessários", p.skills], ["Entregáveis", p.deliverables], ["Dificuldades", p.difficulties], ["Resultado final", p.result], ["Aprendizados", p.learnings]] as const).map(([l, v]) => (
          <div key={l}><p className="label !text-[9px]">{l}</p><p className={`text-[13.5px] mt-1 whitespace-pre-line ${v ? "text-white/75" : "text-white/30"}`}>{v || "—"}</p></div>))}
      </section>

      <section className="hunt-card p-5">
        <p className="label mb-2">Avaliação prática</p>
        {last ? (
          <>
            <p className="font-semibold" style={{ color: MASTERY[masteryFromLevel(last.level)].color }}>{MASTERY[masteryFromLevel(last.level)].label} · nível {last.level}/5{last.score != null ? ` · ${last.score}/100` : ""}</p>
            {last.justification && <p className="text-[13px] text-white/65 whitespace-pre-line mt-2">{last.justification}</p>}
          </>) : <p className="text-[13px] text-white/50">Preencha o resultado final e os aprendizados, depois peça a avaliação. Ela vira evidência de domínio e XP.</p>}
        <button className="btn w-full mt-3" disabled={pending || (!p.result && !p.learnings)} onClick={() => start(async () => { setError(null); const r = await evaluateProject(p.id); if (r.error) setError(r.error); else if (r.result) { gain(20 + r.result.level * 8, "Projeto avaliado", "#ffb21e"); if (r.result.level >= 4) celebrate("Projeto aprovado", `Nível ${r.result.level}/5`); } })}>Avaliar projeto com IA</button>
      </section>
    </div>
  );
}

function ProjectForm({ p, tracks, onDone }: { p: Project | null; tracks: { id: string; title: string }[]; onDone: (id?: string) => void }) {
  const [f, setF] = useState({ title: p?.title ?? "", goal: p?.goal ?? "", skills: p?.skills ?? "", deliverables: p?.deliverables ?? "", difficulties: p?.difficulties ?? "", result: p?.result ?? "", learnings: p?.learnings ?? "", track_id: p?.track_id ?? "", status: p?.status ?? "planejando" });
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const area = (k: keyof typeof f, l: string, ph: string) => <label className="grid gap-1"><span className="label !text-[9px]">{l}</span><textarea className="field !min-h-20 py-2" placeholder={ph} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></label>;
  return (
    <div className="grid gap-3">
      <label className="grid gap-1"><span className="label !text-[9px]">Nome</span><input className="field font-semibold" placeholder="Ex.: API de tarefas com testes" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
      {area("goal", "Objetivo", "O que este projeto prova que você sabe fazer?")}
      {area("skills", "Conhecimentos necessários", "Ex.: HTTP, SQL, testes")}
      {area("deliverables", "Entregáveis", "Ex.: repositório, demo, relatório")}
      <div className="grid grid-cols-2 gap-2">
        <select className="field" value={f.track_id} onChange={(e) => setF({ ...f, track_id: e.target.value })} aria-label="Trilha"><option value="">Sem trilha</option>{tracks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select>
        <select className="field" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} aria-label="Situação">{Object.entries(STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      </div>
      {p && <>{area("difficulties", "Dificuldades encontradas", "")}{area("result", "Resultado final", "")}{area("learnings", "Aprendizados", "")}</>}
      {error && <p className="text-[12.5px] text-[#ff453a]" role="alert">{error}</p>}
      <div className="flex gap-2">
        {p && <button className="btn text-white/60" disabled={pending} onClick={() => { if (confirm("Apagar projeto?")) start(async () => { const e = await deleteProject(p.id); if (e) setError(e); else onDone(); }); }}>Apagar</button>}
        <button className="btn btn-accent flex-1" disabled={pending || !f.title.trim()} onClick={() => start(async () => { const r = await saveProject({ ...f, track_id: f.track_id || null, status: f.status as never }, p?.id); if (r.error) setError(r.error); else onDone(r.id); })}>Salvar</button>
      </div>
    </div>
  );
}
