"use client";
import { useXp } from "@/components/game/xp";
import { Sheet } from "@/components/kit";
import { JourneyCard, JourneyHero, goalInput, goalNumber, goalPercent } from "./journey";
import { useState, useTransition } from "react";
import { deleteGoal, deleteObjective, saveGoal, saveObjective, setGoalCurrent } from "@/app/(app)/metas/actions";
import { AREAS, AUTO, goalMilestones, goalStats, parseGoalValue, type AreaKey, type GoalRow } from "@/lib/goals";

type Objective = { id: string; title: string; area: AreaKey; description: string | null };
type Box = { id: string; name: string };

function GoalProgress({ goal, today, onDone }: { goal: GoalRow; today: string; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [input, setInput] = useState(goalInput(goal.current));
  const [error, setError] = useState(false);
  const { celebrate } = useXp();
  const value = parseGoalValue(input);
  const preview = value == null ? null : goalStats({ ...goal, current: value }, today).pct;

  function save() {
    if (value == null || value === goal.current || pending) return;
    setError(false);
    start(async () => {
      try {
        const result = await setGoalCurrent(goal.id, value);
        if (!result.ok) {
          setError(true);
          return;
        }
        const before = goalMilestones(goal, today);
        const reached = goalMilestones({ ...goal, current: result.current }, today)
          .findLast((milestone, index) => milestone.reached && !before[index].reached);
        onDone();
        if (reached) celebrate(reached.title, `${goal.title} · ${reached.pct * 100}%`);
      } catch {
        setError(true);
      }
    });
  }

  return (
    <form onSubmit={(event) => { event.preventDefault(); save(); }} className="grid gap-3">
      <label className="grid gap-1">
        <span className="text-sm text-white/75">Valor atual{goal.unit ? ` (${goal.unit})` : ""}</span>
        <input className="field num" inputMode="decimal" value={input} onChange={(event) => setInput(event.target.value)} autoFocus />
      </label>
      <p className="text-sm text-white/75">Alvo: {goalNumber(goal.target)} {goal.unit}{preview != null && ` · Progresso após salvar: ${goalPercent(preview)}%`}</p>
      {error && <p role="alert" className="text-sm text-[#ffad96]">Não foi possível salvar o progresso. Tente novamente.</p>}
      <button type="submit" className="btn btn-accent" disabled={pending || value == null || value === goal.current}>{pending ? "Salvando…" : "Salvar progresso"}</button>
    </form>
  );
}

function GoalForm({ goal, objectives, boxes, onDone }: { goal?: GoalRow; objectives: Objective[]; boxes: Box[]; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [f, setF] = useState({
    title: goal?.title ?? "", area: (goal?.area ?? "pessoal") as AreaKey, unit: goal?.unit ?? "",
    start_value: goalInput(goal?.start_value ?? 0), target: goal ? goalInput(goal.target) : "", current: goalInput(goal?.current ?? 0),
    deadline: goal?.deadline ?? "", objective_id: goal?.objective_id ?? "", featured: goal?.featured ?? false,
    auto_source: goal?.auto_source ?? "", auto_ref: goal?.auto_ref ?? "",
  });
  const set = (p: Partial<typeof f>) => setF({ ...f, ...p });
  const target = parseGoalValue(f.target);
  const startValue = parseGoalValue(f.start_value || "0");
  const current = parseGoalValue(f.current);
  const save = () => start(async () => {
    if (target == null || startValue == null || current == null) return;
    await saveGoal({
      title: f.title, area: f.area, unit: f.auto_source ? AUTO[f.auto_source as keyof typeof AUTO].unit : f.unit,
      start_value: startValue, target, current,
      deadline: f.deadline || null, objective_id: f.objective_id || null, featured: f.featured,
      auto_source: (f.auto_source || null) as GoalRow["auto_source"], auto_ref: f.auto_source === "savings_box" && f.auto_ref ? f.auto_ref : null,
    }, goal?.id);
    onDone();
  });
  return (
    <div className="grid gap-2 rounded-[8px] border border-white/10 p-4">
      <input className="field" placeholder="Meta (ex.: Ler a Bíblia inteira)" value={f.title} onChange={(e) => set({ title: e.target.value })} />
      <div className="flex flex-wrap gap-2">
        {(Object.keys(AREAS) as AreaKey[]).map((a) => <button key={a} className="chip" aria-pressed={f.area === a} onClick={() => set({ area: a })}
          style={f.area === a ? { background: AREAS[a].color } : undefined}>{AREAS[a].label}</button>)}
      </div>
      <label className="grid gap-1"><span className="label">Valor automático (opcional)</span>
        <select className="field" value={f.auto_source} onChange={(e) => set({ auto_source: e.target.value })}>
          <option value="">Manual</option>
          {(Object.keys(AUTO) as (keyof typeof AUTO)[]).map((k) => <option key={k} value={k}>{AUTO[k].label}</option>)}
        </select></label>
      {f.auto_source === "savings_box" && boxes.length > 0 && (
        <select className="field" value={f.auto_ref} onChange={(e) => set({ auto_ref: e.target.value })} aria-label="Caixinha">
          <option value="">Escolha a caixinha</option>{boxes.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      )}
      <div className="grid grid-cols-3 gap-2">
        <label className="grid gap-1"><span className="label">Início</span><input className="field num" inputMode="decimal" value={f.start_value} onChange={(e) => set({ start_value: e.target.value })} /></label>
        <label className="grid gap-1"><span className="label">Alvo</span><input className="field num" inputMode="decimal" value={f.target} onChange={(e) => set({ target: e.target.value })} /></label>
        {!f.auto_source
          ? <label className="grid gap-1"><span className="label">Unidade</span><input className="field" placeholder="R$, kg, h…" value={f.unit} onChange={(e) => set({ unit: e.target.value })} /></label>
          : <span />}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1"><span className="label">Prazo</span><input type="date" className="field" value={f.deadline} onChange={(e) => set({ deadline: e.target.value })} /></label>
        {objectives.length > 0 && (
          <label className="grid gap-1"><span className="label">Objetivo</span>
            <select className="field" value={f.objective_id} onChange={(e) => set({ objective_id: e.target.value })}>
              <option value="">Nenhum</option>{objectives.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
            </select></label>
        )}
      </div>
      <label className="flex items-center gap-3 min-h-11"><input type="checkbox" className="h-5 w-5 accent-[#ff9f0a]" checked={f.featured} onChange={(e) => set({ featured: e.target.checked })} /> Meta principal (aparece no Início)</label>
      <div className="flex gap-2 justify-end">
        {goal && <button className="btn text-muted" onClick={() => { if (confirm("Excluir meta?")) start(async () => { await deleteGoal(goal.id); onDone(); }); }}>Excluir</button>}
        <button className="btn" onClick={onDone}>Cancelar</button>
        <button className="btn btn-accent" disabled={pending || !f.title.trim() || target == null || startValue == null || current == null} onClick={save}>Salvar</button>
      </div>
    </div>
  );
}

function ObjectiveForm({ obj, onDone }: { obj?: Objective; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [f, setF] = useState({ title: obj?.title ?? "", area: (obj?.area ?? "espiritual") as AreaKey, description: obj?.description ?? "" });
  return (
    <div className="grid gap-2">
      <input className="field" placeholder="Objetivo (o destino)" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <div className="flex flex-wrap gap-2">
        {(Object.keys(AREAS) as AreaKey[]).map((a) => <button key={a} className="chip" aria-pressed={f.area === a} onClick={() => setF({ ...f, area: a })}
          style={f.area === a ? { background: AREAS[a].color } : undefined}>{AREAS[a].label}</button>)}
      </div>
      <textarea className="field" placeholder="Por que isso importa?" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
      <div className="flex gap-2 justify-end">
        {obj && <button className="btn text-muted" onClick={() => { if (confirm("Excluir objetivo? As metas ficam, sem vínculo.")) start(async () => { await deleteObjective(obj.id); onDone(); }); }}>Excluir</button>}
        <button className="btn" onClick={onDone}>Cancelar</button>
        <button className="btn btn-accent" disabled={pending || !f.title} onClick={() => start(async () => { await saveObjective(f, obj?.id); onDone(); })}>Salvar</button>
      </div>
    </div>
  );
}

type Editor =
  | { kind: "goal"; goal?: GoalRow }
  | { kind: "objective"; objective?: Objective }
  | { kind: "progress"; goal: GoalRow };

export function Goals({ today, objectives, goals, boxes }: { today: string; objectives: Objective[]; goals: GoalRow[]; boxes: Box[] }) {
  const [area, setArea] = useState<AreaKey | "">("");
  const [horizon, setHorizon] = useState("");
  const [status, setStatus] = useState("todas");
  const [editor, setEditor] = useState<Editor | null>(null);

  const filtered = !!area || !!horizon || status !== "todas";
  const visible = goals.filter((goal) => {
    const stats = goalStats(goal, today);
    return (!area || goal.area === area) && (!horizon || stats.horizon === horizon)
      && (status === "todas" || (status === "conquistadas" ? stats.pct >= 1 : stats.pct < 1));
  });
  const groups = [
    ...objectives.map((objective) => ({ objective, list: visible.filter((goal) => goal.objective_id === objective.id) })),
    { objective: null, list: visible.filter((goal) => !objectives.some((o) => o.id === goal.objective_id)) },
  ];
  const close = () => setEditor(null);
  const title = editor?.kind === "progress" ? `Progresso · ${editor.goal.title}`
    : editor?.kind === "goal" ? (editor.goal ? "Editar meta" : "Nova meta")
    : editor?.objective ? "Editar objetivo" : "Novo objetivo";

  return (
    <div className="grid gap-7">
      <JourneyHero goals={goals} today={today} onCreate={() => setEditor({ kind: "goal" })} />
      <section id="jornadas" className="scroll-mt-6" aria-labelledby="journey-list-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="journey-list-title" className="text-3xl font-semibold tracking-tight">Minhas jornadas</h2>
          <button type="button" className="btn" onClick={() => setEditor({ kind: "objective" })}>+ Objetivo</button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar pelo estado da meta">
          {[["todas", "Todas"], ["andamento", "Em andamento"], ["conquistadas", "Conquistadas"]].map(([id, label]) => (
            <button key={id} type="button" className="chip" aria-pressed={status === id} onClick={() => setStatus(id)}>{label}</button>
          ))}
          <select className="field !min-h-10 !w-auto min-w-0" aria-label="Área" value={area} onChange={(event) => setArea(event.target.value as AreaKey | "")}>
            <option value="">Todas as áreas</option>
            {(Object.keys(AREAS) as AreaKey[]).map((key) => <option key={key} value={key}>{AREAS[key].label}</option>)}
          </select>
          <select className="field !min-h-10 !w-auto min-w-0" aria-label="Prazo" value={horizon} onChange={(event) => setHorizon(event.target.value)}>
            <option value="">Qualquer prazo</option><option value="curto">Curto (até 90 dias)</option><option value="medio">Médio (até 1 ano)</option><option value="longo">Longo ou sem prazo</option>
          </select>
        </div>
        <div className="mt-6 grid gap-6">
          {groups.map(({ objective, list }) => (list.length > 0 || (objective && !filtered)) && (
            <section key={objective?.id ?? "avulsas"} className="min-w-0">
              {objective ? (
                <div className="mb-3 flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-4">
                  <div className="min-w-0">
                    <p className="text-xs text-[#ffcf81]">Objetivo · {AREAS[objective.area].label}</p>
                    <h3 className="mt-1 break-words text-xl font-semibold">{objective.title}</h3>
                    {objective.description && <p className="mt-1 break-words text-sm text-white/70">{objective.description}</p>}
                  </div>
                  <button type="button" className="btn !min-h-10 !px-3 text-xs" onClick={() => setEditor({ kind: "objective", objective })} aria-label={`Editar objetivo ${objective.title}`}>Editar</button>
                </div>
              ) : objectives.length > 0 && <h3 className="mb-3 text-lg font-semibold">Metas avulsas</h3>}
              {list.length ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  {list.map((goal) => <JourneyCard key={goal.id} goal={goal} today={today}
                    onEdit={() => setEditor({ kind: "goal", goal })} onProgress={() => setEditor({ kind: "progress", goal })} />)}
                </div>
              ) : <p className="text-sm text-white/65">Nenhuma meta ligada a este objetivo ainda.</p>}
            </section>
          ))}
          {!visible.length && (filtered || (!goals.length && !objectives.length)) && (
            <div className="rounded-2xl border border-dashed border-white/20 bg-white/[.035] p-6">
              <p className="text-lg font-semibold">{filtered ? "Nenhuma meta com esses filtros" : "Qual é seu primeiro destino?"}</p>
              <button type="button" className="btn mt-3" onClick={() => {
                if (filtered) { setArea(""); setHorizon(""); setStatus("todas"); }
                else setEditor({ kind: "goal" });
              }}>{filtered ? "Limpar filtros" : "Criar primeira meta"}</button>
            </div>
          )}
        </div>
      </section>
      <Sheet open={!!editor} onClose={close} title={title}>
        {editor?.kind === "goal" && <GoalForm goal={editor.goal} objectives={objectives} boxes={boxes} onDone={close} />}
        {editor?.kind === "objective" && <ObjectiveForm obj={editor.objective} onDone={close} />}
        {editor?.kind === "progress" && <GoalProgress goal={editor.goal} today={today} onDone={close} />}
      </Sheet>
    </div>
  );
}
