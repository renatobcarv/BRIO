import { StudyNav } from "@/components/study/nav";
import { Achievements } from "@/components/study/achievements";
import { createClient } from "@/lib/supabase/server";
import { learningAchievements } from "@/lib/learning";

export const dynamic = "force-dynamic";

export default async function Page() {
  const sb = await createClient();
  const [sess, ev, notes, proj, certs, tracks] = await Promise.all([
    sb.from("ai_sessions").select("id", { count: "exact", head: true }),
    sb.from("study_evidence").select("id,date,kind,topic,level,score,justification").order("date", { ascending: false }).limit(2000),
    sb.from("study_notes").select("id", { count: "exact", head: true }),
    sb.from("study_projects").select("id,status"),
    sb.from("study_certificates").select("*").order("issued_at", { ascending: false, nullsFirst: false }),
    sb.from("study_tracks").select("id,title"),
  ]);
  const evd = ev.data ?? [], cl = certs.error ? [] : certs.data ?? [];
  const paths = cl.map((c) => c.file_path).filter(Boolean) as string[];
  const signed = paths.length ? (await sb.storage.from("privado").createSignedUrls(paths, 3600)).data ?? [] : [];
  const achievements = learningAchievements({
    sessions: sess.count ?? 0, evidence: evd.map((e) => ({ ...e, level: Number(e.level), score: e.score == null ? null : Number(e.score) })), notes: notes.count ?? 0,
    reviewsOk: evd.filter((e) => e.kind === "revisao" && (e.score ?? 0) >= 60).length, projectsDone: (proj.data ?? []).filter((p) => p.status === "concluido").length,
    certificates: cl.length, hoursCert: cl.reduce((a, c) => a + Number(c.hours ?? 0), 0),
  });
  const brioCerts = evd.filter((e) => (e.kind === "avaliacao" || e.kind === "projeto") && Number(e.level) >= 4);
  return (
    <>
      <StudyNav current="/estudos/conquistas" />
      <Achievements achievements={achievements} brioCerts={brioCerts} certs={cl.map((c) => ({ ...c, file_url: signed.find((x) => x.path === c.file_path)?.signedUrl ?? null }))} certsReady={!certs.error} tracks={tracks.data ?? []} />
    </>
  );
}
