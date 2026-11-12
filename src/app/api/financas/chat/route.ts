import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { todayISO } from "@/lib/date";
import { financeTools } from "@/lib/finance-ai/tools";
import { FINANCE_SYSTEM } from "@/lib/finance-ai/prompt";
import { forecast, monthOverview, shiftMonth, type Item } from "@/lib/finance-ai/analysis";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
const MODEL = "claude-haiku-5-5";
const HISTORY = 20, PER_HOUR = 40;

export async function POST(req: NextRequest) {
  const sb = await createClient();
  const { data: auth } = await sb.auth.getClaims();
  if (!auth?.claims) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "Falta configurar ANTHROPIC_API_KEY nas variáveis da Vercel." }, { status: 503 });

  const parsed = z.object({ message: z.string().trim().min(1).max(2000) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Mensagem inválida." }, { status: 400 });
  const message = parsed.data.message;

  // Limite simples de uso por hora.
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { count, error: tableErr } = await sb.from("finance_chat_messages").select("id", { count: "exact", head: true }).eq("role", "user").gte("created_at", hourAgo);
  if (tableErr) return NextResponse.json({ error: "Rode a migração do assistente (supabase/migrations/20261112000000_assistente.sql)." }, { status: 503 });
  if ((count ?? 0) >= PER_HOUR) return NextResponse.json({ error: "Muitas perguntas na última hora. Tente daqui a pouco." }, { status: 429 });

  const today = todayISO(), month = today.slice(0, 7) + "-01";
  const [settings, hist, items] = await Promise.all([
    getSettings(sb),
    sb.from("finance_chat_messages").select("role,content").order("created_at", { ascending: false }).limit(HISTORY),
    sb.from("finance_items").select("id,date,month,kind,name,amount,category,paid,recurring").gte("month", shiftMonth(month, -3)).lte("month", month).limit(5000),
  ]);

  // Resumo rápido: poupa chamadas de ferramenta nas perguntas mais comuns.
  const all: Item[] = (items.data ?? []).map((r) => ({ ...r, date: r.date ?? r.month, amount: Number(r.amount), paid: r.paid !== false, recurring: !!r.recurring }));
  const ov = monthOverview(all.filter((i) => i.month === month));
  const fc = forecast(all.filter((i) => i.month === month), [1, 2, 3].map((k) => all.filter((i) => i.month === shiftMonth(month, -k))), today, month);
  const context = [
    `# Contexto atual`,
    `- Hoje: ${today.split("-").reverse().join("/")} (dia ${fc.day} de ${fc.days_in_month}).`,
    `- Mês até agora: entrou R$ ${ov.income} (recebido R$ ${ov.income_received}), saiu R$ ${ov.expenses} (pendente R$ ${ov.expenses_pending}).`,
    `- Projeção de fechamento: R$ ${fc.projected_balance} (${fc.method}).`,
    `- Categorias: ${settings.finance_categories.map((c) => `${c.label} [${c.key}, ${c.kind}${c.budget ? `, teto ${c.budget}` : ""}]`).join("; ")}.`,
  ].join("\n");

  const history: Anthropic.Beta.BetaMessageParam[] = (hist.data ?? []).reverse().map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
  // A primeira mensagem precisa ser do usuário.
  while (history.length && history[0].role !== "user") history.shift();
  const startedAt = new Date().toISOString();

  try {
    const client = new Anthropic();
    const final = await client.beta.messages.toolRunner({
      model: MODEL,
      max_tokens: 16000,
      max_iterations: 8,
      output_config: { effort: "medium" },
      cache_control: { type: "ephemeral" },
      system: [{ type: "text", text: FINANCE_SYSTEM }, { type: "text", text: context }],
      tools: financeTools(sb, { today, cats: settings.finance_categories }),
      messages: [...history, { role: "user", content: message }],
    });

    let reply = final.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text").map((b) => b.text).join("\n").trim();
    if (final.stop_reason === "refusal") reply = "Não consigo ajudar com isso. Pergunte sobre seus gastos, metas ou orçamento.";
    else if (!reply) reply = "Não consegui formular uma resposta agora. Tente perguntar de outro jeito.";

    await sb.from("finance_chat_messages").insert([{ role: "user", content: message }, { role: "assistant", content: reply }]);
    const { data: proposals } = await sb.from("finance_chat_proposals").select("id,kind,summary,status").eq("status", "pending").gte("created_at", startedAt);
    return NextResponse.json({ reply, proposals: proposals ?? [] });
  } catch (e) {
    const msg = e instanceof Anthropic.AuthenticationError ? "A chave da API do Claude é inválida. Confira ANTHROPIC_API_KEY na Vercel."
      : e instanceof Anthropic.PermissionDeniedError ? "A chave da API não tem acesso a este modelo."
      : e instanceof Anthropic.RateLimitError ? "Limite da API atingido. Tente em um minuto."
      : e instanceof Anthropic.APIError ? `Erro da API do Claude (${e.status}). Tente de novo.`
      : "Não foi possível falar com o assistente agora.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
