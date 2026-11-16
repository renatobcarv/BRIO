// Camada de provedores de IA (só servidor). Lógica pedagógica não depende daqui.
// Adicionar provedor = implementar `stream` e `json` e registrar em PROVIDERS.
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { geminiJSON } from "@/lib/gemini";
import type { Msg } from "./pedagogy";

export type ProviderId = "claude" | "gemini";
export type Usage = { tokens_in?: number; tokens_out?: number; model: string };
export type StreamResult = { chunks: AsyncIterable<string>; done: Promise<Usage> };

type Provider = {
  label: string;
  ready: () => boolean;
  model: () => string;
  stream: (system: string, msgs: Msg[]) => Promise<StreamResult>;
  json: <T>(system: string, user: string, schema: Record<string, unknown>) => Promise<T | { error: string }>;
};

const claudeModel = () => process.env.AI_CLAUDE_MODEL || "claude-sonnet-5-5";
const geminiModel = () => process.env.GEMINI_MODEL || "gemini-flash-latest";

const claude: Provider = {
  label: "Claude",
  ready: () => !!process.env.ANTHROPIC_API_KEY,
  model: claudeModel,
  async stream(system, msgs) {
    const client = new Anthropic();
    const s = client.messages.stream({ model: claudeModel(), max_tokens: 4000, system, messages: msgs.map((m) => ({ role: m.role, content: m.content })) });
    let resolve!: (u: Usage) => void, reject!: (e: unknown) => void;
    const done = new Promise<Usage>((ok, ko) => { resolve = ok; reject = ko; });
    async function* chunks() {
      try {
        for await (const ev of s) if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") yield ev.delta.text;
        const f = await s.finalMessage();
        resolve({ model: claudeModel(), tokens_in: f.usage.input_tokens, tokens_out: f.usage.output_tokens });
      } catch (e) { reject(e); throw e; }
    }
    return { chunks: chunks(), done };
  },
  async json<T>(system: string, user: string, schema: Record<string, unknown>) {
    try {
      const client = new Anthropic();
      const r = await client.messages.create({
        model: process.env.AI_CLAUDE_FAST_MODEL || "claude-haiku-5-5", max_tokens: 4000, system,
        tools: [{ name: "responder", description: "Devolve a resposta estruturada.", input_schema: schema as Anthropic.Tool.InputSchema }],
        tool_choice: { type: "tool", name: "responder" },
        messages: [{ role: "user", content: user }],
      });
      const b = r.content.find((c) => c.type === "tool_use");
      return b && b.type === "tool_use" ? (b.input as T) : { error: "O Claude não devolveu a estrutura." };
    } catch (e) { return { error: errText(e, "Claude") }; }
  },
};

const gemini: Provider = {
  label: "Gemini",
  ready: () => !!process.env.GEMINI_API_KEY,
  model: geminiModel,
  async stream(system, msgs) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel()}:streamGenerateContent?alt=sse`, {
      method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: msgs.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
        generationConfig: { temperature: 0.6, maxOutputTokens: 4000 },
      }),
    });
    if (!r.ok || !r.body) throw new HttpError(r.status, "Gemini");
    let usage: Usage = { model: geminiModel() };
    let resolve!: (u: Usage) => void, reject!: (e: unknown) => void;
    const done = new Promise<Usage>((ok, ko) => { resolve = ok; reject = ko; });
    const body = r.body;
    async function* chunks() {
      const reader = body.getReader(), dec = new TextDecoder(); let buf = "";
      try {
        for (;;) {
          const { value, done: end } = await reader.read();
          if (end) break;
          buf += dec.decode(value, { stream: true });
          let i;
          while ((i = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
            if (!line.startsWith("data:")) continue;
            try {
              const j = JSON.parse(line.slice(5)) as { candidates?: { content?: { parts?: { text?: string }[] } }[]; usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number } };
              const t = j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
              if (j.usageMetadata) usage = { model: geminiModel(), tokens_in: j.usageMetadata.promptTokenCount, tokens_out: j.usageMetadata.candidatesTokenCount };
              if (t) yield t;
            } catch { /* linha parcial */ }
          }
        }
        resolve(usage);
      } catch (e) { reject(e); throw e; }
    }
    return { chunks: chunks(), done };
  },
  json: (system, user, schema) => geminiJSON(system, user, schema),
};

export const PROVIDERS: Record<ProviderId, Provider> = { claude, gemini };

export function providerStatus() {
  return (Object.keys(PROVIDERS) as ProviderId[]).map((id) => ({ id, label: PROVIDERS[id].label, ready: PROVIDERS[id].ready(), model: PROVIDERS[id].model() }));
}

/** Provedor pedido se estiver configurado; senão o outro. */
export function pick(id?: string | null): ProviderId | null {
  const pref = (id === "gemini" || id === "claude" ? id : (process.env.AI_PROVIDER as ProviderId)) || "claude";
  if (PROVIDERS[pref]?.ready()) return pref;
  const other = pref === "claude" ? "gemini" : "claude";
  return PROVIDERS[other].ready() ? other : null;
}

/** JSON estruturado com queda automática para o outro provedor. */
export async function aiJSON<T>(id: string | null | undefined, system: string, user: string, schema: Record<string, unknown>): Promise<T | { error: string }> {
  const first = pick(id);
  if (!first) return { error: "Nenhuma IA configurada. Defina ANTHROPIC_API_KEY ou GEMINI_API_KEY na Vercel." };
  const r = await PROVIDERS[first].json<T>(system, user, schema);
  if (r && typeof r === "object" && "error" in (r as object)) {
    const other: ProviderId = first === "claude" ? "gemini" : "claude";
    if (PROVIDERS[other].ready()) return PROVIDERS[other].json<T>(system, user, schema);
  }
  return r;
}

export class HttpError extends Error { constructor(public status: number, who: string) { super(`${who} ${status}`); } }
export function errText(e: unknown, who = "A IA"): string {
  const status = e instanceof HttpError ? e.status : (e as { status?: number })?.status;
  if (status === 401 || status === 403) return `Chave do ${who} inválida ou sem acesso.`;
  if (status === 429) return `Limite do ${who} atingido. Tente em um minuto.`;
  if (status && status >= 500) return `O ${who} está sobrecarregado agora. Tente de novo ou troque de IA.`;
  return `${who} não respondeu. Tente de novo.`;
}
