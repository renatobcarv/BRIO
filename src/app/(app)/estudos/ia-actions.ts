"use server";
// Ações do Estudar com IA, Base de Conhecimento e Build Lab. Retornam { error } em vez de lançar.
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/date";
import { aiJSON } from "@/lib/ai/providers";
import { MODES, type Mode } from "@/lib/ai/pedagogy";
import { masteryFromLevel, nextReview } from "@/lib/learning";

const Id = z.string().uuid();
const opt = (n: number) => z.string().trim().max(n).optional().nullable().transform((v) => v || null);
const err = (e: { message: string } | null) => (e ? (/relation|does not exist|schema cache/i.test(e.message) ? "Rode a migração 20261121000000_estudar_ia.sql no Supabase." : e.message) : null);
const refresh = () => { revalidatePath("/estudos", "layout"); };
const ModeZ = z.enum(Object.keys(MODES) as [Mode, ...Mode[]]);

// ───────── Sessões ─────────
const NewSession = z.object({
  text: opt(2000), subject: opt(160), goal: opt(500), level: opt(120), outcome: opt(500),
  mode: ModeZ.default("ensinar"), provider: z.enum(["claude", "gemini"]).default("claude"),
  track_id: Id.optional().nullable(), item_id: Id.optional().nullable(), project_id: Id.optional().nullable(),
});
export async function createSession(input: z.input<typeof NewSession>): Promise<{ id?: string; error?: string }> {
  const p = NewSession.safeParse(input);
  if (!p.success) return { error: "Dados inválidos." };
  const d = p.data;
  const title = (d.subject || d.text || "Sessão de estudo").replace(/\s+/g, " ").slice(0, 80);
  if (!d.subject && !d.text) return { error: "Escreva o que quer aprender." };
  const sb = await createClient();
  const { data, error } = await sb.from("ai_sessions").insert({
    title, subject: d.subject ?? d.text?.slice(0, 160) ?? null, goal: d.goal, level: d.level, outcome: d.outcome, mode: d.mode, provider: d.provider,
    track_id: d.track_id ?? null, item_id: d.item_id ?? null, project_id: d.project_id ?? null,
  }).select("id").single();
  refresh();
  return error ? { error: err(error)! } : { id: data.id };
}

const Patch = z.object({ title: opt(160), goal: opt(500), level: opt(120), outcome: opt(500), mode: ModeZ.optional(), provider: z.enum(["claude", "gemini"]).optional(), stage: opt(120) }).partial();
export async function updateSession(id: string, patch: z.input<typeof Patch>) {
  const p = Patch.safeParse(patch);
  if (!p.success) return "Dados inválidos.";
  const clean = Object.fromEntries(Object.entries(p.data).filter(([, v]) => v !== undefined));
  const sb = await createClient();
  const { error } = await sb.from("ai_sessions").update(clean).eq("id", Id.parse(id));
  refresh(); return err(error);
}
export async function deleteSession(id: string) {
  const sb = await createClient();
  const { error } = await sb.from("ai_sessions").delete().eq("id", Id.parse(id));
  refresh(); return err(error);
}

async function transcript(sessionId: string, max = 30) {
  const sb = await createClient();
  const [s, m] = await Promise.all([
    sb.from("ai_sessions").select("*").eq("id", sessionId).maybeSingle(),
    sb.from("ai_messages").select("role,content").eq("session_id", sessionId).order("created_at", { ascending: false }).limit(max),
  ]);
  const msgs = (m.data ?? []).reverse();
  return { sb, s: s.data, text: msgs.map((x) => `${x.role === "user" ? "ALUNO" : "TUTOR"}: ${x.content.slice(0, 2500)}`).join("\n\n"), n: msgs.length };
}

export async function endSession(id: string): Promise<{ summary?: string; error?: string }> {
  const { sb, s, text, n } = await transcript(Id.parse(id), 60);
  if (!s) return { error: "Sessão não encontrada." };
  let summary = s.summary as string | null;
  if (n >= 2) {
    const r = await aiJSON<{ summary: string }>(s.provider, "Resuma a sessão de estudo em português, em até 6 tópicos curtos: o que foi estudado, o que o aluno demonstrou saber, erros e o próximo passo recomendado.", text, { type: "object", properties: { summary: { type: "string" } }, required: ["summary"] });
    if ("error" in r) return { error: r.error };
    summary = r.summary.slice(0, 3000);
  }
  const { error } = await sb.from("ai_sessions").update({ status: "encerrada", summary, updated_at: new Date().toISOString() }).eq("id", s.id);
  refresh();
  return error ? { error: err(error)! } : { summary: summary ?? "" };
}
export async function reopenSession(id: string) {
  const sb = await createClient();
  const { error } = await sb.from("ai_sessions").update({ status: "ativa" }).eq("id", Id.parse(id));
  refresh(); return err(error);
}

