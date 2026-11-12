"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { copyMeals, deleteFood, deleteMealItem, saveFood, saveMealItem, setMealDone } from "@/app/(app)/corpo/actions";
import { updateSettings } from "@/app/settings-actions";
import { Ring } from "@/components/ui";
import { Field, LinkBtn, Progress, SectionTitle, Sheet, fmt, n } from "@/components/kit";
import { addDays, shortDate, weekdayShort, dow } from "@/lib/date";
import type { MealSlot } from "@/lib/settings";

const G = "#30d158", P = "#ffb340", C = "#0a84ff", F = "#bf5af2";
export type Item = { id: string; slot: string; name: string; kcal: number; protein_g: number; carbs_g: number; fat_g: number };
export type Food = { id: string; name: string; portion: string | null; kcal: number; protein_g: number; carbs_g: number; fat_g: number };
type Goals = { kcal: number; protein: number; carbs: number; fat: number };
const sum = (l: Item[], k: keyof Pick<Item, "kcal" | "protein_g" | "carbs_g" | "fat_g">) => l.reduce((a, i) => a + Number(i[k]), 0);
const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").slice(0, 30) || "ref";

function ItemForm({ date, slot, item, foods, onDone }: { date: string; slot: string; item?: Item; foods: Food[]; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [f, setF] = useState({ name: item?.name ?? "", kcal: String(item?.kcal ?? ""), p: String(item?.protein_g ?? ""), c: String(item?.carbs_g ?? ""), g: String(item?.fat_g ?? ""), fav: false, qty: "1" });
  const [q, setQ] = useState("");
  const pick = (fd: Food) => setF({ ...f, name: fd.name + (fd.portion ? ` (${fd.portion})` : ""), kcal: String(fd.kcal), p: String(fd.protein_g), c: String(fd.carbs_g), g: String(fd.fat_g), qty: "1" });
  const mult = n(f.qty) || 1;
  const list = foods.filter((fd) => !q || fd.name.toLowerCase().includes(q.toLowerCase())).slice(0, 12);
  const save = () => start(async () => {
    await saveMealItem({ date, slot, name: mult !== 1 ? `${f.name} ×${fmt(mult)}` : f.name, kcal: Math.round(n(f.kcal) * mult),
      protein_g: n(f.p) * mult, carbs_g: n(f.c) * mult, fat_g: n(f.g) * mult, favorite: f.fav }, item?.id);
    onDone();
  });
  return (
    <div className="grid gap-3">
      {!item && foods.length > 0 && (
        <div>
          <input className="field" placeholder="Buscar nos favoritos…" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="flex flex-wrap gap-2 mt-2">
            {list.map((fd) => <button key={fd.id} className="chip" onClick={() => pick(fd)}>{fd.name}<span className="ml-1 text-faint">{fd.kcal}</span></button>)}
          </div>
        </div>
      )}
      <Field label="Alimento"><input className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ex.: Arroz, frango, ovos" /></Field>
      <div className="grid grid-cols-4 gap-2">
        <Field label="Kcal"><input className="field num text-center !px-1" inputMode="numeric" value={f.kcal} onChange={(e) => setF({ ...f, kcal: e.target.value })} /></Field>
        <Field label="Prot g"><input className="field num text-center !px-1" inputMode="decimal" value={f.p} onChange={(e) => setF({ ...f, p: e.target.value })} /></Field>
        <Field label="Carb g"><input className="field num text-center !px-1" inputMode="decimal" value={f.c} onChange={(e) => setF({ ...f, c: e.target.value })} /></Field>
        <Field label="Gord g"><input className="field num text-center !px-1" inputMode="decimal" value={f.g} onChange={(e) => setF({ ...f, g: e.target.value })} /></Field>
      </div>
      {!item && (
        <div className="grid grid-cols-[6rem_1fr] gap-3 items-end">
          <Field label="Porções"><input className="field num text-center" inputMode="decimal" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} /></Field>
          <label className="flex items-center gap-3 min-h-11"><input type="checkbox" className="h-5 w-5 accent-[#30d158]" checked={f.fav} onChange={(e) => setF({ ...f, fav: e.target.checked })} />Salvar nos favoritos</label>
        </div>
      )}
      {mult !== 1 && <p className="text-xs text-muted">Total: {Math.round(n(f.kcal) * mult)} kcal · {fmt(n(f.p) * mult)} g proteína</p>}
      <div className="flex gap-2">
        {item && <button className="btn text-muted" disabled={pending} onClick={() => { if (confirm("Remover item?")) start(async () => { await deleteMealItem(item.id); onDone(); }); }}>Excluir</button>}
        <button className="btn btn-accent flex-1" disabled={pending || !f.name.trim()} onClick={save}>{pending ? "Salvando…" : item ? "Salvar" : "Adicionar"}</button>
      </div>
    </div>
  );
}

