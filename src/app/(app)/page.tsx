import Link from "next/link";
import { Verse } from "@/components/ui";
import { Checklist } from "@/components/home/checklist";
import { DailyText } from "@/components/home/daily-text";
import { Greeting } from "@/components/home/greeting";
import { Partner } from "@/components/home/partner";
import { Streak } from "@/components/home/streak";
import { addDays, brl, monthLabel, monthStart, todayISO, toHMM } from "@/lib/date";
import { getSettings } from "@/lib/settings";
import { computeStreak } from "@/lib/streak";
import { signedPhoto } from "@/lib/storage";
import { goalStats, AREAS, type GoalRow } from "@/lib/goals";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const f1 = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

function Mini({ href, label, value, sub, color, pct }: { href: string; label: string; value: string; sub?: string; color: string; pct?: number }) {
  return (
    <Link href={href} className="glass rise p-4 block">
      <p className="label" style={{ color }}>{label}</p>
      <p className="num text-2xl mt-2 leading-none">{value}</p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
      {pct != null && <div className="bar mt-3" style={{ height: 4 }}><i style={{ width: `${Math.min(100, pct * 100)}%`, background: color }} /></div>}
    </Link>
  );
}

export default async function Hoje() {
  const sb = await createClient();
  const today = todayISO();
  const month = monthStart(today);
  const [s, checks, streakQ, pioneer, pGoal, water, weight, fin, goals, refl] = await Promise.all([
    getSettings(sb),
    sb.from("daily_checks").select("date,item_key").gte("date", addDays(today, -400)).eq("done", true),
    sb.from("streaks").select("*").maybeSingle(),
    sb.from("pioneer_entries").select("minutes").gte("date", month).lte("date", today),
    sb.from("pioneer_month_goals").select("goal_minutes").eq("month", month).maybeSingle(),
    sb.from("water_logs").select("ml").eq("date", today),
    sb.from("weight_logs").select("kg,date").order("date", { ascending: false }).limit(1).maybeSingle(),
    sb.from("finance_items").select("kind,amount,category,paid").eq("month", month),
    sb.from("goals").select("*").order("featured", { ascending: false }).order("deadline", { nullsFirst: false }).limit(3),
    sb.from("journal_entries").select("id").eq("date", today).like("text", "Texto do dia:%").limit(1),
  ]);

  // Sequência
  const keys = s.checklist.map((c) => c.key);
  const byDay = new Map<string, Set<string>>();
  for (const c of checks.data ?? []) { if (!byDay.has(c.date)) byDay.set(c.date, new Set()); byDay.get(c.date)!.add(c.item_key); }
  const complete = new Set([...byDay].filter(([, set]) => keys.every((k) => set.has(k))).map(([d]) => d));
  const st = streakQ.data;
  const excused = new Set<string>(st?.excused_dates ?? []);
  const count = computeStreak({ today, completeDays: complete, excused, resetDate: st?.last_date ?? null });
  const best = Math.max(st?.best ?? 0, count);
  if (st && best > st.best) await sb.from("streaks").update({ best, count }).eq("id", st.id);

  // Finanças do mês
  const items = (fin.data ?? []).map((f) => ({ ...f, amount: Number(f.amount) }));
  const income = items.filter((f) => f.kind === "receita").reduce((a, f) => a + f.amount, 0);
  const spent = items.filter((f) => f.kind !== "receita").reduce((a, f) => a + f.amount, 0);
  const pending = items.filter((f) => f.kind !== "receita" && f.paid === false).reduce((a, f) => a + f.amount, 0);
  const left = income - spent;
  const catMap = new Map(s.finance_categories.map((c) => [c.key, c]));
  const byCat = new Map<string, number>();
  for (const f of items.filter((f) => f.kind !== "receita")) byCat.set(f.category ?? "outros", (byCat.get(f.category ?? "outros") ?? 0) + f.amount);
  const topCats = [...byCat].sort((a, b) => b[1] - a[1]).slice(0, 3);

  // Outros resumos
  const pMin = (pioneer.data ?? []).reduce((a, r) => a + r.minutes, 0);
  const pGoalMin = pGoal.data?.goal_minutes ?? s.pioneer_goal_minutes;
  const ml = (water.data ?? []).reduce((a, r) => a + r.ml, 0);
  const kg = weight.data ? Number(weight.data.kg) : null;
  const goalList = (goals.data ?? []).map((g) => ({ ...g, target: Number(g.target), current: Number(g.current), start_value: Number(g.start_value) }) as GoalRow);
  const photo = await signedPhoto(sb, s.partner_photo_path);
  const dailyText = s.daily_text_date === today ? s.daily_text ?? "" : "";

  return (
    <>
      <Greeting name="Renato" />

      {/* Relatório financeiro */}
      <Link href="/financas" className="glass rise block p-5" style={{ ["--accent" as string]: "#d9c49a" }}>
        <div className="flex items-center justify-between"><p className="label" style={{ color: "#d9c49a" }}>Finanças · <span className="capitalize">{monthLabel(month)}</span></p><span className="text-muted text-sm">ver ›</span></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-3 mt-3">
          <div><p className="label">Entrou</p><p className="num text-lg md:text-xl" style={{ color: "#8ac295" }}>{brl(income)}</p></div>
          <div><p className="label">Saiu</p><p className="num text-lg md:text-xl">{brl(spent)}</p></div>
          <div className="col-span-2 sm:col-span-1"><p className="label">Sobra</p><p className="num text-2xl md:text-xl" style={{ color: left >= 0 ? "#d9c49a" : "#e8a39a" }}>{brl(left)}</p></div>
        </div>
        <div className="bar mt-4" style={{ height: 6 }}><i style={{ width: `${income ? Math.min(100, (spent / income) * 100) : 0}%`, background: spent > income ? "#e8a39a" : "#d9c49a" }} /></div>
        <div className="flex justify-between text-xs text-muted mt-1.5">
          <span>{income ? `${Math.round((spent / income) * 100)}% da renda usada` : "Sem receitas lançadas"}</span>
          <span>Poupança {income ? Math.round((left / income) * 100) : 0}%</span>
        </div>
        {(topCats.length > 0 || pending > 0) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {topCats.map(([k, v]) => <span key={k} className="tag"><i className="h-2 w-2 rounded-full" style={{ background: catMap.get(k)?.color ?? "#9a978f" }} />{catMap.get(k)?.label ?? k} {brl(v)}</span>)}
            {pending > 0 && <span className="tag" style={{ color: "#e8a39a" }}>A pagar {brl(pending)}</span>}
          </div>
        )}
      </Link>

      {/* Metas */}
      <Link href="/metas" className="glass rise block p-5 mt-4">
        <div className="flex items-center justify-between"><p className="label" style={{ color: "#ac8fd6" }}>Metas</p><span className="text-muted text-sm">ver ›</span></div>
        {goalList.length === 0 ? <p className="font-display italic text-muted text-lg mt-2">Defina sua primeira meta.</p> : (
          <ul className="grid gap-4 mt-3">
            {goalList.map((g) => {
              const st = goalStats(g, today), c = AREAS[g.area]?.color ?? "#ac8fd6";
              return (
                <li key={g.id}>
                  <div className="flex justify-between gap-3 text-sm"><span className="truncate">{g.title}</span><span className="num shrink-0" style={{ color: c }}>{Math.round(st.pct * 100)}%</span></div>
                  <div className="bar mt-1.5" style={{ height: 5 }}><i style={{ width: `${st.pct * 100}%`, background: c }} /></div>
                  <p className="text-xs text-muted mt-1">{st.left > 0 ? `faltam ${f1(st.left)} ${g.unit}` : "concluída"}{st.daysLeft != null && st.left > 0 ? ` · ${st.daysLeft} dias` : ""}{st.late ? " · atrasada" : ""}</p>
                </li>
              );
            })}
          </ul>
        )}
      </Link>

      <div className="mt-4"><Checklist date={today} items={s.checklist} done={[...(byDay.get(today) ?? [])]} /></div>
      <Streak count={count} best={best} excusedToday={excused.has(today)} />

      <div className="grid grid-cols-3 gap-3 mt-4">
        <Mini href="/pioneiro" label="Pioneiro" color="#84aed4" value={toHMM(pMin)} sub={`de ${toHMM(pGoalMin)}`} pct={pGoalMin ? pMin / pGoalMin : 0} />
        <Mini href="/corpo" label="Água" color="#8ac295" value={`${f1(ml / 1000)} L`} sub={`de ${f1(s.water_goal_ml / 1000)} L`} pct={ml / s.water_goal_ml} />
        <Mini href="/corpo?aba=peso" label="Peso" color="#8ac295" value={kg ? f1(kg) : "—"} sub={`meta ${f1(s.weight_goal_kg)} kg`} />
      </div>

      <div className="mt-4"><DailyText key={dailyText} initial={dailyText} today={today} reflected={(refl.data ?? []).length > 0} /></div>
      <Partner photo={photo} phrase={s.partner_phrase ?? "Tijolo por tijolinho"} />
      <Verse area="inicio" />
    </>
  );
}
