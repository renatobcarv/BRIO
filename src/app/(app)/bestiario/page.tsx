import Link from "next/link";
import { BestiaryGrid, Clareira } from "@/components/body/bestiary-grid";
import { ANGELS, FERAS, bestiaryRecord, type BeastId } from "@/lib/bestiary";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Bestiario() {
  const sb = await createClient();
  const [progs, ws] = await Promise.all([
    sb.from("training_programs").select("id,start_date,phases"),
    sb.from("workouts").select("program_id,week_no,date").not("program_id", "is", null),
  ]);
  const rec = bestiaryRecord((progs.data ?? []) as never, (ws.data ?? []) as never);
  const won = (ids: BeastId[]) => ids.reduce((a, id) => a + rec[id].won, 0);
  const seen = [...ANGELS, ...FERAS].filter((id) => rec[id].won > 0).length;

  return (
    <div className="war">
      <header className="rise mb-6">
        <p className="text-[11px] font-semibold tracking-[.32em]" style={{ color: "#e0393e" }}>ASCENSION · WAR ROOM</p>
        <h1 className="font-display text-[clamp(36px,12vw,48px)] mt-2 leading-none tracking-tight uppercase">Bestiário</h1>
        <p className="text-sm text-muted mt-2">Cada semana da campanha traz uma fera a vencer ou um anjo como exemplo a seguir. Cumpra todos os treinos planejados da semana.</p>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="glass p-3"><p className="num text-2xl">{seen}<span className="text-muted text-sm">/{ANGELS.length + FERAS.length}</span></p><p className="text-[11px] text-muted">desbloqueados</p></div>
          <div className="glass p-3"><p className="num text-2xl" style={{ color: "#ffb340" }}>{won(ANGELS)}</p><p className="text-[11px] text-muted">virtudes ✨</p></div>
          <div className="glass p-3"><p className="num text-2xl" style={{ color: "#e0393e" }}>{won(FERAS)}</p><p className="text-[11px] text-muted">feras abatidas ⚔</p></div>
        </div>
      </header>

      <div className="rise mb-8"><Clareira rec={rec} /></div>
      <section className="rise">
        <p className="text-[10px] font-semibold tracking-[.3em]" style={{ color: "#ffb340" }}>EXEMPLOS · ACUMULAÇÃO</p>
        <p className="text-xs text-muted mt-1 mb-3">Os anjos não são adversários: são referências do que buscar. Cumpra a semana seguindo o exemplo e conquiste a virtude dele.</p>
        <BestiaryGrid ids={ANGELS} rec={rec} angel />
      </section>
      <section className="rise mt-8">
        <p className="text-[10px] font-semibold tracking-[.3em]" style={{ color: "#e0393e" }}>FERAS · INTENSIFICAÇÃO, HELL WEEK, DELOAD E CHEFE</p>
        <div className="mt-3"><BestiaryGrid ids={FERAS} rec={rec} angel={false} /></div>
      </section>
      <Link href="/corpo?aba=treino" className="btn w-full mt-8">Voltar à War Room</Link>
    </div>
  );
}
