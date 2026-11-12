import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { summarize, type GameInput } from "./game";
import type { Settings } from "./settings";

/** Junta os registros reais de todas as áreas e calcula o progresso. Tabelas ausentes contam como vazias. */
export async function loadGame(sb: SupabaseClient, s: Settings, today: string) {
  const q = async <T,>(p: PromiseLike<{ data: T[] | null; error: unknown }>) => { const r = await p; return r.error ? [] : r.data ?? []; };
  const [checks, study, bible, pioneer, workouts, water, sleep, sessions, books, fin, weights, cleanDays, timed, journal] = await Promise.all([
    q<{ date: string; item_key: string }>(sb.from("daily_checks").select("date,item_key").eq("done", true).limit(20000)),
    q<{ date: string; minutes: number }>(sb.from("study_entries").select("date,minutes").limit(10000)),
    q<{ date_read: string }>(sb.from("bible_reading").select("date_read").limit(2000)),
    q<{ date: string; minutes: number }>(sb.from("pioneer_entries").select("date,minutes").limit(10000)),
    q<{ date: string; split_label: string | null; workout_sets: { exercise: string; kg: number; reps: number }[] }>(sb.from("workouts").select("date,split_label,workout_sets(exercise,kg,reps)").limit(3000)),
    q<{ date: string; ml: number }>(sb.from("water_logs").select("date,ml").limit(20000)),
    q<{ date: string; hours: number }>(sb.from("sleep_logs").select("date,hours").limit(5000)),
    q<{ date: string; from_page: number; to_page: number }>(sb.from("reading_sessions").select("date,from_page,to_page").limit(10000)),
    q<{ title: string; finished_at: string | null }>(sb.from("books").select("title,finished_at").eq("status", "lido").limit(2000)),
    q<{ month: string; kind: string; amount: number }>(sb.from("finance_items").select("month,kind,amount").limit(20000)),
    q<{ date: string; kg: number }>(sb.from("weight_logs").select("date,kg").order("date").limit(2000)),
    q<{ date: string; kind: string }>(sb.from("clean_marks").select("date,kind").limit(5000)),
    q<{ date: string; item_key: string; created_at: string }>(sb.from("daily_checks").select("date,item_key,created_at").eq("done", true).limit(20000)),
    q<{ id: string }>(sb.from("journal_entries").select("id").limit(5000)),
  ]);

  const keys = s.checklist.map((c) => c.key);
  const perDay = new Map<string, Set<string>>();
  for (const c of checks) { if (!perDay.has(c.date)) perDay.set(c.date, new Set()); perDay.get(c.date)!.add(c.item_key); }
  const sumBy = <T,>(l: T[], key: (x: T) => string, val: (x: T) => number) => { const m = new Map<string, number>(); for (const x of l) m.set(key(x), (m.get(key(x)) ?? 0) + val(x)); return m; };
  const finByMonth = new Map<string, { logged: number; income: number; expenses: number }>();
  for (const f of fin) { const r = finByMonth.get(f.month) ?? { logged: 0, income: 0, expenses: 0 }; r.logged++; if (f.kind === "receita") r.income += Number(f.amount); else r.expenses += Number(f.amount); finByMonth.set(f.month, r); }

  const input: GameInput = {
    today,
    checks: checks.map((c) => ({ date: c.date })),
    fullDays: [...perDay].filter(([, set]) => keys.every((k) => set.has(k))).map(([d]) => d),
    study: study.map((x) => ({ date: x.date, minutes: Number(x.minutes) })),
    chapters: bible.map((b) => ({ date: b.date_read })),
    pioneer: pioneer.map((p) => ({ date: p.date, minutes: Number(p.minutes) })),
    workouts: workouts.map((w) => ({ date: w.date, sets: (w.workout_sets ?? []).map((x) => ({ exercise: x.exercise, kg: Number(x.kg), reps: Number(x.reps) })),
      cardio: /cardio|corrida|bike|el[ií]ptico|caminhada/i.test(`${w.split_label ?? ""} ${(w.workout_sets ?? []).map((x) => x.exercise).join(" ")}`) })),
    waterDays: [...sumBy(water, (w) => w.date, (w) => Number(w.ml))].map(([date, ml]) => ({ date, ml })), waterGoal: s.water_goal_ml,
    sleep: sleep.map((x) => ({ date: x.date, hours: Number(x.hours) })),
    readingPages: [...sumBy(sessions, (r) => r.date, (r) => Math.max(0, r.to_page - r.from_page))].map(([date, pages]) => ({ date, pages })),
    booksFinished: books.filter((b) => b.finished_at).map((b) => ({ date: b.finished_at!, title: b.title })),
    finance: [...finByMonth].map(([month, v]) => ({ month, ...v })),
    weights: weights.map((w) => ({ date: w.date, kg: Number(w.kg) })),
    cleanDays: cleanDays.filter((c) => c.kind === "limpo").map((c) => c.date),
    relapses: cleanDays.filter((c) => c.kind === "recaida").map((c) => c.date),
    // Hora local de São Paulo (UTC−3) em que a missão principal foi marcada
    morningDays: timed.filter((c) => c.item_key === (s.checklist.find((x) => x.primary) ?? s.checklist[0])?.key)
      .filter((c) => { const h = (new Date(c.created_at).getUTCHours() + 21) % 24; return h >= 3 && h < 7; }).map((c) => c.date),
    journalCount: journal.length,
    weightGoal: s.weight_goal_kg,
  };
  return summarize(input);
}
export type Game = Awaited<ReturnType<typeof loadGame>>;