function FoodsManager({ foods }: { foods: Food[] }) {
  const [pending, start] = useTransition();
  const [edit, setEdit] = useState<Food | "new" | null>(null);
  const blank: Food = { id: "", name: "", portion: "", kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  const cur = edit === "new" ? blank : edit;
  const [f, setF] = useState(blank);
  const open = (fd: Food | "new") => { setEdit(fd); setF(fd === "new" ? blank : fd); };
  if (cur) return (
    <div className="grid gap-3">
      <div className="grid grid-cols-[1fr_7rem] gap-2">
        <Field label="Nome"><input className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Porção"><input className="field" placeholder="100 g" value={f.portion ?? ""} onChange={(e) => setF({ ...f, portion: e.target.value })} /></Field>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {([["kcal", "Kcal"], ["protein_g", "Prot"], ["carbs_g", "Carb"], ["fat_g", "Gord"]] as const).map(([k, l]) =>
          <Field key={k} label={l}><input className="field num text-center !px-1" inputMode="decimal" value={String(f[k])} onChange={(e) => setF({ ...f, [k]: n(e.target.value) })} /></Field>)}
      </div>
      <div className="flex gap-2">
        <button className="btn" onClick={() => setEdit(null)}>Voltar</button>
        {edit !== "new" && <button className="btn text-muted" onClick={() => { if (confirm("Excluir favorito?")) start(async () => { await deleteFood(f.id); setEdit(null); }); }}>Excluir</button>}
        <button className="btn btn-accent flex-1" disabled={pending || !f.name.trim()} onClick={() => start(async () => {
          await saveFood({ name: f.name, portion: f.portion ?? "", kcal: Math.round(f.kcal), protein_g: f.protein_g, carbs_g: f.carbs_g, fat_g: f.fat_g }, edit === "new" ? undefined : f.id); setEdit(null);
        })}>Salvar</button>
      </div>
    </div>
  );
  return (
    <div className="grid gap-2">
      {foods.length === 0 && <p className="font-display italic text-muted">Salve alimentos que você come sempre para lançar com um toque.</p>}
      <ul className="grid">
        {foods.map((fd) => (
          <li key={fd.id}><button className="row-hover w-full flex items-center gap-3 min-h-12 px-2 text-left" onClick={() => open(fd)}>
            <span className="flex-1">{fd.name}{fd.portion && <span className="text-faint text-sm"> · {fd.portion}</span>}</span>
            <span className="text-xs text-muted">P{fmt(fd.protein_g)} C{fmt(fd.carbs_g)} G{fmt(fd.fat_g)}</span><span className="num w-14 text-right">{fd.kcal}</span>
          </button></li>
        ))}
      </ul>
      <button className="btn" onClick={() => open("new")}>+ Novo favorito</button>
    </div>
  );
}

function SlotsEditor({ slots, onDone }: { slots: MealSlot[]; onDone: () => void }) {
  const [list, setList] = useState(slots);
  const [label, setLabel] = useState("");
  const [pending, start] = useTransition();
  const move = (i: number, d: number) => { const x = [...list]; [x[i], x[i + d]] = [x[i + d], x[i]]; setList(x); };
  return (
    <div className="grid gap-3">
      {list.map((s, i) => (
        <div key={s.key} className="flex gap-1">
          <input className="field flex-1" value={s.label} onChange={(e) => setList(list.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} aria-label="Refeição" />
          <button className="btn !px-3" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Subir">↑</button>
          <button className="btn !px-3" disabled={i === list.length - 1} onClick={() => move(i, 1)} aria-label="Descer">↓</button>
          <button className="btn !px-3 text-muted" disabled={list.length === 1} onClick={() => setList(list.filter((_, j) => j !== i))} aria-label="Remover">✕</button>
        </div>
      ))}
      <div className="flex gap-2">
        <input className="field flex-1" placeholder="Nova refeição (ex.: Pré-treino)" value={label} onChange={(e) => setLabel(e.target.value)} />
        <button className="btn" onClick={() => { if (!label.trim()) return; let k = slug(label); while (list.some((x) => x.key === k)) k += "_"; setList([...list, { key: k, label: label.trim() }]); setLabel(""); }}>Adicionar</button>
      </div>
      <button className="btn btn-accent" disabled={pending} onClick={() => start(async () => { await updateSettings({ meal_slots: list }); onDone(); })}>Salvar refeições</button>
    </div>
  );
}

function GoalsEditor({ goals, onDone }: { goals: Goals; onDone: () => void }) {
  const [f, setF] = useState({ kcal: String(goals.kcal), protein: String(goals.protein), carbs: String(goals.carbs), fat: String(goals.fat) });
  const [pending, start] = useTransition();
  const kcalFromMacros = n(f.protein) * 4 + n(f.carbs) * 4 + n(f.fat) * 9;
  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Calorias (kcal)"><input className="field num" inputMode="numeric" value={f.kcal} onChange={(e) => setF({ ...f, kcal: e.target.value })} /></Field>
        <Field label="Proteína (g)"><input className="field num" inputMode="numeric" value={f.protein} onChange={(e) => setF({ ...f, protein: e.target.value })} /></Field>
        <Field label="Carboidrato (g)"><input className="field num" inputMode="numeric" value={f.carbs} onChange={(e) => setF({ ...f, carbs: e.target.value })} /></Field>
        <Field label="Gordura (g)"><input className="field num" inputMode="numeric" value={f.fat} onChange={(e) => setF({ ...f, fat: e.target.value })} /></Field>
      </div>
      <p className="text-xs text-muted">Os macros somam {Math.round(kcalFromMacros)} kcal. <button className="underline" onClick={() => setF({ ...f, kcal: String(Math.round(kcalFromMacros)) })}>Usar este valor</button></p>
      <button className="btn btn-accent" disabled={pending} onClick={() => start(async () => {
        await updateSettings({ kcal_goal: Math.round(n(f.kcal)), protein_goal_g: Math.round(n(f.protein)), carbs_goal_g: Math.round(n(f.carbs)), fat_goal_g: Math.round(n(f.fat)) }); onDone();
      })}>Salvar metas</button>
    </div>
  );
}

