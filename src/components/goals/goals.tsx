"use client";
import { Trophy } from "@/components/meters";
import { useState, useTransition } from "react";
import { deleteGoal, deleteObjective, saveGoal, saveObjective, setGoalCurrent } from "@/app/(app)/metas/actions";
import { Card, Empty } from "@/components/ui";
import { AREAS, AUTO, goalStats, goalsXp, MILESTONES, MILESTONE_NAME, type AreaKey, type GoalRow } from "@/lib/goals";

const ACC = "#ff9f0a";
type Objective = { id: string; title: string; area: AreaKey; description: string | null };
const fmt = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
const num = (s: string) => Number(s.replace(",", ".")) || 0;

function GoalCard({ g, today, objectives, boxes }: { g: GoalRow; today: string; objectives: Objective[]; boxes: { id: string; name: string }[] }) {
  const [pending, start] = useTransition();
  const [cur, setCur] = useState(fmt(g.current));
  const [editing, setEditing] = useState(false);
  const s = goalStats(g, today), color = AREAS[g.area].color;
  if (editing) return <GoalForm goal={g} onDone={() => setEditing(false)} objectives={objectives} boxes={boxes} />;
  const pct = Math.round(s.pct * 100), done = s.pct >= 1;
  const nextM = MILESTONES.find((t) => s.pct < t), nextLeft = nextM != null ? Math.abs(g.start_value + (g.target - g.start_value) * nextM - g.current) : 0;
  const status = done ? { t: "Conquistada", c: "#30d158" } : s.late ? { t: "Atrasada", c: "#ff453a" } : g.deadline ? { t: "No ritmo", c: "#ffb21e" } : { t: "Sem prazo", c: "#8e8e93" };
  const R = 30, C = 2 * Math.PI * R;
  return (
    <div className={`relative rounded-[18px] p-4 overflow-hidden ${done ? "border border-[#30d15855]" : "border border-white/[.06]"} bg-[#0f0f11]`} style={{ ["--accent" as string]: color }}>
      {done && <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(60% 60% at 90% 0%, rgba(48,209,88,.15), transparent 70%)" }} />}
      <div className="relative flex items-start gap-4">
        <span className="relative grid place-items-center shrink-0" style={{ width: 76, height: 76 }}>
          <svg width="76" height="76" className="-rotate-90 absolute inset-0" aria-hidden>
            <circle cx="38" cy="38" r={R} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6" />
            <circle cx="38" cy="38" r={R} fill="none" stroke={done ? "#30d158" : color} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${C * s.pct} ${C}`} style={{ transition: "stroke-dasharray .8s ease" }} />
          </svg>
          {done ? <Trophy pct={1} size={30} color="#30d158" /> : <span className="text-[17px] font-bold">{pct}%</span>}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] rounded-full px-2 py-0.5" style={{ background: `${color}22`, color }}>{AREAS[g.area].label}</span>
            <span className="text-[11px] rounded-full px-2 py-0.5" style={{ background: `${status.c}1f`, color: status.c }}>{status.t}</span>
            {g.featured && <span className="text-[11px] rounded-full px-2 py-0.5 bg-[#ffb21e1f] text-[#ffb21e]">★ Principal</span>}
          </div>
          <p className="text-[17px] font-semibold leading-snug mt-1.5">{g.title}</p>
          <p className="text-[13px] text-white/55 mt-0.5">{fmt(g.current)} de {fmt(g.target)} {g.unit}{s.left > 0 ? ` · faltam ${fmt(s.left)}` : ""}</p>
        </div>
        <button className="text-[12px] text-white/45 hover:text-white min-h-9 shrink-0" onClick={() => setEditing(true)}>Editar</button>
      </div>
      {/* Marcos */}
      <div className="relative grid grid-cols-4 gap-1.5 mt-4">
        {MILESTONES.map((t, i) => { const on = s.pct >= t; return (
          <div key={t} className="rounded-[10px] px-2 py-2 text-center" style={{ background: on ? `${done ? "#30d158" : color}1f` : "rgba(255,255,255,.03)", border: `1px solid ${on ? (done ? "#30d158" : color) + "55" : "rgba(255,255,255,.05)"}` }}>
            <p className="text-[13px] font-bold" style={{ color: on ? (done ? "#30d158" : color) : "rgba(255,255,255,.35)" }}>{on ? "✓ " : ""}{Math.round(t * 100)}%</p>
            <p className="text-[9.5px] text-white/45 leading-tight">{MILESTONE_NAME[i]}</p>
          </div>); })}
      </div>
      {!done && nextM != null && <p className="relative text-[12.5px] mt-3" style={{ color }}>Próximo marco ({Math.round(nextM * 100)}%): faltam {fmt(nextLeft)} {g.unit} · +100 XP</p>}
      {g.deadline && !done && (
        <p className="relative text-[12px] mt-1" style={{ color: s.late ? "#ff453a" : "rgba(255,255,255,.5)" }}>
          {s.daysLeft! >= 0 ? `${s.daysLeft} dias até o prazo` : `prazo vencido há ${-s.daysLeft!} dias`}
          {s.perWeek != null && s.left > 0 && ` · ${fmt(s.perWeek)} ${g.unit}/semana para chegar`}
        </p>)}
      {!g.auto_source && !done && (
        <div className="relative flex flex-wrap gap-2 mt-3">
          <input className="field !min-h-10 !w-28 num" inputMode="decimal" value={cur} onChange={(e) => setCur(e.target.value)} aria-label="Valor atual" />
          <button className="btn !min-h-10" disabled={pending} onClick={() => start(() => setGoalCurrent(g.id, num(cur)))}>Atualizar</button>
          <button className="btn !min-h-10" disabled={pending} onClick={() => { const v = g.current + Math.sign(g.target - g.start_value || 1) * (Math.abs(g.target - g.start_value) >= 20 ? Math.round(Math.abs(g.target - g.start_value) / 20) : 1); setCur(fmt(v)); start(() => setGoalCurrent(g.id, v)); }}>+ avançar</button>
        </div>)}
    </div>
  );
}

/** Arena: nível de metas, marcos, troféus e progresso por área. */
function GoalsArena({ goals, today }: { goals: GoalRow[]; today: string }) {
  const x = goalsXp(goals, today);
  const main = goals.find((g) => g.featured && goalStats(g, today).pct < 1) ?? goals.filter((g) => goalStats(g, today).pct < 1).sort((a, b) => goalStats(b, today).pct - goalStats(a, today).pct)[0];
  const done = goals.filter((g) => goalStats(g, today).pct >= 1);
  const areas = (Object.keys(AREAS) as AreaKey[]).map((a) => { const l = goals.filter((g) => g.area === a); return { a, n: l.length, avg: l.length ? l.reduce((t, g) => t + goalStats(g, today).pct, 0) / l.length : 0 }; }).filter((z) => z.n);
  return (
    <section className="grid gap-4 mb-5">
      <div className="hunt-card p-6 relative overflow-hidden">
        <div aria-hidden className="absolute -right-12 -top-12 h-56 w-56 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,178,30,.18), transparent 70%)" }} />
        <div className="relative flex flex-wrap items-end gap-6">
          <div>
            <p className="label">Nível de metas</p>
            <p className="text-[64px] font-bold leading-none mt-1">{x.level}<span className="text-[18px] text-white/45 ml-2">{x.title}</span></p>
            <div className="h-2 w-64 max-w-full rounded-full bg-white/10 mt-3 overflow-hidden"><i className="block h-full rounded-full bg-[#ffb21e]" style={{ width: `${x.progress * 100}%` }} /></div>
            <p className="text-[12px] text-white/50 mt-1.5">{x.xp.toLocaleString("pt-BR")} XP · {x.toNext.toLocaleString("pt-BR")} para o nível {x.level + 1}</p>
          </div>
          <div className="grid grid-cols-4 gap-2 flex-1 min-w-[260px]">
            {[["Ativas", goals.length - done.length, "#f5f5f7"], ["Marcos", x.marks, "#ffb21e"], ["Troféus", x.done, "#30d158"], ["Atrasadas", x.late, x.late ? "#ff453a" : "#8e8e93"]].map(([l, v, c]) => (
              <div key={String(l)} className="rounded-[14px] bg-white/[.04] py-3 text-center"><p className="text-[26px] font-bold" style={{ color: String(c) }}>{v}</p><p className="text-[11px] text-white/45">{l}</p></div>))}
          </div>
        </div>
      </div>

      {main && (() => { const s = goalStats(main, today), c = AREAS[main.area].color; return (
        <div className="rounded-[22px] p-6 border relative overflow-hidden" style={{ borderColor: `${c}44`, background: `radial-gradient(80% 120% at 0% 0%, ${c}22, transparent 60%), #0b0b0c` }}>
          <p className="text-[12px] uppercase tracking-[.25em]" style={{ color: c }}>★ Missão principal</p>
          <p className="text-[28px] font-bold leading-tight mt-2">{main.title}</p>
          <div className="h-3 rounded-full bg-white/10 mt-4 overflow-hidden relative">
            <i className="block h-full rounded-full" style={{ width: `${s.pct * 100}%`, background: c }} />
            {MILESTONES.slice(0, 3).map((t) => <span key={t} className="absolute top-0 bottom-0 w-px bg-black/60" style={{ left: `${t * 100}%` }} />)}
          </div>
          <p className="text-[13px] text-white/60 mt-2">{Math.round(s.pct * 100)}% · {fmt(main.current)} de {fmt(main.target)} {main.unit}{s.daysLeft != null ? ` · ${s.daysLeft >= 0 ? `${s.daysLeft} dias restantes` : "prazo vencido"}` : ""}</p>
        </div>); })()}

      {areas.length > 0 && (
        <div className="hunt-card p-5">
          <p className="label mb-3">Progresso por área</p>
          <div className="grid gap-3">{areas.map(({ a, n, avg }) => (
            <div key={a} className="flex items-center gap-3">
              <span className="w-24 text-[13px]" style={{ color: AREAS[a].color }}>{AREAS[a].label}</span>
              <div className="flex-1 h-2.5 rounded-full bg-white/10 overflow-hidden"><i className="block h-full rounded-full" style={{ width: `${avg * 100}%`, background: AREAS[a].color }} /></div>
              <span className="text-[12px] text-white/55 w-20 text-right">{Math.round(avg * 100)}% · {n}</span>
            </div>))}</div>
        </div>)}

      {done.length > 0 && (
        <div className="hunt-card p-5">
          <p className="label mb-3">Estante de troféus · {done.length}</p>
          <div className="flex gap-3 overflow-x-auto pb-1">{done.map((g) => (
            <div key={g.id} className="shrink-0 w-32 rounded-[16px] p-3 text-center border border-[#30d15844] bg-[#30d1580d]">
              <div className="grid place-items-center"><Trophy pct={1} size={40} color="#30d158" /></div>
              <p className="text-[12px] font-semibold mt-2 line-clamp-2">{g.title}</p>
              <p className="text-[10.5px] text-white/45 mt-0.5">{AREAS[g.area].label}</p>
            </div>))}</div>
        </div>)}
    </section>
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
    <div className="span-all" style={{ ["--accent" as string]: ACC }}>
      <GoalsArena goals={goals} today={today} />
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
          <div className="grid lg:grid-cols-2 gap-3 mt-4">
            {list.length === 0 ? <p className="font-display italic text-muted">Nenhuma meta ligada a este objetivo ainda.</p>
              : list.map((g) => <GoalCard key={g.id + g.current} g={g} today={today} objectives={objectives} boxes={boxes} />)}
          </div>
        </Card>
      ))}
      {goals.length === 0 && objectives.length === 0 && <Card className="mt-4"><Empty>Um destino claro torna os passos possíveis.</Empty></Card>}
    </div>
  );
}
