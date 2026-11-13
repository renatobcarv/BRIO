"use client";
import { CountUp } from "@/components/count-up";
import { PHYS, physicalAttributes, trainingInsights, trainingMedals, weeklyReview, type PhysKey, type WSession } from "@/lib/physical";

const fmtT = (kg: number) => `${(kg / 1000).toFixed(1).replace(".", ",")} t`;
const delta = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : null);

function Medal({ color, done }: { color: string; done: boolean }) {
  return (
    <svg width="46" height="46" viewBox="0 0 48 48" aria-hidden className="shrink-0" style={{ filter: done ? `drop-shadow(0 0 10px ${color}99)` : "grayscale(1) brightness(.45)" }}>
      <path d="M14 2h8l4 12h-8zM34 2h-8l-4 12h8z" fill={done ? "#801717" : "#333"} />
      <circle cx="24" cy="30" r="15" fill="#0d0d0d" stroke={color} strokeWidth="3" />
      <path d="M24 21l2.6 5.4 5.9.8-4.3 4.1 1 5.8L24 34.4l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z" fill={color} />
    </svg>
  );
}

export function TrainingSystem({ sessions, today, bodyweight, plannedPerWeek, program }: {
  sessions: WSession[]; today: string; bodyweight: number | null; plannedPerWeek: number; program: { totalWeeks: number; ended: boolean } | null;
}) {
  const attrs = physicalAttributes(sessions, today, bodyweight, plannedPerWeek);
  const review = weeklyReview(sessions, today);
  const insights = trainingInsights(sessions, today);
  const medals = trainingMedals(sessions, today, plannedPerWeek, program);
  const vd = delta(review.current.volume, review.previous.volume);

  return (
    <>
      <section className="glass rise p-5 mt-4">
        <p className="text-[10px] font-semibold tracking-[.3em] text-muted">PHYSICAL ATTRIBUTES</p>
        <div className="grid grid-cols-2 gap-2.5 mt-3">
          {(Object.keys(PHYS) as PhysKey[]).map((k) => {
            const v = attrs[k], p = PHYS[k];
            return (
              <div key={k} className="rounded-2xl p-3 border border-white/[.06]" style={{ background: `linear-gradient(160deg, ${p.color}16, #111113 70%)` }}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[10px] font-bold tracking-[.1em] uppercase truncate" style={{ color: p.color }}>{p.label}</p>
                  <p className="num text-2xl leading-none">{v == null ? <span className="text-faint">—</span> : <CountUp value={v} />}</p>
                </div>
                <div className="h-1.5 rounded-full bg-white/[.07] mt-2 overflow-hidden"><div className="h-full rounded-full bar-grow" style={{ width: `${Math.max(2, v ?? 0)}%`, background: p.color, boxShadow: `0 0 10px ${p.color}` }} /></div>
                <p className="text-[11px] text-muted mt-1.5 leading-snug">{p.pt} · {v == null ? "sem dados ainda" : p.hint}</p>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-faint mt-3">Calculados a partir dos seus registros. Força usa o 1RM estimado de agachamento, supino e terra ({attrs.detail.total} kg) dividido pelo seu peso.</p>
      </section>

      <section className="glass rise p-5 mt-4">
        <p className="text-[10px] font-semibold tracking-[.3em] text-muted">REVISÃO DA SEMANA</p>
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="rounded-2xl bg-[#141416] p-3"><p className="num text-2xl"><CountUp value={review.current.sessions} /></p><p className="text-[11px] text-muted">treinos · antes {review.previous.sessions}</p></div>
          <div className="rounded-2xl bg-[#141416] p-3"><p className="num text-2xl">{fmtT(review.current.volume)}</p><p className="text-[11px]" style={{ color: vd == null ? "#8e8e93" : vd >= 0 ? "#30d158" : "#ff9f0a" }}>{vd == null ? "volume" : `${vd >= 0 ? "▲" : "▼"} ${Math.abs(vd)}% volume`}</p></div>
          <div className="rounded-2xl bg-[#141416] p-3"><p className="num text-2xl"><CountUp value={review.current.cardio} /></p><p className="text-[11px] text-muted">min de cardio</p></div>
        </div>
        {review.prs.length > 0 && (
          <ul className="mt-3 grid gap-1.5">
            {review.prs.map((p, i) => <li key={i} className="flex items-center gap-2 rounded-xl px-3 min-h-10 text-sm" style={{ background: "#ffb34014" }}>
              <span>🏆</span><span className="flex-1">{p.exercise}</span><span className="num" style={{ color: "#ffb340" }}>{p.kg} × {p.reps}</span><span className="text-xs text-muted num">1RM ~{p.e1rm}</span></li>)}
          </ul>
        )}
      </section>

      <section className="rise mt-4 rounded-[22px] p-5 border border-white/[.07]" style={{ background: "linear-gradient(160deg, #1a0b0b, #0f0f11 60%)" }}>
        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full breathe" style={{ background: "#ab2424", boxShadow: "0 0 10px #ab2424" }} />
          <p className="text-[10px] font-semibold tracking-[.3em]" style={{ color: "#e05252" }}>ASCENSION INTELLIGENCE</p></div>
        {insights.length === 0 ? <p className="text-sm text-muted mt-3">Ainda não há histórico suficiente para análises. Elas aparecem conforme você registra treinos (tendências pedem algumas semanas).</p> : (
          <ul className="grid gap-2.5 mt-3">
            {insights.map((x, i) => (
              <li key={i} className="rounded-2xl p-3.5 border-l-2" style={{ background: "#141416", borderColor: x.kind === "progresso" ? "#30d158" : x.kind === "atencao" ? "#ff9f0a" : "#64d2ff" }}>
                <p className="text-sm font-semibold">{x.title}</p><p className="text-[13px] text-muted mt-1 leading-snug">{x.text}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[10px] text-faint mt-3">Análise baseada no seu histórico. Não substitui avaliação profissional.</p>
      </section>

      <section className="glass rise p-5 mt-4">
        <div className="flex items-baseline justify-between"><p className="text-[10px] font-semibold tracking-[.3em] text-muted">MEDALHAS DE TREINO</p><p className="text-xs text-muted num">{medals.filter((m) => m.done).length}/{medals.length}</p></div>
        <div className="grid grid-cols-2 gap-2.5 mt-3">
          {medals.map((m) => (
            <div key={m.id} className={`relative overflow-hidden rounded-2xl p-3 border ${m.done ? "achv-shine" : ""}`} style={{ borderColor: m.done ? m.color + "88" : "rgba(255,255,255,.06)", background: m.done ? `linear-gradient(160deg, ${m.color}22, #111113 70%)` : "#111113" }}>
              <div className="flex flex-col items-start gap-1.5 min-w-0"><span className="shrink-0"><Medal color={m.color} done={m.done} /></span><p className={`min-w-0 text-[12px] font-bold uppercase leading-tight tracking-wide ${m.done ? "" : "text-muted"}`}>{m.name}</p></div>
              <p className="text-[11px] text-muted mt-2 leading-snug">{m.desc}</p>
              {!m.done && <><div className="h-1 rounded-full bg-white/[.06] mt-2 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.max(3, m.progress * 100)}%`, background: m.color }} /></div><p className="text-[10px] text-faint mt-1 num">{Math.floor(m.value)} / {m.target}</p></>}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
