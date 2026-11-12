"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { saveProgram } from "@/app/(app)/corpo/program-actions";
import { Sheet } from "@/components/kit";
import { haptic } from "@/components/game/xp";
import { shortDate, weekdayShort } from "@/lib/date";
import { GOALS, MUSCLES, PHASE_KINDS, dayTitle, guessMuscle, newPhaseId, phaseRanges, plannedSetsByMuscle, programPosition, totalWeeks,
  type Goal, type Muscle, type Phase, type PhaseKind, type PlannedEx, type Program } from "@/lib/training";
import { LIBRARY, fromLibrary } from "./program";

const R = "#e0393e";
const DAYS = ["1", "2", "3", "4", "5", "6", "0"];
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

/** Construtor de programa: tudo na mesma tela, salvando sozinho. */
export function ProgramBuilder({ program, today, overrides }: { program: Program; today: string; overrides: Record<string, Muscle> }) {
  const [p, setP] = useState<Program>(() => clone(program));
  const pos = programPosition(p, today);
  const [ph, setPh] = useState(Math.max(0, pos.phaseIndex));
  const [day, setDay] = useState(() => { const d = new Date(today + "T12:00:00Z").getUTCDay(); return String(d); });
  const [status, setStatus] = useState<"" | "salvando" | "salvo" | "erro">("");
  const [lib, setLib] = useState(false);
  const [copyDay, setCopyDay] = useState(false);
  const [settings, setSettings] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const first = useRef(true);

  // Salva sozinho, 800 ms depois da última mudança
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setStatus("salvando"); clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try { await saveProgram({ name: p.name, goal: p.goal, start_date: p.start_date, phases: p.phases.map((f) => ({ ...f, days: Object.fromEntries(Object.entries(f.days).map(([d, l]) => [d, l.filter((e) => e.name.trim())])) })), notes: p.notes || null }, p.id); setStatus("salvo"); }
      catch { setStatus("erro"); }
    }, 800);
    return () => clearTimeout(timer.current);
  }, [p]);

  const phase = p.phases[Math.min(ph, p.phases.length - 1)];
  const list = phase.days[day] ?? [];
  const ranges = phaseRanges(p);
  const vol = useMemo(() => plannedSetsByMuscle(phase), [phase]);
  const setPhase = (patch: Partial<Phase>) => setP((x) => ({ ...x, phases: x.phases.map((f, i) => (i === ph ? { ...f, ...patch } : f)) }));
  const setList = (l: PlannedEx[]) => setPhase({ days: { ...phase.days, [day]: l } });
  const upd = (i: number, patch: Partial<PlannedEx>) => setList(list.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  const move = (i: number, d: number) => { const l = [...list]; [l[i], l[i + d]] = [l[i + d], l[i]]; setList(l); haptic(6); };

  const copyToFollowing = () => {
    if (!confirm(`Copiar os treinos de "${phase.name}" para as ${p.phases.length - ph - 1} fases seguintes? Repetições e RPE se ajustam ao tipo de cada fase.`)) return;
    setP((x) => ({ ...x, phases: x.phases.map((f, i) => i <= ph ? f : { ...f, days: Object.fromEntries(Object.entries(phase.days).map(([d, l]) => [d, l.map((e) => ({ ...fromLibrary(e.name, f.kind, overrides), muscle: e.muscle, notes: e.notes }))])), dayNames: clone(phase.dayNames ?? {}) }) }));
    haptic(20);
  };
  const addPhase = () => { setP((x) => ({ ...x, phases: [...x.phases, { id: newPhaseId(), name: `S${x.phases.length + 1}`, kind: "outro", weeks: 1, notes: "", days: clone(x.phases.at(-1)?.days ?? {}) }] })); setPh(p.phases.length); };
  const dupPhase = () => { setP((x) => ({ ...x, phases: [...x.phases.slice(0, ph + 1), { ...clone(phase), id: newPhaseId(), name: `${phase.name} (cópia)` }, ...x.phases.slice(ph + 1)] })); setPh(ph + 1); };
  const delPhase = () => { if (p.phases.length === 1 || !confirm(`Excluir a fase "${phase.name}"?`)) return; setP((x) => ({ ...x, phases: x.phases.filter((_, i) => i !== ph) })); setPh(Math.max(0, ph - 1)); };

  const [tune, setTune] = useState(false);
  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-[.3em]" style={{ color: R }}>CAMPANHA ATIVA · {GOALS[p.goal].toUpperCase()}</p>
          <p className="font-display text-2xl leading-tight mt-1">{p.name}</p>
          <p className="text-xs text-muted mt-0.5">{pos.status === "andamento" ? `Semana ${pos.week} de ${pos.total}` : pos.status === "futuro" ? `Começa em ${pos.startsIn} dias` : "Concluído"} · {totalWeeks(p)} semanas</p>
        </div>
        <span className="text-xs shrink-0 mt-1" style={{ color: status === "erro" ? "#ff453a" : status === "salvo" ? "#30d158" : "#8e8e93" }}>
          {status === "salvando" ? "Salvando…" : status === "salvo" ? "Salvo ✓" : status === "erro" ? "Erro ao salvar" : ""}</span>
      </div>

      {/* Fases */}
      <p className="label mt-5">1 · Fases da campanha</p>
      <div className="flex gap-1.5 overflow-x-auto mt-4 pb-1 -mx-1 px-1">
        {p.phases.map((f, i) => {
          const on = i === ph, cur = i === pos.phaseIndex && pos.status === "andamento", c = PHASE_KINDS[f.kind].color;
          return (
            <button key={f.id} onClick={() => { setPh(i); setOpen(null); setTune(false); haptic(6); }} className="press shrink-0 rounded-2xl px-3 py-2 text-left border min-w-[76px]"
              style={{ borderColor: on ? c : "rgba(255,255,255,.08)", background: on ? `${c}26` : "#140808", boxShadow: on ? `0 0 16px -6px ${c}` : "none" }}>
              <span className="block text-[13px] font-semibold truncate max-w-[110px]">{f.name}</span>
              <span className="block text-[10px]" style={{ color: c }}>{f.name.trim() === PHASE_KINDS[f.kind].label ? `${f.weeks} sem` : PHASE_KINDS[f.kind].label}{cur ? " · agora" : ""}</span>
            </button>
          );
        })}
        <button onClick={addPhase} className="press shrink-0 rounded-2xl px-3 border border-dashed text-sm text-muted whitespace-nowrap" style={{ borderColor: "rgba(224,57,62,.35)" }}>+ Fase</button>
      </div>

      {/* Fase selecionada */}
      <div key={phase.id} className="mt-3 rounded-2xl border p-3 step-in-right" style={{ borderColor: PHASE_KINDS[phase.kind].color + "55", background: "#120707" }}>
        <div className="flex items-center gap-2">
          <input className="bg-transparent outline-none font-semibold text-lg flex-1 min-w-0" value={phase.name} onChange={(e) => setPhase({ name: e.target.value })} aria-label="Nome da fase" />
          <button className="text-xs font-semibold shrink-0" style={{ color: R }} onClick={() => setTune(!tune)} aria-expanded={tune}>{tune ? "Fechar" : "Ajustar ▸"}</button>
        </div>
        <p className="text-[11px] text-muted">{PHASE_KINDS[phase.kind].label} · {phase.weeks} {phase.weeks === 1 ? "semana" : "semanas"} · {shortDate(ranges[ph].start)}–{shortDate(ranges[ph].end)}</p>
        {tune && <div className="step-in-right">
        <div className="flex flex-wrap gap-1.5 mt-2">
          {(Object.keys(PHASE_KINDS) as PhaseKind[]).map((k) => <button key={k} className="chip !min-h-9 !px-3 text-xs" aria-pressed={phase.kind === k} onClick={() => setPhase({ kind: k })}>{PHASE_KINDS[k].label}</button>)}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-muted">Semanas</span>
          <button className="press h-9 w-9 rounded-full bg-white/[.07]" onClick={() => setPhase({ weeks: Math.max(1, phase.weeks - 1) })} aria-label="Menos semanas">−</button>
          <span className="num text-lg w-6 text-center">{phase.weeks}</span>
          <button className="press h-9 w-9 rounded-full bg-white/[.07]" onClick={() => setPhase({ weeks: Math.min(52, phase.weeks + 1) })} aria-label="Mais semanas">+</button>
          <div className="ml-auto flex gap-1">
            <button className="press h-9 w-9 rounded-full bg-white/[.07] text-sm" onClick={dupPhase} aria-label="Duplicar fase" title="Duplicar fase">⧉</button>
            <button className="press h-9 w-9 rounded-full bg-white/[.07] text-sm text-muted disabled:opacity-30" onClick={delPhase} disabled={p.phases.length === 1} aria-label="Excluir fase" title="Excluir fase">✕</button>
          </div>
        </div>
        <textarea className="field mt-2 !min-h-[60px] text-sm" rows={2} placeholder="Objetivo da fase (ex.: RPE 6–7 nos básicos, cardio 2–3×/sem)" value={phase.notes} onChange={(e) => setPhase({ notes: e.target.value })} />
        </div>}
        {!tune && phase.notes && <p className="text-xs text-ink/70 mt-1.5">{phase.notes}</p>}
      </div>

      <p className="label mt-6">2 · Treinos da semana · {phase.name}</p>

      {/* Dias */}
      <div className="grid grid-cols-7 gap-1 mt-2">
        {DAYS.map((d) => {
          const n = (phase.days[d] ?? []).length, on = d === day;
          return (
            <button key={d} onClick={() => { setDay(d); setOpen(null); haptic(6); }} className="press rounded-xl py-2 text-center border"
              style={{ borderColor: on ? R : "rgba(255,255,255,.06)", background: on ? "rgba(224,57,62,.16)" : "transparent", boxShadow: on ? `0 0 14px -6px ${R}` : "none" }}>
              <span className={`block text-[11px] ${on ? "text-ink font-semibold" : "text-muted"}`}>{weekdayShort[+d]}</span>
              <span className="block num text-sm mt-0.5" style={{ color: n ? (on ? R : "#f5f5f7") : "#5a5a5f" }}>{n || "–"}</span>
            </button>
          );
        })}
      </div>

      <input className="field mt-3 !min-h-12 font-semibold text-lg" placeholder={`Nome do treino · ${weekdayShort[+day]} (ex.: Lower A)`}
        value={phase.dayNames?.[day] ?? ""} onChange={(e) => setPhase({ dayNames: { ...(phase.dayNames ?? {}), [day]: e.target.value } })} aria-label="Nome do treino do dia" />
      {!phase.dayNames?.[day] && list.length > 0 && <p className="text-[11px] text-faint mt-1">Sem nome, aparece como “{dayTitle(phase, day)}”.</p>}
      {/* Exercícios do dia */}
      <div key={`${phase.id}-${day}`} className="grid grid-cols-1 gap-2 mt-3 [&>*]:min-w-0">
        {list.length === 0 && <p className="text-center text-muted text-sm py-4">Dia de descanso. Adicione exercícios se houver treino.</p>}
        {list.map((e, i) => {
          const isOpen = open === i, cardio = e.muscle === "cardio";
          const rest = e.rest >= 60 ? `${Math.floor(e.rest / 60)}${e.rest % 60 ? `:${String(e.rest % 60).padStart(2, "0")}` : ""} min` : e.rest ? `${e.rest}s` : "";
          const Quick = ({ values, cur, onPick, fmtv = (v: number | string) => String(v) }: { values: (number | string)[]; cur: number | string | null; onPick: (v: number | string) => void; fmtv?: (v: number | string) => string }) => (
            <div className="flex gap-1.5 flex-wrap">{values.map((v) => <button key={String(v)} onClick={() => { onPick(v); haptic(6); }} className="press rounded-xl px-3 min-h-10 text-sm font-semibold border"
              style={{ background: String(cur) === String(v) ? R : "#1a0909", color: String(cur) === String(v) ? "#fff" : undefined, borderColor: String(cur) === String(v) ? R : "rgba(224,57,62,.25)", boxShadow: String(cur) === String(v) ? `0 0 14px -4px ${R}` : "none" }}>{fmtv(v)}</button>)}</div>
          );
          return (
            <div key={i} className="rounded-2xl border step-in-right min-w-0 overflow-hidden" style={{ borderColor: isOpen ? R : "rgba(224,57,62,.18)", background: "#140808", boxShadow: isOpen ? `0 0 22px -10px ${R}` : "none", animationDelay: `${i * 30}ms` }}>
              <button className="w-full flex items-center gap-3 p-3 text-left" onClick={() => { setOpen(isOpen ? null : i); haptic(6); }} aria-expanded={isOpen}>
                <span className="num text-xs text-faint w-4">{i + 1}</span>
                <span className="flex-1 min-w-0"><span className="block font-semibold leading-snug line-clamp-2 break-words">{e.name || "Novo exercício"}</span>
                  <span className="block text-xs text-muted truncate">{MUSCLES[e.muscle]}{rest && !cardio ? ` · ${rest}` : ""}{e.notes ? ` · ${e.notes}` : ""}</span></span>
                <span className="num text-sm shrink-0" style={{ color: R }}>{cardio ? e.reps : `${e.sets}×${e.reps}`}{e.rpe ? ` @${String(e.rpe).replace(".", ",")}` : ""}</span>
                <span className="text-muted text-xs">{isOpen ? "▴" : "▾"}</span>
              </button>
              {isOpen && (
                <div className="px-3 pb-3 grid gap-3 step-in-right">
                  <input className="field !min-h-11" value={e.name} onChange={(ev) => upd(i, { name: ev.target.value, muscle: guessMuscle(ev.target.value, overrides) })} aria-label="Nome do exercício" />
                  {!cardio && (
                    <div className="flex items-center gap-3"><span className="text-sm text-muted w-16">Séries</span>
                      <div className="flex items-center rounded-xl bg-white/[.06] h-11">
                        <button className="w-11 h-full text-xl" onClick={() => upd(i, { sets: Math.max(1, e.sets - 1) })} aria-label="Menos séries">−</button>
                        <span className="num text-lg w-8 text-center">{e.sets}</span>
                        <button className="w-11 h-full text-xl" onClick={() => upd(i, { sets: Math.min(20, e.sets + 1) })} aria-label="Mais séries">+</button></div></div>
                  )}
                  <div><p className="text-sm text-muted mb-1.5">{cardio ? "Tempo" : "Repetições"}</p>
                    <Quick values={cardio ? ["10 min", "20 min", "25 min", "30 min", "45 min"] : ["3", "5", "6", "8", "10", "12", "15", "6-8", "8-12"]} cur={e.reps} onPick={(v) => upd(i, { reps: String(v) })} />
                    <input className="field !min-h-10 mt-1.5 text-sm" value={e.reps} onChange={(ev) => upd(i, { reps: ev.target.value })} aria-label="Repetições personalizadas" placeholder="Outro (ex.: 4-6)" /></div>
                  <div><p className="text-sm text-muted mb-1.5">Intensidade (RPE)</p>
                    <Quick values={cardio ? [4, 5, 6, 7] : [6, 7, 7.5, 8, 8.5, 9]} cur={e.rpe} onPick={(v) => upd(i, { rpe: Number(v), rir: Math.max(0, Math.round(10 - Number(v))) })} fmtv={(v) => String(v).replace(".", ",")} /></div>
                  {!cardio && <div><p className="text-sm text-muted mb-1.5">Descanso</p>
                    <Quick values={[60, 90, 120, 150, 180, 240]} cur={e.rest} onPick={(v) => upd(i, { rest: Number(v) })} fmtv={(v) => { const n = Number(v); return n % 60 ? `${Math.floor(n / 60)}:${n % 60}` : `${n / 60} min`; }} /></div>}
                  <input className="field !min-h-10 text-sm" placeholder="Observação técnica (opcional)" value={e.notes} onChange={(ev) => upd(i, { notes: ev.target.value })} />
                  <div className="flex gap-1.5">
                    <button className="btn !min-h-10 flex-1" disabled={i === 0} onClick={() => { move(i, -1); setOpen(i - 1); }}>↑ Subir</button>
                    <button className="btn !min-h-10 flex-1" disabled={i === list.length - 1} onClick={() => { move(i, 1); setOpen(i + 1); }}>↓ Descer</button>
                    <button className="btn !min-h-10 flex-1 text-[#ff453a]" onClick={() => { setList(list.filter((_, j) => j !== i)); setOpen(null); }}>Remover</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <button className="btn !min-h-12 font-semibold text-white" style={{ background: "linear-gradient(160deg,#e0393e,#801717)", boxShadow: "0 10px 26px -12px #e0393e" }} onClick={() => setLib(true)}>+ Adicionar exercício</button>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn !min-h-10 text-sm" onClick={() => setCopyDay(true)} disabled={!list.length}>Copiar dia</button>
          <button className="btn !min-h-10 text-sm" onClick={copyToFollowing} disabled={ph >= p.phases.length - 1}>Replicar nas fases</button>
        </div>
      </div>

      {/* Volume da fase */}
      <div className="mt-4 rounded-2xl p-3 bg-white/[.03]">
        <p className="text-[10px] font-semibold tracking-[.25em] text-muted">SÉRIES DIRETAS / SEMANA NESTA FASE</p>
        <div className="flex flex-wrap gap-1.5 mt-2">{Object.entries(vol).filter(([, v]) => v).sort((a, b) => b[1]! - a[1]!).map(([m, v]) => <span key={m} className="tag">{MUSCLES[m as Muscle]} <b className="text-ink">{v}</b></span>)}</div>
      </div>

      {/* Configurações */}
      <button className="text-sm text-muted mt-4 min-h-10" onClick={() => setSettings(!settings)}>{settings ? "▾" : "▸"} Configurações da campanha</button>
      {settings && (
        <div className="grid gap-2 mt-1 step-in-right">
          <input className="field" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} aria-label="Nome da campanha" />
          <div className="grid grid-cols-2 gap-2">
            <input type="date" className="field" value={p.start_date} onChange={(e) => setP({ ...p, start_date: e.target.value })} aria-label="Início" />
            <select className="field" value={p.goal} onChange={(e) => setP({ ...p, goal: e.target.value as Goal })} aria-label="Objetivo">{(Object.keys(GOALS) as Goal[]).map((g) => <option key={g} value={g}>{GOALS[g]}</option>)}</select>
          </div>
          <textarea className="field" rows={2} placeholder="Observações" value={p.notes ?? ""} onChange={(e) => setP({ ...p, notes: e.target.value })} />
        </div>
      )}

      <Sheet tone="war" accent={R} open={lib} onClose={() => setLib(false)} title={`Adicionar · ${weekdayShort[+day]}`}>
        {lib && <Library existing={list.map((e) => e.name.toLowerCase())} onAdd={(name) => { setList([...(phase.days[day] ?? []), fromLibrary(name, phase.kind, overrides)]); haptic(10); }} onDone={() => setLib(false)} />}
      </Sheet>
      <Sheet tone="war" accent={R} open={copyDay} onClose={() => setCopyDay(false)} title="Copiar dia para…">
        {copyDay && (
          <div className="grid gap-2">
            <p className="text-sm text-muted">Os exercícios de {weekdayShort[+day]} vão substituir os do dia escolhido, nesta fase.</p>
            <div className="grid grid-cols-4 gap-2">
              {DAYS.filter((d) => d !== day).map((d) => <button key={d} className="btn !min-h-12" onClick={() => { setPhase({ days: { ...phase.days, [d]: clone(list) }, dayNames: { ...(phase.dayNames ?? {}), [d]: phase.dayNames?.[day] ?? "" } }); setCopyDay(false); setDay(d); haptic(15); }}>{weekdayShort[+d]}</button>)}
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}

/** Biblioteca com busca e filtro por grupo; adiciona vários seguidos. */
function Library({ existing, onAdd, onDone }: { existing: string[]; onAdd: (name: string) => void; onDone: () => void }) {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<string | null>(null);
  const [added, setAdded] = useState<string[]>([]);
  const all = LIBRARY.flatMap(([g, l]) => l.map((n) => ({ g, n })));
  const shown = all.filter((x) => (!group || x.g === group) && (!q || x.n.toLowerCase().includes(q.toLowerCase())));
  const custom = q.trim() && !all.some((x) => x.n.toLowerCase() === q.trim().toLowerCase());
  return (
    <div className="grid gap-3">
      <input className="field" placeholder="Buscar ou digitar um exercício novo…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button className="chip shrink-0" aria-pressed={!group} onClick={() => setGroup(null)}>Todos</button>
        {LIBRARY.map(([g]) => <button key={g} className="chip shrink-0" aria-pressed={group === g} onClick={() => setGroup(group === g ? null : g)}>{g}</button>)}
      </div>
      {custom && <button className="btn !min-h-12 justify-start" onClick={() => { onAdd(q.trim()); setAdded([...added, q.trim().toLowerCase()]); setQ(""); }}>+ Criar “{q.trim()}”</button>}
      <ul className="grid gap-1.5 max-h-[46dvh] overflow-y-auto">
        {shown.map((x) => {
          const has = existing.includes(x.n.toLowerCase()) || added.includes(x.n.toLowerCase());
          return (
            <li key={x.n}><button disabled={has} onClick={() => { onAdd(x.n); setAdded([...added, x.n.toLowerCase()]); }}
              className="press w-full flex items-center gap-3 rounded-xl px-3 min-h-12 text-left border disabled:opacity-40" style={{ borderColor: "rgba(224,57,62,.2)", background: "#140808" }}>
              <span className="flex-1">{x.n}</span><span className="text-[11px] text-muted">{x.g}</span><span className="text-lg" style={{ color: has ? "#30d158" : R }}>{has ? "✓" : "+"}</span>
            </button></li>
          );
        })}
      </ul>
      <button className="btn btn-accent !min-h-12" onClick={onDone}>Pronto{added.length ? ` · ${added.length} adicionado${added.length > 1 ? "s" : ""}` : ""}</button>
    </div>
  );
}
