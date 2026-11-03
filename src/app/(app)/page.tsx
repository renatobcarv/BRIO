import Link from "next/link";
import { PageHeader, Verse } from "@/components/ui";
import { Checklist } from "@/components/home/checklist";
import { DailyText } from "@/components/home/daily-text";
import { Streak } from "@/components/home/streak";
import { addDays, brl, greeting, longDate, monthStart, todayISO, toHMM } from "@/lib/date";
import { getSettings } from "@/lib/settings";
import { computeStreak } from "@/lib/streak";
import { signedPhoto } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function Mini({ href, label, value, sub, color }: { href: string; label: string; value: string; sub?: string; color: string }) {
  return (
    <Link href={href} className="glass rise p-4 block min-h-24">
      <p className="label" style={{ color }}>{label}</p>
      <p className="num text-2xl mt-2 leading-none">{value}</p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </Link>
  );
}

export default async function Hoje() {
  const sb = await createClient();
  const today = todayISO();
  const month = monthStart(today);
  const s = await getSettings(sb);
  const since = addDays(today, -400);

  const [checks, streakQ, pioneer, pGoal, water, weight, fin, goal] = await Promise.all([
    sb.from("daily_checks").select("date,item_key").gte("date", since).eq("done", true),
    sb.from("streaks").select("*").maybeSingle(),
    sb.from("pioneer_entries").select("minutes").gte("date", month).lte("date", today),
    sb.from("pioneer_month_goals").select("goal_minutes").eq("month", month).maybeSingle(),
    sb.from("water_logs").select("ml").eq("date", today),
    sb.from("weight_logs").select("kg,date").order("date", { ascending: false }).limit(1).maybeSingle(),
    sb.from("finance_items").select("kind,amount").eq("month", month),
    sb.from("goals").select("title,target,current,start_value,unit").order("featured", { ascending: false }).order("deadline").limit(1).maybeSingle(),
  ]);

  // Sequência
  const keys = s.checklist.map((c) => c.key);
  const byDay = new Map<string, Set<string>>();
  for (const c of checks.data ?? []) {
    if (!byDay.has(c.date)) byDay.set(c.date, new Set());
    byDay.get(c.date)!.add(c.item_key);
  }
  const complete = new Set([...byDay].filter(([, set]) => keys.every((k) => set.has(k))).map(([d]) => d));
  const st = streakQ.data;
  const excused = new Set<string>(st?.excused_dates ?? []);
  const count = computeStreak({ today, completeDays: complete, excused, resetDate: st?.last_date ?? null });
  const best = Math.max(st?.best ?? 0, count);
  if (st && best > st.best) await sb.from("streaks").update({ best, count }).eq("id", st.id);

  // Resumos
  const pMin = (pioneer.data ?? []).reduce((a, r) => a + r.minutes, 0);
  const pGoalMin = pGoal.data?.goal_minutes ?? s.pioneer_goal_minutes;
  const ml = (water.data ?? []).reduce((a, r) => a + r.ml, 0);
  const kg = weight.data ? Number(weight.data.kg) : null;
  const sum = (k: string) => (fin.data ?? []).filter((f) => f.kind === k).reduce((a, f) => a + Number(f.amount), 0);
  const surplus = sum("receita") - sum("fixo") - sum("variavel");
  const g = goal.data;
  const gPct = g ? Math.max(0, Math.min(1, (Number(g.current) - Number(g.start_value)) / ((Number(g.target) - Number(g.start_value)) || 1))) : 0;

  const photo = await signedPhoto(sb, s.partner_photo_path);
  const dailyText = s.daily_text_date === today ? s.daily_text ?? "" : "";

  return (
    <>
      <PageHeader eyebrow={longDate()} title={`${greeting()}, Renato.`} />
      <DailyText key={dailyText} initial={dailyText} />
      <Checklist date={today} items={s.checklist} done={[...(byDay.get(today) ?? [])]} />
      <Streak count={count} best={best} excusedToday={excused.has(today)} />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
        <Mini href="/pioneiro" label="Pioneiro" color="#84aed4" value={toHMM(pMin)} sub={`de ${toHMM(pGoalMin)} no mês`} />
        <Mini href="/corpo" label="Água" color="#8ac295" value={`${(ml / 1000).toFixed(1).replace(".", ",")} L`} sub={`meta ${(s.water_goal_ml / 1000).toFixed(1).replace(".", ",")} L`} />
        <Mini href="/corpo" label="Peso" color="#8ac295" value={kg ? `${kg.toFixed(1).replace(".", ",")} kg` : "—"} sub={`meta ${s.weight_goal_kg.toString().replace(".", ",")} kg`} />
        <Mini href="/financas" label="Sobra do mês" color="#d9c49a" value={brl(surplus)} />
        {g && (
          <Link href="/metas" className="glass rise p-4 block col-span-2">
            <p className="label" style={{ color: "#ac8fd6" }}>Meta principal</p>
            <p className="font-display text-lg mt-2 leading-snug">{g.title}</p>
            <div className="bar mt-3" style={{ ["--accent" as string]: "#ac8fd6" }}><i style={{ width: `${gPct * 100}%` }} /></div>
            <p className="text-xs text-muted mt-1">{Math.round(gPct * 100)}% · {Number(g.current).toLocaleString("pt-BR")} / {Number(g.target).toLocaleString("pt-BR")} {g.unit}</p>
          </Link>
        )}
      </div>

      {(photo || s.partner_phrase) && (
        <section className="glass rise p-4 mt-4 flex items-center gap-4">
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="Maria Luisa" className="h-20 w-20 rounded-2xl object-cover shrink-0" />
          )}
          <div>
            <p className="label">Maria Luisa</p>
            {s.partner_phrase && <p className="font-display italic text-lg mt-1 leading-snug">{s.partner_phrase}</p>}
          </div>
        </section>
      )}
      <Verse area="inicio" />
    </>
  );
}
