"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { geminiJSON } from "@/lib/gemini";
import { firstReview, review } from "@/lib/study";

const Id = z.string().uuid();
const Iso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const done = () => revalidatePath("/estudos");
const msg = (e: { message: string } | null) => (e ? (/study_/.test(e.message) ? "Rode a migração 20261118000000_central_estudos.sql no Supabase." : e.message) : null);
const todaySP = () => new Date(Date.now() - 3 * 36e5).toISOString().slice(0, 10);

const Track = z.object({ title: z.string().trim().min(1).max(120), why: z.string().max(1000).nullable(), weakness: z.string().max(1000).nullable(),
  deadline: Iso.nullable(), color: z.string().regex(/^#[0-9a-f]{6}$/i), daily_min: z.number().int().min(5).max(600) });
export async function saveTrack(input: z.input<typeof Track>, id?: string): Promise<{ id?: string; error?: string }> {
  const p = Track.safeParse(input); if (!p.success) return { error: "Confira os campos." };
  const sb = await createClient();
  const r = id ? await sb.from("study_tracks").update(p.data).eq("id", Id.parse(id)).select("id").single() : await sb.from("study_tracks").insert(p.data).select("id").single();
  done(); return r.error ? { error: msg(r.error)! } : { id: r.data.id };
}
export async function setTrackStatus(id: string, status: "ativo" | "pausado" | "concluido") {
  const sb = await createClient();
  const { error } = await sb.from("study_tracks").update({ status, finished_at: status === "concluido" ? todaySP() : null }).eq("id", Id.parse(id));
  done(); return msg(error);
}
export async function deleteTrack(id: string) { const sb = await createClient(); const { error } = await sb.from("study_tracks").delete().eq("id", Id.parse(id)); done(); return msg(error); }

const Item = z.object({ track_id: Id, module: z.string().trim().min(1).max(80), title: z.string().trim().min(1).max(200), est_min: z.number().int().min(5).max(600).nullable(),
  weak: z.boolean(), link: z.string().max(500).nullable(), notes: z.string().max(4000).nullable() });
export async function saveItem(input: z.input<typeof Item>, id?: string) {
  const p = Item.safeParse(input); if (!p.success) return "Confira os campos.";
  const sb = await createClient();
  if (id) { const { error } = await sb.from("study_items").update(p.data).eq("id", Id.parse(id)); done(); return msg(error); }
  const { count } = await sb.from("study_items").select("id", { count: "exact", head: true }).eq("track_id", p.data.track_id);
  const { error } = await sb.from("study_items").insert({ ...p.data, position: (count ?? 0) + 1 }); done(); return msg(error);
}
export async function deleteItem(id: string) { const sb = await createClient(); const { error } = await sb.from("study_items").delete().eq("id", Id.parse(id)); done(); return msg(error); }
export async function setItemStatus(id: string, status: "afazer" | "estudando" | "revisar" | "dominado") {
  const sb = await createClient(); const t = todaySP();
  const patch = status === "dominado" ? { status, done_at: t, ...firstReview(t) } : { status, done_at: null, ...(status === "afazer" ? { review_at: null, review_step: 0 } : {}) };
  const { error } = await sb.from("study_items").update(patch).eq("id", Id.parse(id)); done(); return msg(error);
}
export async function reviewItem(id: string, remembered: boolean) {
  const sb = await createClient();
  const { data } = await sb.from("study_items").select("review_step").eq("id", Id.parse(id)).single();
  const { error } = await sb.from("study_items").update(review({ review_step: data?.review_step ?? 0 }, remembered, todaySP())).eq("id", id);
  done(); return msg(error);
}
export async function toggleWeak(id: string, weak: boolean) { const sb = await createClient(); const { error } = await sb.from("study_items").update({ weak }).eq("id", Id.parse(id)); done(); return msg(error); }

export async function logStudy(input: { track_id: string | null; item_id: string | null; minutes: number; kind: "estudo" | "revisao" | "exercicios"; date?: string }) {
  const p = z.object({ track_id: Id.nullable(), item_id: Id.nullable(), minutes: z.number().int().min(1).max(600), kind: z.enum(["estudo", "revisao", "exercicios"]), date: Iso.optional() }).safeParse(input);
  if (!p.success) return "Tempo inválido.";
  const sb = await createClient();
  const { error } = await sb.from("study_logs").insert({ ...p.data, date: p.data.date ?? todaySP() });
  if (!error && p.data.item_id) await sb.from("study_items").update({ status: "estudando" }).eq("id", p.data.item_id).eq("status", "afazer");
  done(); revalidatePath("/"); return msg(error);
}

// ── IA: monta o plano (módulos e conteúdos) a partir do objetivo e das fraquezas ──
export type PlanModule = { module: string; items: { title: string; est_min: number; weak: boolean }[] };
export async function aiStudyPlan(input: { title: string; why: string; weakness: string; level: string; deadline: string | null; daily_min: number }): Promise<{ modules: PlanModule[]; tip: string } | { error: string }> {
  const system = `Você é um planejador de estudos objetivo. Monte um plano em PT-BR para alguém chegar ao objetivo, do básico ao avançado, em módulos curtos e conteúdos concretos (cada conteúdo = 1 sessão de 15 a 60 min).
Priorize as fraquezas: marque weak=true nos conteúdos que atacam diretamente as fraquezas e coloque-os cedo. Entre 3 e 7 módulos, 3 a 8 conteúdos por módulo. Títulos curtos e acionáveis (ex.: "Present perfect: formação e uso", "Exercícios: derivadas da cadeia").
Considere o tempo diário e o prazo para dosar a quantidade. "tip" é uma frase curta com a estratégia principal.`;
  const user = `Objetivo: ${input.title}\nPor quê: ${input.why || "-"}\nFraquezas: ${input.weakness || "-"}\nNível atual: ${input.level || "-"}\nPrazo: ${input.deadline ?? "sem prazo"}\nTempo por dia: ${input.daily_min} min`;
  const r = await geminiJSON<{ modules: PlanModule[]; tip: string }>(system, user, {
    type: "OBJECT", properties: {
      tip: { type: "STRING" },
      modules: { type: "ARRAY", items: { type: "OBJECT", properties: {
        module: { type: "STRING" },
        items: { type: "ARRAY", items: { type: "OBJECT", properties: { title: { type: "STRING" }, est_min: { type: "INTEGER" }, weak: { type: "BOOLEAN" } }, required: ["title", "est_min", "weak"] } },
      }, required: ["module", "items"] } },
    }, required: ["modules", "tip"] });
  if ("error" in r) return r;
  return { tip: r.tip ?? "", modules: (r.modules ?? []).slice(0, 10).map((m) => ({ module: String(m.module).slice(0, 80), items: (m.items ?? []).slice(0, 12).map((i) => ({ title: String(i.title).slice(0, 200), est_min: Math.min(240, Math.max(5, Math.round(i.est_min || 30))), weak: !!i.weak })) })) };
}
export async function applyPlan(trackId: string, modules: PlanModule[]) {
  const sb = await createClient();
  const { count } = await sb.from("study_items").select("id", { count: "exact", head: true }).eq("track_id", Id.parse(trackId));
  let pos = count ?? 0;
  const rows = modules.flatMap((m) => m.items.map((i) => ({ track_id: trackId, module: m.module.slice(0, 80), title: i.title.slice(0, 200), est_min: i.est_min, weak: i.weak, position: ++pos })));
  const { error } = rows.length ? await sb.from("study_items").insert(rows) : { error: null };
  done(); return msg(error);
}
