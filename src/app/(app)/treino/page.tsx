import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { todayISO } from "@/lib/date";
import { loadTrainingView } from "./load";
import { ExerciseLibrary, GymTools } from "@/components/body/gym";
import { FireLayer } from "@/components/events/event-ui";
import { HI, Ico } from "@/components/hunt-icons";

export const dynamic = "force-dynamic";
const TABS = [["treino", "Treino", HI.dumbbell], ["exercicios", "Exercícios", HI.list], ["ferramentas", "Ferramentas", HI.target]] as const;

export default async function Page({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const sp = await searchParams;
  const openProgram = sp.aba === "programa";
  const tab = openProgram ? "treino" : TABS.some(([k]) => k === sp.aba) ? sp.aba! : "treino";
  const sb = await createClient();
  const s = await getSettings(sb);
  const today = todayISO();
  const tv = await loadTrainingView(sb, s, today, openProgram);
  const week = new Date(Date.parse(today + "T12:00:00Z") - 6 * 864e5).toISOString().slice(0, 10);
  const wk = tv.workouts.filter((w) => w.date >= week);
  const vol = wk.reduce((a, w) => a + w.sets.reduce((b, x) => b + x.kg * x.reps, 0), 0);

  return (
    <div className={`treino-page war ${tv.onFire ? "war-fire" : ""}`}>
      {tv.onFire && <FireLayer />}
      <header className="rise panther-hero mb-4 !min-h-[180px]">
        <img src="/pantera/sentada.webp" alt="" aria-hidden className="panther-img !opacity-80" />
        <div className="relative">
          <p className="label flex items-center gap-1.5" style={{ color: "#ff2800" }}><Ico d={HI.dumbbell} size={13} />Treino · Covil</p>
          <h1 className="font-display text-5xl md:text-6xl mt-2">Mais forte<span className="text-[#ffb21e]"> hoje.</span></h1>
          <p className="font-mono text-[12px] text-white/60 mt-3">{new Set(wk.map((w) => w.date)).size} treinos nos últimos 7 dias · {vol >= 1000 ? `${(vol / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} t` : `${Math.round(vol)} kg`} de volume · {tv.workouts.length} sessões registradas</p>
        </div>
      </header>
      <nav aria-label="Seções do treino" className="sticky top-0 z-30 -mx-4 px-4 py-2 mb-4 bg-[#050505]/90 backdrop-blur-xl md:static md:mx-0 md:px-0 md:bg-transparent md:backdrop-blur-none">
        <div className="grid grid-cols-3 gap-px bg-white/[.06] border border-white/[.06] rounded-[8px] overflow-hidden">
          {TABS.map(([k, l, ic]) => { const on = tab === k; return (
            <Link key={k} href={`/treino?aba=${k}`} aria-current={on ? "page" : undefined} className={`relative min-h-12 flex items-center justify-center gap-2 text-[12px] uppercase tracking-[.12em] ${on ? "bg-[#140303] text-white" : "bg-[#080808] text-white/55 hover:text-white"}`}>
              {on && <span aria-hidden className="absolute inset-x-0 top-0 h-[2px] bg-[#ff2800]" style={{ boxShadow: "0 0 12px #ff2800" }} />}<Ico d={ic} size={14} color={on ? "#ffb21e" : "currentColor"} />{l}</Link>); })}
        </div>
      </nav>
      {tab === "treino" && <>{tv.warEvent}{tv.content}</>}
      {tab === "exercicios" && <ExerciseLibrary history={tv.workouts} />}
      {tab === "ferramentas" && <GymTools />}
    </div>
  );
}
