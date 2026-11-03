"use client";
import { useTransition } from "react";
import { excuseToday, honestRestart } from "@/app/(app)/home-actions";

export function Streak({ count, best, excusedToday }: { count: number; best: number; excusedToday: boolean }) {
  const [pending, start] = useTransition();
  return (
    <section className="glass rise rise-3 p-5 mt-4">
      <div className="flex items-end justify-between gap-4">
        <div><p className="label">Sequência</p>
          <p className="mt-1"><span className="num text-5xl">{count}</span> <span className="text-muted">{count === 1 ? "dia" : "dias"}</span></p></div>
        <div className="text-right"><p className="label">Recorde</p><p className="num text-2xl mt-1 text-gold">{best}</p></div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4">
        <button className="btn" disabled={pending} aria-pressed={excusedToday}
          onClick={() => start(() => excuseToday())}>{excusedToday ? "Justificado ✓" : "Dia justificado"}</button>
        <button className="btn" disabled={pending}
          onClick={() => { if (confirm("Recomeçar do zero? O recorde fica guardado.")) start(() => honestRestart()); }}>
          Recomeço honesto</button>
      </div>
    </section>
  );
}
