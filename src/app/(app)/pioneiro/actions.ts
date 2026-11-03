"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Iso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const done = () => { revalidatePath("/pioneiro"); revalidatePath("/"); };

export async function addPioneerEntry(input: { date: string; minutes: number; category: string }) {
  const p = z.object({ date: Iso, minutes: z.number().int().min(1).max(24 * 60),
    category: z.enum(["campo", "publico", "assembleia", "obra"]) }).parse(input);
  const sb = await createClient();
  const { error } = await sb.from("pioneer_entries").insert(p);
  if (error) throw new Error(error.message);
  done();
}

export async function deletePioneerEntry(id: string) {
  const sb = await createClient();
  await sb.from("pioneer_entries").delete().eq("id", z.string().uuid().parse(id));
  done();
}

export async function setMonthGoal(month: string, minutes: number) {
  const p = z.object({ month: Iso, minutes: z.number().int().min(0).max(300 * 60) }).parse({ month, minutes });
  const sb = await createClient();
  await sb.from("pioneer_month_goals").upsert({ month: p.month, goal_minutes: p.minutes }, { onConflict: "user_id,month" });
  done();
}

export async function saveWeekPlan(minutes: number[]) {
  const m = z.array(z.number().int().min(0).max(24 * 60)).length(7).parse(minutes);
  const sb = await createClient();
  const { data } = await sb.from("pioneer_week_plan").select("id").maybeSingle();
  if (data) await sb.from("pioneer_week_plan").update({ minutes_by_day: m }).eq("id", data.id);
  else await sb.from("pioneer_week_plan").insert({ minutes_by_day: m });
  done();
}
