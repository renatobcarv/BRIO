import { cleanDays as implicitClean, type Mark } from "./clean.ts";
import { petState } from "./pet.ts";
import { achievements, xpEvents, type Attr } from "./game";
import { BEAST_ATTR, economy, itemBonus, kills, tamed, tamedLevel, tamedPct, validEquipped } from "./items";
import { ALL, FERAS, bestiaryRecord } from "./bestiary";
import "server-only";
import { eaten } from "./meals.ts";
import type { SupabaseClient } from "@supabase/supabase-js";
import { summarize, type GameInput } from "./game";
import { computeEvents, type EvProgram } from "./events";
import type { Settings } from "./settings";

/** Junta os registros reais de todas as áreas e calcula o progresso. Tabelas ausentes contam como vazias. */
export async function loadGame(sb: SupabaseClient, s: Settings, today: string) {
  const q = async <T,>(p: PromiseLike<{ data: T[] | null; error: unknown }>) => { const r = await p; return r.error ? [] : r.data ?? []; };
  const [learning, checks, study, bible, pioneer, workouts, water, sleep, sessions, books, fin, weights, cleanDays, timed, journal, mealRows, programs, mealsDone] = await Promise.all([
    q<{ date: string; kind: string; level: number; score: number | null; topic: string }>(sb.from("study_evidence").select("date,kind,level,score,topic").limit(5000)),
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
    q<{ date: string; kind: string; at?: string }>(sb.from("clean_marks").select("date,kind,at:created_at").limit(5000)),
    q<{ date: string; item_key: string; created_at: string }>(sb.from("daily_checks").select("date,item_key,created_at").eq("done", true).limit(20000)),
    q<{ id: string }>(sb.from("journal_entries").select("id").limit(5000)),
    q<{ date: string; slot: string; protein_g: number }>(sb.from("meal_items").select("date,slot,protein_g").limit(20000)),
    q<EvProgram>(sb.from("training_programs").select("id,name,start_date,phases").limit(50)),
    q<{ date: string; slot: string }>(sb.from("meals").select("date,slot").eq("done", true).limit(20000)),
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
    learning: learning.map((x) => ({ ...x, level: Number(x.level), score: x.score == null ? null : Number(x.score) })),
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
    cleanDays: implicitClean(cleanDays as Mark[], today, Date.now()),
    relapses: cleanDays.filter((c) => c.kind === "recaida").map((c) => c.date),
    // Hora local de São Paulo (UTC−3) em que a missão principal foi marcada
    morningDays: timed.filter((c) => c.item_key === (s.checklist.find((x) => x.primary) ?? s.checklist[0])?.key)
      .filter((c) => { const h = (new Date(c.created_at).getUTCHours() + 21) % 24; return h >= 3 && h < 7; }).map((c) => c.date),
    journalCount: journal.length,
    weightGoal: s.weight_goal_kg,
    meals: (() => { const m = new Map<string, { slots: Set<string>; protein: number }>(); for (const r of eaten(mealRows, new Set(mealsDone.map((m) => `${m.date}|${m.slot}`)))) { const x = m.get(r.date) ?? { slots: new Set(), protein: 0 }; x.slots.add(r.slot); x.protein += Number(r.protein_g); m.set(r.date, x); } return [...m].map(([date, v]) => ({ date, slots: v.slots.size, protein: v.protein })); })(),
    proteinGoal: s.protein_goal_g,
  };
  // Eventos dinâmicos: bônus de XP e insígnias de vitória/cicatriz
  const mealsByDay = input.meals ?? [];
  const events = computeEvents({ today, programs, travel: s.travel ?? [], proteinGoal: s.protein_goal_g, sleep: input.sleep, meals: mealsByDay.map((m) => ({ date: m.date, protein: m.protein })),
    workouts: input.workouts.map((w) => ({ date: w.date, sets: w.sets })) });
  input.eventBonus = events.flatMap((e) => e.bonusXp.map((b) => ({ ...b, attr: (e.type === "sanctuary" ? "vigor" : e.type === "war_rations" ? "vigor" : "forca") as "forca" | "vigor" })));
  // Mascote: alimentado pelos eventos reais desde a adoção; às vezes dá bônus de XP.
  // Itens do mascote: conquistas + saque das feras + loja (Ouro de caça). Bônus limitado a 15%, sem retroativo.
  const eqQ = await sb.from("pets").select("equipped,bought,levels,spent,active_beast").maybeSingle();
  const bq = await sb.from("workouts").select("program_id,week_no,date").not("program_id", "is", null).limit(3000);
  const sessionsB = (bq.error ? [] : bq.data ?? []) as { program_id: string | null; week_no: number | null; date: string }[];
  const ks = kills(programs as never, sessionsB);
  const eco = economy(ks, achievements(input).filter((x) => x.done).map((x) => x.id),
    { bought: (eqQ.data?.bought as string[]) ?? [], levels: (eqQ.data?.levels as Record<string, number>) ?? {}, spent: Number(eqQ.data?.spent ?? 0) });
  const equipped = validEquipped(eqQ.error ? null : eqQ.data?.equipped, eco.owned.keys());
  // Feras domadas: a ativa dá bônus no atributo dela desde o dia em que foi domada.
  const baseEv = xpEvents(input), army = tamed(ks);
  const army2 = army.map((t) => ({ ...t, level: tamedLevel(baseEv.filter((e) => e.date >= t.since).reduce((a, e) => a + e.xp, 0)) }));
  const active = army2.find((t) => t.id === (eqQ.data as { active_beast?: string } | null)?.active_beast) ?? null;
  const beastSrc = active ? [{ attr: BEAST_ATTR[active.id]!, pct: tamedPct(active.stars), at: active.since, name: ALL(active.id).name + " (domada)" }] : [];
  input.eventBonus = [...(input.eventBonus ?? []), ...itemBonus(baseEv, equipped, eco.levels, beastSrc)];
  const beasts = bestiaryRecord(programs as never, sessionsB as never);
  const trophies = FERAS.filter((id) => beasts[id].won > 0).map((id) => ({ id, won: beasts[id].won }));
  const petQ = await sb.from("pets").select("id,name,species,adopted_on,bonus_essence").maybeSingle();
  const pet = petQ.error || !petQ.data ? null : (() => { const st = petState(petQ.data.id, petQ.data.adopted_on, xpEvents(input), today, Number(petQ.data.bonus_essence ?? 0)); input.eventBonus = [...(input.eventBonus ?? []), ...st.bonus.map((b) => ({ ...b, attr: b.attr as Attr }))]; return { ...petQ.data, ...st }; })();
  return { ...summarize(input), events, pet, petReady: !petQ.error, items: { owned: Object.fromEntries(eco.owned), levels: eco.levels, gold: eco.gold, drops: eco.drops.slice(0, 12), kills: ks.length, equipped, trophies, ready: !eqQ.error, army: army2, active: active?.id ?? null } };
}
export type Game = Awaited<ReturnType<typeof loadGame>>;
