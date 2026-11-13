"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { aiStudyPlan, applyPlan, deleteItem, deleteTrack, logStudy, reviewItem, saveItem, saveTrack, setItemStatus, setTrackStatus, toggleWeak, type PlanModule } from "@/app/(app)/estudos/actions";
import { Field, Sheet } from "@/components/kit";
import { haptic, useXp } from "@/components/game/xp";
import { nextStep, pace, perDay, progress, studyStreak, type SItem, type SLog, type STrack, type StudyStatus } from "@/lib/study";

const V = "#bf5af2";
const COLORS = ["#bf5af2", "#5ab0ff", "#30d158", "#ff9f0a", "#ff6b81", "#3ee6c1", "#ffd60a"];
const ST: Record<StudyStatus, { label: string; color: string; e: string }> = {
  afazer: { label: "A estudar", color: "#8e8e93", e: "○" }, estudando: { label: "Estudando", color: "#5ab0ff", e: "◐" },
  revisar: { label: "Revisar", color: "#ff9f0a", e: "↻" }, dominado: { label: "Dominado", color: "#30d158", e: "●" },
};
const ORDER: StudyStatus[] = ["afazer", "estudando", "dominado", "revisar"];
const hm = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}` : `${m} min`);
const br = (iso: string) => iso.split("-").reverse().slice(0, 2).join("/");
const daysTo = (iso: string, today: string) => Math.round((Date.parse(iso) - Date.parse(today)) / 864e5);

export function StudyCenter({ today, ready, tracks, items, logs }: { today: string; ready: boolean; tracks: STrack[]; items: SItem[]; logs: SLog[] }) {
  const active = tracks.filter((t) => t.status !== "concluido");
  const [sel, setSel] = useState<string | null>(active[0]?.id ?? tracks[0]?.id ?? null);
  const [sheet, setSheet] = useState<null | { k: "track"; t?: STrack } | { k: "item"; i?: SItem; module?: string } | { k: "timer"; i?: SItem } | { k: "ai" } | { k: "log" }>(null);
  const track = tracks.find((t) => t.id === sel) ?? null;
  const tItems = items.filter((i) => i.track_id === sel).sort((a, b) => a.position - b.position);
  const tLogs = logs.filter((l) => l.track_id === sel);
  const days = perDay(logs, today, 14), maxDay = Math.max(30, ...days.map((d) => d.min));
  const week = days.slice(-7).reduce((a, d) => a + d.min, 0), streak = studyStreak(logs, today);
  const mastered = items.filter((i) => i.status === "dominado").length;
  const dueAll = items.filter((i) => i.review_at && i.review_at <= today);
  const step = nextStep(tItems, today);
  const pct = progress(tItems), pc = track ? pace(tItems, track.deadline, today) : null;
  const modules = useMemo(() => { const m = new Map<string, SItem[]>(); for (const i of tItems) m.set(i.module, [...(m.get(i.module) ?? []), i]); return [...m]; }, [tItems]);
  const close = () => setSheet(null);

  return (
    <div style={{ ["--accent" as string]: V }}>
      {/* Cabeçalho */}
      <header className="rise rounded-[26px] p-4 border relative overflow-hidden" style={{ borderColor: "rgba(191,90,242,.3)", background: "radial-gradient(120% 90% at 0% 0%, rgba(191,90,242,.2), transparent 55%), radial-gradient(90% 80% at 100% 100%, rgba(90,176,255,.14), transparent 60%), #08070d" }}>
        <p className="text-[10px] font-bold tracking-[.35em]" style={{ color: V }}>CENTRAL DE ESTUDOS</p>
        <h1 className="font-display text-[clamp(28px,9vw,40px)] leading-none mt-1">Aprender até fechar.</h1>
        <div className="grid grid-cols-4 gap-2 mt-4">
          {([["⏱", hm(week), "na semana"], ["🔥", String(streak), streak === 1 ? "dia seguido" : "dias seguidos"], ["🧠", String(mastered), "dominados"], ["↻", String(dueAll.length), "revisões hoje"]] as const).map(([e, v, l]) => (
            <div key={l} className="rounded-2xl p-2 text-center border border-white/10 bg-white/[.03]"><p className="text-sm">{e}</p><p className="num text-lg leading-tight">{v}</p><p className="text-[9px] text-muted leading-tight">{l}</p></div>))}
        </div>
        {/* gráfico 14 dias */}
        <div className="flex items-end gap-1 h-16 mt-4" aria-label="Minutos estudados nos últimos 14 dias">
          {days.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full gap-1" title={`${br(d.date)}: ${d.min} min`}>
              <div className="w-full rounded-md bar-grow" style={{ height: `${Math.max(3, (d.min / maxDay) * 100)}%`, background: d.date === today ? `linear-gradient(180deg, #e3a6ff, ${V})` : d.min ? V + "88" : "rgba(255,255,255,.07)", boxShadow: d.date === today && d.min ? `0 0 10px ${V}` : "none" }} />
            </div>))}
        </div>
        <div className="flex justify-between text-[9px] text-faint mt-1"><span>{br(days[0].date)}</span><span>hoje</span></div>
      </header>

      {!ready && <p className="glass p-4 mt-4 text-sm text-[#ff6961]">Rode a migração <b>supabase/migrations/20261118000000_central_estudos.sql</b> no Supabase.</p>}

      {/* Revisões de hoje (todas as trilhas) */}
      {dueAll.length > 0 && (
        <section className="rise mt-4 rounded-[22px] p-4 border" style={{ borderColor: "rgba(255,159,10,.35)", background: "linear-gradient(160deg, rgba(255,159,10,.10), #0d0b08 70%)" }}>
          <p className="text-[10px] font-bold tracking-[.3em] text-[#ff9f0a]">↻ REVISÕES DE HOJE · {dueAll.length}</p>
          <ul className="grid gap-2 mt-2">{dueAll.slice(0, 6).map((i) => <ReviewRow key={i.id} i={i} track={tracks.find((t) => t.id === i.track_id)} />)}</ul>
        </section>
      )}

      {/* Objetivos */}
      <div className="flex items-center justify-between mt-5 mb-2"><p className="label">Objetivos</p><button className="text-xs font-semibold" style={{ color: V }} onClick={() => setSheet({ k: "track" })}>+ Novo objetivo</button></div>
      {tracks.length === 0 ? (
        <button onClick={() => setSheet({ k: "track" })} className="press w-full rounded-[22px] p-5 border border-dashed text-left" style={{ borderColor: V + "66" }}>
          <p className="font-display text-xl">Comece por um objetivo</p><p className="text-sm text-muted mt-1">Ex.: “Inglês para conversação”, “Passar em Cálculo I”, “Dominar Excel”. Depois a IA monta o plano a partir das suas fraquezas.</p>
        </button>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
          {tracks.map((t) => { const ti = items.filter((i) => i.track_id === t.id), p = progress(ti), on = t.id === sel; return (
            <button key={t.id} onClick={() => setSel(t.id)} className="press snap-start shrink-0 w-44 text-left rounded-2xl p-3 border" style={{ borderColor: on ? t.color : "rgba(255,255,255,.08)", background: on ? `linear-gradient(160deg, ${t.color}26, transparent 75%)` : "rgba(255,255,255,.03)", opacity: t.status === "concluido" ? 0.6 : 1 }}>
              <p className="text-sm font-semibold leading-snug line-clamp-2">{t.status === "concluido" ? "🏆 " : ""}{t.title}</p>
              <div className="h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${p * 100}%`, background: t.color }} /></div>
              <p className="text-[10px] text-muted mt-1 num">{Math.round(p * 100)}% · {ti.length} conteúdos{t.deadline ? ` · ${br(t.deadline)}` : ""}</p>
            </button>); })}
        </div>
      )}

      {track && (
        <>
          {/* Painel do objetivo */}
          <section className="rise glass mt-4 p-4" style={{ ["--accent" as string]: track.color }}>
            <div className="flex items-start gap-3">
              <Ring pct={pct} color={track.color} />
              <div className="flex-1 min-w-0">
                <p className="font-display text-xl leading-tight">{track.title}</p>
                {track.why && <p className="text-xs text-muted mt-0.5 line-clamp-2">🎯 {track.why}</p>}
                {track.weakness && <p className="text-xs mt-1 line-clamp-2" style={{ color: "#ff9f0a" }}>⚠ Fraquezas: {track.weakness}</p>}
              </div>
              <button className="text-xs text-muted shrink-0" onClick={() => setSheet({ k: "track", t: track })}>editar</button>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              <div className="rounded-xl bg-white/[.04] p-2"><p className="num text-base">{hm(tLogs.reduce((a, l) => a + l.minutes, 0))}</p><p className="text-[10px] text-muted">estudado</p></div>
              <div className="rounded-xl bg-white/[.04] p-2"><p className="num text-base">{pc ? hm(Math.round(pc.leftMin)) : "—"}</p><p className="text-[10px] text-muted">faltam (est.)</p></div>
              <div className="rounded-xl bg-white/[.04] p-2"><p className="num text-base" style={{ color: pc?.perDay && pc.perDay > track.daily_min ? "#ff9f0a" : undefined }}>{pc?.perDay ? hm(pc.perDay) : hm(track.daily_min)}</p><p className="text-[10px] text-muted">{pc?.days != null ? `/dia · ${pc.days} dias` : "meta/dia"}</p></div>
            </div>
            {pc?.perDay && pc.perDay > track.daily_min && <p className="text-[11px] text-[#ff9f0a] mt-2">No ritmo de {hm(track.daily_min)}/dia você não fecha no prazo. Aumente o tempo ou ajuste o prazo.</p>}

            {/* Próximo passo */}
            {tItems.length > 0 && (step ? (
              <div className="mt-4 rounded-2xl p-3.5 border-2" style={{ borderColor: track.color, background: `linear-gradient(160deg, ${track.color}22, transparent 75%)`, boxShadow: `0 10px 30px -18px ${track.color}` }}>
                <p className="text-[10px] font-bold tracking-[.3em]" style={{ color: track.color }}>{step.review_at && step.review_at <= today ? "↻ REVISAR AGORA" : "▶ PRÓXIMO PASSO"}</p>
                <p className="font-semibold text-[16px] mt-1 leading-snug">{step.weak ? "⚠ " : ""}{step.title}</p>
                <p className="text-xs text-muted mt-0.5">{step.module}{step.est_min ? ` · ~${step.est_min} min` : ""}</p>
                {step.review_at && step.review_at <= today ? <ul className="mt-3"><ReviewRow i={step} track={track} /></ul> : (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button className="btn btn-accent" onClick={() => setSheet({ k: "timer", i: step })}>⏱ Estudar agora</button>
                  <StatusButton i={step} />
                </div>)}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl p-4 text-center border" style={{ borderColor: "#30d15566", background: "rgba(48,209,88,.08)" }}>
                <p className="text-2xl">🏆</p><p className="font-display text-lg mt-1">Plano concluído</p>
                {track.status !== "concluido" && <CloseTrack id={track.id} />}
              </div>
            ))}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <button className="btn !min-h-10 text-xs whitespace-nowrap" onClick={() => setSheet({ k: "ai" })}>✦ Plano IA</button>
              <button className="btn !min-h-10 text-xs" onClick={() => setSheet({ k: "item" })}>+ Conteúdo</button>
              <button className="btn !min-h-10 text-xs" onClick={() => setSheet({ k: "log" })}>+ Tempo</button>
            </div>
          </section>

          {/* Plano */}
          {modules.length > 0 && (
            <section className="mt-4 grid gap-3">
              {modules.map(([mod, list]) => { const mp = progress(list); return (
                <div key={mod} className="glass rise p-4">
                  <div className="flex items-center gap-3">
                    <p className="font-semibold flex-1">{mod}</p>
                    <span className="num text-xs text-muted">{list.filter((i) => i.status === "dominado").length}/{list.length}</span>
                    <button className="text-xs" style={{ color: track.color }} onClick={() => setSheet({ k: "item", module: mod })}>+</button>
                  </div>
                  <div className="h-1 rounded-full bg-white/10 mt-2 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${mp * 100}%`, background: track.color }} /></div>
                  <ul className="grid gap-1.5 mt-3">
                    {list.map((i) => <ItemRow key={i.id} i={i} today={today} current={step?.id === i.id} onOpen={() => setSheet({ k: "item", i })} onStudy={() => setSheet({ k: "timer", i })} />)}
                  </ul>
                </div>); })}
            </section>
          )}
          {tItems.length === 0 && (
            <button onClick={() => setSheet({ k: "ai" })} className="press mt-4 w-full rounded-[22px] p-5 text-left border" style={{ borderColor: V + "55", background: `linear-gradient(160deg, ${V}1f, transparent 70%)` }}>
              <p className="font-display text-xl">✦ Gerar o plano com IA</p><p className="text-sm text-muted mt-1">A IA monta módulos e conteúdos a partir do seu objetivo e das suas fraquezas. Você revisa antes de salvar.</p>
            </button>
          )}
        </>
      )}

      <Sheet open={sheet?.k === "track"} onClose={close} title={sheet?.k === "track" && sheet.t ? "Editar objetivo" : "Novo objetivo"} accent={V}>
        {sheet?.k === "track" && <TrackForm t={sheet.t} onDone={(id) => { if (id) setSel(id); close(); }} />}
      </Sheet>
      <Sheet open={sheet?.k === "item"} onClose={close} title={sheet?.k === "item" && sheet.i ? "Conteúdo" : "Novo conteúdo"} accent={V}>
        {sheet?.k === "item" && track && <ItemForm trackId={track.id} i={sheet.i} module={sheet.module ?? modules.at(-1)?.[0] ?? "Geral"} modules={modules.map(([m]) => m)} onDone={close} />}
      </Sheet>
      <Sheet open={sheet?.k === "timer"} onClose={close} title="Sessão de estudo" accent={V}>
        {sheet?.k === "timer" && track && <Timer track={track} i={sheet.i} onDone={close} />}
      </Sheet>
      <Sheet open={sheet?.k === "log"} onClose={close} title="Registrar tempo" accent={V}>
        {sheet?.k === "log" && track && <LogForm trackId={track.id} onDone={close} />}
      </Sheet>
      <Sheet open={sheet?.k === "ai"} onClose={close} title="Plano com IA" accent={V}>
        {sheet?.k === "ai" && track && <AiPlan track={track} onDone={close} />}
      </Sheet>
    </div>
  );
}

