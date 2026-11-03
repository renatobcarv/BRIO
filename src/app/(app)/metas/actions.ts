"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Area = z.enum(["espiritual", "financeira", "fisica", "carreira", "pessoal"]);
const done = () => { revalidatePath("/metas"); revalidatePath("/"); };

export async function saveObjective(input: { title: string; area: string; description: string }, id?: string) {
  const p = z.object({ title: z.string().trim().min(1).max(200), area: Area, description: z.string().max(2000) }).parse(input);
  const sb = await createClient();
  const row = { ...p, description: p.description || null };
  if (id) await sb.from("objectives").update(row).eq("id", z.string().uuid().parse(id));
  else await sb.from("objectives").insert(row);
  done();
}
export async function deleteObjective(id: string) {
  const sb = await createClient(); await sb.from("objectives").delete().eq("id", z.string().uuid().parse(id)); done();
}

const Goal = z.object({
  title: z.string().trim().min(1).max(200), area: Area, unit: z.string().max(20),
  start_value: z.number(), target: z.number(), current: z.number(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(), objective_id: z.string().uuid().nullable(),
  featured: z.boolean(), auto_source: z.enum(["pioneer_month", "weight", "savings_box", "bible_chapters"]).nullable(),
  auto_ref: z.string().uuid().nullable(),
});
export async function saveGoal(input: z.infer<typeof Goal>, id?: string) {
  const p = Goal.parse(input);
  const sb = await createClient();
  if (p.featured) await sb.from("goals").update({ featured: false }).eq("featured", true);
  if (id) await sb.from("goals").update(p).eq("id", z.string().uuid().parse(id));
  else await sb.from("goals").insert(p);
  done();
}
export async function setGoalCurrent(id: string, current: number) {
  const sb = await createClient();
  await sb.from("goals").update({ current: z.number().parse(current) }).eq("id", z.string().uuid().parse(id)); done();
}
export async function deleteGoal(id: string) {
  const sb = await createClient(); await sb.from("goals").delete().eq("id", z.string().uuid().parse(id)); done();
}
