import { StudyCenter } from "@/components/study/center";
import { todayISO } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import type { SItem, SLog, STrack } from "@/lib/study";

export const dynamic = "force-dynamic";

export default async function Page() {
  const sb = await createClient();
  const today = todayISO();
  const from = new Date(Date.parse(today + "T12:00:00Z") - 90 * 864e5).toISOString().slice(0, 10);
  const [t, i, l] = await Promise.all([
    sb.from("study_tracks").select("id,title,why,weakness,deadline,color,daily_min,status,finished_at").order("created_at"),
    sb.from("study_items").select("id,track_id,module,title,position,est_min,status,weak,confidence,link,notes,review_at,review_step,done_at").order("position"),
    sb.from("study_logs").select("date,track_id,item_id,minutes,kind").gte("date", from),
  ]);
  return <StudyCenter today={today} ready={!t.error} tracks={(t.data ?? []) as STrack[]} items={(i.data ?? []) as SItem[]} logs={(l.data ?? []) as SLog[]} />;
}