function Ring({ pct, color }: { pct: number; color: string }) {
  const r = 24, c = 2 * Math.PI * r;
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" className="shrink-0" aria-label={`${Math.round(pct * 100)}%`}>
      <circle cx="30" cy="30" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6" />
      <circle cx="30" cy="30" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${pct * c} ${c}`} transform="rotate(-90 30 30)" style={{ transition: "stroke-dasharray 1s ease", filter: `drop-shadow(0 0 6px ${color})` }} />
      <text x="30" y="34" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">{Math.round(pct * 100)}%</text>
    </svg>
  );
}

function StatusButton({ i }: { i: SItem }) {
  const [pending, start] = useTransition();
  const { gain, celebrate } = useXp();
  const next: StudyStatus = i.status === "afazer" ? "estudando" : i.status === "estudando" ? "dominado" : i.status === "revisar" ? "dominado" : "afazer";
  return <button className="btn" disabled={pending} onClick={() => start(async () => { await setItemStatus(i.id, next); haptic(15); if (next === "dominado") { gain(15, `Dominado: ${i.title}`, "#30d158"); celebrate("Conteúdo dominado", "Primeira revisão amanhã"); } })}>
    {next === "estudando" ? "Comecei" : next === "dominado" ? "✓ Dominei" : "Refazer"}</button>;
}

function ItemRow({ i, today, current, onOpen, onStudy }: { i: SItem; today: string; current: boolean; onOpen: () => void; onStudy: () => void }) {
  const [pending, start] = useTransition();
  const s = ST[i.status], due = i.review_at && i.review_at <= today;
  const cycle = () => start(async () => { haptic(8); await setItemStatus(i.id, ORDER[(ORDER.indexOf(i.status) + 1) % ORDER.length]); });
  return (
    <li className="flex items-center gap-2 rounded-xl px-2 py-1.5 border" style={{ borderColor: current ? "var(--accent)" : "transparent", background: current ? "rgba(255,255,255,.04)" : "transparent" }}>
      <button onClick={cycle} disabled={pending} aria-label={`Estado: ${s.label}. Tocar para mudar`} className="h-7 w-7 shrink-0 rounded-full grid place-items-center text-sm border" style={{ borderColor: s.color, color: i.status === "dominado" ? "#000" : s.color, background: i.status === "dominado" ? s.color : "transparent" }}>{i.status === "dominado" ? "✓" : s.e}</button>
      <button onClick={onOpen} className="flex-1 min-w-0 text-left">
        <span className={`block text-[14px] leading-snug ${i.status === "dominado" ? "text-muted line-through decoration-1" : ""}`}>{i.weak ? "⚠ " : ""}{i.title}</span>
        <span className="block text-[10px] text-muted">{s.label}{i.est_min ? ` · ~${i.est_min} min` : ""}{i.review_at ? ` · revisar ${due ? "hoje" : br(i.review_at)}` : ""}</span>
      </button>
      {i.status !== "dominado" && <button onClick={onStudy} className="text-xs rounded-lg px-2 py-1 border border-white/10 shrink-0" aria-label="Estudar agora">⏱</button>}
    </li>
  );
}

function ReviewRow({ i, track }: { i: SItem; track?: STrack }) {
  const [pending, start] = useTransition();
  const { gain } = useXp();
  return (
    <li className="flex items-center gap-2 rounded-xl px-3 py-2 bg-black/30">
      <span className="flex-1 min-w-0"><span className="block text-sm truncate">{i.title}</span><span className="block text-[10px] text-muted truncate">{track?.title} · revisão {i.review_step + 1}</span></span>
      <button className="text-xs rounded-lg px-2.5 py-1.5 border border-[#ff453a55] text-[#ff6961]" disabled={pending} onClick={() => start(async () => { await reviewItem(i.id, false); })}>Esqueci</button>
      <button className="text-xs rounded-lg px-2.5 py-1.5 bg-[#30d158] text-black font-semibold" disabled={pending} onClick={() => start(async () => { await reviewItem(i.id, true); gain(5, "Revisão feita", "#ff9f0a"); haptic(12); })}>Lembrei</button>
    </li>
  );
}

function CloseTrack({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const { celebrate } = useXp();
  return <button className="btn btn-accent mt-3" disabled={pending} onClick={() => start(async () => { await setTrackStatus(id, "concluido"); celebrate("Objetivo concluído", "Fechou o que começou."); })}>Fechar objetivo 🏆</button>;
}

function TrackForm({ t, onDone }: { t?: STrack; onDone: (id?: string) => void }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState({ title: t?.title ?? "", why: t?.why ?? "", weakness: t?.weakness ?? "", deadline: t?.deadline ?? "", color: t?.color ?? COLORS[0], daily: String(t?.daily_min ?? 30) });
  const save = () => start(async () => { const r = await saveTrack({ title: f.title, why: f.why || null, weakness: f.weakness || null, deadline: f.deadline || null, color: f.color, daily_min: Math.max(5, +f.daily || 30) }, t?.id); if (r.error) setErr(r.error); else onDone(r.id); });
  return (
    <div className="grid gap-3">
      <Field label="Objetivo"><input className="field" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Ex.: Inglês para conversação" /></Field>
      <Field label="Por que isso importa"><textarea className="field !min-h-[60px]" value={f.why} onChange={(e) => setF({ ...f, why: e.target.value })} placeholder="O que muda quando você chegar lá?" /></Field>
      <Field label="Fraquezas (o que mais trava)"><textarea className="field !min-h-[60px]" value={f.weakness} onChange={(e) => setF({ ...f, weakness: e.target.value })} placeholder="Ex.: listening rápido, tempos verbais, vocabulário de trabalho" /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Prazo"><input type="date" className="field" value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} /></Field>
        <Field label="Minutos por dia"><input className="field num" inputMode="numeric" value={f.daily} onChange={(e) => setF({ ...f, daily: e.target.value })} /></Field>
      </div>
      <div className="flex gap-2">{COLORS.map((c) => <button key={c} onClick={() => setF({ ...f, color: c })} aria-label={`Cor ${c}`} className="h-8 w-8 rounded-full border-2" style={{ background: c, borderColor: f.color === c ? "#fff" : "transparent" }} />)}</div>
      {err && <p className="text-sm text-[#ff6961]">{err}</p>}
      <div className="flex gap-2">
        {t && <button className="btn text-muted" disabled={pending} onClick={() => { if (confirm("Excluir este objetivo e todo o plano?")) start(async () => { await deleteTrack(t.id); onDone(); }); }}>Excluir</button>}
        {t && t.status !== "concluido" && <button className="btn" disabled={pending} onClick={() => start(async () => { await setTrackStatus(t.id, t.status === "pausado" ? "ativo" : "pausado"); onDone(); })}>{t.status === "pausado" ? "Retomar" : "Pausar"}</button>}
        <button className="btn btn-accent flex-1" disabled={pending || !f.title.trim()} onClick={save}>{pending ? "Salvando…" : t ? "Salvar" : "Criar"}</button>
      </div>
    </div>
  );
}

function ItemForm({ trackId, i, module, modules, onDone }: { trackId: string; i?: SItem; module: string; modules: string[]; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState({ module: i?.module ?? module, title: i?.title ?? "", est: String(i?.est_min ?? 30), weak: i?.weak ?? false, link: i?.link ?? "", notes: i?.notes ?? "" });
  const save = () => start(async () => { const e = await saveItem({ track_id: trackId, module: f.module || "Geral", title: f.title, est_min: +f.est || null, weak: f.weak, link: f.link || null, notes: f.notes || null }, i?.id); if (e) setErr(e); else onDone(); });
  return (
    <div className="grid gap-3">
      <Field label="Conteúdo"><input className="field" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Ex.: Present perfect" /></Field>
      <Field label="Módulo"><input className="field" list="mods" value={f.module} onChange={(e) => setF({ ...f, module: e.target.value })} /><datalist id="mods">{modules.map((m) => <option key={m} value={m} />)}</datalist></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Minutos (estimativa)"><input className="field num" inputMode="numeric" value={f.est} onChange={(e) => setF({ ...f, est: e.target.value })} /></Field>
        <label className="flex items-center gap-2 mt-5 text-sm min-h-11"><input type="checkbox" className="h-5 w-5" checked={f.weak} onChange={(e) => { setF({ ...f, weak: e.target.checked }); if (i) start(async () => { await toggleWeak(i.id, e.target.checked); }); }} />⚠ É uma fraqueza</label>
      </div>
      <Field label="Link (vídeo, apostila…)"><input className="field" value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} placeholder="https://" /></Field>
      {f.link && /^https?:\/\//.test(f.link) && <a href={f.link} target="_blank" rel="noreferrer" className="text-xs underline" style={{ color: V }}>Abrir material ↗</a>}
      <Field label="Anotações"><textarea className="field !min-h-[90px]" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Resumo, fórmulas, dúvidas…" /></Field>
      {i && <div className="grid grid-cols-4 gap-1.5">{ORDER.map((s) => <button key={s} className="chip justify-center !min-h-9 text-[11px]" aria-pressed={i.status === s} onClick={() => start(async () => { await setItemStatus(i.id, s); onDone(); })}>{ST[s].label}</button>)}</div>}
      {err && <p className="text-sm text-[#ff6961]">{err}</p>}
      <div className="flex gap-2">
        {i && <button className="btn text-muted" disabled={pending} onClick={() => { if (confirm("Excluir conteúdo?")) start(async () => { await deleteItem(i.id); onDone(); }); }}>Excluir</button>}
        <button className="btn btn-accent flex-1" disabled={pending || !f.title.trim()} onClick={save}>{pending ? "Salvando…" : "Salvar"}</button>
      </div>
    </div>
  );
}

function Timer({ track, i, onDone }: { track: STrack; i?: SItem; onDone: () => void }) {
  const [goal, setGoal] = useState(i?.est_min ?? 25);
  const [t0, setT0] = useState<number | null>(null);
  const [paused, setPaused] = useState(0); const [pauseAt, setPauseAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const { gain } = useXp();
  const fired = useRef(false);
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(id); }, []);
  const el = t0 ? Math.max(0, (pauseAt ?? now) - t0 - paused) : 0, min = Math.floor(el / 60000), sec = Math.floor(el / 1000) % 60;
  const pct = Math.min(1, el / (goal * 60000));
  useEffect(() => { if (pct >= 1 && !fired.current && t0) { fired.current = true; haptic([200, 100, 200]); } }, [pct, t0]);
  const finish = () => start(async () => { const m = Math.max(1, Math.round(el / 60000)); const e = await logStudy({ track_id: track.id, item_id: i?.id ?? null, minutes: m, kind: i?.review_at ? "revisao" : "estudo" }); if (e) setErr(e); else { gain(Math.min(60, m), `${m} min de estudo`, track.color); onDone(); } });
  const r = 92, c = 2 * Math.PI * r;
  return (
    <div className="grid gap-4 text-center">
      {i && <div><p className="text-[10px] font-bold tracking-[.3em]" style={{ color: track.color }}>{track.title.toUpperCase()}</p><p className="font-display text-xl mt-1">{i.title}</p></div>}
      <div className="relative mx-auto" style={{ width: 220, height: 220 }}>
        <svg width="220" height="220" viewBox="0 0 220 220">
          <circle cx="110" cy="110" r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="12" />
          <circle cx="110" cy="110" r={r} fill="none" stroke={track.color} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${pct * c} ${c}`} transform="rotate(-90 110 110)" style={{ filter: `drop-shadow(0 0 10px ${track.color})`, transition: "stroke-dasharray .5s linear" }} />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div><p className="num text-5xl tabular-nums">{String(min).padStart(2, "0")}:{String(sec).padStart(2, "0")}</p><p className="text-xs text-muted mt-1">{pct >= 1 ? "Meta batida ✓" : `meta ${goal} min`}</p></div>
        </div>
      </div>
      {!t0 && <div className="flex justify-center gap-1.5">{[15, 25, 45, 60].map((g) => <button key={g} className="chip !min-h-9" aria-pressed={goal === g} onClick={() => setGoal(g)}>{g} min</button>)}</div>}
      {err && <p className="text-sm text-[#ff6961]">{err}</p>}
      {!t0 ? <button className="btn btn-accent !min-h-14 text-base" onClick={() => { setT0(Date.now()); haptic(20); }}>▶ Começar</button> : (
        <div className="grid grid-cols-2 gap-2">
          <button className="btn !min-h-12" onClick={() => { if (pauseAt) { setPaused((p) => p + (Date.now() - pauseAt)); setPauseAt(null); } else setPauseAt(Date.now()); }}>{pauseAt ? "▶ Continuar" : "⏸ Pausar"}</button>
          <button className="btn btn-accent !min-h-12" disabled={pending || el < 30000} onClick={finish}>{pending ? "Salvando…" : "■ Encerrar e salvar"}</button>
        </div>
      )}
      <p className="text-[11px] text-faint">Deixe o celular de lado. Ao encerrar, o tempo entra no gráfico e vira XP.</p>
    </div>
  );
}

