import { ATTRS, RANKS, type Attr } from "@/lib/game";
import type { Game } from "@/lib/game-data";
import { shortDate, weekdayShort, dow } from "@/lib/date";

const KEYS = Object.keys(ATTRS) as Attr[];

function Radar({ values }: { values: Record<Attr, number> }) {
  const S = 340, C = S / 2, R = 100;
  const pt = (i: number, v: number) => { const a = (Math.PI * 2 * i) / KEYS.length - Math.PI / 2; return [C + Math.cos(a) * R * v, C + Math.sin(a) * R * v]; };
  const max = Math.max(20, ...KEYS.map((k) => values[k])) * 1.1;
  const poly = KEYS.map((k, i) => pt(i, values[k] / max).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="w-full max-w-[360px] mx-auto" role="img" aria-label="Radar de atributos">
      <defs><radialGradient id="rg"><stop offset="0" stopColor="#f3d48a" stopOpacity=".55" /><stop offset="1" stopColor="#e0ac53" stopOpacity=".15" /></radialGradient></defs>
      {[0.25, 0.5, 0.75, 1].map((f) => <polygon key={f} points={KEYS.map((_, i) => pt(i, f).join(",")).join(" ")} fill="none" stroke="rgba(255,255,255,.07)" />)}
      {KEYS.map((_, i) => { const [x, y] = pt(i, 1); return <line key={i} x1={C} y1={C} x2={x} y2={y} stroke="rgba(255,255,255,.06)" />; })}
      <polygon points={poly} fill="url(#rg)" stroke="#e0ac53" strokeWidth="2" strokeLinejoin="round" className="radar-in" />
      {KEYS.map((k, i) => { const [x, y] = pt(i, values[k] / max); return <circle key={k} cx={x} cy={y} r="4" fill={ATTRS[k].color} stroke="#07080b" strokeWidth="2" />; })}
      {KEYS.map((k, i) => { const [x, y] = pt(i, 1.24); return <text key={k} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="#9a978f">{ATTRS[k].label} <tspan fill="#ece8df" fontWeight="600">{values[k]}</tspan></text>; })}
    </svg>
  );
}

