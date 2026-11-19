import { MEDALS, medalState, TIER_COLOR, type Stats } from "@/lib/reading-medals";

/** Medalhas de leitura: o que fazer para ganhar, nível atual e progresso. */
export function ReadingMedals({ stats }: { stats: Stats }) {
  const all = MEDALS.map((m) => ({ m, s: medalState(m, stats[m.id] ?? 0) }));
  const earned = all.reduce((a, x) => a + x.s.level, 0), total = MEDALS.reduce((a, m) => a + m.tiers.length, 0);
  const close = all.filter((x) => !x.s.maxed).sort((a, b) => b.s.progress - a.s.progress).slice(0, 3);
  return (
    <section className="hunt-card p-5 lg:p-6 mb-4 span-all">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="label">Medalhas de leitura</p><p className="font-display text-4xl mt-1">Adquira suas medalhas<span className="text-[#ffb21e]">.</span></p></div>
        <p className="num text-4xl" style={{ color: "#ffb21e" }}>{earned}<span className="text-lg text-white/40">/{total}</span></p>
      </div>
      <div className="grid sm:grid-cols-3 gap-2 mt-4">
        {close.map(({ m, s }) => (
          <div key={m.id} className="border border-[#ffb21e44] bg-[#ffb21e0a] rounded-[8px] p-3">
            <p className="label !text-[9px] !text-[#ffb21e]">Quase lá</p>
            <p className="text-[14px] font-semibold mt-1"><span className="pet-glyph mr-1.5">{m.icon}</span>{m.how(s.next!.n)}</p>
            <div className="h-[5px] bg-white/10 mt-2"><i className="block h-full" style={{ width: `${s.progress * 100}%`, background: TIER_COLOR[s.next!.name] }} /></div>
            <p className="font-mono text-[11px] text-white/50 mt-1">{s.value.toLocaleString("pt-BR")} / {s.next!.n.toLocaleString("pt-BR")} {m.unit} · {s.next!.name}</p>
          </div>))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 mt-4">
        {all.map(({ m, s }) => { const c = s.tier ? TIER_COLOR[s.tier] : "#3a3a3c"; return (
          <div key={m.id} className={`relative rounded-[8px] border p-3 ${s.tier ? "border-white/10 bg-[#0b0b0b]" : "border-white/[.05] bg-[#070707]"}`}>
            <div className="flex items-center gap-3">
              <span className="relative grid place-items-center h-12 w-12 rounded-full shrink-0" style={{ background: `radial-gradient(circle, ${c}33, transparent 70%)`, boxShadow: s.tier ? `inset 0 0 0 2px ${c}` : "inset 0 0 0 1px #2a2a2c" }}>
                <span className="pet-glyph text-[22px]" style={s.tier ? undefined : { filter: "grayscale(1) brightness(.5)" }}>{m.icon}</span>
              </span>
              <div className="min-w-0">
                <p className="text-[13.5px] font-semibold leading-tight">{m.title}</p>
                <p className="text-[10.5px] font-mono mt-0.5" style={{ color: s.tier ? c : "#6b6b70" }}>{s.tier ?? "Bloqueada"}{s.level ? ` · ${s.level}/${m.tiers.length}` : ""}</p>
              </div>
            </div>
            <p className="text-[12px] text-white/60 mt-2.5 leading-snug">{s.maxed ? "Nível máximo. Lendário." : m.how(s.next!.n)}</p>
            {!s.maxed && <><div className="flex gap-[2px] mt-2">{m.tiers.map((t, i) => <i key={i} className="h-[4px] flex-1" style={{ background: s.value >= t.n ? TIER_COLOR[t.name] : i === s.level ? `linear-gradient(90deg, ${TIER_COLOR[t.name]} ${s.progress * 100}%, rgba(255,255,255,.08) ${s.progress * 100}%)` : "rgba(255,255,255,.08)" }} />)}</div>
              <p className="font-mono text-[10.5px] text-white/40 mt-1">{s.value.toLocaleString("pt-BR")} / {s.next!.n.toLocaleString("pt-BR")} {m.unit}</p></>}
          </div>); })}
      </div>
    </section>
  );
}
