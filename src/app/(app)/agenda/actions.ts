"use server";
import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { accessToken, remove, revoke, upsert } from "@/lib/google";
import { geminiJSON } from "@/lib/gemini";

const Ev = z.object({
  title: z.string().trim().min(1).max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  category: z.enum(["pessoal", "espiritual", "campo", "treino", "financas", "trabalho", "familia"]),
  location: z.string().max(200).nullable(),
  notes: z.string().max(2000).nullable(),
  remind_min: z.number().int().min(0).max(10080).nullable(),
});
const msg = (e: { message: string } | null) => (e ? (e.message.includes("calendar") ? "Rode a migração 20261116000000_agenda.sql no Supabase." : e.message) : null);

export async function saveEvent(input: z.input<typeof Ev>, id?: string): Promise<string | null> {
  const p = Ev.safeParse(input);
  if (!p.success) return p.error.issues[0]?.message ?? "Dados inválidos.";
  if (p.data.start_time && p.data.end_time && p.data.end_time <= p.data.start_time) return "O fim precisa ser depois do início.";
  const sb = await createClient();
  const { data: row, error } = id
    ? await sb.from("calendar_events").update({ ...p.data, updated_at: new Date().toISOString() }).eq("id", z.string().uuid().parse(id)).select("id,google_id").single()
    : await sb.from("calendar_events").insert(p.data).select("id,google_id").single();
  if (!error && row) await mirror(sb, row.id, p.data, (row as { google_id?: string | null }).google_id ?? null);
  revalidatePath("/agenda"); revalidatePath("/");
  return msg(error);
}

/** Espelha no Google Agenda, se conectado. Falha no Google não impede salvar no BRIO. */
async function mirror(sb: Awaited<ReturnType<typeof createClient>>, id: string, ev: z.infer<typeof Ev>, googleId: string | null) {
  const { data: g } = await sb.from("google_calendar").select("refresh_token,calendar_id").maybeSingle();
  if (!g) return;
  try {
    const gid = await upsert(await accessToken(g.refresh_token), g.calendar_id, ev, googleId);
    if (gid !== googleId) await sb.from("calendar_events").update({ google_id: gid }).eq("id", id);
  } catch { /* fica só no BRIO; a próxima edição tenta de novo */ }
}
export async function deleteEvent(id: string): Promise<string | null> {
  const sb = await createClient();
  const [{ data: ev }, { data: g }] = await Promise.all([
    sb.from("calendar_events").select("google_id").eq("id", z.string().uuid().parse(id)).maybeSingle(),
    sb.from("google_calendar").select("refresh_token,calendar_id").maybeSingle(),
  ]);
  if (g && ev?.google_id) { try { await remove(await accessToken(g.refresh_token), g.calendar_id, ev.google_id); } catch { /* segue */ } }
  const { error } = await sb.from("calendar_events").delete().eq("id", z.string().uuid().parse(id));
  revalidatePath("/agenda"); revalidatePath("/");
  return msg(error);
}
/** Gera (ou troca) o link secreto. O antigo para de funcionar na hora. */
export async function rotateCalendarToken(): Promise<string | null> {
  const sb = await createClient();
  const { error } = await sb.from("settings").update({ calendar_token: randomBytes(24).toString("hex") }).not("id", "is", null);
  revalidatePath("/agenda");
  return msg(error);
}
export async function disableCalendarToken(): Promise<string | null> {
  const sb = await createClient();
  const { error } = await sb.from("settings").update({ calendar_token: null }).not("id", "is", null);
  revalidatePath("/agenda");
  return msg(error);
}