export function StatusSheet({ g }: { g: Game }) {
  const nextRank = RANKS.find((r) => r.min > g.level);
  const maxWeek = Math.max(1, ...g.week.map((w) => w.xp));
  const done = g.achievements.filter((a) => a.done).length;
  return (
    <>
      <section className="glass rise p-6 relative overflow-hidden text-center">
        <div className="absolute left-1/2 -top-24 -translate-x-1/2 h-64 w-64 rounded-full blur-3xl opacity-30" style={{ background: g.rank.color }} />
        <p className="label relative" style={{ color: g.rank.color }}>Patente · {g.rank.name}</p>
        <p className="font-display text-7xl mt-2 relative leading-none">{g.level}</p>
        <p className="label mt-1 relative">nível</p>
        <div className="mt-5 h-3 rounded-full bg-white/[.07] overflow-hidden relative">
          <div className="h-full rounded-full xp-shine" style={{ width: `${g.progress * 100}%`, background: `linear-gradient(90deg, ${g.rank.color}, #f3d48a)` }} />
        </div>
        <div className="flex justify-between text-xs text-muted mt-1.5 num relative">
          <span>{g.into.toLocaleString("pt-BR")} / {g.need.toLocaleString("pt-BR")} XP</span><span>{g.total.toLocaleString("pt-BR")} XP no total</span>
        </div>
        {nextRank && <p className="text-sm text-muted mt-3 relative">Próxima patente: <span style={{ color: nextRank.color }}>{nextRank.name}</span> no nível {nextRank.min}</p>}
      </section>

      <section className="glass rise p-5 mt-4">
        <p className="label mb-2">Atributos</p>
        <Radar values={g.attrs} />
        <ul className="grid gap-3 mt-2">
          {KEYS.map((k) => (
            <li key={k}>
              <div className="flex items-baseline gap-2 text-sm"><span style={{ color: ATTRS[k].color }}>{ATTRS[k].label}</span><span className="text-faint text-xs flex-1">{ATTRS[k].hint}</span><span className="num">{g.attrs[k]}</span></div>
              <div className="h-1.5 rounded-full bg-white/[.06] mt-1 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${g.attrs[k]}%`, background: ATTRS[k].color }} /></div>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass rise p-5 mt-4">
        <div className="flex justify-between items-baseline"><p className="label">XP da semana</p><p className="num text-sm">{g.week.reduce((s, w) => s + w.xp, 0).toLocaleString("pt-BR")} XP</p></div>
        <div className="flex items-end gap-2 h-28 mt-3">
          {g.week.map((w) => (
            <div key={w.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              {w.xp > 0 && <span className="text-[10px] num text-muted">{w.xp}</span>}
              <div className="w-full rounded-md" style={{ height: `${(w.xp / maxWeek) * 80}%`, minHeight: 3, background: w.date === g.week.at(-1)!.date ? "linear-gradient(180deg,#f3d48a,#e0ac53)" : "rgba(224,172,83,.35)" }} />
              <span className="text-[10px] text-muted">{weekdayShort[dow(w.date)]}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="glass rise p-5 mt-4">
        <div className="flex justify-between items-baseline mb-3"><p className="label">Conquistas</p><p className="text-sm num text-muted">{done}/{g.achievements.length}</p></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {g.achievements.map((a) => (
            <div key={a.id} className={`rounded-2xl p-3 border ${a.done ? "" : "opacity-60"}`} style={{ borderColor: a.done ? ATTRS[a.attr].color + "66" : "rgba(255,255,255,.06)", background: a.done ? `linear-gradient(160deg, ${ATTRS[a.attr].color}22, transparent)` : "rgba(255,255,255,.02)" }}>
              <div className="flex items-center gap-2">
                <span className="h-7 w-7 rounded-full grid place-items-center text-sm shrink-0" style={{ background: a.done ? ATTRS[a.attr].color : "rgba(255,255,255,.06)", color: a.done ? "#120f08" : "#5d5b56" }}>{a.done ? "★" : "☆"}</span>
                <p className="text-sm font-medium leading-tight">{a.title}</p>
              </div>
              <p className="text-[11px] text-muted mt-1.5 leading-snug">{a.desc}</p>
              {!a.done && <div className="h-1 rounded-full bg-white/[.06] mt-2 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${a.progress * 100}%`, background: ATTRS[a.attr].color }} /></div>}
            </div>
          ))}
        </div>
      </section>

      <section className="glass rise p-5 mt-4">
        <p className="label mb-2">Últimos ganhos</p>
        {g.recent.length === 0 ? <p className="font-display italic text-muted">Cumpra a primeira missão do dia para começar.</p> : (
          <ul>
            {g.recent.map((e, i) => (
              <li key={i} className="flex items-center gap-3 min-h-10 text-sm">
                <i className="h-2 w-2 rounded-full shrink-0" style={{ background: ATTRS[e.attr].color }} />
                <span className="flex-1 truncate">{e.label}</span>
                <span className="text-xs text-faint">{shortDate(e.date)}</span>
                <span className="num w-16 text-right" style={{ color: ATTRS[e.attr].color }}>+{e.xp}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <details className="glass rise p-5 mt-4">
        <summary className="label cursor-pointer min-h-9 flex items-center">Como ganhar XP</summary>
        <ul className="text-sm text-muted grid gap-1.5 mt-3">
          <li><b className="text-ink">Disciplina:</b> 10 por missão do dia · +50 no dia 100%</li>
          <li><b className="text-ink">Sabedoria:</b> 1 por minuto de estudo · 15 por capítulo da Bíblia · 1 a cada 2 páginas · 150 por livro concluído</li>
          <li><b className="text-ink">Serviço:</b> 1 a cada 2 minutos de campo (30 por hora)</li>
          <li><b className="text-ink">Força:</b> 1 a cada 100 kg de volume (até 300 por sessão) · 100 por recorde em agachamento, supino ou terra</li>
          <li><b className="text-ink">Vigor:</b> 20 por meta de água · 15 por noite de 7h+ · 30 por cardio</li>
          <li><b className="text-ink">Ordem:</b> 5 por lançamento (até 150/mês) · 150 por mês fechado com 10%+ de sobra</li>
        </ul>
        <p className="text-xs text-faint mt-3">Tudo vem dos seus registros reais. Não há XP de graça: o nível mede o que você fez.</p>
      </details>
    </>
  );
}
