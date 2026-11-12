import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { BrioMark } from "@/components/brand";
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
      <nav className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 mb-2 sticky top-0 z-10 py-2 bg-[#000]/80 backdrop-blur">
        {[["rotina", "Rotina"], ["metas", "Metas"], ["treino", "Treino"], ["maria-luisa", "Maria Luisa"], ["dados", "Dados"], ["conta", "Conta"]].map(([id, t]) =>
          <a key={id} href={`#${id}`} className="chip shrink-0 !min-h-9 text-xs">{t}</a>)}
      </nav>
      <Group id="rotina" title="Rotina" hint="O que você marca todo dia na tela inicial."><ChecklistEditor initial={s.checklist} /></Group>
      <Group id="metas" title="Metas" hint="Água, calorias, proteína, peso e ministério."><DefaultsEditor s={s} /></Group>
      <Group id="treino" title="Treino" hint="Divisão usada quando não há campanha ativa."><SplitEditor initial={s.workout_split} /></Group>
      <Group id="maria-luisa" title="Maria Luisa" hint="Foto e frase do card da tela inicial."><PartnerEditor phrase={s.partner_phrase ?? ""} photo={photo} /></Group>
      <Group id="dados" title="Dados" hint="Seus dados são seus: exporte e importe quando quiser."><Backup /></Group>
      <div id="conta" className="scroll-mt-16" />
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
      <Link href="/sobre" className="flex flex-col items-center mt-10 mb-4 opacity-80">
        <BrioMark size={56} glow={false} />
        <p className="text-xs tracking-[.3em] mt-2 pl-[.3em]">BRIO</p>
        <p className="text-[11px] text-muted mt-1">Vigor com honra · sobre o app</p>
      </Link>
    </>
  );
}

function Group({ id, title, hint, children }: { id: string; title: string; hint: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-16 mt-6">
      <p className="font-display text-xl">{title}</p>
      <p className="text-xs text-muted mb-2">{hint}</p>
      {children}
    </section>
  );
}
