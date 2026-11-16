import { StudyNav } from "@/components/study/nav";
import { Knowledge } from "@/components/study/knowledge";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function Page() {
  const sb = await createClient();
  const [n, t, ev] = await Promise.all([
    sb.from("study_notes").select("id,created_at,kind,title,body,track_id,session_id,project_id,in_review,review_at,interval_days,hits,misses,mastery,last_reviewed").order("created_at", { ascending: false }).limit(1000),
    sb.from("study_tracks").select("id,title").order("created_at"),
    sb.from("study_evidence").select("id,date,kind,topic,level,score,justification").order("created_at", { ascending: false }).limit(60),
  ]);
  return (
    <>
      <StudyNav current="/estudos/conhecimento" />
      <Knowledge today={todayISO()} ready={!n.error} notes={n.data ?? []} tracks={t.data ?? []} evidence={ev.error ? [] : ev.data ?? []} />
    </>
  );
}
