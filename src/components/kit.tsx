"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** Painel que sobe de baixo no celular e vira modal centralizado no desktop. */
export function Sheet({ open, onClose, title, children, accent = "#ffb340", tone }:
  { open: boolean; onClose: () => void; title: string; children: React.ReactNode; accent?: string; tone?: "war" }) {
  const ref = useRef<HTMLDivElement>(null);
  // onClose costuma ser uma função nova a cada render: guardar em ref evita refocar o 1º campo a cada tecla.
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && close.current();
    window.addEventListener("keydown", esc);
    // Foca só ao abrir; no celular não abre o teclado sozinho.
    if (window.matchMedia("(pointer: fine)").matches) ref.current?.querySelector<HTMLElement>("input,textarea,select")?.focus();
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", esc); };
  }, [open]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!open || !mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 bg-black/60 backdrop-blur-sm sheet-fade" aria-label="Fechar" onClick={onClose} />
      <div ref={ref} style={{ ["--accent" as string]: accent }}
        className={`sheet-up relative w-full md:max-w-lg max-h-[92dvh] overflow-y-auto overflow-x-hidden rounded-t-[28px] md:rounded-[28px] border p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] ${tone === "war" ? "war border-[#e0393e]/30 bg-[linear-gradient(180deg,#1c0707,#0b0505_40%)]" : "border-white/10 bg-[#111113]/95 backdrop-blur-xl"}`}>
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 md:hidden" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl">{title}</h2>
          <button className="btn !px-3 text-muted" onClick={onClose} aria-label="Fechar">✕</button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="text-xs text-faint">{hint}</span>}
    </label>
  );
}

export function Stat({ label, value, sub, color, big }: { label: string; value: React.ReactNode; sub?: React.ReactNode; color?: string; big?: boolean }) {
  return (
    <div>
      <p className="label">{label}</p>
      <p className={`num leading-tight mt-1 whitespace-nowrap ${big ? "text-3xl" : "text-lg sm:text-xl"}`} style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex p-1 rounded-2xl bg-white/[.04] border border-white/[.06] gap-1 max-w-full overflow-x-auto" role="tablist">
      {options.map(([k, l]) => (
        <button key={k} role="tab" aria-selected={value === k} onClick={() => onChange(k)}
          className={`min-h-10 px-4 rounded-xl text-sm whitespace-nowrap transition-colors ${value === k ? "bg-white/[.09] text-ink" : "text-muted hover:text-ink"}`}>{l}</button>
      ))}
    </div>
  );
}

export function Progress({ value, color, height = 8, label = "Progresso" }: { value: number; color?: string; height?: number; label?: string }) {
  const v = Math.max(0, Math.min(1, value || 0));
  // role=progressbar com rótulo e valores (biblioteca GEN-A11Y-02)
  return <div className="bar" style={{ height }} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v * 100)}><i style={{ width: `${v * 100}%`, background: color }} /></div>;
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return <div className="flex items-center justify-between mb-3 gap-2"><p className="label">{children}</p>{action}</div>;
}

export function LinkBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="text-sm text-muted hover:text-ink min-h-11 px-2 -mr-2">{children}</button>;
}

export const n = (s: string | number) => typeof s === "number" ? s : Number(String(s).replace(/\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".")) || 0;
export const fmt = (v: number, d = 1) => v.toLocaleString("pt-BR", { maximumFractionDigits: d });
