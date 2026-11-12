"use client";
import { useState, useTransition } from "react";
import { saveTrips } from "@/app/(app)/eventos/actions";

type Trip = { start: string; end: string };
const br = (d: string) => d.split("-").reverse().slice(0, 2).join("/");

/** Modo viagem: pausa eventos que cruzam o período. */
export function TravelControl({ trips, today }: { trips: Trip[]; today: string }) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, go] = useTransition();
  const current = trips.filter((t) => t.end >= today);
  const save = (next: Trip[]) => go(async () => { const err = await saveTrips(next); setMsg(err); if (!err) setOpen(false); });

  return (
    <section className="glass p-4 mb-4">
      <div className="flex items-center justify-between gap-3">
        <div><p className="text-sm font-semibold">✈ Modo viagem</p>
          <p className="text-xs text-muted mt-0.5">Eventos durante a viagem ficam pausados: sem prêmio, sem cicatriz.</p></div>
        {!open && <button className="btn !min-h-10 shrink-0" onClick={() => setOpen(true)}>Estou viajando</button>}
      </div>
      {current.map((t) => (
        <div key={t.start + t.end} className="flex items-center justify-between mt-3 text-sm rounded-xl px-3 py-2 bg-white/[.05]">
          <span>{br(t.start)} – {br(t.end)}</span>
          <button className="text-xs text-muted underline" disabled={pending} onClick={() => save(trips.filter((x) => x !== t))}>remover</button>
        </div>
      ))}
      {open && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          <label className="text-xs text-muted">Ida<input type="date" className="field mt-1" value={start} onChange={(e) => setStart(e.target.value)} /></label>
          <label className="text-xs text-muted">Volta<input type="date" className="field mt-1" value={end} min={start} onChange={(e) => setEnd(e.target.value)} /></label>
          <button className="btn" onClick={() => setOpen(false)}>Cancelar</button>
          <button className="btn btn-accent" disabled={pending} onClick={() => save([...trips, { start, end }])}>{pending ? "Salvando…" : "Pausar eventos"}</button>
        </div>
      )}
      {msg && <p className="text-xs text-[#ff453a] mt-2">{msg}</p>}
    </section>
  );
}
