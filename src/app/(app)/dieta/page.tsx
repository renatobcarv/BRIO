import { CorpoView } from "@/app/(app)/status/corpo-view";
import { DietCoach } from "@/components/body/diet-coach";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/date";

export const dynamic = "force-dynamic";
/** Dieta: só alimentação e peso, com a Helena ajustando o plano semana a semana. */
export default async function Page({ searchParams }: { searchParams: Promise<{ sub?: string; d?: string }> }) {
  const sp = await searchParams, sb = await createClient(), today = todayISO();
  const from = new Date(Date.parse(today + "T12:00:00Z") - 21 * 864e5).toISOString().slice(0, 10);
  const [dp, wl] = await Promise.all([sb.from("diet_plans").select("kcal,protein_g,goal,profile").maybeSingle(), sb.from("weight_logs").select("date,kg").gte("date", from)]);
  const coach = <DietCoach plan={dp.error ? null : (dp.data as never) ?? null} weights={(wl.data ?? []).map((w) => ({ date: w.date as string, kg: Number(w.kg) }))} today={today} />;
  return <div className="perfil-page" data-tab="corpo"><CorpoView sp={{ aba: sp.sub === "peso" ? "peso" : "alimentacao", d: sp.d }} base="/dieta?sub=" only={["alimentacao", "peso"]} top={coach} /></div>;
}