// ───────── Anotações sugeridas (aprovação manual) ─────────
export type NoteSuggestion = { kind: string; title: string; body: string };
const KINDS = ["conceito", "definicao", "exemplo", "insight", "resumo", "referencia", "pergunta", "erro"] as const;
export async function suggestNotes(sessionId: string): Promise<{ notes?: NoteSuggestion[]; error?: string }> {
  const { s, text, n } = await transcript(Id.parse(sessionId));
  if (!s) return { error: "Sessão não encontrada." };
  if (n < 2) return { error: "Converse um pouco antes de pedir anotações." };
  const r = await aiJSON<{ notes: NoteSuggestion[] }>(s.provider,
    "Extraia de 2 a 6 anotações que valem a pena guardar desta sessão de estudo. Cada uma deve ser autossuficiente e servir para revisão ativa: title é uma PERGUNTA ou o nome do conceito; body é a resposta/explicação correta em até 600 caracteres. Inclua um item 'erro' para cada erro conceitual que o aluno cometeu. Não copie a conversa.",
    text, { type: "object", properties: { notes: { type: "array", items: { type: "object", properties: { kind: { type: "string", enum: [...KINDS] }, title: { type: "string" }, body: { type: "string" } }, required: ["kind", "title", "body"] } } }, required: ["notes"] });
  if ("error" in r) return { error: r.error };
  return { notes: (r.notes ?? []).filter((x) => x.title).slice(0, 6) };
}

const Note = z.object({
  kind: z.enum(KINDS).default("conceito"), title: z.string().trim().min(1).max(200), body: z.string().trim().max(20000).default(""),
  track_id: Id.optional().nullable(), session_id: Id.optional().nullable(), project_id: Id.optional().nullable(), in_review: z.boolean().default(true),
});
export async function saveNote(input: z.input<typeof Note>, id?: string) {
  const p = Note.safeParse(input);
  if (!p.success) return "Dê um título à anotação.";
  const sb = await createClient();
  const row = { ...p.data, track_id: p.data.track_id ?? null, session_id: p.data.session_id ?? null, project_id: p.data.project_id ?? null };
  const { error } = id ? await sb.from("study_notes").update(row).eq("id", Id.parse(id))
    : await sb.from("study_notes").insert({ ...row, review_at: p.data.in_review ? todayISO() : null });
  refresh(); return err(error);
}
export async function deleteNote(id: string) {
  const sb = await createClient();
  const { error } = await sb.from("study_notes").delete().eq("id", Id.parse(id));
  refresh(); return err(error);
}

// ───────── Revisão espaçada com recuperação ativa ─────────
/** Corrige a resposta escrita. Sem IA disponível, usa a autoavaliação (selfQuality) — mas só depois de responder. */
export async function gradeReview(noteId: string, answer: string, selfQuality?: number): Promise<{ quality?: number; feedback?: string; next?: string; error?: string }> {
  const ans = answer.trim();
  if (ans.length < 2) return { error: "Responda antes de conferir. Revisão só conta com resposta." };
  const sb = await createClient();
  const { data: n } = await sb.from("study_notes").select("*").eq("id", Id.parse(noteId)).maybeSingle();
  if (!n) return { error: "Anotação não encontrada." };
  let quality = selfQuality, feedback = "";
  if (quality == null) {
    const r = await aiJSON<{ quality: number; feedback: string }>(null,
      "Você corrige uma revisão de recuperação ativa. Compare a resposta do aluno com a referência. quality: 0 = errado/em branco, 1-2 = muito incompleto ou com erro conceitual, 3 = correto com esforço/lacunas, 4 = correto, 5 = correto, completo e com as próprias palavras. feedback: 1-3 frases objetivas apontando o que faltou ou errou.",
      `PERGUNTA: ${n.title}\nREFERÊNCIA: ${n.body}\nRESPOSTA DO ALUNO: ${ans.slice(0, 4000)}`,
      { type: "object", properties: { quality: { type: "integer", minimum: 0, maximum: 5 }, feedback: { type: "string" } }, required: ["quality", "feedback"] });
    if ("error" in r) return { error: `${r.error} Use a autoavaliação.` };
    quality = r.quality; feedback = r.feedback;
  }
  const today = todayISO();
  const nx = nextReview({ interval_days: n.interval_days, ease: Number(n.ease), hits: n.hits, misses: n.misses }, quality!, today);
  const { error } = await sb.from("study_notes").update({ interval_days: nx.interval_days, ease: nx.ease, hits: nx.hits, misses: nx.misses, review_at: nx.review_at, last_reviewed: today, mastery: nx.mastery }).eq("id", n.id);
  if (error) return { error: err(error)! };
  await sb.from("study_evidence").insert({ date: today, kind: "revisao", topic: n.title.slice(0, 200), level: Math.min(5, quality!), score: quality! * 20, justification: feedback || "Autoavaliação após responder.", note_id: n.id, track_id: n.track_id });
  refresh();
  return { quality, feedback, next: nx.review_at };
}

