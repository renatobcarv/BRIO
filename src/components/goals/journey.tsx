import Image from "next/image";
import { HI, Ico } from "@/components/hunt-icons";
import { AREAS, AUTO, goalMilestones, goalStats, goalsXp, XP_DONE, XP_PER_MARK, XP_PER_PCT, type AreaKey, type GoalRow } from "@/lib/goals";

export const goalNumber = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
export const goalPercent = (pct: number) => pct >= 1 ? 100 : Math.min(99, Math.floor(pct * 100 + 1e-7));
export const goalInput = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2, useGrouping: false });

const AREA_STYLE = {
  espiritual: { color: "#f6ca80", art: "espiritual" },
  financeira: { color: "#8cd8bb", art: "financas" },
  fisica: { color: "#f2a688", art: "corpo" },
  carreira: { color: "#9dbdf5", art: "estudo" },
  pessoal: { color: "#dac2f1", art: "sonhos" },
};

export function JourneyHero({ goals, today, onCreate }: { goals: GoalRow[]; today: string; onCreate: () => void }) {
  const active = goals.filter((g) => goalStats(g, today).pct < 1);
  const arena = goalsXp(goals, today);
  const focus = active.find((g) => g.featured) ?? active[0];
  const next = focus && goalMilestones(focus, today).find((m) => !m.reached);

  return (
    <section className="relative isolate overflow-hidden rounded-[26px] border border-[#82aa90]/30 bg-[#14211c]">
      <Image src="/cards/metas-expedicao.webp" alt="" fill unoptimized priority className="object-cover object-[63%_center]" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-[#08100e]/95 via-[#08100e]/70 to-[#08100e]/15" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#08100e] via-transparent to-transparent" />
      <div className="relative grid gap-7 px-5 pb-5 pt-9 sm:px-8 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,.8fr)] lg:items-end">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-[#ffd389]"><Ico d={HI.flag} size={17} /> Seu mapa de progresso</p>
          <h1 className="mt-2 text-5xl font-semibold tracking-[-.055em] text-white sm:text-7xl">Metas</h1>
          <p className="mt-3 max-w-sm text-sm text-white/85 sm:text-lg">Escolha um destino, registre seus avanços e conquiste um marco de cada vez.</p>
          <button type="button" className="btn btn-accent mt-6 w-fit" onClick={onCreate}><Ico d={HI.plus} size={18} /> Nova meta</button>
        </div>
        {focus && next && (
          <a href="#jornadas" className="block rounded-2xl border border-white/20 bg-[#0d1714]/90 p-4 text-white transition-colors hover:border-[#ffe0a8]/60 sm:p-5">
            <span className="text-xs font-semibold text-[#ffce83]">{focus.featured ? "Meta em destaque" : "Próxima meta em andamento"}</span>
            <span className="mt-1 block text-xl font-semibold break-words">{focus.title}</span>
            <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/80">
              <strong className="text-white">{goalPercent(goalStats(focus, today).pct)}%</strong>
              Até {next.pct * 100}% · {next.title}
            </span>
          </a>
        )}
      </div>
      <div className="relative mx-5 mt-4 rounded-2xl border border-white/10 bg-[#0d1714]/90 p-4 sm:mx-8">
        <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm">
          <span className="font-semibold text-[#ffe0a8]">Nível {arena.level} · {arena.title}</span>
          <span className="text-white/80">{goalNumber(arena.xp)} XP de metas</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Progresso do nível de metas" aria-valuemin={0} aria-valuemax={100} aria-valuenow={goalPercent(arena.progress)}>
          <div className="h-full bg-[#ffcc81]" style={{ width: `${arena.progress * 100}%` }} />
        </div>
        <p className="mt-2 text-xs text-white/70">Faltam {goalNumber(arena.toNext)} XP para o nível {arena.level + 1}</p>
      </div>
      <dl className="relative mx-5 mb-5 mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 text-center sm:mx-8 sm:mb-8 sm:grid-cols-4">
        {[[active.length, "Em andamento"], [arena.done, "Conquistadas"], [arena.marks, "Marcos"], [arena.late, "Fora do ritmo"]].map(([value, label]) => (
          <div key={label} className="bg-[#0d1714]/95 px-2 py-3">
            <dt className="text-[11px] text-white/75 sm:text-xs">{label}</dt>
            <dd className="mt-0.5 text-2xl font-semibold tabular-nums text-[#ffe0a8]">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function JourneyCard({ goal, today, onEdit, onProgress }: {
  goal: GoalRow; today: string; onEdit: () => void; onProgress: () => void;
}) {
  const s = goalStats(goal, today);
  const milestones = goalMilestones(goal, today);
  const next = milestones.find((m) => !m.reached);
  const pct = goalPercent(s.pct);
  const { color, art } = AREA_STYLE[goal.area];
  const deadline = s.daysLeft;

  return (
    <article className="relative isolate flex min-w-0 flex-col overflow-hidden rounded-[22px] border border-white/10 bg-[#141416] p-4 sm:p-5"
      style={{ backgroundImage: `radial-gradient(ellipse at top right, ${color}1b, transparent 70%)` }}>
      <Image src={`/sobre/capas/${art}.webp`} alt="" width={360} height={225} unoptimized
        className="pointer-events-none absolute right-0 top-0 -z-10 h-[48%] w-3/5 object-cover opacity-35 [mask-image:linear-gradient(135deg,transparent_12%,#000_55%,transparent_95%)]" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold" style={{ color }}>
            {AREAS[goal.area].label}{goal.featured && <span>· Principal</span>}
          </p>
          <h3 className="mt-1 break-words text-xl font-semibold leading-tight sm:text-2xl">{goal.title}</h3>
          {goal.auto_source && <p className="mt-1 text-xs text-white/65">Automática · {AUTO[goal.auto_source].label}</p>}
        </div>
        <button className="btn !min-h-10 !px-3 text-xs" type="button" onClick={onEdit} aria-label={`Editar meta ${goal.title}`}>Editar</button>
      </div>
      <div className="mt-6 flex items-end justify-between gap-2">
        <div><p className="text-4xl font-semibold tabular-nums tracking-tight" style={{ color }}>{pct}%</p><p className="mt-1 text-sm text-white/75">{goalNumber(goal.current)} / {goalNumber(goal.target)} {goal.unit}</p></div>
        <span className="max-w-[54%] text-right text-xs text-white/70">{next ? `Faltam ${goalNumber(s.left)} ${goal.unit}` : "Meta conquistada"}</span>
      </div>
      <div role="progressbar" aria-label={`Progresso de ${goal.title}`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500" style={{ width: `${s.pct * 100}%`, background: color }} />
      </div>
      <ol className="mt-3 grid grid-cols-4 gap-1 text-center" aria-label="Marcos da meta">
        {milestones.map((m) => (
          <li key={m.pct} className="min-w-0">
            <Image src={`/medalhas/patentes/${m.art}.webp`} alt="" width={46} height={46} unoptimized
              className={`mx-auto h-10 w-10 object-contain ${m.reached ? "medal-motion" : "grayscale brightness-50"}`} />
            <span className="block text-xs font-semibold" style={{ color: m.reached ? color : "#99989f" }}>{m.pct * 100}%</span>
            <span className="sr-only"> · {m.title}{m.reached ? " · alcançado" : " · pendente"}</span>
          </li>
        ))}
      </ol>
      <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
        <p className="text-sm font-semibold text-white">{next ? `Próximo marco · ${next.title}` : "Todos os marcos conquistados"}</p>
        {next && <p className="mt-1 break-words text-xs text-white/70">Alvo do marco: {goalNumber(next.value)} {goal.unit} · +{next.pct === 1 ? XP_PER_MARK + XP_DONE : XP_PER_MARK} XP de bônus</p>}
        <p className="mt-0.5 text-[11px] text-[#ffb21e]">Cada 1% vale +{XP_PER_PCT} XP · já rendeu {goalsXp([goal], today).xp} XP</p>
        {deadline != null && next && (
          <p className={`mt-2 text-xs ${s.late ? "text-[#ffad96]" : "text-white/65"}`}>
            {deadline < 0 ? `Prazo vencido há ${-deadline} dias` : deadline === 0 ? "Prazo hoje" : `${deadline} dias até o prazo`}
            {s.perWeek != null && ` · ritmo: ${goalNumber(s.perWeek)} ${goal.unit}/semana`}
          </p>
        )}
      </div>
      {!goal.auto_source && (
        <div className="mt-auto pt-4"><button type="button" className="btn w-full" onClick={onProgress}>
          <Ico d={HI.chart} size={16} /> Registrar progresso
        </button></div>
      )}
    </article>
  );
}

export function JourneyRewards({ goals, today }: { goals: GoalRow[]; today: string }) {
  if (!goals.length) return null;
  const stats = goals.map((goal) => ({ goal, progress: goalStats(goal, today).pct }));
  const completed = stats.filter((entry) => entry.progress >= 1);
  const areas = (Object.keys(AREAS) as AreaKey[]).flatMap((area) => {
    const entries = stats.filter(({ goal }) => goal.area === area);
    if (!entries.length) return [];
    const progress = entries.reduce((sum, entry) => sum + entry.progress, 0) / entries.length;
    return [{ area, progress }];
  });

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <section className="rounded-2xl border border-white/10 bg-[#141416] p-4 sm:p-5" aria-label="Progresso por área">
        <h2 className="text-lg font-semibold">Progresso por área</h2>
        <ul className="mt-3 grid gap-3">
          {areas.map(({ area, progress }) => (
            <li key={area}>
              <div className="flex justify-between gap-3 text-sm"><span>{AREAS[area].label}</span><span className="tabular-nums text-white/75">{goalPercent(progress)}%</span></div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden>
                <div className="h-full rounded-full" style={{ background: AREA_STYLE[area].color, width: `${progress * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-2xl border border-white/10 bg-[#141416] p-4 sm:p-5" aria-label="Estante de troféus">
        <h2 className="text-lg font-semibold">Estante de troféus</h2>
        {completed.length ? (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {completed.map(({ goal }) => (
              <li key={goal.id} className="flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-2">
                <Image src="/medalhas/patentes/9.webp" alt="" width={42} height={42} unoptimized className="medal-motion h-10 w-10 shrink-0 object-contain" />
                <span className="break-words text-sm font-medium">{goal.title}</span>
              </li>
            ))}
          </ul>
        ) : <p className="mt-3 text-sm text-white/70">Seu primeiro troféu aparece quando você completa uma meta.</p>}
      </section>
    </div>
  );
}
