import type { SupabaseClient } from "@supabase/supabase-js";
export async function signedPhoto(sb: SupabaseClient, path: string | null) {
  if (!path) return null;
  const { data } = await sb.storage.from("privado").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}
