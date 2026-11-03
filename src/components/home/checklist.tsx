"use client";
import { useOptimistic, useTransition } from "react";
import { toggleCheck } from "@/app/(app)/home-actions";
import { Ring } from "@/components/ui";
import type { ChecklistItem } from "@/lib/settings";

function Box({ on, color }: { on: boolean; color: string }) {
  return (
    <span className="grid place-items-center h-6 w-6 shrink-0 rounded-lg border transition-colors"
      style={{ borderColor: on ? color : "rgba(255,255,255,.18)", background: on ? color : "transparent" }}>
      {on && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#120f08" strokeWidth="3" aria-hidden><path d="M5 12l5 5L20 7" /></svg>}
    </span>
  );
}

export function Checklist({ date, items, done }: { date: string; items: ChecklistItem[]; done: string[] }) {
  const [, start] = useTransition();
  const [opt, setOpt] = useOptimistic(new Set(done), (s: Set<string>, a: { key: string; on: boolean }) => {
    const n = new Set(s); if (a.on) n.add(a.key); else n.delete(a.key); return n;
  });
  const toggle = (key: string) => {
    const on = !opt.has(key);
    start(async () => { setOpt({ key, on }); await toggleCheck(date, key, on); });
  };
  const primary = items.find((i) => i.primary) ?? items[0];
  const rest = items.filter((i) => i !== primary);
  const pct = items.length ? items.filter((i) => opt.has(i.key)).length / items.length : 0;

  return (
    <>
      {primary && (
        <button onClick={() => toggle(primary.key)} aria-pressed={opt.has(primary.key)}
          className="glass rise rise-1 w-full text-left p-6 mt-4 flex items-center gap-5"
          style={{ borderColor: "rgba(224,172,83,.35)", background: opt.has(primary.key) ? "linear-gradient(180deg, rgba(224,172,83,.16), rgba(224,172,83,.04))" : undefined }}>
          <span className="grid place-items-center h-14 w-14 rounded-2xl shrink-0 border transition-colors"
            style={{ borderColor: "#e0ac53", background: opt.has(primary.key) ? "#e0ac53" : "transparent" }}>
            {opt.has(primary.key)
              ? <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#120f08" strokeWidth="2.6" aria-hidden><path d="M5 12l5 5L20 7" /></svg>
              : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e0ac53" strokeWidth="1.6" aria-hidden><path d="M12 3v18M7 8h10" /></svg>}
          </span>
          <span>
            <span className="label text-gold block">Jeová em primeiro lugar</span>
            <span className="font-display text-xl md:text-2xl mt-1 block leading-snug">{primary.label}</span>
            <span className="text-sm text-muted">{opt.has(primary.key) ? "Feito. Bom começo de dia." : "Toque para marcar"}</span>
          </span>
        </button>
      )}
      <section className="glass rise rise-2 p-5 mt-4">
        <div className="flex items-center gap-5">
          <Ring value={pct} size={96} stroke={9}><span className="num text-2xl">{Math.round(pct * 100)}%</span></Ring>
          <div><p className="label">Disciplina de hoje</p>
            <p className="font-display italic text-lg mt-1 text-muted">{pct === 1 ? "Dia completo." : "Constância antes de intensidade."}</p></div>
        </div>
        <ul className="mt-4 divide-y divide-white/5">
          {rest.map((it) => (
            <li key={it.key}>
              <button onClick={() => toggle(it.key)} aria-pressed={opt.has(it.key)}
                className="w-full flex items-center gap-4 min-h-12 py-2 text-left">
                <Box on={opt.has(it.key)} color="#e0ac53" />
                <span className={opt.has(it.key) ? "text-muted line-through decoration-white/20" : ""}>{it.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
