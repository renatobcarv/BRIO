import Link from "next/link";
import { Board, Card, PageHeader, Verse } from "@/components/ui";
import { HI } from "@/components/hunt-icons";
import { BibleTab, JournalTab, StudyTab } from "@/components/spirit/spirit";
import { SpiritToday } from "@/components/spirit/today";
import { PagesGallery, type PageCard } from "@/components/spirit/pages";
import { StudyQuizButton } from "@/components/quiz/study-button";
import { addDays, daysInMonth, dow, monthEnd, monthStart, todayISO, weekdayShort } from "@/lib/date";
import { dayStreak } from "@/lib/streak-days";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const ACC = "#9fd0f5";
const TABS = [["paginas", "Páginas"], ["estudo", "Estudo"], ["biblia", "Bíblia"], ["diario", "Diário"]] as const;

export default async function Page({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const tab = (await searchParams).aba ?? "paginas";
  const sb = await createClient();
  const today = todayISO(), m = monthStart(today), dim = daysInMonth(m);
  const [studies, bible, journal] = await Promise.all([
    sb.from("study_entries").select("id,date,type,material,minutes,takeaway").gte("date", addDays(today, -400)).order("date", { ascending: false }),
    sb.from("bible_reading").select("book,chapter,date_read"),
    tab === "diario" ? sb.from("journal_entries").select("id,date,kind,text").order("date", { ascending: false }).order("created_at", { ascending: false }).limit(100) : Promise.resolve({ data: [] }),
  ]);
  const st = studies.data ?? [];
  const pq = await sb.from("spirit_pages").select("id,title,kind,cover_path,bible_book,bible_chapter,updated_at,content").order("pinned", { ascending: false }).order("updated_at", { ascending: false }).limit(300);
  const praw = pq.error ? [] : pq.data ?? [];
  const covers = praw.map((p) => p.cover_path).filter(Boolean) as string[];
  const cs = covers.length && tab === "paginas" ? (await sb.storage.from("privado").createSignedUrls(covers, 3600)).data ?? [] : [];
  const pages: PageCard[] = praw.map((p) => ({ id: p.id, title: p.title, kind: p.kind, bible_book: p.bible_book, bible_chapter: p.bible_chapter, updated_at: p.updated_at,
    cover: cs.find((x) => x.path === p.cover_path)?.signedUrl ?? null, excerpt: String(p.content).replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/[#>*=+`_-]/g, "").replace(/\s+/g, " ").trim().slice(0, 140) }));
  const chapterNotes = pages.filter((p) => p.bible_book).map((p) => ({ id: p.id, title: p.title, book: p.bible_book!, chapter: p.bible_chapter }));
  const jt = await sb.from("journal_entries").select("kind").eq("date", today);
  const kindsToday = new Set((jt.data ?? []).map((x) => x.kind));
  const monthSt = st.filter((s) => s.date >= m && s.date <= monthEnd(m));
  const mins = new Map<string, number>();
  for (const s of monthSt) mins.set(s.date, (mins.get(s.date) ?? 0) + s.minutes);
  const streak = dayStreak(new Set(st.map((s) => s.date)), today);
  const bibleStreak = dayStreak(new Set((bible.data ?? []).map((b) => b.date_read)), today);

  return (
    <div className="dash-auto peace" style={{ ["--accent" as string]: ACC }}>
      <PageHeader eyebrow="Espiritual" title="Vida espiritual" color="#9fd0f5" icon={HI.book} line="Jeová em primeiro lugar. O resto se organiza." />
      {(() => { const todayMin = st.filter((x) => x.date === today).reduce((a, x) => a + x.minutes, 0), monthMin = monthSt.reduce((a, x) => a + x.minutes, 0);
        return <Board accent="#9fd0f5" accent2="#f2dfae" icon={HI.book} label="Estudo pessoal hoje" big={String(todayMin)} unit="min" bar={todayMin / 30} sub={todayMin >= 30 ? "Alimento espiritual do dia garantido." : `Meta de 30 min · faltam ${30 - todayMin}`}
          stats={[[HI.flame, "Sequência", String(streak), "dias de estudo"], [HI.book, "Bíblia", String(bibleStreak), "dias seguidos"], [HI.clock, "No mês", String(Math.round(monthMin / 60 * 10) / 10), "horas"]]} />; })()}
      <SpiritToday today={today} bibleToday={(bible.data ?? []).some((b) => b.date_read === today)} studyMin={st.filter((x) => x.date === today).reduce((a, x) => a + x.minutes, 0)} prayed={kindsToday.has("oracao")} grateful={kindsToday.has("gratidao")} />
      <StudyQuizButton today={today} minutesToday={st.filter((x) => x.date === today).reduce((a, x) => a + x.minutes, 0)} />
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
              style={{ background: v ? `rgba(159,208,245,${a})` : "rgba(255,255,255,.04)", color: a > .6 ? "#120f08" : undefined }}>{i + 1}</span>;
          })}
        </div>
      </Card>
      <div className="flex gap-2 my-4" role="tablist">
        {TABS.map(([k, l]) => <Link key={k} href={`/espiritual?aba=${k}`} role="tab" aria-selected={tab === k} className="chip !min-h-11 !px-5">{l}</Link>)}
      </div>
      {tab === "paginas" ? <PagesGallery pages={pages} ready={!pq.error} />
        : tab === "biblia" ? <BibleTab read={bible.data ?? []} streak={bibleStreak} notes={chapterNotes} />
        : tab === "diario" ? <JournalTab entries={journal.data ?? []} />
        : <StudyTab today={today} studies={st} />}
      <Verse area="espiritual" />
    </div>
  );
}
