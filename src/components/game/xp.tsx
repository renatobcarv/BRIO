"use client";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { levelOf, rankOf, rankIndex } from "@/lib/game";
import { Insignia } from "@/components/game/insignia";
import { CountUp } from "@/components/count-up";

type Float = { id: number; text: string; color: string };
type Ctx = { total: number; today: number; gain: (xp: number, label?: string, color?: string) => void; celebrate: (title: string, sub?: string, insignia?: number) => void };
const XpCtx = createContext<Ctx>({ total: 0, today: 0, gain: () => {}, celebrate: () => {} });
export const useXp = () => useContext(XpCtx);

export function haptic(pattern: number | number[] = 12) { try { navigator.vibrate?.(pattern); } catch { /* sem suporte */ } }

const CONFETTI = ["#ffb340", "#ffd27a", "#30d158", "#0a84ff", "#bf5af2", "#ff453a"];

/** Guarda o XP no cliente para a barra reagir na hora; o servidor recalcula no próximo carregamento. */
export function XpProvider({ initialTotal, initialToday, children, trackLevel = true }: { initialTotal: number; initialToday: number; children: React.ReactNode; trackLevel?: boolean }) {
  const [total, setTotal] = useState(initialTotal);
  const [today, setToday] = useState(initialToday);
  const [floats, setFloats] = useState<Float[]>([]);
  const [banner, setBanner] = useState<{ title: string; sub?: string; key: number; insignia?: number } | null>(null);
  const id = useRef(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => { setTotal(initialTotal); setToday(initialToday); }, [initialTotal, initialToday]);

  const celebrate = useCallback((title: string, sub?: string, insignia?: number) => {
    haptic(insignia != null ? [40, 60, 40, 60, 40, 60, 160] : [30, 60, 30, 60, 80]);
    setBanner({ title, sub, key: ++id.current, insignia });
    setTimeout(() => setBanner(null), insignia != null ? 3600 : 2600);
  }, []);

  const gain = useCallback((xp: number, label?: string, color = "#ffb340") => {
    setTotal((t) => {
      const next = Math.max(0, t + xp);
      if (trackLevel && xp > 0 && levelOf(next).level > levelOf(t).level) {
        const a = levelOf(t).level, b = levelOf(next).level;
        if (rankIndex(b) > rankIndex(a)) { const r = rankOf(b); setTimeout(() => celebrate(r.name.toUpperCase(), `${r.pt} · “${r.motto}”`, rankIndex(b)), 450); }
        else setTimeout(() => celebrate(`Nível ${b}`, rankOf(b).name), 450);
      }
      return next;
    });
    setToday((t) => Math.max(0, t + xp));
    if (xp > 0) {
      haptic(14);
      const f = { id: ++id.current, text: `+${xp} XP${label ? ` · ${label}` : ""}`, color };
      setFloats((l) => [...l, f]);
      setTimeout(() => setFloats((l) => l.filter((x) => x.id !== f.id)), 1500);
    }
  }, [celebrate, trackLevel]);

  return (
    <XpCtx.Provider value={{ total, today, gain, celebrate }}>
      {children}
      {mounted && createPortal(<>
      <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+4.5rem)] z-50 flex flex-col items-center gap-2" aria-live="polite">
        {floats.map((f) => <span key={f.id} className="xp-float rounded-full px-4 py-1.5 text-sm font-semibold backdrop-blur-md border" style={{ color: f.color, borderColor: f.color + "55", background: "rgba(14,16,21,.85)" }}>{f.text}</span>)}
      </div>
      {banner && (
        <div key={banner.key} className="pointer-events-none fixed inset-0 z-[60] grid place-items-center" role="status">
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 36 }).map((_, i) => (
              <i key={i} className="confetti" style={{ left: `${(i * 37) % 100}%`, background: CONFETTI[i % CONFETTI.length], animationDelay: `${(i % 9) * 0.05}s`, ["--dx" as string]: `${((i * 53) % 120) - 60}px`, ["--rot" as string]: `${(i * 97) % 360}deg` }} />
            ))}
          </div>
          <div className="absolute inset-0 bg-black/60 sheet-fade" />
          <div className="relative grid place-items-center">
            <div className="absolute h-[420px] w-[420px] rays" aria-hidden />
            <div className="level-pop relative text-center rounded-[32px] px-10 py-8 border border-[#ffb340]/40 bg-[#111113]" style={{ animationDuration: banner.insignia != null ? "3.6s" : undefined, boxShadow: "0 0 0 1px rgba(255,179,64,.15), 0 0 90px -10px rgba(255,179,64,.65)" }}>
              {banner.insignia != null && <div className="mx-auto w-fit emblem-spin mb-2"><Insignia index={banner.insignia} size={120} /></div>}
              <p className="label" style={{ color: "#ffb340" }}>{banner.insignia != null ? "Nova patente · Ascension" : "Conquista"}</p>
              <p className="font-display text-6xl mt-2 text-glow" style={{ ["--glow" as string]: "#ffb340" }}>{banner.title}</p>
              {banner.sub && <p className="text-muted mt-2">{banner.sub}</p>}
            </div>
          </div>
        </div>
      )}
      </>, document.body)}
    </XpCtx.Provider>
  );
}

