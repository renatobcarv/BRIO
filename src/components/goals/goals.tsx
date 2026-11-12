"use client";
import { Trophy } from "@/components/meters";
import { useState, useTransition } from "react";
import { deleteGoal, deleteObjective, saveGoal, saveObjective, setGoalCurrent } from "@/app/(app)/metas/actions";
import { Card, Empty } from "@/components/ui";
import { AREAS, AUTO, goalStats, type AreaKey, type GoalRow } from "@/lib/goals";

const ACC = "#bf5af2";
type Objective = { id: string; title: string; area: AreaKey; description: string | null };
const fmt = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
const num = (s: string) => Number(s.replace(",", ".")) || 0;

function GoalCard({ g, today, objectives, boxes }: { g: GoalRow; today: string; objectives: Objective[]; boxes: { id: string; name: string }[] }) {
  const [pending, start] = useTransition();
  const [cur, setCur] = useState(fmt(g.current));
  const [editing, setEditing] = useState(false);
  const s = goalStats(g, today), color = AREAS[g.area].color;
  if (editing) return <GoalForm goal={g} onDone={() => setEditing(false)} objectives={objectives} boxes={boxes} />;
  return (
    <div className="rounded-2xl border border-white/[.06] p-4" style={{ ["--accent" as string]: color }}>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <p className="label" style={{ color }}>{AREAS[g.area].label}{g.featured ? " · destaque" : ""}{g.auto_source ? " · automática" : ""}</p>
          <p className="font-display text-lg leading-snug mt-1">{g.title}</p>
        </div>
        <button className="btn !min-h-9 !px-3 text-muted text-xs" onClick={() => setEditing(true)}>Editar</button>
      </div>
      <div className="flex items-center gap-3 mt-3"><Trophy pct={s.pct} size={34} color={color} /><div className="bar flex-1"><i style={{ width: `${s.pct * 100}%` }} /></div></div>
      <div className="flex justify-between text-sm mt-1">
        <span className="num">{Math.round(s.pct * 100)}% · {fmt(g.current)} / {fmt(g.target)} {g.unit}</span>
        {s.left > 0 && <span className="text-muted">faltam {fmt(s.left)} {g.unit}</span>}
      </div>
      {g.deadline && (
        <p className="text-xs mt-2" style={{ color: s.late ? "#ff453a" : "#9a978f" }}>
          {s.daysLeft! >= 0 ? `${s.daysLeft} dias até o prazo` : `prazo vencido há ${-s.daysLeft!} dias`}
          {s.perWeek != null && s.left > 0 && ` · ritmo: ${fmt(s.perWeek)} ${g.unit}/semana (${fmt(s.perMonth!)}/mês)`}
          {s.late && " · atrasada"}
        </p>
      )}
      {!g.auto_source && (
        <div className="flex gap-2 mt-3">
          <input className="field !min-h-10 !w-28 num" inputMode="decimal" value={cur} onChange={(e) => setCur(e.target.value)} aria-label="Valor atual" />
          <button className="btn !min-h-10" disabled={pending} onClick={() => start(() => setGoalCurrent(g.id, num(cur)))}>Atualizar</button>
        </div>
      )}
    </div>
  );
}

