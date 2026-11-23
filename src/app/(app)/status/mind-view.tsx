import { createClient } from "@/lib/supabase/server";
import { MindLab } from "@/components/mind/lab";

/** Mente: histórico das sessões + laboratório (teste completo e treino diário). */
export async function MindView() {
  const sb = await createClient();
  const { data, error } = await sb.from("mind_sessions").select("date,kind,score,domains").order("created_at", { ascending: false }).limit(60);
  return <>
    {error && <p className="hunt-card p-4 mb-4 text-[13px] max-w-3xl mx-auto" style={{ color: "#ffb21e" }}>Para salvar seus resultados, rode o SQL <b>20261129000000_mente.sql</b> no Supabase.</p>}
    <MindLab history={(data ?? []) as never} />
  </>;
}
