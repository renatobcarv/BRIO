import { notFound } from "next/navigation";
import { Workspace } from "@/components/study/workspace";
import { createClient } from "@/lib/supabase/server";
import { providerStatus } from "@/lib/ai/providers";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const sb = await createClient();
  const { data: s } = await sb.from("ai_sessions").select("*").eq("id", id).maybeSingle();
  if (!s) notFound();
  const [msgs, notes, ev, track, item, project] = await Promise.all([
    sb.from("ai_messages").select("id,role,content,created_at").eq("session_id", id).order("created_at").limit(400),
    sb.from("study_notes").select("id,kind,title").eq("session_id", id).order("created_at", { ascending: false }),
    sb.from("study_evidence").select("id,date,level,score,justification,topic").eq("session_id", id).order("created_at", { ascending: false }),
    s.track_id ? sb.from("study_tracks").select("title").eq("id", s.track_id).maybeSingle() : Promise.resolve({ data: null }),
    s.item_id ? sb.from("study_items").select("title").eq("id", s.item_id).maybeSingle() : Promise.resolve({ data: null }),
    s.project_id ? sb.from("study_projects").select("title").eq("id", s.project_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  return <Workspace session={s} initial={msgs.data ?? []} notes={notes.data ?? []} evidence={ev.data ?? []} providers={providerStatus()}
    links={{ track: track.data?.title ?? null, item: item.data?.title ?? null, project: project.data?.title ?? null }} />;
}
