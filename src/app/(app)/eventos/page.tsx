import Link from "next/link";
import { Verse } from "@/components/ui";
import { EventBadge, EventCard } from "@/components/events/event-ui";
import { loadGame } from "@/lib/game-data";
import { getSettings } from "@/lib/settings";
import { todayISO } from "@/lib/date";
import { TravelControl } from "@/components/events/travel";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Page() {
  const sb = await createClient();
  const s = await getSettings(sb);
  const g = await loadGame(sb, s, todayISO());
  const live = g.events.filter((e) => e.stage === "ativo" || e.stage === "contagem" || e.stage === "anunciado" || (e.stage === "pausado" && e.end >= todayISO()));
  const past = g.events.filter((e) => e.stage === "vitoria" || e.stage === "falha").sort((a, b) => b.end.localeCompare(a.end));
  const earned = past.map((e) => (e.stage === "vitoria" ? e.glory : e.scar));
  return (
    <div className="war">
      <header className="rise mb-6"><p className="text-[11px] font-semibold tracking-[.32em]" style={{ color: "#e0393e" }}>ASCENSION</p>
        <h1 className="font-display text-5xl mt-2 leading-none tracking-tight uppercase">Event Center</h1>
        <p className="text-sm text-muted mt-2">Eventos nascem da sua periodização. Vencer dá XP extra e uma insígnia de glória; falhar deixa uma cicatriz.</p></header>

      {live.length === 0 && past.length === 0 && (
        <section className="glass p-5">
          <p className="font-display text-xl">Nenhum evento à vista.</p>
          <p className="text-sm text-muted mt-1">Os eventos aparecem até 14 dias antes de cada marco do seu programa: Genesis, Hell Week, War Rations, Sanctuary e Judgment Day.</p>
          <Link href="/corpo?aba=programa" className="btn btn-accent w-full mt-4">Montar meu programa</Link>
        </section>
      )}

      <Link href="/bestiario" className="glass flex items-center justify-between p-4 mb-4"><span><span className="block text-sm font-semibold">⚔ Bestiário</span><span className="block text-xs text-muted">Anjos aprovados e feras abatidas</span></span><span className="text-muted">›</span></Link>
      <TravelControl trips={s.travel ?? []} today={todayISO()} />
      <div className="grid gap-4">{live.map((e) => <EventCard key={e.id} e={e} />)}</div>

      {earned.length > 0 && (
        <section className="glass rise p-5 mt-6">
          <p className="text-[10px] font-semibold tracking-[.3em] text-muted">INSÍGNIAS DE EVENTO</p>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {earned.map((b, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto w-fit emblem-spin"><EventBadge b={b} size={64} /></div>
                <p className="text-[11px] font-bold tracking-wider mt-1.5" style={{ color: b.kind === "glory" ? b.color : "#b51224" }}>{b.name}</p>
                <p className="text-[10px] text-muted">{b.pt}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section className="mt-6">
          <p className="text-[10px] font-semibold tracking-[.3em] text-muted mb-3">HISTÓRICO</p>
          <div className="grid gap-4">{past.map((e) => <EventCard key={e.id} e={e} />)}</div>
        </section>
      )}
      <Verse area="corpo" />
    </div>
  );
}
