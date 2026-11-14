"use client";
import { useState } from "react";
import { Sheet } from "@/components/kit";
import { StudyQuiz } from "./study-quiz";

export function StudyQuizButton({ today, minutesToday }: { today: string; minutesToday: number }) {
  const [open, setOpen] = useState(false);
  const C = "#ff4d8a";
  return (
    <>
      <section className="rounded-[26px] p-5 mb-4 border" style={{ borderColor: C + "44", background: `linear-gradient(160deg, ${C}24, #0f0f11 65%)` }}>
        <div className="flex items-center gap-4">
          <span className="h-14 w-14 rounded-2xl grid place-items-center shrink-0 glow" style={{ background: C, ["--glow" as string]: C } as React.CSSProperties}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M4 5a2 2 0 0 1 2-2h6v17H6a2 2 0 0 0-2 2zM20 5a2 2 0 0 0-2-2h-6v17h6a2 2 0 0 1 2 2z" /></svg>
          </span>
          <div><p className="label">Estudo de hoje</p><p className="mt-0.5"><span className="num text-3xl">{minutesToday}</span><span className="text-muted ml-1.5">min</span></p></div>
        </div>
        <button className="btn btn-accent w-full mt-4 !min-h-14 text-base" onClick={() => setOpen(true)}>Registrar estudo</button>
      </section>
      <Sheet accent={C} open={open} onClose={() => setOpen(false)} title="Estudo">{open && <StudyQuiz today={today} onClose={() => setOpen(false)} />}</Sheet>
    </>
  );
}