function GoalForm({ goal, objectives, boxes, onDone }: { goal?: GoalRow; objectives: Objective[]; boxes: { id: string; name: string }[]; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [f, setF] = useState({
    title: goal?.title ?? "", area: (goal?.area ?? "pessoal") as AreaKey, unit: goal?.unit ?? "",
    start_value: fmt(goal?.start_value ?? 0), target: goal ? fmt(goal.target) : "", current: fmt(goal?.current ?? 0),
    deadline: goal?.deadline ?? "", objective_id: goal?.objective_id ?? "", featured: goal?.featured ?? false,
    auto_source: goal?.auto_source ?? "", auto_ref: goal?.auto_ref ?? "",
  });
  const set = (p: Partial<typeof f>) => setF({ ...f, ...p });
  const save = () => start(async () => {
    await saveGoal({
      title: f.title, area: f.area, unit: f.auto_source ? AUTO[f.auto_source as keyof typeof AUTO].unit : f.unit,
      start_value: num(f.start_value), target: num(f.target), current: num(f.current),
      deadline: f.deadline || null, objective_id: f.objective_id || null, featured: f.featured,
      auto_source: (f.auto_source || null) as GoalRow["auto_source"], auto_ref: f.auto_source === "savings_box" && f.auto_ref ? f.auto_ref : null,
    }, goal?.id);
    onDone();
  });
  return (
    <div className="grid gap-2 rounded-2xl border border-white/10 p-4">
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
      <label className="flex items-center gap-3 min-h-11"><input type="checkbox" className="h-5 w-5 accent-[#bf5af2]" checked={f.featured} onChange={(e) => set({ featured: e.target.checked })} /> Meta principal (aparece no Início)</label>
      <div className="flex gap-2 justify-end">
        {goal && <button className="btn text-muted" onClick={() => { if (confirm("Excluir meta?")) start(async () => { await deleteGoal(goal.id); onDone(); }); }}>Excluir</button>}
        <button className="btn" onClick={onDone}>Cancelar</button>
        <button className="btn btn-accent" disabled={pending || !f.title || !f.target} onClick={save}>Salvar</button>
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

export function Goals({ today, objectives, goals, boxes }: { today: string; objectives: Objective[]; goals: GoalRow[]; boxes: { id: string; name: string }[] }) {
  const [area, setArea] = useState<AreaKey | "">("");
  const [hz, setHz] = useState("");
  const [newGoal, setNewGoal] = useState(false);
  const [newObj, setNewObj] = useState(false);
  const [editObj, setEditObj] = useState<string | null>(null);

  const visible = goals.filter((g) => (!area || g.area === area) && (!hz || goalStats(g, today).horizon === hz));
  const groups = [...objectives.map((o) => ({ o, list: visible.filter((g) => g.objective_id === o.id) })),
    { o: null as Objective | null, list: visible.filter((g) => !g.objective_id || !objectives.some((o) => o.id === g.objective_id)) }];

  return (
    <div style={{ ["--accent" as string]: ACC }}>
      <div className="flex flex-wrap gap-2 rise">
        <button className="chip" aria-pressed={!area} onClick={() => setArea("")}>Todas</button>
        {(Object.keys(AREAS) as AreaKey[]).map((a) => <button key={a} className="chip" aria-pressed={area === a} onClick={() => setArea(area === a ? "" : a)}>{AREAS[a].label}</button>)}
      </div>
      <div className="flex flex-wrap gap-2 mt-2 rise">
        {[["", "Qualquer prazo"], ["curto", "Curto (≤3m)"], ["medio", "Médio (≤12m)"], ["longo", "Longo"]].map(([k, l]) =>
          <button key={k} className="chip" aria-pressed={hz === k} onClick={() => setHz(k)}>{l}</button>)}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        <button className="btn btn-accent" onClick={() => setNewGoal(true)}>+ Meta</button>
        <button className="btn" onClick={() => setNewObj(true)}>+ Objetivo</button>
      </div>
      {newObj && <Card className="mt-4"><ObjectiveForm onDone={() => setNewObj(false)} /></Card>}
      {newGoal && <Card className="mt-4"><GoalForm objectives={objectives} boxes={boxes} onDone={() => setNewGoal(false)} /></Card>}

      {groups.map(({ o, list }) => (o || list.length > 0) && (
        <Card key={o?.id ?? "solta"} className="mt-4">
          {o ? (editObj === o.id ? <ObjectiveForm obj={o} onDone={() => setEditObj(null)} /> : (
            <button className="text-left w-full" onClick={() => setEditObj(o.id)}>
              <p className="label" style={{ color: AREAS[o.area].color }}>Objetivo · {AREAS[o.area].label}</p>
              <p className="font-display italic text-2xl mt-1 leading-snug">{o.title}</p>
              {o.description && <p className="text-sm text-muted mt-1">{o.description}</p>}
            </button>
          )) : <p className="label">Metas avulsas</p>}
          <div className="grid gap-3 mt-4">
            {list.length === 0 ? <p className="font-display italic text-muted">Nenhuma meta ligada a este objetivo ainda.</p>
              : list.map((g) => <GoalCard key={g.id + g.current} g={g} today={today} objectives={objectives} boxes={boxes} />)}
          </div>
        </Card>
      ))}
      {goals.length === 0 && objectives.length === 0 && <Card className="mt-4"><Empty>Um destino claro torna os passos possíveis.</Empty></Card>}
    </div>
  );
}
