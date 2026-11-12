import Link from "next/link";
import { BeastArt } from "@/components/body/battle-intro";
import { CelestialArt } from "@/components/body/celestial-art";
import { ALL, ANGELS, FERAS, bestiaryRecord, type BeastId } from "@/lib/bestiary";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const br = (d?: string) => d ? d.split("-").reverse().slice(0, 2).join("/") : "";

export default async function Bestiario() {
  const sb = await createClient();
  const [progs, ws] = await Promise.all([
    sb.from("training_programs").select("id,start_date,phases"),
    sb.from("workouts").select("program_id,week_no,date").not("program_id", "is", null),
  ]);
  const rec = bestiaryRecord((progs.data ?? []) as never, (ws.data ?? []) as never);
  const won = (ids: BeastId[]) => ids.reduce((a, id) => a + rec[id].won, 0);
  const seen = [...ANGELS, ...FERAS].filter((id) => rec[id].won > 0).length;

  const Card = ({ id, angel }: { id: BeastId; angel: boolean }) => {
    const b = ALL(id), r = rec[id], open = r.won > 0;
    return (
      <div className="rounded-3xl p-3 border text-center relative overflow-hidden"
        style={{ borderColor: open ? b.color + "66" : "rgba(255,255,255,.07)", background: open ? `radial-gradient(90% 70% at 50% 25%, ${b.color}30, #0b0b0d 70%)` : "#0b0b0d" }}>
        <div className="mx-auto w-28 h-28" style={{ filter: open ? `drop-shadow(0 0 12px ${b.color}88)` : "grayscale(1) brightness(.18)" }}>
          {b.angel ? <svg viewBox="0 0 320 320" className="w-full h-full" aria-hidden><CelestialArt id={id} c={b.color} eye={b.eye} /></svg> : <svg viewBox="0 0 240 240" className="w-full h-full" aria-hidden><BeastArt id={id} c={b.color} eye={b.eye} look={b.angel} /></svg>}
        </div>
        <p className="text-[13px] font-bold uppercase leading-tight mt-2 break-words">{open || r.met ? b.name : "???"}</p>
        <p className="text-[10px] text-muted mt-0.5 leading-tight">{open || r.met ? (b.angel ? `${b.virtue} · ${b.epithet}` : b.epithet) : "Ainda não encontrado"}</p>
        {open ? <p className="text-xs font-semibold mt-2" style={{ color: b.color }}>{angel ? `${b.virtue} conquistada` : "Abatido"} ×{r.won}</p>
          : r.met ? <p className="text-xs text-muted mt-2">{angel ? "Semana incompleta" : "Encontrado · escapou"}</p> : <p className="text-xs text-faint mt-2">🔒</p>}
        {open && r.last && <p className="text-[10px] text-faint">última {br(r.last)}</p>}
      </div>
    );
  };

  return (
    <div className="war">
      <header className="rise mb-6">
        <p className="text-[11px] font-semibold tracking-[.32em]" style={{ color: "#e0393e" }}>ASCENSION · WAR ROOM</p>
        <h1 className="font-display text-5xl mt-2 leading-none tracking-tight uppercase">Bestiário</h1>
        <p className="text-sm text-muted mt-2">Cada semana da campanha traz uma fera a vencer ou um anjo como exemplo a seguir. Cumpra todos os treinos planejados da semana.</p>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="glass p-3"><p className="num text-2xl">{seen}<span className="text-muted text-sm">/{ANGELS.length + FERAS.length}</span></p><p className="text-[11px] text-muted">desbloqueados</p></div>
          <div className="glass p-3"><p className="num text-2xl" style={{ color: "#ffb340" }}>{won(ANGELS)}</p><p className="text-[11px] text-muted">virtudes ✨</p></div>
          <div className="glass p-3"><p className="num text-2xl" style={{ color: "#e0393e" }}>{won(FERAS)}</p><p className="text-[11px] text-muted">feras abatidas ⚔</p></div>
        </div>
      </header>

      <section className="rise">
        <p className="text-[10px] font-semibold tracking-[.3em]" style={{ color: "#ffb340" }}>EXEMPLOS · ACUMULAÇÃO</p>
        <p className="text-xs text-muted mt-1 mb-3">Os anjos não são adversários: são referências do que buscar. Cumpra a semana seguindo o exemplo e conquiste a virtude dele.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{ANGELS.map((id) => <Card key={id} id={id} angel />)}</div>
      </section>
      <section className="rise mt-8">
        <p className="text-[10px] font-semibold tracking-[.3em]" style={{ color: "#e0393e" }}>FERAS · INTENSIFICAÇÃO, HELL WEEK, DELOAD E CHEFE</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">{FERAS.map((id) => <Card key={id} id={id} angel={false} />)}</div>
      </section>
      <Link href="/corpo?aba=treino" className="btn w-full mt-8">Voltar à War Room</Link>
    </div>
  );
}
