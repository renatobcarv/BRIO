"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/date";

const Iso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export async function toggleCheck(date: string, key: string, done: boolean) {
  const p = z.object({ date: Iso, key: z.string().min(1).max(60), done: z.boolean() }).parse({ date, key, done });
  const sb = await createClient();
  if (p.done) {
    await sb.from("daily_checks").upsert({ date: p.date, item_key: p.key, done: true }, { onConflict: "user_id,date,item_key" });
  } else {
    await sb.from("daily_checks").delete().eq("date", p.date).eq("item_key", p.key);
  }
  revalidatePath("/");
}

async function streakRow() {
  const sb = await createClient();
  let { data } = await sb.from("streaks").select("*").maybeSingle();
  if (!data) data = (await sb.from("streaks").insert({}).select("*").single()).data;
  return { sb, row: data! };
}

/** Imprevisto: hoje não soma, mas protege a sequência. */
export async function excuseToday() {
  const { sb, row } = await streakRow();
  const t = todayISO();
  const list: string[] = row.excused_dates ?? [];
  const next = list.includes(t) ? list.filter((d) => d !== t) : [...list, t];
  await sb.from("streaks").update({ excused_dates: next }).eq("id", row.id);
  revalidatePath("/");
}

/** Zera a sequência e mantém o recorde. last_date = data do recomeço. */
export async function honestRestart() {
  const { sb, row } = await streakRow();
  await sb.from("streaks").update({ count: 0, last_date: todayISO() }).eq("id", row.id);
  revalidatePath("/");
}

export async function saveDailyText(text: string) {
  const t = z.string().max(4000).parse(text);
  const sb = await createClient();
  await sb.from("settings").update({ daily_text: t || null, daily_text_date: todayISO() }).not("id", "is", null);
  revalidatePath("/");
}

/** Reflexão sobre o texto do dia → vai para o diário espiritual. */
export async function saveDailyReflection(text: string) {
  const t = z.string().trim().min(1).max(2000).parse(text);
  const sb = await createClient();
  await sb.from("journal_entries").insert({ date: todayISO(), kind: "reflexao", text: `Texto do dia: ${t}` });
  revalidatePath("/"); revalidatePath("/espiritual");
}