/** Envia ao Google todos os compromissos ainda não espelhados (a partir de hoje). */
export async function syncAllToGoogle(): Promise<string | null> {
  const sb = await createClient();
  const { data: g } = await sb.from("google_calendar").select("refresh_token,calendar_id").maybeSingle();
  if (!g) return "Google não conectado.";
  const today = new Date(Date.now() - 3 * 36e5).toISOString().slice(0, 10);
  const { data: evs } = await sb.from("calendar_events").select("id,title,date,start_time,end_time,category,location,notes,remind_min,google_id").gte("date", today).is("google_id", null).limit(200);
  try {
    const tok = await accessToken(g.refresh_token);
    for (const e of evs ?? []) { const gid = await upsert(tok, g.calendar_id, e as never, null); await sb.from("calendar_events").update({ google_id: gid }).eq("id", e.id); }
  } catch (e) { return e instanceof Error ? e.message : "Falha ao sincronizar."; }
  revalidatePath("/agenda");
  return null;
}
export async function disconnectGoogle(): Promise<string | null> {
  const sb = await createClient();
  const { data: g } = await sb.from("google_calendar").select("refresh_token").maybeSingle();
  if (g) await revoke(g.refresh_token);
  const { error } = await sb.from("google_calendar").delete().not("user_id", "is", null);
  await sb.from("calendar_events").update({ google_id: null }).not("google_id", "is", null);
  revalidatePath("/agenda");
  return msg(error);
}

// ── IA: transforma o que você fala em compromissos (propostas para confirmar) ──
export type AgendaProposal = { action: "criar" | "alterar" | "apagar"; id?: string; title: string; date: string; start_time: string | null; end_time: string | null;
  category: z.infer<typeof Ev>["category"]; location: string | null; notes: string | null; remind_min: number | null; why?: string };

