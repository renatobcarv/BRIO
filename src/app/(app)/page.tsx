import Link from "next/link";
import { Hourglass, MiniBottle } from "@/components/meters";
import { Verse } from "@/components/ui";
import { Checklist } from "@/components/home/checklist";
import { DailyText } from "@/components/home/daily-text";
import { Greeting } from "@/components/home/greeting";
import { Partner } from "@/components/home/partner";
import { Streak } from "@/components/home/streak";
import { addDays, brl, monthLabel, monthStart, todayISO, toHMM } from "@/lib/date";
import { getSettings } from "@/lib/settings";
import { computeStreak } from "@/lib/streak";
import { cleanStats, type Mark } from "@/lib/clean";
import { signedPhoto } from "@/lib/storage";
import { goalStats, AREAS, type GoalRow } from "@/lib/goals";
import { createClient } from "@/lib/supabase/server";
import { loadGame } from "@/lib/game-data";
import { ATTRS, type Attr } from "@/lib/game";
import { XpProvider } from "@/components/game/xp";
import { HeroPlayer, QuickActions } from "@/components/home/hero";
import { EventCard } from "@/components/events/event-ui";

export const dynamic = "force-dynamic";
const f1 = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

function Mini({ href, label, value, sub, color, pct, meter }: { href: string; label: string; value: string; sub?: string; color: string; pct?: number; meter?: React.ReactNode }) {
  return (
    <Link href={href} className="glass rise p-4 block">
      <div className="flex items-start justify-between gap-1"><p className="label" style={{ color }}>{label}</p>{meter && <span className="-mt-1 -mr-1 shrink-0">{meter}</span>}</div>
      <p className={`num text-2xl leading-none ${meter ? "-mt-3" : "mt-2"}`}>{value}</p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
      {pct != null && <div className="bar mt-3" style={{ height: 4 }}><i style={{ width: `${Math.min(100, pct * 100)}%`, background: color }} /></div>}
    </Link>
  );
}

