import { Card, PageHeader } from "@/components/ui";
import { Backup, ChecklistEditor, DefaultsEditor, PartnerEditor, SplitEditor } from "@/components/settings/settings";
import { signOut } from "@/app/actions";
import { getSettings } from "@/lib/settings";
import { signedPhoto } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Config() {
  const sb = await createClient();
  const s = await getSettings(sb);
  const photo = await signedPhoto(sb, s.partner_photo_path);
  return (
    <>
      <PageHeader eyebrow="Ajustes" title="Configurações" color="#9a978f" />
      <ChecklistEditor initial={s.checklist} />
      <DefaultsEditor s={s} />
      <SplitEditor initial={s.workout_split} />
      <div id="maria-luisa" /><PartnerEditor phrase={s.partner_phrase ?? ""} photo={photo} />
      <Backup />
      <Card className="mt-4">
        <form action={signOut}><button className="btn w-full">Sair</button></form>
      </Card>
    </>
  );
}
