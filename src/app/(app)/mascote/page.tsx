import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { loadGame } from "@/lib/game-data";
import { todayISO } from "@/lib/date";
import { PetPage, type PetView } from "@/components/pet/pet";
import { Arsenal } from "@/components/pet/arsenal";
import { Army } from "@/components/pet/army";

export const dynamic = "force-dynamic";
export default async function Page() {
  const sb = await createClient();
  const d = await sb.from("pet_draws").select("species,month,free,duplicate").order("created_at");
  const p = await sb.from("pets").select("bonus_essence").limit(1);
  // Sem as tabelas novas: avisa qual SQL rodar em vez de quebrar a tela.
  if (d.error || p.error) return (
    <section className="hunt-card p-6 max-w-xl">
      <p className="label">Mascote</p>
      <h1 className="font-display text-3xl mt-2">Falta rodar o SQL do mascote<span className="text-[#ffb21e]">.</span></h1>
      <p className="text-white/65 mt-2 text-[14px]">No Supabase, abra o SQL Editor e rode o <b>supabase/TUDO.sql</b> (ou só o <b>20261125000000_mascote.sql</b>). Depois recarregue esta página.</p>
      <p className="font-mono text-[11px] text-white/40 mt-3">Detalhe: {(d.error ?? p.error)?.message}</p>
    </section>);
  let pet: PetView | null = null, err: string | null = null, items: Awaited<ReturnType<typeof loadGame>>["items"] | null = null;
  try { const g = await loadGame(sb, await getSettings(sb), todayISO()); pet = (g.pet as PetView | null) ?? null; items = g.items; }
  catch (e) { err = e instanceof Error ? e.message : String(e); }
  return <>
    {err && <p className="hunt-card p-4 mb-4 text-[13px] text-[#ff8a80]">Não consegui calcular a evolução do mascote agora ({err}). O sorteio funciona normalmente.</p>}
    <PetPage p={pet} ready draws={d.data ?? []} month={todayISO().slice(0, 7)} />
    {pet && items && <Army army={items.army} active={items.active} kills={items.kills} ready={items.ready} pending={items.pending} />}
    {pet && items && <Arsenal {...items} petName={pet.name} />}
  </>;
}