// ───────── Avaliação de domínio baseada em evidências ─────────
export type Assessment = { topic: string; level: number; score: number; justification: string; evidence: string[]; gaps: string[] };
export async function assessSession(sessionId: string): Promise<{ result?: Assessment; error?: string }> {
  const { sb, s, text, n } = await transcript(Id.parse(sessionId), 40);
  if (!s) return { error: "Sessão não encontrada." };
  if (n < 4) return { error: "Ainda não há evidências suficientes. Responda perguntas ou exercícios primeiro (modo Avaliar ajuda)." };
  const r = await aiJSON<Assessment>(s.provider,
    `Avalie o domínio do ALUNO sobre o assunto, usando SOMENTE o que ele escreveu (não o que o tutor explicou). Escala: 0 nada; 1 reconhece; 2 explica com as próprias palavras; 3 resolve problemas; 4 aplica em situação real; 5 ensina/reproduz sem ajuda. Ler uma explicação não é evidência. Seja rigoroso. evidence: trechos/fatos concretos que sustentam o nível. gaps: o que falta para o próximo nível. score 0-100 = qualidade das respostas.`,
    `Assunto: ${s.subject || s.title}\nObjetivo: ${s.goal ?? "-"}\n\n${text}`,
    { type: "object", properties: { topic: { type: "string" }, level: { type: "integer", minimum: 0, maximum: 5 }, score: { type: "integer", minimum: 0, maximum: 100 }, justification: { type: "string" }, evidence: { type: "array", items: { type: "string" } }, gaps: { type: "array", items: { type: "string" } } }, required: ["topic", "level", "score", "justification", "evidence", "gaps"] });
  if ("error" in r) return { error: r.error };
  const just = `${r.justification}\nEvidências: ${r.evidence.join(" · ")}\nLacunas: ${r.gaps.join(" · ")}`.slice(0, 3000);
  const { error } = await sb.from("study_evidence").insert({ date: todayISO(), kind: "avaliacao", topic: (r.topic || s.title).slice(0, 200), level: r.level, score: r.score, justification: just, session_id: s.id, track_id: s.track_id, project_id: s.project_id });
  if (error) return { error: err(error)! };
  if (s.item_id) await sb.from("study_items").update({ status: r.level >= 5 ? "dominado" : r.score < 50 ? "revisar" : "estudando" }).eq("id", s.item_id);
  await sb.from("ai_sessions").update({ stage: `Avaliado: ${masteryFromLevel(r.level)}` }).eq("id", s.id);
  refresh();
  return { result: r };
}

