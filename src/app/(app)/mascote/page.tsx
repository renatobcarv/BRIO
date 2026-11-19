import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { loadGame } from "@/lib/game-data";
import { todayISO } from "@/lib/date";
import { PetPage, type PetView } from "@/components/pet/pet";

export const dynamic = "force-dynamic";
export default async function Page() {
  const sb = await createClient();
  const g = await loadGame(sb, await getSettings(sb), todayISO());
  const d = await sb.from("pet_draws").select("species,month,free,duplicate").order("created_at");
  return <PetPage p={(g.pet as PetView | null) ?? null} ready={g.petReady && !d.error} draws={d.data ?? []} month={todayISO().slice(0, 7)} />;
}
