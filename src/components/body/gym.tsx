"use client";
import { useMemo, useState } from "react";
import { allExercises, EQUIP, type Equip } from "@/lib/swaps";
import { MUSCLES, type Muscle } from "@/lib/training";
import { epley, PCT_TABLE, platesFor, PLATES, warmup } from "@/lib/gym-tools";
import { ExerciseHero, ExerciseThumb } from "./exercise-media";
import { MuscleMap } from "./muscle-map";
import { Sheet } from "@/components/kit";

const R = "#ffb21e", A = "#ffb21e";
const nn = (s: string) => Number(s.replace(",", ".")) || 0;
const f1 = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

/** Biblioteca de exercícios com filtro por músculo e equipamento, ilustração e músculos trabalhados. */
export function ExerciseLibrary({ history }: { history: { date: string; sets: { exercise: string; kg: number; reps: number }[] }[] }) {
  const all = useMemo(() => allExercises(), []);
  const [m, setM] = useState<Muscle | "todos">("todos"), [e, setE] = useState<Equip | "todos">("todos"), [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const list = all.filter((x) => (m === "todos" || x.muscle === m) && (e === "todos" || x.equip === e) && (!q || x.name.toLowerCase().includes(q.toLowerCase())));
  const muscles = [...new Set(all.map((x) => x.muscle))];
  const best = (name: string) => { const s = history.flatMap((w) => w.sets.filter((x) => x.exercise.toLowerCase() === name.toLowerCase()).map((x) => ({ ...x, date: w.date }))); if (!s.length) return null; const top = s.reduce((a, b) => (epley(b.kg, b.reps) > epley(a.kg, a.reps) ? b : a)); return { ...top, est: epley(top.kg, top.reps), n: new Set(s.map((x) => x.date)).size }; };
  const cur = sel ? all.find((x) => x.name === sel) : null, b = sel ? best(sel) : null;
  return (
    <div className="grid lg:grid-cols-[240px_minmax(0,1fr)] gap-5 items-start">
      <aside className="grid gap-3 lg:sticky lg:top-4">
        <input className="field" placeholder="Buscar exercício" value={q} onChange={(ev) => setQ(ev.target.value)} aria-label="Buscar exercício" />
        <div><p className="label !text-[9px] mb-2">Músculo</p><div className="flex lg:flex-col flex-wrap gap-1">{(["todos", ...muscles] as const).map((k) => <button key={k} className={`text-left px-3 min-h-9 text-[13px] border rounded-[6px] ${m === k ? "border-[#ffb21e] bg-[#140303] text-white" : "border-white/[.08] text-white/60 hover:text-white"}`} onClick={() => setM(k)}>{k === "todos" ? "Todos" : MUSCLES[k]}</button>)}</div></div>
        <div><p className="label !text-[9px] mb-2">Equipamento</p><div className="flex flex-wrap gap-1">{(["todos", ...Object.keys(EQUIP)] as const).map((k) => <button key={k} className="chip !min-h-8 text-[12px]" aria-pressed={e === k} onClick={() => setE(k as Equip | "todos")}>{k === "todos" ? "Todos" : EQUIP[k as Equip]}</button>)}</div></div>
      </aside>
      <div>
        <p className="label mb-3">{list.length} exercícios</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {list.map((x) => (
            <button key={x.name} onClick={() => setSel(x.name)} className="text-left border border-white/[.08] rounded-[8px] overflow-hidden bg-[#0a0a0a] hover:border-[#ffb21e66] transition-colors">
              <div className="h-28 grid place-items-center ex-media !rounded-none"><ExerciseThumb name={x.name} size={96} /></div>
              <div className="p-3"><p className="text-[13.5px] font-medium leading-snug line-clamp-2">{x.name}</p><p className="text-[10.5px] font-mono text-white/45 mt-1">{MUSCLES[x.muscle]} · {EQUIP[x.equip]}</p></div>
            </button>))}
        </div>
      </div>
      <Sheet tone="war" open={!!cur} onClose={() => setSel(null)} title={cur?.name ?? ""}>
        {cur && <div className="grid md:grid-cols-2 gap-5">
          <div><ExerciseHero name={cur.name} /></div>
          <div className="grid gap-4 content-start">
            <MuscleMap list={[{ name: cur.name, sets: 3, muscle: cur.muscle }]} compact />
            <p className="text-[13px] text-white/60">{MUSCLES[cur.muscle]} · {EQUIP[cur.equip]}</p>
            {b ? <div className="hunt-card p-4"><p className="label !text-[9px]">Seu melhor</p><p className="num text-3xl mt-1" style={{ color: A }}>{f1(b.kg)} kg × {b.reps}</p><p className="text-[12px] text-white/55">1RM estimado {f1(b.est)} kg · {b.n} treinos com este exercício</p></div>
              : <p className="text-[12.5px] text-white/45">Você ainda não registrou este exercício.</p>}
          </div>
        </div>}
      </Sheet>
    </div>
  );
}

/** Calculadoras: 1RM e cargas por %, anilhas por lado e aquecimento. */
export function GymTools() {
  const [kg, setKg] = useState("100"), [reps, setReps] = useState("5");
  const [target, setTarget] = useState("100"), [bar, setBar] = useState("20");
  const orm = epley(nn(kg), Math.round(nn(reps)));
  const pl = platesFor(nn(target), nn(bar)), wu = warmup(nn(target), nn(bar));
  const plateH: Record<number, number> = { 25: 64, 20: 58, 15: 52, 10: 44, 5: 34, 2.5: 26, 1.25: 20 };
  const plateC: Record<number, string> = { 25: R, 20: "#3b82f6", 15: "#eab308", 10: "#22c55e", 5: "#f5f5f7", 2.5: "#a1a1a6", 1.25: "#6b6b70" };
  return (
    <div className="grid lg:grid-cols-3 gap-4 items-start">
      <section className="hunt-card p-5">
        <p className="label">1RM estimado</p>
        <div className="grid grid-cols-2 gap-2 mt-3"><label className="grid gap-1"><span className="label !text-[9px]">Carga (kg)</span><input className="field num text-lg" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value)} /></label><label className="grid gap-1"><span className="label !text-[9px]">Repetições</span><input className="field num text-lg" inputMode="numeric" value={reps} onChange={(e) => setReps(e.target.value)} /></label></div>
        <p className="num text-5xl mt-4" style={{ color: A }}>{f1(orm)} <span className="text-lg text-white/40">kg</span></p>
        <table className="w-full mt-4 text-[13px]"><tbody>{PCT_TABLE.map(([r, p]) => <tr key={r} className="border-t border-white/[.06]"><td className="py-1.5 text-white/55">{r} rep{r > 1 ? "s" : ""}</td><td className="text-white/45 font-mono">{p}%</td><td className="text-right num">{f1(Math.round((orm * p) / 100 / 2.5) * 2.5)} kg</td></tr>)}</tbody></table>
      </section>
      <section className="hunt-card p-5">
        <p className="label">Anilhas por lado</p>
        <div className="grid grid-cols-2 gap-2 mt-3"><label className="grid gap-1"><span className="label !text-[9px]">Peso total</span><input className="field num text-lg" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} /></label><label className="grid gap-1"><span className="label !text-[9px]">Barra</span><select className="field" value={bar} onChange={(e) => setBar(e.target.value)}>{["20", "15", "10", "0"].map((b) => <option key={b} value={b}>{b === "0" ? "Sem barra" : `${b} kg`}</option>)}</select></label></div>
        <div className="flex items-center gap-1 mt-5 h-20" aria-label={`Por lado: ${pl.perSide.join(", ")} kg`}>
          <i className="h-3 w-10 bg-[#a1a1a6]" />{pl.perSide.map((p, i) => <i key={i} className="w-3 rounded-[2px]" style={{ height: plateH[p], background: plateC[p] }} title={`${p} kg`} />)}<i className="h-3 flex-1 bg-[#a1a1a6]" />
        </div>
        <p className="font-mono text-[13px] mt-3">{pl.perSide.length ? pl.perSide.join(" + ") : "só a barra"} <span className="text-white/45">por lado</span></p>
        {Math.abs(pl.achieved - nn(target)) > 0.01 && <p className="text-[12px] mt-1" style={{ color: A }}>Mais perto possível: {f1(pl.achieved)} kg</p>}
        <p className="text-[11px] text-white/40 mt-2">Anilhas: {PLATES.join(", ")} kg</p>
      </section>
      <section className="hunt-card p-5">
        <p className="label">Aquecimento até {f1(nn(target))} kg</p>
        <ol className="mt-3 grid gap-px bg-white/[.06] border border-white/[.06]">{wu.map((w, i) => <li key={i} className="bg-[#080808] flex items-center gap-3 px-3 py-2.5"><span className="font-mono text-[11px] text-white/40">{i + 1}</span><span className="num text-xl flex-1">{f1(w.kg)} kg</span><span className="font-mono text-[12px] text-white/60">× {w.reps}</span></li>)}</ol>
        <p className="text-[11.5px] text-white/45 mt-3">Descanso curto entre as séries de aquecimento. Depois, as séries de trabalho.</p>
      </section>
    </div>
  );
}
