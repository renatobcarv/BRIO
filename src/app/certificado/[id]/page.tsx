import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BrioMark } from "@/components/brand";
import { MASTERY, masteryFromLevel } from "@/lib/learning";
import { PrintButton } from "@/components/study/print-button";

export const dynamic = "force-dynamic";

/** Certificado BRIO: registro pessoal de domínio comprovado por avaliação (nível 4+). Página para imprimir/salvar em PDF. */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const sb = await createClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) redirect("/login");
  const { data: e } = await sb.from("study_evidence").select("*").eq("id", id).maybeSingle();
  if (!e || e.level < 4 || !["avaliacao", "projeto"].includes(e.kind)) notFound();
  const name = String(auth.user.user_metadata?.name ?? auth.user.email?.split("@")[0] ?? "");
  const date = new Date(e.date + "T12:00:00Z").toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
  const m = MASTERY[masteryFromLevel(e.level)];
  return (
    <main className="cert-page min-h-dvh grid place-items-center p-4 sm:p-10 bg-[#050505]">
      <article className="cert relative w-full max-w-[1000px] aspect-[1.414/1] border border-[#3a0000] bg-[#080808] p-[6%] flex flex-col overflow-hidden">
        <div className="absolute inset-3 border border-[#ffb21e33] pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-3 text-white"><BrioMark size={44} /><span className="label !tracking-[.4em]">BRIO · Central de Estudos</span></span>
          <span className="font-mono text-[10px] text-white/40">Nº {e.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <div className="flex-1 grid content-center text-center">
          <p className="label !text-[#ffb21e]">{e.kind === "projeto" ? "Certificado de projeto aplicado" : "Certificado de domínio"}</p>
          <p className="text-white/60 mt-6 text-[clamp(13px,1.6vw,17px)]">Certifica-se que</p>
          <p className="font-display text-[clamp(30px,5vw,58px)] mt-1">{name}</p>
          <p className="text-white/60 mt-3 text-[clamp(13px,1.6vw,17px)]">demonstrou <b style={{ color: m.color }}>{m.label.toLowerCase()}</b> (nível {e.level}/5{e.score != null ? ` · ${e.score}/100` : ""}) em</p>
          <p className="font-display text-[clamp(22px,3.4vw,40px)] mt-2 text-[#ff2800]">{e.topic}</p>
          {e.justification && <p className="text-[clamp(11px,1.15vw,13px)] text-white/45 mt-5 max-w-[70ch] mx-auto line-clamp-4 whitespace-pre-line">{e.justification.split("\n")[0]}</p>}
        </div>
        <div className="flex items-end justify-between text-[11px] text-white/45">
          <span>{date}</span>
          <span className="max-w-[55%] text-right">Registro pessoal de aprendizagem, emitido a partir de avaliação baseada em evidências no BRIO. Não substitui certificação oficial.</span>
        </div>
      </article>
      <PrintButton />
    </main>
  );
}
