import { ASCENSION_CREED, ATTRS, RANKS, RARITY, TITLES, rankIndex, type Attr } from "@/lib/game";
import { Insignia, TitleBadge } from "./insignia";
import type { Game } from "@/lib/game-data";
import { shortDate, weekdayShort, dow } from "@/lib/date";
import { CountUp } from "@/components/count-up";

const KEYS = Object.keys(ATTRS) as Attr[];

function Radar({ values }: { values: Record<Attr, number> }) {
  const S = 340, C = S / 2, R = 100;
  const pt = (i: number, v: number) => { const a = (Math.PI * 2 * i) / KEYS.length - Math.PI / 2; return [C + Math.cos(a) * R * v, C + Math.sin(a) * R * v]; };
  const max = Math.max(20, ...KEYS.map((k) => values[k])) * 1.1;
  const poly = KEYS.map((k, i) => pt(i, values[k] / max).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="w-full max-w-[360px] mx-auto" role="img" aria-label="Radar de atributos">
      <defs><radialGradient id="rg"><stop offset="0" stopColor="#ffd27a" stopOpacity=".55" /><stop offset="1" stopColor="#ffb340" stopOpacity=".15" /></radialGradient></defs>
      {[0.25, 0.5, 0.75, 1].map((f) => <polygon key={f} points={KEYS.map((_, i) => pt(i, f).join(",")).join(" ")} fill="none" stroke="rgba(255,255,255,.07)" />)}
      {KEYS.map((_, i) => { const [x, y] = pt(i, 1); return <line key={i} x1={C} y1={C} x2={x} y2={y} stroke="rgba(255,255,255,.06)" />; })}
      <polygon points={poly} fill="url(#rg)" stroke="#ffb340" strokeWidth="2" strokeLinejoin="round" className="radar-in" />
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
        <p className="text-[10px] font-semibold tracking-[.32em] text-muted relative">ASCENSION · THE PATH OF MASTERY</p>
        <div className="relative mx-auto w-fit mt-3 emblem-spin"><Insignia index={rankIndex(g.level)} size={150} /></div>
        <p className="text-3xl font-bold tracking-[.08em] uppercase mt-3 text-glow relative" style={{ color: g.rank.color, ["--glow" as string]: g.rank.color } as React.CSSProperties}>{g.rank.name}</p>
        <p className="text-sm text-ink/80 relative">{g.rank.pt} · nível <CountUp value={g.level} /></p>
        <p className="text-sm italic text-muted mt-2 relative">“{g.rank.motto}”</p>
        <div className="mt-5 h-3 rounded-full bg-white/[.07] overflow-hidden relative">
          <div className="h-full rounded-full xp-shine bar-grow" style={{ width: `${Math.max(2, g.progress * 100)}%`, background: `linear-gradient(90deg, ${g.rank.color}, #ffd27a)`, boxShadow: `0 0 16px ${g.rank.color}` }} />
        </div>
        <div className="flex justify-between text-xs text-muted mt-1.5 num relative">
          <span><CountUp value={g.into} /> / {g.need.toLocaleString("pt-BR")} XP</span><span><CountUp value={g.total} duration={1400} /> XP no total</span>
        </div>
        {nextRank && <p className="text-sm text-muted mt-3 relative">Próxima patente: <span style={{ color: nextRank.color }}>{nextRank.name}</span> no nível {nextRank.min}</p>}
      </section>

      <section className="rise mt-4 rounded-[24px] p-5 text-center border border-white/[.06]" style={{ background: "linear-gradient(160deg, #1a0b0b, #0d0d0d 70%)" }}>
        <p className="text-[10px] font-semibold tracking-[.3em]" style={{ color: "#c6a15b" }}>O CREDO</p>
        <p className="font-display text-xl mt-2 leading-snug">{ASCENSION_CREED}</p>
        <p className="text-xs text-muted mt-2">Você não compete com ninguém. Está construindo alguém que possa respeitar.</p>
      </section>

      <section className="glass rise p-5 mt-4">
        <p className="label mb-4">A jornada · 10 patentes</p>
        <ol className="grid gap-2.5">
          {RANKS.map((r, i) => {
            const cur = i === rankIndex(g.level), got = g.level >= r.min, nextMin = RANKS[i + 1]?.min;
            return (
              <li key={r.name} className={`relative flex gap-4 rounded-2xl p-3.5 border transition-all ${got ? "" : "opacity-55"}`}
                style={{ borderColor: cur ? r.color : "rgba(255,255,255,.06)", background: cur ? `linear-gradient(160deg, ${r.color}24, #0f0f11 70%)` : "#0f0f11", boxShadow: cur ? `0 0 30px -12px ${r.color}` : undefined }}>
                <div className="shrink-0"><Insignia index={i} size={58} locked={!got} glow={cur} /></div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-[11px] num text-faint">{String(i + 1).padStart(2, "0")}</span>
                    <span className="font-bold tracking-[.08em] uppercase" style={{ color: got ? r.color : undefined }}>{r.name}</span>
                    <span className="text-xs text-muted">— {r.pt}</span>
                    {cur && <span className="tag" style={{ color: r.color }}>você</span>}
                  </div>
                  <p className="text-[13px] text-muted mt-1 leading-snug">{r.meaning}</p>
                  <p className="text-xs italic mt-1.5" style={{ color: got ? r.color : "#84848a" }}>“{r.motto}”</p>
                  <p className="text-[10px] text-faint mt-1 num">Nível {r.min}{nextMin ? `–${nextMin - 1}` : "+"}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="glass rise p-5 mt-4">
        <p className="label mb-1">Títulos extraordinários</p>
        <p className="text-xs text-faint mb-4">Distinções raras, além da patente.</p>
        <div className="grid gap-3">
          {TITLES.map((t) => {
            const earned = g.titles?.find((x) => x.id === t.id)?.earned ?? false;
            return (
              <div key={t.id} className={`flex items-center gap-4 rounded-2xl p-3.5 border ${earned ? "achv-shine relative overflow-hidden" : ""}`}
                style={{ borderColor: earned ? t.color : "rgba(255,255,255,.06)", background: earned ? `linear-gradient(160deg, ${t.color}26, #0f0f11 70%)` : "#0f0f11" }}>
                <TitleBadge id={t.id} size={58} locked={!earned} />
                <div className="min-w-0">
                  <p className="font-bold tracking-[.12em] uppercase" style={{ color: earned ? t.color : "#8e8e93" }}>{t.name}</p>
                  <p className="text-[13px] text-muted leading-snug mt-0.5">{t.meaning}</p>
                  <p className="text-[11px] mt-1" style={{ color: earned ? "#30d158" : "#84848a" }}>{earned ? "Conquistado" : t.rule}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="glass rise p-5 mt-4">
        <p className="label mb-2">Atributos</p>
        <Radar values={g.attrs} />
        <ul className="grid gap-3 mt-2 stagger">
          {KEYS.map((k) => (
            <li key={k}>
              <div className="flex items-baseline gap-2 text-sm"><span style={{ color: ATTRS[k].color }}>{ATTRS[k].label}</span><span className="text-faint text-xs flex-1">{ATTRS[k].hint}</span><span className="num">{g.attrs[k]}</span></div>
              <div className="h-1.5 rounded-full bg-white/[.06] mt-1 overflow-hidden"><div className="h-full rounded-full bar-grow" style={{ width: `${Math.max(3, g.attrs[k])}%`, background: ATTRS[k].color, boxShadow: `0 0 10px ${ATTRS[k].color}` }} /></div>
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
              <div className="w-full rounded-md grow-up" style={{ height: `${(w.xp / maxWeek) * 80}%`, minHeight: 3, background: w.date === g.week.at(-1)!.date ? "linear-gradient(180deg,#ffd27a,#ffb340)" : "rgba(255,179,64,.35)" }} />
              <span className="text-[10px] text-muted">{weekdayShort[dow(w.date)]}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="glass rise p-5 mt-4">
        <div className="flex justify-between items-baseline mb-3"><p className="label">Conquistas</p><p className="text-sm num text-muted">{done}/{g.achievements.length}</p></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 stagger">
          {[...g.achievements].sort((x, y) => Number(y.done) - Number(x.done) || (["lendaria", "epica", "rara", "comum"].indexOf(x.rarity) - ["lendaria", "epica", "rara", "comum"].indexOf(y.rarity)) || y.progress - x.progress).map((a) => {
            const r = RARITY[a.rarity];
            return (
              <div key={a.id} className={`relative overflow-hidden rounded-2xl p-3 border ${a.done ? "achv-shine" : ""}`}
                style={{ borderColor: a.done ? r.color + "88" : "rgba(255,255,255,.06)", background: a.done ? `linear-gradient(160deg, ${r.color}26, #111113 70%)` : "#111113", boxShadow: a.done && a.rarity !== "comum" ? `0 8px 26px -12px ${r.color}` : undefined }}>
                <div className="flex items-center gap-2">
                  <span className="h-8 w-8 rounded-[10px] grid place-items-center text-sm shrink-0"
                    style={{ background: a.done ? r.color : "rgba(255,255,255,.05)", color: a.done ? "#000" : "#84848a", boxShadow: a.done ? `0 0 16px ${r.color}` : undefined }}>{a.done ? "★" : "☆"}</span>
                  <div className="min-w-0"><p className={`text-sm font-semibold leading-tight ${a.done ? "" : "text-muted"}`}>{a.title}</p>
                    <p className="text-[10px] font-medium mt-0.5" style={{ color: r.color }}>{r.label}</p></div>
                </div>
                <p className="text-[11px] text-muted mt-2 leading-snug">{a.desc}</p>
                {a.source && <p className="text-[10px] text-faint mt-1 italic">{a.source}</p>}
                {!a.done && (
                  <>
                    <div className="h-1 rounded-full bg-white/[.06] mt-2 overflow-hidden"><div className="h-full rounded-full bar-grow" style={{ width: `${Math.max(2, a.progress * 100)}%`, background: ATTRS[a.attr].color }} /></div>
                    <p className="text-[10px] text-faint mt-1 num">{Math.floor(a.value).toLocaleString("pt-BR")} / {a.target.toLocaleString("pt-BR")}</p>
                  </>
                )}
              </div>
            );
          })}
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
          <li><b className="text-ink">Disciplina:</b> 10 por missão do dia · +50 no dia 100% · 20 por dia limpo</li>
          <li><b className="text-ink">Sabedoria:</b> 1 por minuto de estudo · 15 por capítulo da Bíblia · 1 a cada 2 páginas · 150 por livro concluído</li>
          <li><b className="text-ink">Serviço:</b> 1 a cada 2 minutos de campo (30 por hora)</li>
          <li><b className="text-ink">Força:</b> 1 a cada 100 kg de volume (até 300 por sessão) · 100 por recorde em agachamento, supino ou terra</li>
          <li><b className="text-ink">Vigor:</b> 20 por meta de água · 15 por noite de 7h+ · 30 por cardio · 10 por refeição registrada · 25 por meta de proteína</li>
          <li><b className="text-ink">Ordem:</b> 5 por lançamento (até 150/mês) · 150 por mês fechado com 10%+ de sobra</li>
        </ul>
        <p className="text-xs text-faint mt-3">Tudo vem dos seus registros reais. Não há XP de graça: o nível mede o que você fez.</p>
      </details>
    </>
  );
}
