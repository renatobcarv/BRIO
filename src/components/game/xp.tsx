"use client";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { levelOf, rankOf } from "@/lib/game";

type Float = { id: number; text: string; color: string };
type Ctx = { total: number; today: number; gain: (xp: number, label?: string, color?: string) => void; celebrate: (title: string, sub?: string) => void };
const XpCtx = createContext<Ctx>({ total: 0, today: 0, gain: () => {}, celebrate: () => {} });
export const useXp = () => useContext(XpCtx);

export function haptic(pattern: number | number[] = 12) { try { navigator.vibrate?.(pattern); } catch { /* sem suporte */ } }

const CONFETTI = ["#e0ac53", "#f3d48a", "#8ac295", "#84aed4", "#ac8fd6", "#e8a39a"];

/** Guarda o XP no cliente para a barra reagir na hora; o servidor recalcula no próximo carregamento. */
export function XpProvider({ initialTotal, initialToday, children }: { initialTotal: number; initialToday: number; children: React.ReactNode }) {
  const [total, setTotal] = useState(initialTotal);
  const [today, setToday] = useState(initialToday);
  const [floats, setFloats] = useState<Float[]>([]);
  const [banner, setBanner] = useState<{ title: string; sub?: string; key: number } | null>(null);
  const id = useRef(0);
  useEffect(() => { setTotal(initialTotal); setToday(initialToday); }, [initialTotal, initialToday]);

  const celebrate = useCallback((title: string, sub?: string) => {
    haptic([30, 60, 30, 60, 80]);
    setBanner({ title, sub, key: ++id.current });
    setTimeout(() => setBanner(null), 2600);
  }, []);

  const gain = useCallback((xp: number, label?: string, color = "#e0ac53") => {
    setTotal((t) => {
      const next = Math.max(0, t + xp);
      if (xp > 0 && levelOf(next).level > levelOf(t).level) setTimeout(() => celebrate(`Nível ${levelOf(next).level}`, rankOf(levelOf(next).level).name), 450);
      return next;
    });
    setToday((t) => Math.max(0, t + xp));
    if (xp > 0) {
      haptic(14);
      const f = { id: ++id.current, text: `+${xp} XP${label ? ` · ${label}` : ""}`, color };
      setFloats((l) => [...l, f]);
      setTimeout(() => setFloats((l) => l.filter((x) => x.id !== f.id)), 1500);
    }
  }, [celebrate]);

  return (
    <XpCtx.Provider value={{ total, today, gain, celebrate }}>
      {children}
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
          <div className="level-pop text-center rounded-[28px] px-10 py-7 border border-[#e0ac53]/40" style={{ background: "radial-gradient(120% 120% at 50% 0%, rgba(224,172,83,.28), rgba(14,16,21,.95) 60%)", boxShadow: "0 0 80px -10px rgba(224,172,83,.55)" }}>
            <p className="label text-gold">Conquista</p>
            <p className="font-display text-5xl mt-1">{banner.title}</p>
            {banner.sub && <p className="text-muted mt-1">{banner.sub}</p>}
          </div>
        </div>
      )}
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
      <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full blur-3xl opacity-25" style={{ background: rank.color }} />
      <div className="flex items-center gap-4 relative">
        <div className="relative h-[76px] w-[76px] shrink-0">
          <svg width="76" height="76" className="-rotate-90" aria-hidden>
            <circle cx="38" cy="38" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6" />
            <circle cx="38" cy="38" r={r} fill="none" stroke={rank.color} strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - lv.progress)} style={{ transition: "stroke-dashoffset .9s cubic-bezier(.34,1.56,.64,1)" }} />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center"><span><span className="label text-[9px] block">Nível</span><span className="num text-2xl leading-none">{lv.level}</span></span></div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[.18em]" style={{ color: rank.color }}>{rank.name}</span>
            <span className="ml-auto text-xs num" style={{ color: today ? "#8ac295" : "#5d5b56" }}>{today ? `+${today} XP hoje` : "0 XP hoje"}</span>
          </div>
          <div className="mt-2 h-2.5 rounded-full bg-white/[.07] overflow-hidden">
            <div className="h-full rounded-full xp-shine" style={{ width: `${lv.progress * 100}%`, background: `linear-gradient(90deg, ${rank.color}, #f3d48a)`, transition: "width .9s cubic-bezier(.34,1.56,.64,1)" }} />
          </div>
          <p className="text-[11px] text-muted mt-1 num">{lv.into.toLocaleString("pt-BR")} / {lv.need.toLocaleString("pt-BR")} XP para o nível {lv.level + 1}</p>
          <div className="grid grid-cols-6 gap-1.5 mt-2">
            {attrs.map((a) => (
              <div key={a.key} title={`${a.label} ${a.value}`}>
                <div className="h-1 rounded-full bg-white/[.07] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${a.value}%`, background: a.color }} /></div>
                <p className="text-[9px] text-faint mt-0.5 truncate">{a.label.slice(0, 3)} <span className="text-muted">{a.value}</span></p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