/** Painel de status no topo do Início. */
export function StatusHud({ attrs }: { attrs: { key: string; label: string; color: string; value: number }[] }) {
  const { total, today } = useXp();
  const lv = levelOf(total), rank = rankOf(lv.level);
  const r = 30, c = 2 * Math.PI * r;
  return (
    <Link href="/status" className="glass rise block p-4 overflow-hidden relative" aria-label={`Nível ${lv.level}, ${rank.name}. Ver status`}>
      <div className="flex items-center gap-4 relative">
        <div className="relative h-[76px] w-[76px] shrink-0">
          <svg width="76" height="76" className="-rotate-90" aria-hidden>
            <circle cx="38" cy="38" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6" />
            <circle cx="38" cy="38" r={r} fill="none" stroke={rank.color} strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - lv.progress)} className="ring-anim"
              style={{ ["--c" as string]: c, transition: "stroke-dashoffset .9s cubic-bezier(.34,1.56,.64,1)", filter: `drop-shadow(0 0 6px ${rank.color})` }} />
          </svg>
          <div className="absolute inset-1.5 rounded-full breathe" style={{ boxShadow: `inset 0 0 22px -6px ${rank.color}` }} aria-hidden />
          <div className="absolute inset-0 grid place-items-center text-center"><span><span className="label text-[10px] block">Nível</span><CountUp value={lv.level} className="num text-2xl leading-none" /></span></div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-glow" style={{ color: rank.color, ["--glow" as string]: rank.color }}>{rank.name}</span>
            <span className="ml-auto text-xs num" style={{ color: today ? "#30d158" : "#5a5a5f" }}>+<CountUp value={today} /> XP hoje</span>
          </div>
          <div className="mt-2 h-2.5 rounded-full bg-white/[.07] overflow-hidden">
            <div className="h-full rounded-full xp-shine bar-grow" style={{ width: `${Math.max(3, lv.progress * 100)}%`, background: `linear-gradient(90deg, ${rank.color}, #ffd27a)`, boxShadow: `0 0 14px -1px ${rank.color}`, transition: "width .9s cubic-bezier(.34,1.56,.64,1)" }} />
          </div>
          <p className="text-[11px] text-muted mt-1 num">{lv.into.toLocaleString("pt-BR")} / {lv.need.toLocaleString("pt-BR")} XP para o nível {lv.level + 1}</p>
          <div className="grid grid-cols-6 gap-1.5 mt-2">
            {attrs.map((a) => (
              <div key={a.key} title={`${a.label} ${a.value}`}>
                <div className="h-1 rounded-full bg-white/[.07] overflow-hidden"><div className="h-full rounded-full bar-grow" style={{ width: `${Math.max(4, a.value)}%`, background: a.color, boxShadow: `0 0 8px ${a.color}` }} /></div>
                <p className="text-[9px] text-faint mt-0.5 truncate">{a.label.slice(0, 3)} <span className="text-muted">{a.value}</span></p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