function LogForm({ trackId, onDone }: { trackId: string; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [f, setF] = useState({ min: "30", kind: "estudo" as "estudo" | "revisao" | "exercicios", date: new Date(Date.now() - 3 * 36e5).toISOString().slice(0, 10) });
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-3 gap-1.5">{(["estudo", "revisao", "exercicios"] as const).map((k) => <button key={k} className="chip justify-center !min-h-10 capitalize" aria-pressed={f.kind === k} onClick={() => setF({ ...f, kind: k })}>{k === "revisao" ? "Revisão" : k === "exercicios" ? "Exercícios" : "Estudo"}</button>)}</div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Minutos"><input className="field num" inputMode="numeric" value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} /></Field>
        <Field label="Data"><input type="date" className="field" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
      </div>
      {err && <p className="text-sm text-[#ff6961]">{err}</p>}
      <button className="btn btn-accent" disabled={pending || !+f.min} onClick={() => start(async () => { const e = await logStudy({ track_id: trackId, item_id: null, minutes: Math.round(+f.min), kind: f.kind, date: f.date }); if (e) setErr(e); else onDone(); })}>{pending ? "Salvando…" : "Registrar"}</button>
    </div>
  );
}

function AiPlan({ track, onDone }: { track: STrack; onDone: () => void }) {
  const [level, setLevel] = useState("");
  const [pending, start] = useTransition();
  const [plan, setPlan] = useState<{ modules: PlanModule[]; tip: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const gen = () => start(async () => { setErr(null); const r = await aiStudyPlan({ title: track.title, why: track.why ?? "", weakness: track.weakness ?? "", level, deadline: track.deadline, daily_min: track.daily_min }); if ("error" in r) setErr(r.error); else setPlan(r); });
  const total = plan?.modules.reduce((a, m) => a + m.items.length, 0) ?? 0;
  return (
    <div className="grid gap-3">
      {!plan ? <>
        <p className="text-sm text-muted">Objetivo: <b className="text-ink">{track.title}</b>{track.weakness ? <> · fraquezas: <span className="text-[#ff9f0a]">{track.weakness}</span></> : null}</p>
        <Field label="Seu nível hoje (opcional)"><textarea className="field !min-h-[70px]" value={level} onChange={(e) => setLevel(e.target.value)} placeholder="Ex.: entendo textos simples, travo para falar; já vi limites mas não derivadas" /></Field>
        {err && <p className="text-sm text-[#ff6961]">{err}</p>}
        <button className="btn btn-accent !min-h-12" disabled={pending} onClick={gen}>{pending ? "Montando o plano…" : "✦ Gerar plano"}</button>
      </> : <>
        {plan.tip && <p className="text-sm rounded-2xl p-3 border border-white/10" style={{ background: `linear-gradient(160deg, ${V}14, transparent)` }}>✦ {plan.tip}</p>}
        <div className="grid gap-2 max-h-[45dvh] overflow-y-auto pr-1">
          {plan.modules.map((m, mi) => (
            <div key={mi} className="rounded-2xl border border-white/10 p-3">
              <p className="font-semibold text-sm">{m.module}</p>
              <ul className="mt-1.5 grid gap-1">{m.items.map((i, ii) => (
                <li key={ii} className="flex items-center gap-2 text-sm">
                  <button aria-label="Remover" className="text-faint text-xs" onClick={() => setPlan({ ...plan, modules: plan.modules.map((x, xi) => (xi !== mi ? x : { ...x, items: x.items.filter((_, yi) => yi !== ii) })).filter((x) => x.items.length) })}>✕</button>
                  <span className="flex-1">{i.weak ? "⚠ " : ""}{i.title}</span><span className="num text-[11px] text-muted">{i.est_min}′</span>
                </li>))}</ul>
            </div>))}
        </div>
        {err && <p className="text-sm text-[#ff6961]">{err}</p>}
        <div className="grid grid-cols-2 gap-2">
          <button className="btn" disabled={pending} onClick={() => setPlan(null)}>Refazer</button>
          <button className="btn btn-accent" disabled={pending || !total} onClick={() => start(async () => { const e = await applyPlan(track.id, plan.modules); if (e) setErr(e); else onDone(); })}>{pending ? "Salvando…" : `Salvar ${total} conteúdos`}</button>
        </div>
      </>}
    </div>
  );
}
