import { Card, PageHeader } from "@/components/ui";
import { Backup, ChecklistEditor, DefaultsEditor, PartnerEditor, SplitEditor } from "@/components/settings/settings";
import { signOut } from "@/app/actions";
import { getSettings } from "@/lib/settings";
import { signedPhoto } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_URL } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function Config() {
  const sb = await createClient();
  const s = await getSettings(sb);
  const photo = await signedPhoto(sb, s.partner_photo_path);
  const { data: claims } = await sb.auth.getClaims();
  const ref = SUPABASE_URL.replace(/^https?:\/\//, "").split(".")[0] || "não configurado";
  return (
    <>
      <PageHeader eyebrow="Ajustes" title="Configurações" color="#9a978f" />
      <ChecklistEditor initial={s.checklist} />
      <DefaultsEditor s={s} />
      <SplitEditor initial={s.workout_split} />
      <div id="maria-luisa" /><PartnerEditor phrase={s.partner_phrase ?? ""} photo={photo} />
      <Backup />
      <Card className="mt-4">
        <p className="label mb-3">Conexão</p>
        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between gap-3"><dt className="text-muted">Projeto Supabase</dt><dd className="num truncate">{ref}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-muted">Conta</dt><dd className="truncate">{String(claims?.claims?.email ?? "—")}</dd></div>
        </dl>
        <p className="text-xs text-faint mt-3">O código do projeto aparece no endereço do painel do Supabase: supabase.com/dashboard/project/<span className="num">{ref}</span></p>
      </Card>
      <Card className="mt-4">
        <form action={signOut}><button className="btn w-full">Sair</button></form>
      </Card>
    </>
  );
}
