"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { MUSCLES, PHASE_KINDS, GOALS } from "@/lib/training";

const Id = z.string().uuid();
const ok = async (p: PromiseLike<{ error: { message: string } | null }>) => { const { error } = await p; if (error) throw new Error(error.message); };
const done = () => { revalidatePath("/corpo"); revalidatePath("/"); };

const Ex = z.object({
  name: z.string().trim().min(1).max(80), muscle: z.enum(Object.keys(MUSCLES) as [string, ...string[]]),
  sets: z.number().int().min(1).max(20), reps: z.string().trim().min(1).max(20),
  kg: z.number().min(0).max(1500).nullable(), rpe: z.number().min(1).max(10).nullable(), rir: z.number().int().min(0).max(10).nullable(),
  rest: z.number().int().min(0).max(1800), notes: z.string().max(500),
});
const PhaseS = z.object({
  id: z.string().min(1).max(40), name: z.string().trim().min(1).max(60), kind: z.enum(Object.keys(PHASE_KINDS) as [string, ...string[]]),
  weeks: z.number().int().min(1).max(52), notes: z.string().max(1000),
  days: z.record(z.string().regex(/^[0-6]$/), z.array(Ex).max(25)),
});
const ProgramS = z.object({
  name: z.string().trim().min(1).max(100), goal: z.enum(Object.keys(GOALS) as [string, ...string[]]),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), phases: z.array(PhaseS).min(1).max(20), notes: z.string().max(4000).nullable(),
});

export async function saveProgram(input: z.input<typeof ProgramS>, id?: string) {
  const p = ProgramS.parse(input);
  const sb = await createClient();
  if (id) { await ok(sb.from("training_programs").update(p).eq("id", Id.parse(id))); done(); return id; }
  // Um programa novo vira o ativo.
  await sb.from("training_programs").update({ active: false }).eq("active", true);
  const { data, error } = await sb.from("training_programs").insert({ ...p, active: true }).select("id").single();
  if (error) throw new Error(error.message);
  done();
  return data.id as string;
}
export async function activateProgram(id: string) {
  const sb = await createClient();
  await sb.from("training_programs").update({ active: false }).eq("active", true);
  await ok(sb.from("training_programs").update({ active: true, archived: false }).eq("id", Id.parse(id)));
  done();
}
export async function archiveProgram(id: string) {
  const sb = await createClient();
  await ok(sb.from("training_programs").update({ active: false, archived: true }).eq("id", Id.parse(id))); done();
}
export async function deleteProgram(id: string) {
  const sb = await createClient();
  await ok(sb.from("training_programs").delete().eq("id", Id.parse(id))); done();
}