export default async function Hoje() {
  const sb = await createClient();
  // Nome de quem está logado (cadastro grava em user_metadata.name); sem nome, usa o começo do e-mail.
  const { data: me } = await sb.auth.getUser();
  const raw = String(me.user?.user_metadata?.name ?? me.user?.email?.split("@")[0].split(/[._\-\d]/)[0] ?? "").trim().split(/\s+/)[0];
  const firstName = raw ? raw[0].toUpperCase() + raw.slice(1) : "você";
  const today = todayISO();
  const month = monthStart(today);
  const [s, checks, streakQ, pioneer, pGoal, water, weight, fin, goals, refl, cleanQ] = await Promise.all([
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
    sb.from("clean_marks").select("date,kind").gte("date", addDays(today, -800)),
  ]);
  const contactsQ = await sb.from("field_contacts").select("id,name,address").neq("status", "encerrado").order("next_visit", { nullsFirst: false }).limit(30);

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
  // Dias limpos + semana atual (seg → dom)
  const marks = (cleanQ.error ? [] : cleanQ.data ?? []) as Mark[];
  const clean = cleanStats(marks, today);
  const monday = addDays(today, -((new Date(today + "T12:00:00Z").getUTCDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(monday, i), m = marks.find((x) => x.date === d);
    return { date: d, label: ["S", "T", "Q", "Q", "S", "S", "D"][i], today: d === today,
      state: (d > today ? "future" : m?.kind === "limpo" ? "done" : m?.kind === "recaida" ? "relapse" : "none") as "done" | "relapse" | "none" | "future" };
  });

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
  const game = await loadGame(sb, s, today);

  return (
    <XpProvider initialTotal={game.total} initialToday={game.today}>
      <div className="stagger home-dash">
      <div className="dash-main min-w-0">
      <Greeting name={firstName} />
      <HeroPlayer attrs={(Object.keys(ATTRS) as Attr[]).map((k) => ({ key: k, label: ATTRS[k].label, color: ATTRS[k].color, value: game.attrs[k] }))} />
      {(() => { const ev = game.events.find((e) => e.stage === "ativo" || e.stage === "contagem"); return ev ? <Link href="/eventos" className="block mt-4"><EventCard e={ev} compact /></Link> : null; })()}
      <div className="mt-4"><QuickActions today={today} contacts={contactsQ.error ? [] : contactsQ.data ?? []} waterMl={ml} waterGoal={s.water_goal_ml} /></div>
      <div className="mt-4"><Checklist date={today} items={s.checklist} done={[...(byDay.get(today) ?? [])]} streak={count} best={best} /></div>
      </div>
      <div className="dash-side min-w-0">
      <Streak count={clean.count} best={clean.best} todayDone={clean.todayDone} week={week} next={clean.next} ready={!cleanQ.error} />
      <div className="grid grid-cols-3 gap-3 mt-4">
        <Mini href="/pioneiro" label="Pioneiro" color="#0a84ff" value={toHMM(pMin)} sub={`de ${toHMM(pGoalMin)}`} pct={pGoalMin ? pMin / pGoalMin : 0} meter={<Hourglass pct={pGoalMin ? pMin / pGoalMin : 0} size={24} />} />
        <Mini href="/corpo" label="Água" color="#30d158" value={`${f1(ml / 1000)} L`} sub={`de ${f1(s.water_goal_ml / 1000)} L`} pct={ml / s.water_goal_ml} meter={<MiniBottle pct={ml / s.water_goal_ml} size={22} />} />
        <Mini href="/corpo?aba=peso" label="Peso" color="#30d158" value={kg ? f1(kg) : "—"} sub={`meta ${f1(s.weight_goal_kg)} kg`} />
      </div>

      {/* Relatório financeiro */}
      <Link href="/financas" className="glass rise block p-5 mt-4" style={{ ["--accent" as string]: "#3ee6c1" }}>
        <div className="flex items-center justify-between"><p className="label" style={{ color: "#3ee6c1" }}>Finanças · <span className="capitalize">{monthLabel(month)}</span></p><span className="text-muted text-sm">ver ›</span></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-3 mt-3">
          <div><p className="label">Entrou</p><p className="num text-lg md:text-xl" style={{ color: "#30d158" }}>{brl(income)}</p></div>
          <div><p className="label">Saiu</p><p className="num text-lg md:text-xl">{brl(spent)}</p></div>
          <div className="col-span-2 sm:col-span-1"><p className="label">Sobra</p><p className="num text-2xl md:text-xl" style={{ color: left >= 0 ? "#f5f5f7" : "#ff453a" }}>{brl(left)}</p></div>
        </div>
        <div className="bar mt-4" style={{ height: 6 }}><i style={{ width: `${income ? Math.min(100, (spent / income) * 100) : 0}%`, background: spent > income ? "#ff453a" : "#3ee6c1" }} /></div>
        <div className="flex justify-between text-xs text-muted mt-1.5">
          <span>{income ? `${Math.round((spent / income) * 100)}% da renda usada` : "Sem receitas lançadas"}</span>
          <span>Poupança {income ? Math.round((left / income) * 100) : 0}%</span>
        </div>
        {(topCats.length > 0 || pending > 0) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {topCats.map(([k, v]) => <span key={k} className="tag"><i className="h-2 w-2 rounded-full" style={{ background: catMap.get(k)?.color ?? "#9a978f" }} />{catMap.get(k)?.label ?? k} {brl(v)}</span>)}
            {pending > 0 && <span className="tag" style={{ color: "#ff453a" }}>A pagar {brl(pending)}</span>}
          </div>
        )}
      </Link>

      {/* Metas */}
      <Link href="/metas" className="glass rise block p-5 mt-4">
        <div className="flex items-center justify-between"><p className="label" style={{ color: "#bf5af2" }}>Metas</p><span className="text-muted text-sm">ver ›</span></div>
        {goalList.length === 0 ? <p className="font-display italic text-muted text-lg mt-2">Defina sua primeira meta.</p> : (
          <ul className="grid gap-4 mt-3">
            {goalList.map((g) => {
              const st = goalStats(g, today), c = AREAS[g.area]?.color ?? "#bf5af2";
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

      <div className="mt-4"><DailyText key={dailyText} initial={dailyText} today={today} reflected={(refl.data ?? []).length > 0} /></div>
      <Partner photo={photo} phrase={s.partner_phrase ?? "Tijolo por tijolinho"} />
      <Verse area="inicio" />
      </div>
      </div>
    </XpProvider>
  );
}
