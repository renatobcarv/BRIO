"use client";
import { useState } from "react";
import { alternativesFor, EQUIP, equipOf, type Equip } from "@/lib/swaps";
import { ExerciseHero, ExerciseThumb } from "./exercise-media";
import { Sheet } from "@/components/kit";

/** Troca o exercício na hora: mesmo músculo, outro equipamento (ou nome livre). */
export function SwapSheet({ open, name, muscle, onClose, onPick }: { open: boolean; name: string; muscle?: string | null; onClose: () => void; onPick: (name: string) => void }) {
  const [equip, setEquip] = useState<Equip | null>(null);
  const [custom, setCustom] = useState("");
  const list = alternativesFor(name, muscle, equip);
  const cur = equipOf(name);
  return (
    <Sheet open={open} onClose={onClose} title={`Trocar: ${name}`}>
      <p className="text-[12.5px] text-white/55 mb-3">Mesmo músculo, outro equipamento. As séries e metas continuam; a carga sugerida se ajusta pelo seu histórico.</p>
      <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
        <button className={`chip shrink-0 ${equip === null ? "!border-[#ffb21e] !text-white" : ""}`} onClick={() => setEquip(null)}>Todos</button>
        {(Object.keys(EQUIP) as Equip[]).filter((e) => e !== cur).map((e) => <button key={e} className={`chip shrink-0 ${equip === e ? "!border-[#ffb21e] !text-white" : ""}`} onClick={() => setEquip(e)}>{EQUIP[e]}</button>)}
      </div>
      <ul className="grid gap-px bg-white/[.06] border border-white/[.06] mt-2">
        {list.length === 0 && <li className="bg-[#080808] p-4 text-sm text-white/50">Nenhuma opção com esse equipamento. Escreva abaixo.</li>}
        {list.map((a) => (
          <li key={a.name}><button className="w-full flex items-center gap-3 bg-[#080808] hover:bg-[#140303] px-3 py-2.5 text-left" onClick={() => { onPick(a.name); onClose(); }}>
            <ExerciseThumb name={a.name} size={44} /><span className="flex-1 min-w-0"><span className="block text-[14.5px]">{a.name}</span><span className="block text-[11px] font-mono text-white/45">{EQUIP[a.equip]}</span></span><span className="text-[#ffb21e] text-sm">Usar</span>
          </button></li>))}
      </ul>
      <form className="flex gap-2 mt-3" onSubmit={(e) => { e.preventDefault(); if (custom.trim()) { onPick(custom.trim()); onClose(); setCustom(""); } }}>
        <input className="field flex-1" placeholder="Outro exercício (nome livre)" value={custom} onChange={(e) => setCustom(e.target.value)} />
        <button className="btn" disabled={!custom.trim()}>Usar</button>
      </form>
    </Sheet>
  );
}

/** Visualização do treino completo, com ilustração de cada exercício. */
export function WorkoutPreview({ open, title, items, onClose, onStart, startLabel }: { open: boolean; title: string; items: { name: string; detail: string }[]; onClose: () => void; onStart?: () => void; startLabel?: string }) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <ol className="grid gap-5">
        {items.map((x, i) => (
          <li key={i}>
            <div className="flex items-baseline gap-2"><span className="font-mono text-[11px] text-[#ffb21e]">{String(i + 1).padStart(2, "0")}</span><p className="font-semibold text-[16px] flex-1">{x.name}</p><span className="font-mono text-[12px] text-white/60">{x.detail}</span></div>
            <ExerciseHero name={x.name} />
          </li>))}
      </ol>
      {onStart && <button className="btn btn-accent w-full mt-5 sticky bottom-0" onClick={() => { onClose(); onStart(); }}>{startLabel ?? "Iniciar"}</button>}
    </Sheet>
  );
}
