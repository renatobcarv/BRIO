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

// ── Registro rápido (quiz) e contatos ──
const Time = z.string().regex(/^\d{2}:\d{2}$/);
const Contact = z.object({ name: z.string().trim().min(1).max(120), address: z.string().max(200), notes: z.string().max(500), next_visit: Iso.nullable() });

export async function logFieldDay(input: { date: string; category: string; start: string | null; end: string | null; minutes: number;
  return_visits: number; notes: string; contacts: z.infer<typeof Contact>[]; visited_ids: string[] }): Promise<string | null> {
  const p = z.object({ date: Iso, category: z.enum(["campo", "publico", "assembleia", "obra"]), start: Time.nullable(), end: Time.nullable(),
    minutes: z.number().int().min(1).max(24 * 60), return_visits: z.number().int().min(0).max(100), notes: z.string().max(1000),
    contacts: z.array(Contact).max(30), visited_ids: z.array(z.string().uuid()).max(100) }).parse(input);
  const sb = await createClient();
  const full = { date: p.date, category: p.category, minutes: p.minutes, start_time: p.start, end_time: p.end, return_visits: p.return_visits, notes: p.notes || null };
  let { error } = await sb.from("pioneer_entries").insert(full);
  // Sem a migração de campo: grava só o essencial.
  if (error && /column|schema cache/i.test(error.message)) ({ error } = await sb.from("pioneer_entries").insert({ date: p.date, category: p.category, minutes: p.minutes }));
  if (error) return error.message;
  if (p.contacts.length) {
    const r = await sb.from("field_contacts").insert(p.contacts.map((c) => ({ ...c, address: c.address || null, notes: c.notes || null, last_visit: p.date })));
    if (r.error) return /relation|schema cache/i.test(r.error.message) ? "Horas salvas, mas os contatos precisam da migração supabase/migrations/20261114000000_campo.sql." : r.error.message;
  }
  if (p.visited_ids.length) await sb.from("field_contacts").update({ last_visit: p.date }).in("id", p.visited_ids);
  done();
  return null;
}
export async function saveContact(input: z.infer<typeof Contact> & { status: "revisita" | "estudo" | "encerrado" }, id?: string) {
  const p = Contact.extend({ status: z.enum(["revisita", "estudo", "encerrado"]) }).parse(input);
  const sb = await createClient();
  const row = { ...p, address: p.address || null, notes: p.notes || null };
  if (id) await sb.from("field_contacts").update(row).eq("id", z.string().uuid().parse(id)); else await sb.from("field_contacts").insert(row);
  done();
}
export async function visitContact(id: string, next_visit: string | null) {
  const sb = await createClient();
  await sb.from("field_contacts").update({ last_visit: new Date().toISOString().slice(0, 10), next_visit: next_visit && /^\d{4}-\d{2}-\d{2}$/.test(next_visit) ? next_visit : null }).eq("id", z.string().uuid().parse(id));
  done();
}
export async function deleteContact(id: string) {
  const sb = await createClient(); await sb.from("field_contacts").delete().eq("id", z.string().uuid().parse(id)); done();
}