export async function aiAgenda(text: string, today: string): Promise<{ reply: string; proposals: AgendaProposal[] } | { error: string }> {
  const msgText = z.string().trim().min(2).max(1500).safeParse(text);
  if (!msgText.success) return { error: "Escreva o que você tem marcado." };
  const GEMINI = process.env.GEMINI_API_KEY, CLAUDE = process.env.ANTHROPIC_API_KEY;
  if (!GEMINI && !CLAUDE) return { error: "Falta GEMINI_API_KEY na Vercel." };
  const sb = await createClient();
  const until = new Date(Date.parse(today + "T12:00:00Z") + 60 * 864e5).toISOString().slice(0, 10);
  const { data: evs } = await sb.from("calendar_events").select("id,title,date,start_time,end_time,category,location").gte("date", today).lte("date", until).order("date").limit(200);
  const wd = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"][new Date(today + "T12:00:00Z").getUTCDay()];
  const system = `Você organiza a agenda pessoal do Renato (fuso America/Sao_Paulo). Hoje é ${wd}, ${today}.
Interprete o que ele disser e proponha compromissos com a ferramenta "propor". Datas relativas ("amanhã", "quinta", "dia 20", "semana que vem") viram datas ISO a partir de hoje; "quinta" sem mais contexto é a próxima quinta (hoje conta se ainda for possível).
Sem horário = dia todo (start_time null). Sem fim = deixe end_time null. Categorias: pessoal, espiritual (reuniões, estudo, assembleia), campo (pregação, revisitas, estudos bíblicos), treino, financas (pagamentos, vencimentos), trabalho, familia.
Lembrete padrão: 30 min para eventos com horário, 1440 (1 dia) para vencimentos e dia todo.
Para mudar ou cancelar algo existente, use "alterar" ou "apagar" com o id da lista. Não invente compromissos que ele não pediu. "reply" é uma frase curta em PT-BR resumindo.
Compromissos existentes (próximos 60 dias):
${(evs ?? []).map((e) => `${e.id} | ${e.date} ${e.start_time?.slice(0, 5) ?? "dia todo"}${e.end_time ? "-" + e.end_time.slice(0, 5) : ""} | ${e.title} | ${e.category}`).join("\n") || "(nenhum)"}`;
  const CATS = ["pessoal", "espiritual", "campo", "treino", "financas", "trabalho", "familia"];
  try {
    let out: { reply: string; items: Partial<AgendaProposal>[] };
    if (GEMINI) {
      const g = await geminiJSON<{ reply: string; items: Partial<AgendaProposal>[] }>(system + '\nResponda só com JSON no formato pedido. "items" lista o que criar/alterar/apagar.', msgText.data, {
        type: "OBJECT", properties: {
          reply: { type: "STRING" },
          items: { type: "ARRAY", items: { type: "OBJECT", properties: {
            action: { type: "STRING", enum: ["criar", "alterar", "apagar"] }, id: { type: "STRING" }, title: { type: "STRING" },
            date: { type: "STRING" }, start_time: { type: "STRING", nullable: true }, end_time: { type: "STRING", nullable: true },
            category: { type: "STRING", enum: CATS }, location: { type: "STRING", nullable: true }, notes: { type: "STRING", nullable: true }, remind_min: { type: "INTEGER", nullable: true },
          }, required: ["action", "title", "date", "category"] } },
        }, required: ["reply", "items"] });
      if ("error" in g) return g;
      out = g;
    } else {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic();
      const r = await client.messages.create({
        model: "claude-haiku-5-5", max_tokens: 4000, system,
        tools: [{
          name: "propor", description: "Propõe criar, alterar ou apagar compromissos.",
          input_schema: { type: "object", properties: {
            reply: { type: "string" },
            items: { type: "array", items: { type: "object", properties: {
              action: { type: "string", enum: ["criar", "alterar", "apagar"] }, id: { type: "string" },
              title: { type: "string" }, date: { type: "string", description: "YYYY-MM-DD" },
              start_time: { type: ["string", "null"], description: "HH:MM" }, end_time: { type: ["string", "null"], description: "HH:MM" },
              category: { type: "string", enum: CATS },
              location: { type: ["string", "null"] }, notes: { type: ["string", "null"] }, remind_min: { type: ["integer", "null"] },
            }, required: ["action", "title", "date", "category"] } },
          }, required: ["reply", "items"] },
        }],
        tool_choice: { type: "tool", name: "propor" },
        messages: [{ role: "user", content: msgText.data }],
      });
      const tu = r.content.find((b) => b.type === "tool_use");
      if (!tu || tu.type !== "tool_use") return { error: "Não entendi. Tente de novo com dia e horário." };
      out = tu.input as { reply: string; items: Partial<AgendaProposal>[] };
    }
    const hm = (t: unknown) => (typeof t === "string" && /^\d{1,2}:\d{2}/.test(t) ? t.padStart(5, "0").slice(0, 5) : null);
    const proposals = (out.items ?? []).filter((i) => i.title && /^\d{4}-\d{2}-\d{2}$/.test(i.date ?? "")).map((i) => ({
      action: (i.action ?? "criar") as AgendaProposal["action"], id: i.id, title: String(i.title).slice(0, 120), date: i.date!, start_time: hm(i.start_time), end_time: hm(i.end_time),
      category: (CATS.includes(String(i.category)) ? i.category : "pessoal") as AgendaProposal["category"],
      location: i.location ?? null, notes: i.notes ?? null, remind_min: typeof i.remind_min === "number" ? i.remind_min : null,
    }));
    return { reply: out.reply ?? "", proposals };
  } catch (e) {
    return { error: e instanceof Error && /401|auth/i.test(e.message) ? "Chave da API inválida." : "A IA não respondeu agora. Tente de novo." };
  }
}

/** Aplica as propostas confirmadas. */
export async function applyProposals(list: AgendaProposal[]): Promise<string | null> {
  for (const p of list) {
    if (p.action === "apagar" && p.id) { const e = await deleteEvent(p.id); if (e) return e; continue; }
    const e = await saveEvent({ title: p.title, date: p.date, start_time: p.start_time, end_time: p.end_time, category: p.category, location: p.location, notes: p.notes, remind_min: p.remind_min },
      p.action === "alterar" && p.id ? p.id : undefined);
    if (e) return e;
  }
  return null;
}
