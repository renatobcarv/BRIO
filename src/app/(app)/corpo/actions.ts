"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/date";

const Iso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Id = z.string().uuid();
const done = () => { revalidatePath("/corpo"); revalidatePath("/"); };
const ok = async (p: PromiseLike<{ error: { message: string } | null }>) => { const { error } = await p; if (error) throw new Error(error.message); };

// ── Água ──
export async function addWater(ml: number) {
  const v = z.number().int().min(-5000).max(5000).parse(ml);
  const sb = await createClient();
  await ok(sb.from("water_logs").insert({ date: todayISO(), ml: v })); done();
}
export async function undoWater() {
  const sb = await createClient();
  const { data } = await sb.from("water_logs").select("id").eq("date", todayISO()).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (data) await sb.from("water_logs").delete().eq("id", data.id);
  done();
}

// ── Sono ──
export async function saveSleep(date: string, hours: number) {
  const p = z.object({ date: Iso, hours: z.number().min(0).max(24) }).parse({ date, hours });
  const sb = await createClient(); await ok(sb.from("sleep_logs").upsert(p, { onConflict: "user_id,date" })); done();
}

// ── Alimentação ──
const Macro = z.object({ name: z.string().trim().min(1).max(100), kcal: z.number().int().min(0).max(10000),
  protein_g: z.number().min(0).max(1000), carbs_g: z.number().min(0).max(2000), fat_g: z.number().min(0).max(1000) });

export async function saveMealItem(input: z.infer<typeof Macro> & { date: string; slot: string; favorite?: boolean; portion?: string }, id?: string) {
  const { favorite, portion, date, slot, ...m } = input;
  const p = Macro.parse(m);
  const sb = await createClient();
  if (id) await ok(sb.from("meal_items").update(p).eq("id", Id.parse(id)));
  else await ok(sb.from("meal_items").insert({ ...p, date: Iso.parse(date), slot: z.string().min(1).max(40).parse(slot) }));
  if (favorite) {
    const { data } = await sb.from("foods").select("id").ilike("name", p.name).maybeSingle();
    if (!data) await ok(sb.from("foods").insert({ ...p, portion: portion || null }));
  }
  done();
}
export async function deleteMealItem(id: string) {
  const sb = await createClient(); await ok(sb.from("meal_items").delete().eq("id", Id.parse(id))); done();
}
export async function setMealDone(date: string, slot: string, isDone: boolean) {
  const sb = await createClient();
  await ok(sb.from("meals").upsert({ date: Iso.parse(date), slot: z.string().min(1).max(40).parse(slot), done: isDone }, { onConflict: "user_id,date,slot" }));
  done();
}
export async function copyMeals(from: string, to: string) {
  const sb = await createClient();
  const { data } = await sb.from("meal_items").select("slot,name,kcal,protein_g,carbs_g,fat_g").eq("date", Iso.parse(from));
  if (data?.length) await ok(sb.from("meal_items").insert(data.map((r) => ({ ...r, date: Iso.parse(to) }))));
  done();
}
export async function saveFood(input: z.infer<typeof Macro> & { portion: string }, id?: string) {
  const { portion, ...m } = input;
  const p = { ...Macro.parse(m), portion: z.string().max(40).parse(portion) || null };
  const sb = await createClient();
  if (id) await ok(sb.from("foods").update(p).eq("id", Id.parse(id))); else await ok(sb.from("foods").insert(p));
  done();
}
export async function deleteFood(id: string) {
  const sb = await createClient(); await ok(sb.from("foods").delete().eq("id", Id.parse(id))); done();
}

// ── Peso ──
export async function saveWeight(date: string, kg: number, id?: string) {
  const p = z.object({ date: Iso, kg: z.number().min(20).max(400) }).parse({ date, kg });
  const sb = await createClient();
  if (id) await ok(sb.from("weight_logs").update(p).eq("id", Id.parse(id)));
  else await ok(sb.from("weight_logs").upsert(p, { onConflict: "user_id,date" }));
  done();
}
export async function deleteWeight(id: string) {
  const sb = await createClient(); await ok(sb.from("weight_logs").delete().eq("id", Id.parse(id))); done();
}

// ── Treino ──
const SetS = z.object({ exercise: z.string().trim().min(1).max(80), reps: z.number().int().min(0).max(500), kg: z.number().min(0).max(1500) });
export async function saveWorkout(input: { date: string; split_label: string; notes: string; duration_min: number | null; sets: z.infer<typeof SetS>[] }, id?: string) {
  const p = z.object({ date: Iso, split_label: z.string().max(80), notes: z.string().max(4000),
    duration_min: z.number().int().min(0).max(600).nullable(), sets: z.array(SetS).max(300) }).parse(input);
  const sb = await createClient();
  const row = { date: p.date, split_label: p.split_label, notes: p.notes || null, duration_min: p.duration_min };
  let wid = id ? Id.parse(id) : null;
  if (wid) { await ok(sb.from("workouts").update(row).eq("id", wid)); await ok(sb.from("workout_sets").delete().eq("workout_id", wid)); }
  else { const { data, error } = await sb.from("workouts").insert(row).select("id").single(); if (error) throw new Error(error.message); wid = data.id; }
  const counter = new Map<string, number>();
  const rows = p.sets.map((s) => { const k = (counter.get(s.exercise) ?? 0) + 1; counter.set(s.exercise, k); return { workout_id: wid, exercise: s.exercise, set_no: k, reps: s.reps, kg: s.kg }; });
  if (rows.length) await ok(sb.from("workout_sets").insert(rows));
  done();
}
export async function deleteWorkout(id: string) {
  const sb = await createClient(); await ok(sb.from("workouts").delete().eq("id", Id.parse(id))); done();
}
