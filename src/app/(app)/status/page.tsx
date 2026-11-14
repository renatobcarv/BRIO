import { PageHeader, Verse } from "@/components/ui";
import { StatusSheet } from "@/components/game/status";
import { loadGame } from "@/lib/game-data";
import { getSettings } from "@/lib/settings";
import { todayISO } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Page() {
  const sb = await createClient();
  const s = await getSettings(sb);
  const g = await loadGame(sb, s, todayISO());
  return (
    <div className="dash-auto">
      <PageHeader eyebrow="Status" title="Sua evolução" />
      <StatusSheet g={g} />
      <Verse area="metas" />
    </div>
  );
}
