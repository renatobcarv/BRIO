import { DreamBoard, type Dream } from "@/components/dreams/board";
import { getSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";
import { signedPhoto } from "@/lib/storage";
import { todayISO } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function Sonhos() {
  const sb = await createClient();
  const [s, q] = await Promise.all([getSettings(sb), sb.from("dreams").select("id,title,why,category,target_date,image_path,position,done_at").order("position").order("created_at")]);
  const rows = (q.data ?? []) as (Omit<Dream, "image"> & { image_path: string | null })[];
  // URLs assinadas (1 h) para as imagens privadas
  const paths = rows.map((r) => r.image_path).filter(Boolean) as string[];
  const signed = paths.length ? (await sb.storage.from("privado").createSignedUrls(paths, 3600)).data ?? [] : [];
  const url = new Map(signed.map((x) => [x.path, x.signedUrl]));
  const dreams: Dream[] = rows.map((r) => ({ ...r, image: r.image_path ? url.get(r.image_path) ?? null : null }));
  const maria = await signedPhoto(sb, s.partner_photo_path);
  return <DreamBoard today={todayISO()} dreams={dreams} ready={!q.error} maria={{ photo: maria, phrase: s.partner_phrase ?? "" }} />;
}
