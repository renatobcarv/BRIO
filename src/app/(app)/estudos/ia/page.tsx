import { StudyNav } from "@/components/study/nav";
import { AiHome } from "@/components/study/ai-home";
import { createClient } from "@/lib/supabase/server";
import { providerStatus } from "@/lib/ai/providers";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ track?: string; item?: string; t?: string; project?: string }> }) {
  const sp = await searchParams;
  const sb = await createClient();
  const [s, tracks, projects] = await Promise.all([
    sb.from("ai_sessions").select("id,title,subject,mode,provider,status,stage,updated_at,track_id").order("updated_at", { ascending: false }).limit(60),
    sb.from("study_tracks").select("id,title,status").neq("status", "concluido").order("created_at"),
    sb.from("study_projects").select("id,title").neq("status", "concluido").order("created_at", { ascending: false }),
  ]);
  return (
    <>
      <StudyNav current="/estudos/ia" />
      <AiHome ready={!s.error} sessions={s.data ?? []} tracks={tracks.data ?? []} projects={projects.error ? [] : projects.data ?? []}
        providers={providerStatus()} preset={{ track_id: sp.track ?? null, item_id: sp.item ?? null, project_id: sp.project ?? null, subject: sp.t ?? "" }} />
    </>
  );
}
