"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/date";

const Iso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const done = () => { revalidatePath("/corpo"); revalidatePath("/"); };

export async function addWater(ml: number) {
  const v = z.number().int().min(-5000).max(5000).parse(ml);
  const sb = await createClient();
  await sb.from("water_logs").insert({ date: todayISO(), ml: v });
  done();
}
export async function undoWater() {
  const sb = await createClient();
  const { data } = await sb.from("water_logs").select("id").eq("date", todayISO()).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (data) await sb.from("water_logs").delete().eq("id", data.id);
  done();
}

export async function saveMeal(input: { date: string; slot: string; done: boolean; kcal: number | null; protein_g: number | null }) {
  const p = z.object({ date: Iso, slot: z.enum(["cafe", "almoco", "lanche", "jantar"]), done: z.boolean(),
    kcal: z.number().int().min(0).max(10000).nullable(), protein_g: z.number().int().min(0).max(1000).nullable() }).parse(input);
  const sb = await createClient();
  await sb.from("meals").upsert(p, { onConflict: "user_id,date,slot" });
  done();
}

export async function saveSleep(date: string, hours: number) {
  const p = z.object({ date: Iso, hours: z.number().min(0).max(24) }).parse({ date, hours });
  const sb = await createClient();
  await sb.from("sleep_logs").upsert(p, { onConflict: "user_id,date" });
  done();
}

export async function addWeight(date: string, kg: number) {
  const p = z.object({ date: Iso, kg: z.number().min(20).max(400) }).parse({ date, kg });
  const sb = await createClient();
  await sb.from("weight_logs").upsert(p, { onConflict: "user_id,date" });
  done();
}
export async function deleteWeight(id: string) {
  const sb = await createClient();
  await sb.from("weight_logs").delete().eq("id", z.string().uuid().parse(id));
  done();
}

const SetS = z.object({ exercise: z.string().trim().min(1).max(80), reps: z.number().int().min(0).max(200), kg: z.number().min(0).max(1000) });
export async function saveWorkout(input: { date: string; split_label: string; notes: string; sets: z.infer<typeof SetS>[] }) {
  const p = z.object({ date: Iso, split_label: z.string().max(40), notes: z.string().max(2000), sets: z.array(SetS).max(200) }).parse(input);
  const sb = await createClient();
  const { data: w, error } = await sb.from("workouts").insert({ date: p.date, split_label: p.split_label, notes: p.notes || null }).select("id").single();
  if (error) throw new Error(error.message);
  const counter = new Map<string, number>();
  const rows = p.sets.map((s) => {
    const n = (counter.get(s.exercise) ?? 0) + 1; counter.set(s.exercise, n);
    return { workout_id: w.id, exercise: s.exercise, set_no: n, reps: s.reps, kg: s.kg };
  });
  if (rows.length) await sb.from("workout_sets").insert(rows);
  done();
}
export async function deleteWorkout(id: string) {
  const sb = await createClient();
  await sb.from("workouts").delete().eq("id", z.string().uuid().parse(id));
  done();
}
