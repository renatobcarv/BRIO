import { CorpoView } from "@/app/(app)/status/corpo-view";

export const dynamic = "force-dynamic";
/** Dieta: plano alimentar, refeições do dia, água e peso, com entrada própria no menu. */
export default async function Page({ searchParams }: { searchParams: Promise<{ sub?: string; d?: string }> }) {
  const sp = await searchParams;
  return <div className="perfil-page" data-tab="corpo"><CorpoView sp={{ aba: sp.sub ?? "alimentacao", d: sp.d }} base="/dieta?sub=" /></div>;
}
