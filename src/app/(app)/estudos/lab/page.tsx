import { StudyNav } from "@/components/study/nav";
import { Lab } from "@/components/study/lab";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Page() {
  const sb = await createClient();
  const [p, t, ev] = await Promise.all([
    sb.from("study_projects").select("*").order("created_at", { ascending: false }),
    sb.from("study_tracks").select("id,title").order("created_at"),
    sb.from("study_evidence").select("project_id,level,score,justification,date").eq("kind", "projeto").order("created_at", { ascending: false }),
  ]);
  return (
    <>
      <StudyNav current="/estudos/lab" />
      <Lab ready={!p.error} projects={p.data ?? []} tracks={t.data ?? []} evidence={ev.error ? [] : ev.data ?? []} />
    </>
  );
}