export function Nutrition({ date, today, slots, items, doneSlots, foods, goals, week }: {
  date: string; today: string; slots: MealSlot[]; items: Item[]; doneSlots: string[]; foods: Food[]; goals: Goals; week: { date: string; kcal: number; protein: number }[];
}) {
  const [pending, start] = useTransition();
  const [sheet, setSheet] = useState<null | { kind: "add"; slot: string } | { kind: "edit"; item: Item } | { kind: "foods" | "slots" | "goals" }>(null);
  const close = () => setSheet(null);
  const kcal = sum(items, "kcal"), prot = sum(items, "protein_g"), carb = sum(items, "carbs_g"), fat = sum(items, "fat_g");
  const remaining = goals.kcal - kcal;
  const maxW = Math.max(goals.kcal, ...week.map((w) => w.kcal)) * 1.1;
  const isToday = date === today;
  const extraSlots = [...new Set(items.map((i) => i.slot))].filter((k) => !slots.some((s) => s.key === k)).map((k) => ({ key: k, label: k }));

  return (
    <div style={{ ["--accent" as string]: G }}>
      <nav className="flex items-center justify-between mb-4">
        <Link className="btn" href={`/corpo?aba=alimentacao&d=${addDays(date, -1)}`} aria-label="Dia anterior">‹</Link>
        <p className="font-display text-xl">{isToday ? "Hoje" : `${weekdayShort[dow(date)]}, ${shortDate(date)}`}</p>
        <Link className="btn" href={`/corpo?aba=alimentacao&d=${addDays(date, 1)}`} aria-label="Próximo dia">›</Link>
      </nav>

      <section className="glass rise p-5">
        <SectionTitle action={<LinkBtn onClick={() => setSheet({ kind: "goals" })}>Metas</LinkBtn>}>Resumo do dia</SectionTitle>
        <div className="flex items-center gap-6">
          <Ring value={kcal / goals.kcal} size={130} stroke={11} color={kcal > goals.kcal * 1.05 ? "#ff453a" : G}>
            <span><span className="num text-3xl block">{Math.abs(remaining).toLocaleString("pt-BR")}</span><span className="label">{remaining >= 0 ? "kcal restam" : "kcal acima"}</span></span>
          </Ring>
          <div className="flex-1 grid gap-3">
            {([["Proteína", prot, goals.protein, P], ["Carboidrato", carb, goals.carbs, C], ["Gordura", fat, goals.fat, F]] as const).map(([l, v, g, c]) => (
              <div key={l}>
                <div className="flex justify-between text-sm"><span>{l}</span><span className="num text-muted"><span className="text-ink">{fmt(v, 0)}</span> / {g} g</span></div>
                <Progress value={v / g} color={c} height={6} />
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted mt-3">{kcal.toLocaleString("pt-BR")} de {goals.kcal.toLocaleString("pt-BR")} kcal consumidas</p>
      </section>

      {items.length === 0 && (
        <button className="btn w-full mt-4" disabled={pending} onClick={() => start(() => copyMeals(addDays(date, -1), date))}>Copiar refeições do dia anterior</button>
      )}

      {[...slots, ...extraSlots].map((s) => {
        const list = items.filter((i) => i.slot === s.key), on = doneSlots.includes(s.key);
        return (
          <section key={s.key} className="glass rise p-5 mt-4">
            <div className="flex items-center gap-3">
              <button aria-pressed={on} aria-label={`Marcar ${s.label} como feita`} onClick={() => start(() => setMealDone(date, s.key, !on))}
                className="h-9 w-9 shrink-0 grid place-items-center rounded-xl border transition-colors" style={{ borderColor: on ? G : "rgba(255,255,255,.18)", background: on ? G : "transparent" }}>
                {on && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#120f08" strokeWidth="3" aria-hidden><path d="M5 12l5 5L20 7" /></svg>}
              </button>
              <p className="font-display text-xl flex-1">{s.label}</p>
              <p className="num text-sm text-muted">{sum(list, "kcal")} kcal · {fmt(sum(list, "protein_g"), 0)} g P</p>
            </div>
            {list.length > 0 && (
              <ul className="mt-3">
                {list.map((i) => (
                  <li key={i.id}><button className="row-hover w-full flex items-center gap-3 min-h-11 px-2 text-left" onClick={() => setSheet({ kind: "edit", item: i })}>
                    <span className="flex-1 text-[15px]">{i.name}</span>
                    <span className="text-xs text-faint hidden sm:inline">P{fmt(Number(i.protein_g), 0)} · C{fmt(Number(i.carbs_g), 0)} · G{fmt(Number(i.fat_g), 0)}</span>
                    <span className="num text-sm w-14 text-right">{i.kcal}</span>
                  </button></li>
                ))}
              </ul>
            )}
            <button className="btn w-full mt-3 text-muted" onClick={() => setSheet({ kind: "add", slot: s.key })}>+ Adicionar alimento</button>
          </section>
        );
      })}

      <div className="grid grid-cols-2 gap-2 mt-4">
        <button className="btn" onClick={() => setSheet({ kind: "foods" })}>Favoritos ({foods.length})</button>
        <button className="btn" onClick={() => setSheet({ kind: "slots" })}>Editar refeições</button>
      </div>

      <section className="glass rise p-5 mt-4">
        <SectionTitle>Últimos 7 dias</SectionTitle>
        <div className="relative flex items-end gap-2 h-36">
          <div className="absolute inset-x-0 border-t border-dashed border-white/20" style={{ bottom: `${(goals.kcal / maxW) * 100}%` }} />
          {week.map((w) => (
            <Link key={w.date} href={`/corpo?aba=alimentacao&d=${w.date}`} className="flex-1 flex flex-col items-center gap-1 h-full justify-end" title={`${w.kcal} kcal · ${w.protein} g`}>
              <div className="w-full rounded-md" style={{ height: `${(w.kcal / maxW) * 100}%`, minHeight: 2, background: w.date === date ? G : G + "55" }} />
              <span className="text-[10px] text-muted">{weekdayShort[dow(w.date)]}</span>
            </Link>
          ))}
        </div>
        <p className="text-xs text-muted mt-2">Média: {Math.round(week.reduce((a, w) => a + w.kcal, 0) / 7).toLocaleString("pt-BR")} kcal · {Math.round(week.reduce((a, w) => a + w.protein, 0) / 7)} g de proteína por dia</p>
      </section>

      <Sheet accent={G} open={sheet?.kind === "add" || sheet?.kind === "edit"} onClose={close}
        title={sheet?.kind === "edit" ? "Editar alimento" : `Adicionar · ${slots.find((s) => sheet?.kind === "add" && s.key === sheet.slot)?.label ?? ""}`}>
        {sheet?.kind === "add" && <ItemForm key={"a" + sheet.slot} date={date} slot={sheet.slot} foods={foods} onDone={close} />}
        {sheet?.kind === "edit" && <ItemForm key={sheet.item.id} date={date} slot={sheet.item.slot} item={sheet.item} foods={foods} onDone={close} />}
      </Sheet>
      <Sheet accent={G} open={sheet?.kind === "foods"} onClose={close} title="Alimentos favoritos"><FoodsManager foods={foods} /></Sheet>
      <Sheet accent={G} open={sheet?.kind === "slots"} onClose={close} title="Refeições do dia"><SlotsEditor slots={slots} onDone={close} /></Sheet>
      <Sheet accent={G} open={sheet?.kind === "goals"} onClose={close} title="Metas de alimentação"><GoalsEditor goals={goals} onDone={close} /></Sheet>
    </div>
  );
}
