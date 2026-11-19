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
    <section className="hunt-card relative p-5 lg:p-6 mb-4 span-all">
      <span aria-hidden className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: tone, boxShadow: `0 0 16px ${tone}` }} />
      <p className="label">Como fechar o mês</p>
      <p className="font-display text-3xl mt-1" style={{ color: tone }}>{msg.t}</p>
      <p className="text-[14px] text-white/70 mt-1 max-w-[60ch]">{msg.s}</p>
      {remaining > 0 && <>
        <p className="font-mono text-[12px] text-white/50 mt-3">Faltam {h(remaining)} em {r.daysLeft} dias · ≈ {r.perDay} min por dia · esperado até hoje: {h(p.expected)}</p>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[.06] border border-white/[.06] mt-4">
          {r.plans.map((x) => (
            <li key={x.id} className="bg-[#070a0e] p-4">
              <p className="font-semibold">{x.title}</p>
              <p className="font-mono text-[12px] text-[#f2dfae] mt-0.5">{x.block}</p>
              <p className="text-[13px] text-white/65 mt-1.5">{x.how}</p>
              <p className="text-[13px] mt-2"><b className="num text-xl text-[#9fd0f5]">{x.id === "diario" ? x.perSession : x.sessions}</b> <span className="text-white/55">{x.id === "diario" ? "min por dia" : x.sessions === 1 ? "saída" : "saídas"}</span></p>
              <p className="text-[11px] text-white/40 mt-0.5">{x.when}</p>
            </li>))}
        </ul>
      </>}
    </section>
  );
}
