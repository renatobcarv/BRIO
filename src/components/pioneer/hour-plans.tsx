import { hourPlans, pace } from "@/lib/pioneer";

const h = (m: number) => { const x = Math.round(m); return `${Math.floor(x / 60)}h${x % 60 ? String(x % 60).padStart(2, "0") : ""}`; };

/** Como fechar as horas do mês: ritmo, aviso e formas concretas de fazer. */
export function HourPlans({ doneMin, goalMin, today, monthEndISO }: { doneMin: number; goalMin: number; today: string; monthEndISO: string }) {
  const remaining = Math.max(0, goalMin - doneMin);
  const dayN = Number(today.slice(8, 10)), dim = Number(monthEndISO.slice(8, 10));
  const p = pace(doneMin, goalMin, dayN, dim), r = hourPlans(remaining, today, monthEndISO);
  const msg = remaining === 0 ? { t: "Meta do mês cumprida.", s: "Você honrou o seu trato com Jeová este mês. O que fizer a mais é oferta voluntária, com alegria." }
    : p.state === "atrasado" ? { t: "Honre seu trato com Jeová.", s: `Você está ${h(-p.diff)} atrás do ritmo. Ainda dá: escolha uma das formas abaixo e marque na agenda hoje.` }
    : p.state === "no limite" ? { t: "No limite do ritmo.", s: "Uma saída a mais esta semana deixa o mês tranquilo." }
    : { t: "Ritmo em dia.", s: `${h(p.diff)} à frente do esperado. Mantenha a constância.` };
  const tone = remaining === 0 || p.state === "adiantado" ? "#9fd0f5" : p.state === "atrasado" ? "#f2b8a0" : "#f2dfae";
  return (
    <section className="hunt-card relative p-4 lg:p-5 mb-4 span-all">
      <span aria-hidden className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: tone, boxShadow: `0 0 16px ${tone}` }} />
      <p className="label">Como fechar o mês</p>
      <p className="font-display text-2xl mt-1" style={{ color: tone }}>{msg.t}</p>
      <p className="text-[13px] text-white/65 mt-0.5 max-w-[60ch]">{msg.s}</p>
      {remaining > 0 && (() => {
        const fits = r.plans.filter((x) => x.id !== "diario" && !x.when.startsWith("precisa")).sort((a, b) => a.sessions - b.sessions);
        const top = [...fits.slice(0, 2), ...r.plans.filter((x) => x.id === "diario")].slice(0, 3);
        const rest = r.plans.filter((x) => !top.includes(x));
        const Row = ({ x }: { x: (typeof r.plans)[number] }) => (
          <li className="flex items-baseline gap-3 py-2">
            <b className="num text-lg text-[#9fd0f5] w-12 shrink-0 text-right">{x.id === "diario" ? x.perSession : x.sessions}</b>
            <span className="text-[11px] text-white/45 w-14 shrink-0">{x.id === "diario" ? "min/dia" : x.sessions === 1 ? "saída" : "saídas"}</span>
            <span className="min-w-0 text-[13.5px]"><span className="font-semibold">{x.title}</span> <span className="font-mono text-[11.5px] text-[#f2dfae]">{x.block}</span><span className="block text-[12px] text-white/50 truncate">{x.how}</span></span>
          </li>);
        return <>
          <p className="font-mono text-[11.5px] text-white/50 mt-2">Faltam {h(remaining)} · {r.daysLeft} dias · ≈ {r.perDay} min/dia</p>
          <ul className="mt-2 divide-y divide-white/[.06]">{top.map((x) => <Row key={x.id} x={x} />)}</ul>
          {rest.length > 0 && <details className="mt-1"><summary className="text-[12px] text-white/50 cursor-pointer min-h-9 flex items-center">Ver outras formas ({rest.length})</summary><ul className="divide-y divide-white/[.06]">{rest.map((x) => <Row key={x.id} x={x} />)}</ul></details>}
        </>;
      })()}
    </section>
  );
}
