"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useXp, haptic } from "@/components/game/xp";
import { CountUp } from "@/components/count-up";
import { Sheet } from "@/components/kit";
import { StudyQuiz } from "@/components/quiz/study-quiz";
import { FieldQuiz } from "@/components/quiz/field-quiz";
import { addWater } from "@/app/(app)/corpo/actions";
import { levelOf, rankOf, rankIndex, RANKS } from "@/lib/game";
import { Insignia } from "@/components/game/insignia";

type AttrChip = { key: string; label: string; color: string; value: number };

/** Cartão do personagem: a primeira coisa que você vê. */
export function HeroPlayer({ attrs }: { attrs: AttrChip[] }) {
  const { total, today } = useXp();
  const lv = levelOf(total), rank = rankOf(lv.level), next = RANKS.find((r) => r.min > lv.level);
  return (
    <Link href="/status" className="press block relative overflow-hidden rounded-[8px] p-5 border" aria-label={`Nível ${lv.level}, ${rank.name}`}
      style={{ borderColor: rank.color + "40", background: `radial-gradient(130% 90% at 15% 0%, ${rank.color}30, #0f0f11 60%)`, boxShadow: `0 20px 50px -30px ${rank.color}` }}>
      <p className="text-[10px] font-semibold tracking-[.32em] text-muted">ASCENSION</p>
      <div className="flex items-center gap-4 mt-2">
        <div className="relative shrink-0 emblem-spin">
          <Insignia index={rankIndex(lv.level)} size={104} />
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold num border" style={{ background: "#0d0d0d", borderColor: rank.color, color: rank.color, boxShadow: `0 0 12px -2px ${rank.color}` }}>
            NV <CountUp value={lv.level} duration={1300} />
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[26px] leading-none font-bold tracking-[.06em] uppercase text-glow" style={{ color: rank.color, ["--glow" as string]: rank.color } as React.CSSProperties}>{rank.name}</p>
          <p className="text-sm text-ink/80 mt-1">{rank.pt}</p>
          <p className="text-xs italic text-muted mt-1.5 leading-snug">“{rank.motto}”</p>
          <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ background: today ? "#30d15822" : "rgba(255,255,255,.06)", color: today ? "#30d158" : "#8e8e93" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></svg>+<CountUp value={today} /> XP hoje
          </div>
        </div>
      </div>
      <div className="mt-5">
        <div className="h-3.5 rounded-full bg-white/[.07] overflow-hidden">
          <div className="h-full rounded-full xp-shine bar-grow" style={{ width: `${Math.max(3, lv.progress * 100)}%`, background: `linear-gradient(90deg, ${rank.color}, #ff7a5c)`, boxShadow: `0 0 16px ${rank.color}` }} />
        </div>
        <div className="flex justify-between text-xs mt-1.5"><span className="text-muted num"><CountUp value={lv.into} /> / {lv.need.toLocaleString("pt-BR")} XP</span>
          <span className="font-medium" style={{ color: rank.color }}>{next && next.min === lv.level + 1 ? `próximo: ${next.name}` : `faltam ${(lv.need - lv.into).toLocaleString("pt-BR")} para o ${lv.level + 1}`}</span></div>
      </div>
      <div className="grid grid-cols-6 gap-1.5 mt-4">
        {attrs.map((a) => (
          <div key={a.key} className="rounded-xl py-2 text-center" style={{ background: `${a.color}14` }}>
            <p className="num text-lg leading-none" style={{ color: a.color }}><CountUp value={a.value} /></p>
            <p className="text-[10px] text-muted mt-1">{a.label.slice(0, 3)}</p>
          </div>
        ))}
      </div>
    </Link>
  );
}

const ACTIONS = [
  { key: "estudo", label: "Estudo", accessibleLabel: "Registrar estudo" },
  { key: "campo", label: "Campo", accessibleLabel: "Campo, registrar pregação" },
  { key: "agua", label: "+250 ml", accessibleLabel: "+250 ml de água" },
  { key: "treino", label: "Treino", accessibleLabel: "Abrir treino", href: "/treino" },
  { key: "peso", label: "Peso", accessibleLabel: "Peso, registrar peso corporal", href: "/corpo?aba=peso" },
  { key: "gasto", label: "Gasto", accessibleLabel: "Registrar gasto", href: "/financas?aba=lancamentos" },
] as const;

/** Atalhos de registro: um toque, recompensa imediata. */
export function QuickActions({ today, contacts, waterMl, waterGoal }: { today: string; contacts: { id: string; name: string; address: string | null }[]; waterMl: number; waterGoal: number }) {
  const [sheet, setSheet] = useState<null | "estudo" | "campo">(null);
  const [ml, setMl] = useState(waterMl);
  const [, start] = useTransition();
  const { gain } = useXp();
  const water = () => {
    const next = ml + 250; setMl(next); haptic(12);
    if (ml < waterGoal && next >= waterGoal) gain(20, "Meta de água", "#f5f5f7");
    start(() => addWater(250));
  };
  return (
    <>
      <div className="grid grid-cols-3 gap-2.5">
        {ACTIONS.map((a) => {
          const inner = (
            <>
              <Image src={`/atalhos/${a.key}.webp`} width={72} height={72} alt="" unoptimized
                className="h-16 w-16 object-contain sm:h-[72px] sm:w-[72px]" />
              <span className="text-[13px] font-semibold mt-2">{a.label}</span>
              {a.key === "agua" && <span id="quick-water-progress" className="text-[11px] text-muted num">{(ml / 1000).toFixed(2).replace(".", ",")} / {(waterGoal / 1000).toFixed(1).replace(".", ",")} L</span>}
            </>
          );
          const cls = "tile press relative isolate overflow-hidden flex flex-col items-center justify-center px-1 py-3 min-h-[116px]";
          return "href" in a
            ? <Link key={a.key} href={a.href} className={cls} aria-label={a.accessibleLabel}>{inner}</Link>
            : <button key={a.key} type="button" className={cls} aria-label={a.accessibleLabel} aria-describedby={a.key === "agua" ? "quick-water-progress" : undefined} onClick={() => (a.key === "agua" ? water() : setSheet(a.key as "estudo" | "campo"))}>{inner}</button>;
        })}
      </div>
      <Sheet accent="#ff2800" open={sheet === "estudo"} onClose={() => setSheet(null)} title="Estudo">{sheet === "estudo" && <StudyQuiz today={today} onClose={() => setSheet(null)} />}</Sheet>
      <Sheet accent="#f5f5f7" open={sheet === "campo"} onClose={() => setSheet(null)} title="Serviço de hoje">{sheet === "campo" && <FieldQuiz today={today} contacts={contacts} onClose={() => setSheet(null)} />}</Sheet>
    </>
  );
}
