// Chat de estudo com IA em streaming. Chaves só no servidor; histórico persistido em ai_messages.
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { contextWindow, systemPrompt, MODES, type Mode, type Msg } from "@/lib/ai/pedagogy";
import { PROVIDERS, aiJSON, errText, pick, type ProviderId, type StreamResult } from "@/lib/ai/providers";

export const dynamic = "force-dynamic";
export const maxDuration = 120;
const PER_HOUR = 80;

const Body = z.object({
  session_id: z.string().uuid(),
  message: z.string().trim().min(1).max(12000),
  mode: z.enum(Object.keys(MODES) as [Mode, ...Mode[]]).optional(),
  provider: z.enum(["claude", "gemini"]).optional(),
});

export async function POST(req: NextRequest) {
  const sb = await createClient();
  const { data: auth } = await sb.auth.getClaims();
  if (!auth?.claims) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Mensagem inválida." }, { status: 400 });
  const { session_id, message } = p.data;

  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { count, error: tErr } = await sb.from("ai_messages").select("id", { count: "exact", head: true }).eq("role", "user").gte("created_at", hourAgo);
  if (tErr) return NextResponse.json({ error: "Rode a migração supabase/migrations/20261121000000_estudar_ia.sql." }, { status: 503 });
  if ((count ?? 0) >= PER_HOUR) return NextResponse.json({ error: "Muitas mensagens na última hora. Respire e volte em instantes." }, { status: 429 });

  const { data: s } = await sb.from("ai_sessions").select("*").eq("id", session_id).maybeSingle();
  if (!s) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 404 });
  const mode = (p.data.mode ?? s.mode) as Mode;
  const provider = pick(p.data.provider ?? s.provider);
  if (!provider) return NextResponse.json({ error: "Nenhuma IA configurada. Defina ANTHROPIC_API_KEY ou GEMINI_API_KEY na Vercel." }, { status: 503 });

  const [hist, notes, ev, track, item, project] = await Promise.all([
    sb.from("ai_messages").select("role,content").eq("session_id", session_id).order("created_at").limit(400),
    sb.from("study_notes").select("kind,title,body").or(`session_id.eq.${session_id}${s.track_id ? `,track_id.eq.${s.track_id}` : ""}`).order("created_at", { ascending: false }).limit(8),
    sb.from("study_evidence").select("topic,level,justification").or(`session_id.eq.${session_id}${s.track_id ? `,track_id.eq.${s.track_id}` : ""}`).order("created_at", { ascending: false }).limit(6),
    s.track_id ? sb.from("study_tracks").select("title").eq("id", s.track_id).maybeSingle() : Promise.resolve({ data: null }),
    s.item_id ? sb.from("study_items").select("title").eq("id", s.item_id).maybeSingle() : Promise.resolve({ data: null }),
    s.project_id ? sb.from("study_projects").select("title").eq("id", s.project_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  await sb.from("ai_messages").insert({ session_id, role: "user", content: message, mode, provider });
  const all: Msg[] = [...((hist.data ?? []) as Msg[]), { role: "user", content: message }];
  const { kept, dropped } = contextWindow(all);
  const system = systemPrompt({
    title: s.title, subject: s.subject, goal: s.goal, level: s.level, outcome: s.outcome, mode, stage: s.stage, summary: s.summary,
    track: track.data?.title, item: item.data?.title, project: project.data?.title,
    notes: notes.data ?? [], evidence: ev.data ?? [],
  });

  // Inicia o stream; se o provedor escolhido falhar logo de cara, tenta o outro.
  let used: ProviderId = provider, res: StreamResult;
  try { res = await PROVIDERS[provider].stream(system, kept); }
  catch (e) {
    const other: ProviderId = provider === "claude" ? "gemini" : "claude";
    if (!PROVIDERS[other].ready()) return NextResponse.json({ error: errText(e, PROVIDERS[provider].label) }, { status: 502 });
    try { res = await PROVIDERS[other].stream(system, kept); used = other; }
    catch (e2) { return NextResponse.json({ error: errText(e2, PROVIDERS[other].label) }, { status: 502 }); }
  }

  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(ctrl) {
      let text = "";
      try {
        for await (const c of res.chunks) { text += c; ctrl.enqueue(enc.encode(c)); }
        const u = await res.done.catch(() => ({ model: PROVIDERS[used].model() }) as { model: string; tokens_in?: number; tokens_out?: number });
        if (text.trim()) await sb.from("ai_messages").insert({ session_id, role: "assistant", content: text.slice(0, 60000), mode, provider: used, model: u.model, tokens_in: u.tokens_in ?? null, tokens_out: u.tokens_out ?? null });
        await sb.from("ai_sessions").update({ updated_at: new Date().toISOString(), mode, provider: used }).eq("id", session_id);
        // Mensagens que saíram da janela entram no resumo (a cada 8 novas, para economizar chamadas).
        if (dropped > 0 && all.length % 8 === 0) {
          const old = all.slice(0, dropped).map((m) => `${m.role === "user" ? "Aluno" : "Tutor"}: ${m.content.slice(0, 1500)}`).join("\n");
          const r = await aiJSON<{ summary: string; stage: string }>(used, "Resuma a sessão de estudo para o tutor continuar sem perder contexto: o que foi visto, o que o aluno acertou/errou, dúvidas abertas. Máx. 900 caracteres. stage = etapa atual em até 8 palavras.",
            `Resumo anterior:\n${s.summary ?? "(nenhum)"}\n\nTrecho antigo:\n${old}`, { type: "object", properties: { summary: { type: "string" }, stage: { type: "string" } }, required: ["summary", "stage"] });
          if (!("error" in r)) await sb.from("ai_sessions").update({ summary: r.summary.slice(0, 2000), stage: r.stage.slice(0, 120) }).eq("id", session_id);
        }
      } catch (e) {
        ctrl.enqueue(enc.encode(`\n\n⚠ ${errText(e, PROVIDERS[used].label)}`));
      } finally { ctrl.close(); }
    },
  });
  return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-provider": used } });
}
