"use client";
import { useState } from "react";
import { saveMealItem, setMealDone } from "@/app/(app)/corpo/actions";
import { Choices, Quiz } from "./quiz";
import { haptic } from "@/components/game/xp";
import type { MealSlot } from "@/lib/settings";

const G = "#30d158";
type Food = { id: string; name: string; portion: string | null; kcal: number; protein_g: number; carbs_g: number; fat_g: number };
type Pick = { name: string; kcal: number; protein_g: number; carbs_g: number; fat_g: number; favorite?: boolean };

const slotStyle = (label: string) =>
  /caf[eé]|manh/i.test(label) ? { color: "#ffb340", icon: "M5 8h11v6a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5zM16 10h2a2 2 0 0 1 0 4h-2M8 3v2M11 3v2" }
  : /almo/i.test(label) ? { color: "#30d158", icon: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8a4 4 0 1 0 0 8" }
  : /lanche/i.test(label) ? { color: "#ff8a65", icon: "M12 7c-3-3-8-1-8 4 0 5 4 9 8 9s8-4 8-9c0-5-5-7-8-4zM12 7c0-2 1-4 3-4" }
  : /jant/i.test(label) ? { color: "#5e5ce6", icon: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" }
  : /tre?ino/i.test(label) ? { color: "#ff9f0a", icon: "M13 2L4 14h7l-1 8 9-12h-7z" }
  : { color: "#64d2ff", icon: "M7 3v8a2 2 0 0 0 4 0V3M9 11v10M17 3c-2 0-3 3-3 6s1 4 3 4v8" };

export function MealQuiz({ date, slots, foods, doneSlots, proteinSoFar, proteinGoal, onClose }: {
  date: string; slots: MealSlot[]; foods: Food[]; doneSlots: string[]; proteinSoFar: number; proteinGoal: number; onClose: () => void;
}) {
  const [slot, setSlot] = useState<string | null>(slots.find((x) => !doneSlots.includes(x.key))?.key ?? null);
  const [picked, setPicked] = useState<Pick[]>([]);
  const [d, setD] = useState({ name: "", kcal: "", protein: "", fav: true });
  const kcal = picked.reduce((a, p) => a + p.kcal, 0), prot = picked.reduce((a, p) => a + p.protein_g, 0);
  const reachesGoal = proteinSoFar < proteinGoal && proteinSoFar + prot >= proteinGoal;
  const xp = 10 + (reachesGoal ? 25 : 0);
  const toggleFood = (f: Food) => { haptic(8); setPicked((l) => (l.some((p) => p.name === f.name) ? l.filter((p) => p.name !== f.name) : [...l, { name: f.name, kcal: f.kcal, protein_g: f.protein_g, carbs_g: f.carbs_g, fat_g: f.fat_g }])); };
  const addDraft = () => {
    if (!d.name.trim()) return;
    setPicked([...picked, { name: d.name.trim(), kcal: Math.round(Number(d.kcal.replace(",", ".")) || 0), protein_g: Number(d.protein.replace(",", ".")) || 0, carbs_g: 0, fat_g: 0, favorite: d.fav }]);
    setD({ name: "", kcal: "", protein: "", fav: true });
  };
  const slotLabel = slots.find((x) => x.key === slot)?.label ?? "Refeição";

  return (
    <Quiz color={G} xp={xp} onClose={onClose} rewardTitle={`${slotLabel} registrado`}
      rewardLines={[`${kcal} kcal · ${Math.round(prot)} g de proteína`, reachesGoal ? "Meta de proteína do dia batida!" : `Proteína do dia: ${Math.round(proteinSoFar + prot)} / ${proteinGoal} g`]}
      onFinish={async () => {
        try {
          const all = d.name.trim() ? [...picked, { name: d.name.trim(), kcal: Math.round(Number(d.kcal) || 0), protein_g: Number(d.protein) || 0, carbs_g: 0, fat_g: 0, favorite: d.fav }] : picked;
          for (const p of all) await saveMealItem({ date, slot: slot!, name: p.name, kcal: p.kcal, protein_g: p.protein_g, carbs_g: p.carbs_g, fat_g: p.fat_g, favorite: p.favorite });
          await setMealDone(date, slot!, true);
          return null;
        } catch (e) { return (e as Error).message.includes("relation") ? "Rode a migração v2 (alimentação) no Supabase." : (e as Error).message; }
      }}
      steps={[
        { title: "Qual refeição?", canNext: !!slot, content: (
          <Choices value={slot} onChange={setSlot} options={slots.map((x) => ({ value: x.key, label: x.label, sub: doneSlots.includes(x.key) ? "já registrada" : undefined, ...slotStyle(x.label) }))} />) },
        { title: "O que você comeu?", hint: foods.length ? "Toque nos favoritos ou adicione um alimento." : "Adicione o que comeu. Os salvos viram favoritos de um toque.", canNext: picked.length > 0 || !!d.name.trim(), content: (
          <div className="grid gap-4">
            {foods.length > 0 && <div className="flex flex-wrap gap-2">{foods.map((f) => (
              <button key={f.id} className="chip !min-h-11" aria-pressed={picked.some((p) => p.name === f.name)} onClick={() => toggleFood(f)}>{f.name}<span className="ml-1.5 opacity-60 num">{Math.round(f.protein_g)}g</span></button>))}</div>}
            {picked.filter((p) => !foods.some((f) => f.name === p.name)).map((p, k) => (
              <div key={k} className="flex items-center justify-between rounded-xl bg-white/[.04] px-3 min-h-11 text-sm"><span>{p.name}</span><span className="text-muted num">{p.kcal} kcal · {Math.round(p.protein_g)} g</span></div>))}
            <div className="grid gap-2 rounded-2xl border border-white/[.07] p-3">
              <input className="field" placeholder="Alimento (ex.: frango com arroz)" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <input className="field num" inputMode="numeric" placeholder="kcal" value={d.kcal} onChange={(e) => setD({ ...d, kcal: e.target.value })} />
                <input className="field num" inputMode="decimal" placeholder="proteína (g)" value={d.protein} onChange={(e) => setD({ ...d, protein: e.target.value })} />
              </div>
              <label className="flex items-center gap-3 min-h-10 text-sm"><input type="checkbox" className="h-5 w-5 accent-[#30d158]" checked={d.fav} onChange={(e) => setD({ ...d, fav: e.target.checked })} />Salvar nos favoritos</label>
              <button className="btn" disabled={!d.name.trim()} onClick={addDraft}>+ Adicionar</button>
            </div>
          </div>) },
        { title: "Resumo da refeição", content: (
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl bg-[#141416] p-4 text-center"><p className="num text-4xl">{kcal}</p><p className="text-xs text-muted">kcal</p></div>
              <div className="rounded-2xl p-4 text-center" style={{ background: "#ffb34018" }}><p className="num text-4xl" style={{ color: "#ffb340" }}>{Math.round(prot)}</p><p className="text-xs text-muted">g de proteína</p></div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted mb-1"><span>Proteína do dia</span><span className="num">{Math.round(proteinSoFar + prot)} / {proteinGoal} g</span></div>
              <div className="h-2.5 rounded-full bg-white/[.08] overflow-hidden"><div className="h-full rounded-full bar-grow" style={{ width: `${Math.min(100, ((proteinSoFar + prot) / proteinGoal) * 100)}%`, background: "#ffb340", boxShadow: "0 0 12px #ffb340" }} /></div>
              {reachesGoal && <p className="text-sm mt-2 font-semibold" style={{ color: "#30d158" }}>Esta refeição fecha sua meta de proteína: +25 XP extra</p>}
            </div>
          </div>) },
      ]} />
  );
}
