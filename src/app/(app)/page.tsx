import { Card, Empty, PageHeader, Ring, Verse } from "@/components/ui";
import { greeting, longDate } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";

export default async function Hoje() {
  const supabase = await createClient();
  const { data: s } = await supabase.from("settings").select("daily_text").maybeSingle();
  return (
    <>
      <PageHeader eyebrow={longDate()} title={`${greeting()}, Renato.`} />
      <Card className="rise-1">
        <p className="label">Texto do dia</p>
        {s?.daily_text ? <p className="font-display italic text-xl mt-3">{s.daily_text}</p>
          : <Empty>Cole aqui o texto de hoje.</Empty>}
      </Card>
      <Card className="rise-2 mt-4 border-gold/30">
        <div className="flex items-center gap-5">
          <Ring value={0} size={88}><span className="font-display text-xl">0%</span></Ring>
          <div>
            <p className="label text-gold">Jeová em primeiro lugar</p>
            <p className="mt-1 text-muted text-sm">Checklist e sequência chegam na Fase 2.</p>
          </div>
        </div>
      </Card>
      <Verse area="inicio" />
    </>
  );
}
