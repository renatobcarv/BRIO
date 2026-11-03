import Link from "next/link";
import { Card, PageHeader, Verse } from "@/components/ui";
import { BibleTab, JournalTab, StudyTab } from "@/components/spirit/spirit";
import { addDays, daysInMonth, dow, monthEnd, monthStart, todayISO, weekdayShort } from "@/lib/date";
import { dayStreak } from "@/lib/streak-days";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const ACC = "#e0ac53";
const TABS = [["estudo", "Estudo"], ["biblia", "Bíblia"], ["diario", "Diário"]] as const;

export default async function Page({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const tab = (await searchParams).aba ?? "estudo";
  const sb = await createClient();
  const today = todayISO(), m = monthStart(today), dim = daysInMonth(m);
  const [studies, bible, journal] = await Promise.all([
    sb.from("study_entries").select("id,date,type,material,minutes,takeaway").gte("date", addDays(today, -400)).order("date", { ascending: false }),
    sb.from("bible_reading").select("book,chapter,date_read"),
    tab === "diario" ? sb.from("journal_entries").select("id,date,kind,text").order("date", { ascending: false }).order("created_at", { ascending: false }).limit(100) : Promise.resolve({ data: [] }),
  ]);
  const st = studies.data ?? [];
  const monthSt = st.filter((s) => s.date >= m && s.date <= monthEnd(m));
  const mins = new Map<string, number>();
  for (const s of monthSt) mins.set(s.date, (mins.get(s.date) ?? 0) + s.minutes);
  const streak = dayStreak(new Set(st.map((s) => s.date)), today);
  const bibleStreak = dayStreak(new Set((bible.data ?? []).map((b) => b.date_read)), today);

  return (
    <div style={{ ["--accent" as string]: ACC }}>
      <PageHeader eyebrow="Espiritual" title="Vida espiritual" />
      <Card>
        <div className="grid grid-cols-3 gap-3">
          <div><p className="label">Dias no mês</p><p className="num text-3xl">{mins.size}</p></div>
          <div><p className="label">Minutos</p><p className="num text-3xl">{monthSt.reduce((a, s) => a + s.minutes, 0)}</p></div>
          <div><p className="label">Sequência</p><p className="num text-3xl text-gold">{streak}</p></div>
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-center mt-4">
          {weekdayShort.map((d) => <span key={d} className="label text-[10px]">{d}</span>)}
          {Array.from({ length: dow(m) }).map((_, i) => <span key={"b" + i} />)}
          {Array.from({ length: dim }).map((_, i) => {
            const d = addDays(m, i), v = mins.get(d) ?? 0, a = v ? Math.min(1, 0.3 + v / 90) : 0;
            return <span key={d} title={v ? `${v} min` : undefined} className={`aspect-square rounded-lg grid place-items-center text-xs ${d === today ? "ring-1 ring-white/50" : ""}`}
              style={{ background: v ? `rgba(224,172,83,${a})` : "rgba(255,255,255,.04)", color: a > .6 ? "#120f08" : undefined }}>{i + 1}</span>;
          })}
        </div>
      </Card>
      <div className="flex gap-2 my-4" role="tablist">
        {TABS.map(([k, l]) => <Link key={k} href={`/espiritual?aba=${k}`} role="tab" aria-selected={tab === k} aria-pressed={tab === k} className="chip !min-h-11 !px-5">{l}</Link>)}
      </div>
      {tab === "biblia" ? <BibleTab read={bible.data ?? []} streak={bibleStreak} />
        : tab === "diario" ? <JournalTab entries={journal.data ?? []} />
        : <StudyTab today={today} studies={st} />}
      <Verse area="espiritual" />
    </div>
  );
}
