import Link from "next/link";
import { BestiaryGrid, Clareira } from "@/components/body/bestiary-grid";
import { ANGELS, FERAS, bestiaryRecord, currentHunt, type BeastId } from "@/lib/bestiary";
import { todayISO } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Bestiario() {
  const sb = await createClient();
  const [progs, ws] = await Promise.all([
    sb.from("training_programs").select("id,start_date,phases"),
    sb.from("workouts").select("program_id,week_no,date").not("program_id", "is", null),
  ]);
  const rec = bestiaryRecord((progs.data ?? []) as never, (ws.data ?? []) as never);
  const act = await sb.from("training_programs").select("id,start_date,phases").eq("active", true).maybeSingle();
  const hunt = currentHunt((act.data as never) ?? null, (ws.data ?? []) as never, todayISO());
  const won = (ids: BeastId[]) => ids.reduce((a, id) => a + rec[id].won, 0);
  const seen = [...ANGELS, ...FERAS].filter((id) => rec[id].won > 0).length;

  return (
    <div className="war bestiary-page">
      <header className="rise mb-6">
        <p className="text-[11px] font-semibold tracking-[.32em]" style={{ color: "#ffb21e" }}>ASCENSION · COVIL</p>
        <h1 className="font-display text-[clamp(36px,12vw,48px)] mt-2 leading-none tracking-tight uppercase">Bestiário</h1>
        <p className="text-sm text-muted mt-2">Cada semana da campanha traz uma fera a vencer ou um anjo como exemplo a seguir. Cada treino concluído da campanha derrota a criatura da semana, e ela vai para a Clareira na hora. Quanto mais treinos, mais vezes ela é abatida.</p>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="glass p-3"><p className="num text-2xl">{seen}<span className="text-muted text-sm">/{ANGELS.length + FERAS.length}</span></p><p className="text-[11px] text-muted">desbloqueados</p></div>
          <div className="glass p-3"><p className="num text-2xl" style={{ color: "#ffb21e" }}>{won(ANGELS)}</p><p className="text-[11px] text-muted">virtudes ✨</p></div>
          <div className="glass p-3"><p className="num text-2xl" style={{ color: "#ffb21e" }}>{won(FERAS)}</p><p className="text-[11px] text-muted">feras abatidas ⚔</p></div>
        </div>
      </header>

      {hunt && (
        <section className="glass p-5 mb-6 flex items-center gap-5">
          <img src={`/bestiario/${hunt.beast.id}.webp`} alt="" className="h-24 w-24 object-contain shrink-0" style={{ filter: hunt.won ? `drop-shadow(0 0 16px ${hunt.beast.color})` : "grayscale(.4)" }} />
          <div className="min-w-0 flex-1">
            <p className="label">Caçada da semana {hunt.week}</p>
            <p className="text-[22px] font-bold leading-tight">{hunt.beast.name}</p>
            <div className="flex gap-1 mt-2" aria-label={`${hunt.done} de ${hunt.planned} treinos`}>{Array.from({ length: hunt.planned }, (_, i) => <i key={i} className="h-2 flex-1 rounded-full" style={{ background: i < hunt.done ? "#ffb21e" : "rgba(255,255,255,.1)" }} />)}</div>
            <p className="text-[13px] mt-2 text-white/70">{hunt.won ? `${hunt.beast.angel ? "Virtude conquistada" : "Abatido"} ${hunt.done}× nesta semana. Já está na Clareira.` : `Conclua um treino desta semana para ${hunt.beast.angel ? "conquistar a virtude" : "abater"} e levar para a Clareira.`} {hunt.left > 0 && hunt.won ? `Faltam ${hunt.left} treinos planejados.` : ""}</p>
          </div>
        </section>)}
      <div className="clearing-section mb-8"><Clareira rec={rec} /></div>
      <section className="rise">
        <p className="text-[10px] font-semibold tracking-[.3em]" style={{ color: "#ffb21e" }}>EXEMPLOS · ACUMULAÇÃO</p>
        <p className="text-xs text-muted mt-1 mb-3">Os anjos não são adversários: são referências do que buscar. Cumpra a semana seguindo o exemplo e conquiste a virtude dele.</p>
        <BestiaryGrid ids={ANGELS} rec={rec} angel />
      </section>
      <section className="rise mt-8">
        <p className="text-[10px] font-semibold tracking-[.3em]" style={{ color: "#ffb21e" }}>FERAS · INTENSIFICAÇÃO, HELL WEEK, DELOAD E CHEFE</p>
        <div className="mt-3"><BestiaryGrid ids={FERAS} rec={rec} angel={false} /></div>
      </section>
      <Link href="/treino" className="btn w-full mt-8">Voltar ao Covil</Link>
    </div>
  );
}
