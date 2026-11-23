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
  dayNames: z.record(z.string().regex(/^[0-6]$/), z.string().max(40)).optional(),
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

/** Salva (ou desfaz, com days = null) o ajuste de uma semana da campanha. */
export async function saveWeekOverride(programId: string, week: number, days: Record<string, z.input<typeof Ex>[]> | null, note = ""): Promise<string | null> {
  const id = Id.safeParse(programId), w = z.number().int().min(1).max(200).safeParse(week);
  if (!id.success || !w.success) return "Semana inválida.";
  const sb = await createClient();
  const { data, error } = await sb.from("training_programs").select("week_overrides").eq("id", id.data).single();
  if (error) return /column|schema cache/i.test(error.message) ? "Rode o SQL 20261128000000_ajuste_semana.sql no Supabase." : error.message;
  const all = { ...((data?.week_overrides ?? {}) as Record<string, unknown>) };
  if (days === null) delete all[String(w.data)];
  else {
    const parsed = z.record(z.string().regex(/^[0-6]$/), z.array(Ex).max(25)).safeParse(days);
    if (!parsed.success) return "Ajuste inválido.";
    all[String(w.data)] = { days: parsed.data, note: note.slice(0, 80) };
  }
  const { error: e2 } = await sb.from("training_programs").update({ week_overrides: all }).eq("id", id.data);
  if (e2) return e2.message;
  revalidatePath("/treino"); done();
  return null;
}

/** Antecipa o início da campanha para esta semana (segunda-feira atual, horário de Brasília). */
export async function startProgramNow(id: string): Promise<string | null> {
  const p = Id.safeParse(id); if (!p.success) return "Programa inválido.";
  const d = new Date(Date.now() - 3 * 36e5); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  const sb = await createClient();
  const { error } = await sb.from("training_programs").update({ start_date: d.toISOString().slice(0, 10) }).eq("id", p.data);
  if (error) return error.message;
  revalidatePath("/treino"); revalidatePath("/eventos"); done();
  return null;
}