// ───────── Build Lab ─────────
export type Step = { title: string; done: boolean; tasks?: string[] };
const Project = z.object({
  title: z.string().trim().min(1).max(160), goal: opt(1000), skills: opt(1000), deliverables: opt(2000), difficulties: opt(4000), result: opt(4000), learnings: opt(4000),
  track_id: Id.optional().nullable(), status: z.enum(["planejando", "construindo", "concluido", "pausado"]).default("planejando"),
});
export async function saveProject(input: z.input<typeof Project>, id?: string): Promise<{ id?: string; error?: string }> {
  const p = Project.safeParse(input);
  if (!p.success) return { error: "Dê um nome ao projeto." };
  const sb = await createClient();
  const row = { ...p.data, track_id: p.data.track_id ?? null, finished_at: p.data.status === "concluido" ? todayISO() : null };
  const q = id ? await sb.from("study_projects").update(row).eq("id", Id.parse(id)).select("id").single() : await sb.from("study_projects").insert(row).select("id").single();
  refresh();
  return q.error ? { error: err(q.error)! } : { id: q.data.id };
}
export async function deleteProject(id: string) {
  const sb = await createClient();
  const { error } = await sb.from("study_projects").delete().eq("id", Id.parse(id));
  refresh(); return err(error);
}
export async function setSteps(id: string, steps: Step[]) {
  const clean = z.array(z.object({ title: z.string().trim().min(1).max(200), done: z.boolean(), tasks: z.array(z.string().max(200)).max(12).optional() })).max(30).safeParse(steps);
  if (!clean.success) return "Etapas inválidas.";
  const sb = await createClient();
  const all = clean.data, status = all.length && all.every((s) => s.done) ? undefined : all.some((s) => s.done) ? "construindo" : undefined;
  const { error } = await sb.from("study_projects").update({ steps: all, ...(status ? { status } : {}) }).eq("id", Id.parse(id));
  refresh(); return err(error);
}
export async function planProject(id: string): Promise<{ steps?: Step[]; error?: string }> {
  const sb = await createClient();
  const { data: p } = await sb.from("study_projects").select("*").eq("id", Id.parse(id)).maybeSingle();
  if (!p) return { error: "Projeto não encontrado." };
  const r = await aiJSON<{ steps: { title: string; tasks: string[] }[] }>(null,
    "Planeje um projeto prático de aprendizagem em 4 a 8 etapas pequenas e verificáveis, da preparação à entrega. Cada etapa com 2 a 4 tarefas concretas. Português do Brasil.",
    `Projeto: ${p.title}\nObjetivo: ${p.goal ?? "-"}\nConhecimentos necessários: ${p.skills ?? "-"}\nEntregáveis: ${p.deliverables ?? "-"}`,
    { type: "object", properties: { steps: { type: "array", items: { type: "object", properties: { title: { type: "string" }, tasks: { type: "array", items: { type: "string" } } }, required: ["title", "tasks"] } } }, required: ["steps"] });
  if ("error" in r) return { error: r.error };
  const steps = r.steps.slice(0, 8).map((s) => ({ title: s.title.slice(0, 200), done: false, tasks: s.tasks.slice(0, 6).map((t) => t.slice(0, 200)) }));
  const e = await setSteps(id, steps);
  return e ? { error: e } : { steps };
}
export async function evaluateProject(id: string): Promise<{ result?: Assessment; error?: string }> {
  const sb = await createClient();
  const { data: p } = await sb.from("study_projects").select("*").eq("id", Id.parse(id)).maybeSingle();
  if (!p) return { error: "Projeto não encontrado." };
  if (!p.result && !p.learnings) return { error: "Descreva o resultado final e os aprendizados antes de avaliar." };
  const steps = (p.steps as Step[]) ?? [];
  const r = await aiJSON<Assessment>(null,
    "Avalie um projeto prático de aprendizagem com base no que foi entregue e relatado. Escala 0–5 (3 resolve, 4 aplica em situação real, 5 domina e ensina). Justifique com evidências do relato e liste lacunas. Seja rigoroso e construtivo.",
    `Projeto: ${p.title}\nObjetivo: ${p.goal ?? "-"}\nEtapas: ${steps.map((s) => `${s.done ? "[x]" : "[ ]"} ${s.title}`).join("; ")}\nEntregáveis: ${p.deliverables ?? "-"}\nDificuldades: ${p.difficulties ?? "-"}\nResultado: ${p.result ?? "-"}\nAprendizados: ${p.learnings ?? "-"}`,
    { type: "object", properties: { topic: { type: "string" }, level: { type: "integer", minimum: 0, maximum: 5 }, score: { type: "integer", minimum: 0, maximum: 100 }, justification: { type: "string" }, evidence: { type: "array", items: { type: "string" } }, gaps: { type: "array", items: { type: "string" } } }, required: ["topic", "level", "score", "justification", "evidence", "gaps"] });
  if ("error" in r) return { error: r.error };
  const { error } = await sb.from("study_evidence").insert({ date: todayISO(), kind: "projeto", topic: p.title.slice(0, 200), level: r.level, score: r.score, justification: `${r.justification}\nEvidências: ${r.evidence.join(" · ")}\nLacunas: ${r.gaps.join(" · ")}`.slice(0, 3000), project_id: p.id, track_id: p.track_id });
  refresh();
  return error ? { error: err(error)! } : { result: r };
}
