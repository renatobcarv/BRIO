// Gemini (Google AI) via REST. Só no servidor. Tenta modelos em ordem caso um nome deixe de existir (404).
import "server-only";

const MODELS = [process.env.GEMINI_MODEL, "gemini-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash"].filter(Boolean) as string[];

/** Gera JSON seguindo o esquema. Retorna o objeto ou { error }. */
export async function geminiJSON<T>(system: string, user: string, schema: object): Promise<T | { error: string }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { error: "Falta GEMINI_API_KEY na Vercel." };
  let last = 0;
  for (const model of MODELS) for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt) await new Promise((ok) => setTimeout(ok, 900));
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { temperature: 0.3, responseMimeType: "application/json", responseSchema: schema },
      }),
    });
    last = r.status;
    if (r.status === 404) break; // nome de modelo inexistente: tenta o próximo
    if (r.status === 503 || r.status === 500 || r.status === 502) { if (attempt === 0) continue; break; } // sobrecarga: tenta de novo e depois outro modelo
    if (r.status === 400 || r.status === 403) { const t = await r.text(); return { error: /API key|PERMISSION|key/i.test(t) ? "Chave do Gemini inválida ou sem acesso. Confira GEMINI_API_KEY." : "O Gemini recusou o pedido. Tente reformular." }; }
    if (r.status === 429) return { error: "Limite do Gemini atingido. Tente em um minuto." };
    if (!r.ok) return { error: `O Gemini não respondeu (${r.status}). Tente de novo.` };
    const j = (await r.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const txt = j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    try { return JSON.parse(txt) as T; } catch { return { error: "Não entendi a resposta. Tente de novo." }; }
  }
  return { error: last === 503 || last === 500 || last === 502 ? "O Gemini está sobrecarregado agora. Tente em instantes." : `Nenhum modelo do Gemini disponível (${last}). Defina GEMINI_MODEL na Vercel.`, overloaded: last >= 500 } as { error: string };
}
