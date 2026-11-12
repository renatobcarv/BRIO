"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { copyMeals, deleteFood, deleteMealItem, saveFood, saveMealItem, setMealDone } from "@/app/(app)/corpo/actions";
import { updateSettings } from "@/app/settings-actions";
import { Ring } from "@/components/ui";
import { Avocado, Bread, Drumstick, EnergyFlame } from "@/components/meters";
import { Field, LinkBtn, Progress, SectionTitle, Sheet, fmt, n } from "@/components/kit";
import { addDays, shortDate, weekdayShort, dow } from "@/lib/date";
import type { MealSlot } from "@/lib/settings";
import { MealQuiz } from "@/components/quiz/meal-quiz";

const G = "#30d158", P = "#ffb340", C = "#0a84ff", F = "#bf5af2";
export type Item = { id: string; slot: string; name: string; kcal: number; protein_g: number; carbs_g: number; fat_g: number };
export type Food = { id: string; name: string; portion: string | null; kcal: number; protein_g: number; carbs_g: number; fat_g: number };
type Goals = { kcal: number; protein: number; carbs: number; fat: number };
const sum = (l: Item[], k: keyof Pick<Item, "kcal" | "protein_g" | "carbs_g" | "fat_g">) => l.reduce((a, i) => a + Number(i[k]), 0);
const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").slice(0, 30) || "ref";

/** Fora do plano: slot "extra|comida|14:30" ou "extra|bebida|22:10" (sem migração). */
export const isExtra = (slot: string) => slot.startsWith("extra|");
const extraInfo = (slot: string) => { const [, kind, time] = slot.split("|"); return { kind: kind === "bebida" ? "bebida" : "comida", time: time ?? "" }; };
type Preset = { cat: string; e: string; name: string; kcal: number; p: number; c: number; g: number };
/** Valores médios aproximados por porção comum (referências de tabelas brasileiras e rótulos). */
const PRESETS: Preset[] = [
  // Salgados
  { cat: "Salgados", e: "🥟", name: "Coxinha (média)", kcal: 260, p: 9, c: 28, g: 12 },
  { cat: "Salgados", e: "🥟", name: "Pastel de carne", kcal: 280, p: 9, c: 25, g: 16 },
  { cat: "Salgados", e: "🥟", name: "Pastel de queijo", kcal: 300, p: 10, c: 24, g: 18 },
  { cat: "Salgados", e: "🥐", name: "Esfiha de carne", kcal: 220, p: 9, c: 28, g: 8 },
  { cat: "Salgados", e: "🥐", name: "Enroladinho de salsicha", kcal: 250, p: 7, c: 27, g: 13 },
  { cat: "Salgados", e: "🥟", name: "Risole / bolinha de queijo", kcal: 230, p: 7, c: 22, g: 13 },
  { cat: "Salgados", e: "🥧", name: "Empada de frango", kcal: 270, p: 7, c: 24, g: 16 },
  { cat: "Salgados", e: "🥖", name: "Pão de queijo (3 un.)", kcal: 240, p: 6, c: 30, g: 11 },
  { cat: "Salgados", e: "🥪", name: "Misto quente", kcal: 320, p: 16, c: 30, g: 15 },
  { cat: "Salgados", e: "🧆", name: "Quibe frito", kcal: 230, p: 10, c: 18, g: 13 },
  { cat: "Salgados", e: "🥓", name: "Pão com linguiça", kcal: 420, p: 16, c: 34, g: 24 },
  { cat: "Salgados", e: "🍳", name: "Pão com ovo (pão francês + 1 ovo)", kcal: 260, p: 11, c: 29, g: 11 },
  { cat: "Salgados", e: "🍳", name: "Pão com 2 ovos", kcal: 340, p: 17, c: 29, g: 17 },
  { cat: "Salgados", e: "🍳", name: "Pão com ovo e queijo", kcal: 340, p: 16, c: 29, g: 17 },
  { cat: "Salgados", e: "🥖", name: "Pão na chapa com manteiga", kcal: 220, p: 5, c: 29, g: 9 },
  // Lanches
  { cat: "Lanches", e: "🍔", name: "Hambúrguer artesanal", kcal: 650, p: 32, c: 42, g: 38 },
  { cat: "Lanches", e: "🍔", name: "X-tudo", kcal: 850, p: 40, c: 55, g: 50 },
  { cat: "Lanches", e: "🍔", name: "Cheeseburger (fast-food)", kcal: 300, p: 15, c: 32, g: 13 },
  { cat: "Lanches", e: "🌭", name: "Cachorro-quente completo", kcal: 450, p: 15, c: 45, g: 23 },
  { cat: "Lanches", e: "🍕", name: "Pizza (1 fatia)", kcal: 285, p: 12, c: 36, g: 10 },
  { cat: "Lanches", e: "🍟", name: "Batata frita (porção média)", kcal: 340, p: 4, c: 44, g: 17 },
  { cat: "Lanches", e: "🌯", name: "Wrap / burrito", kcal: 500, p: 22, c: 55, g: 20 },
  { cat: "Lanches", e: "🥙", name: "Tapioca com queijo", kcal: 300, p: 10, c: 45, g: 9 },
  { cat: "Lanches", e: "🍗", name: "Frango frito (2 pedaços)", kcal: 480, p: 34, c: 18, g: 30 },
  // Pratos e churrasco
  { cat: "Pratos", e: "🍛", name: "Prato feito (arroz, feijão, carne)", kcal: 750, p: 38, c: 90, g: 24 },
  { cat: "Pratos", e: "🍝", name: "Macarrão à bolonhesa", kcal: 600, p: 26, c: 80, g: 18 },
  { cat: "Pratos", e: "🥩", name: "Picanha (200 g)", kcal: 560, p: 44, c: 0, g: 42 },
  { cat: "Pratos", e: "🌭", name: "Linguiça de churrasco (1 gomo)", kcal: 260, p: 12, c: 1, g: 23 },
  { cat: "Pratos", e: "🍢", name: "Espetinho de carne", kcal: 170, p: 18, c: 2, g: 10 },
  { cat: "Pratos", e: "🧀", name: "Queijo coalho (espeto)", kcal: 180, p: 12, c: 1, g: 14 },
  { cat: "Pratos", e: "🍲", name: "Feijoada (prato)", kcal: 650, p: 35, c: 50, g: 33 },
  { cat: "Pratos", e: "🍣", name: "Sushi (10 peças)", kcal: 450, p: 18, c: 70, g: 10 },
  { cat: "Pratos", e: "🥗", name: "Farofa (3 colheres)", kcal: 220, p: 2, c: 22, g: 14 },
  // Petiscos
  { cat: "Petiscos", e: "🥜", name: "Amendoim (punhado 30 g)", kcal: 170, p: 8, c: 5, g: 14 },
  { cat: "Petiscos", e: "🥔", name: "Batata chips (pacote 50 g)", kcal: 270, p: 3, c: 26, g: 17 },
  { cat: "Petiscos", e: "🍤", name: "Isca de peixe/frango (porção)", kcal: 450, p: 30, c: 25, g: 25 },
  { cat: "Petiscos", e: "🧅", name: "Anéis de cebola (porção)", kcal: 400, p: 5, c: 45, g: 22 },
  { cat: "Petiscos", e: "🍿", name: "Pipoca (saco médio)", kcal: 300, p: 5, c: 35, g: 16 },
  // Doces
  { cat: "Doces", e: "🍫", name: "Chocolate (barra 25 g)", kcal: 135, p: 2, c: 15, g: 8 },
  { cat: "Doces", e: "🍫", name: "Brigadeiro (1 un.)", kcal: 90, p: 1, c: 13, g: 4 },
  { cat: "Doces", e: "🍦", name: "Sorvete (1 bola)", kcal: 140, p: 2, c: 18, g: 7 },
  { cat: "Doces", e: "🫐", name: "Açaí (300 ml)", kcal: 400, p: 4, c: 60, g: 15 },
  { cat: "Doces", e: "🍰", name: "Bolo (1 fatia)", kcal: 300, p: 4, c: 45, g: 12 },
  { cat: "Doces", e: "🍩", name: "Sonho / donut", kcal: 280, p: 5, c: 35, g: 14 },
  { cat: "Doces", e: "🍮", name: "Pudim (1 fatia)", kcal: 250, p: 6, c: 38, g: 8 },
  { cat: "Doces", e: "🍪", name: "Biscoito recheado (4 un.)", kcal: 190, p: 2, c: 28, g: 8 },
  { cat: "Doces", e: "🥞", name: "Churros", kcal: 300, p: 4, c: 40, g: 14 },
  // Frutas (unidade ou porção média)
  { cat: "Frutas", e: "🍌", name: "Banana (1 média)", kcal: 90, p: 1, c: 23, g: 0 },
  { cat: "Frutas", e: "🍎", name: "Maçã (1 média)", kcal: 80, p: 0, c: 21, g: 0 },
  { cat: "Frutas", e: "🍊", name: "Laranja (1 média)", kcal: 65, p: 1, c: 16, g: 0 },
  { cat: "Frutas", e: "🍊", name: "Tangerina / mexerica", kcal: 50, p: 1, c: 13, g: 0 },
  { cat: "Frutas", e: "🥭", name: "Manga (1 média)", kcal: 130, p: 1, c: 34, g: 1 },
  { cat: "Frutas", e: "🍍", name: "Abacaxi (2 fatias)", kcal: 70, p: 1, c: 18, g: 0 },
  { cat: "Frutas", e: "🍉", name: "Melancia (1 fatia grande)", kcal: 85, p: 2, c: 21, g: 0 },
  { cat: "Frutas", e: "🍈", name: "Melão (1 fatia)", kcal: 40, p: 1, c: 9, g: 0 },
  { cat: "Frutas", e: "🍐", name: "Pera (1 média)", kcal: 95, p: 1, c: 25, g: 0 },
  { cat: "Frutas", e: "🍇", name: "Uva (1 cacho pequeno)", kcal: 100, p: 1, c: 26, g: 0 },
  { cat: "Frutas", e: "🍓", name: "Morango (10 un.)", kcal: 40, p: 1, c: 9, g: 0 },
  { cat: "Frutas", e: "🥝", name: "Kiwi (1 un.)", kcal: 45, p: 1, c: 11, g: 0 },
  { cat: "Frutas", e: "🥑", name: "Abacate (meio)", kcal: 160, p: 2, c: 9, g: 15 },
  { cat: "Frutas", e: "🧡", name: "Mamão papaia (meio)", kcal: 70, p: 1, c: 17, g: 0 },
  { cat: "Frutas", e: "🍑", name: "Pêssego (1 médio)", kcal: 60, p: 1, c: 15, g: 0 },
  { cat: "Frutas", e: "🫐", name: "Goiaba (1 média)", kcal: 70, p: 1, c: 15, g: 1 },
  { cat: "Frutas", e: "🥥", name: "Coco seco (pedaço 40 g)", kcal: 140, p: 1, c: 6, g: 13 },
  { cat: "Frutas", e: "🍇", name: "Uva-passa (2 colheres)", kcal: 85, p: 1, c: 22, g: 0 },
  { cat: "Frutas", e: "🥗", name: "Salada de frutas (tigela)", kcal: 150, p: 2, c: 37, g: 0 },
  // Bebidas
  { cat: "Bebidas", e: "🥤", name: "Refrigerante (lata)", kcal: 140, p: 0, c: 35, g: 0 },
  { cat: "Bebidas", e: "🥤", name: "Refrigerante (copo 300 ml)", kcal: 125, p: 0, c: 31, g: 0 },
  { cat: "Bebidas", e: "🧃", name: "Suco de caixinha (200 ml)", kcal: 100, p: 0, c: 24, g: 0 },
  { cat: "Bebidas", e: "🍊", name: "Suco natural com açúcar (300 ml)", kcal: 160, p: 1, c: 38, g: 0 },
  { cat: "Bebidas", e: "☕", name: "Café com açúcar", kcal: 40, p: 0, c: 10, g: 0 },
  { cat: "Bebidas", e: "🧋", name: "Cappuccino", kcal: 150, p: 5, c: 20, g: 5 },
  { cat: "Bebidas", e: "🥛", name: "Milkshake (400 ml)", kcal: 520, p: 12, c: 70, g: 20 },
  { cat: "Bebidas", e: "⚡", name: "Energético (lata)", kcal: 110, p: 0, c: 27, g: 0 },
  { cat: "Bebidas", e: "🥥", name: "Água de coco (300 ml)", kcal: 60, p: 1, c: 14, g: 0 },
  { cat: "Bebidas", e: "🍵", name: "Chá gelado (lata)", kcal: 90, p: 0, c: 22, g: 0 },
  // Cervejas e outras
  { cat: "Cervejas", e: "🍺", name: "Cerveja (lata 350 ml)", kcal: 150, p: 1, c: 13, g: 0 },
  { cat: "Cervejas", e: "🍺", name: "Cerveja long neck (355 ml)", kcal: 150, p: 1, c: 13, g: 0 },
  { cat: "Cervejas", e: "🍺", name: "Cerveja garrafa (600 ml)", kcal: 260, p: 2, c: 22, g: 0 },
  { cat: "Cervejas", e: "🍻", name: "Chopp (300 ml)", kcal: 130, p: 1, c: 11, g: 0 },
  { cat: "Cervejas", e: "🍺", name: "Cerveja artesanal IPA (350 ml)", kcal: 210, p: 2, c: 18, g: 0 },
  { cat: "Cervejas", e: "🍺", name: "Cerveja sem álcool (lata)", kcal: 70, p: 1, c: 15, g: 0 },
  { cat: "Cervejas", e: "🍷", name: "Vinho (taça 150 ml)", kcal: 125, p: 0, c: 4, g: 0 },
  { cat: "Cervejas", e: "🍹", name: "Caipirinha", kcal: 240, p: 0, c: 25, g: 0 },
  { cat: "Cervejas", e: "🥃", name: "Destilado (dose 50 ml)", kcal: 115, p: 0, c: 0, g: 0 },
];
const CATS = ["Salgados", "Lanches", "Pratos", "Petiscos", "Doces", "Frutas", "Bebidas", "Cervejas"] as const;
const DRINK_CATS = new Set(["Bebidas", "Cervejas"]);
const nowHM = () => { const d = new Date(Date.now() - 3 * 36e5); return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`; };

function OffPlanForm({ date, onDone }: { date: string; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [kind, setKind] = useState<"comida" | "bebida">("comida");
  const [cat, setCat] = useState<string>("Salgados");
  const [q, setQ] = useState("");
  const shown = PRESETS.filter((x) => (q ? x.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(q.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")) : x.cat === cat));
  const [time, setTime] = useState(nowHM());
  const [f, setF] = useState({ name: "", kcal: "", p: "", c: "", g: "", qty: "1" });
  const mult = n(f.qty) || 1;
  const save = () => start(async () => {
    await saveMealItem({ date, slot: `extra|${kind}|${time}`, name: mult !== 1 ? `${f.name} ×${fmt(mult)}` : f.name, kcal: Math.round(n(f.kcal) * mult),
      protein_g: n(f.p) * mult, carbs_g: n(f.c) * mult, fat_g: n(f.g) * mult });
    onDone();
  });
  return (
    <div className="grid gap-3">
      <input className="field" placeholder="Buscar: coxinha, cerveja, pizza…" value={q} onChange={(e) => setQ(e.target.value)} />
      {!q && <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {CATS.map((c) => <button key={c} className="chip shrink-0 !min-h-9 text-xs" aria-pressed={cat === c} onClick={() => setCat(c)}>{PRESETS.find((x) => x.cat === c)?.e} {c}</button>)}
      </div>}
      <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
        {shown.map((x) => (
          <button key={x.name} className="chip" aria-pressed={f.name === x.name} onClick={() => { setKind(DRINK_CATS.has(x.cat) ? "bebida" : "comida"); setF({ ...f, name: x.name, kcal: String(x.kcal), p: String(x.p), c: String(x.c), g: String(x.g) }); }}>
            {x.e} {x.name}<span className="ml-1 text-faint">{x.kcal}</span></button>))}
        {shown.length === 0 && <p className="text-xs text-muted">Nada encontrado. Digite abaixo e preencha as calorias.</p>}
      </div>
      <p className="text-[11px] text-faint -mt-1">Valores médios aproximados por porção. Ajuste se souber o exato.</p>
      <div className="grid grid-cols-2 gap-2">
        {(["comida", "bebida"] as const).map((k) => <button key={k} className="chip justify-center !min-h-10" aria-pressed={kind === k} onClick={() => setKind(k)}>{k === "comida" ? "🍽️ Comida" : "🥤 Bebida"}</button>)}
      </div>
      <Field label={kind === "bebida" ? "Bebida" : "Comida"}><input className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder={kind === "bebida" ? "Ex.: Refrigerante, suco" : "Ex.: Pizza, doce, salgado"} /></Field>
      <div className="grid grid-cols-4 gap-2">
        <Field label="Kcal"><input className="field num text-center !px-1" inputMode="numeric" value={f.kcal} onChange={(e) => setF({ ...f, kcal: e.target.value })} /></Field>
        <Field label="Prot g"><input className="field num text-center !px-1" inputMode="decimal" value={f.p} onChange={(e) => setF({ ...f, p: e.target.value })} /></Field>
        <Field label="Carb g"><input className="field num text-center !px-1" inputMode="decimal" value={f.c} onChange={(e) => setF({ ...f, c: e.target.value })} /></Field>
        <Field label="Gord g"><input className="field num text-center !px-1" inputMode="decimal" value={f.g} onChange={(e) => setF({ ...f, g: e.target.value })} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Horário"><input type="time" className="field num" value={time} onChange={(e) => setTime(e.target.value)} /></Field>
        <Field label="Quantidade"><input className="field num text-center" inputMode="decimal" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} /></Field>
      </div>
      {mult !== 1 && <p className="text-xs text-muted">Total: {Math.round(n(f.kcal) * mult)} kcal</p>}
      <p className="text-xs text-faint">Entra no total do dia, mas fica separado das refeições do plano. Sem culpa: registrar com honestidade é o que mantém o controle.</p>
      <button className="btn btn-accent" disabled={pending || !f.name.trim()} onClick={save}>{pending ? "Salvando…" : "Registrar"}</button>
    </div>
  );
}

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
  const [sheet, setSheet] = useState<null | { kind: "add"; slot: string } | { kind: "edit"; item: Item } | { kind: "foods" | "slots" | "goals" | "quiz" | "off" }>(null);
  const close = () => setSheet(null);
  const kcal = sum(items, "kcal"), prot = sum(items, "protein_g"), carb = sum(items, "carbs_g"), fat = sum(items, "fat_g");
  const remaining = goals.kcal - kcal;
  const maxW = Math.max(goals.kcal, ...week.map((w) => w.kcal)) * 1.1;
  const isToday = date === today;
  const extraSlots = [...new Set(items.map((i) => i.slot))].filter((k) => !isExtra(k) && !slots.some((s) => s.key === k)).map((k) => ({ key: k, label: k }));
  const off = items.filter((i) => isExtra(i.slot)).sort((a, b) => extraInfo(a.slot).time.localeCompare(extraInfo(b.slot).time));
  const offKcal = sum(off, "kcal");

  return (
    <div style={{ ["--accent" as string]: G }}>
      <nav className="flex items-center justify-between mb-4">
        <Link className="btn" href={`/corpo?aba=alimentacao&d=${addDays(date, -1)}`} aria-label="Dia anterior">‹</Link>
        <p className="font-display text-xl">{isToday ? "Hoje" : `${weekdayShort[dow(date)]}, ${shortDate(date)}`}</p>
        <Link className="btn" href={`/corpo?aba=alimentacao&d=${addDays(date, 1)}`} aria-label="Próximo dia">›</Link>
      </nav>

      <button onClick={() => setSheet({ kind: "quiz" })} className="press w-full rounded-[22px] p-4 mb-4 flex items-center gap-4 text-left border" style={{ borderColor: G + "55", background: `linear-gradient(160deg, ${G}26, #0f0f11 70%)` }}>
        <span className="h-12 w-12 rounded-2xl grid place-items-center glow shrink-0" style={{ background: G, ["--glow" as string]: G } as React.CSSProperties}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.2" strokeLinecap="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg></span>
        <span className="flex-1"><span className="block font-semibold text-[16px]">Registrar refeição</span><span className="text-sm text-muted">{doneSlots.length}/{slots.length} refeições · +10 XP cada</span></span>
      </button>
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
        <p className="text-xs text-muted mt-3">{kcal.toLocaleString("pt-BR")} de {goals.kcal.toLocaleString("pt-BR")} kcal consumidas{offKcal ? ` · ${offKcal.toLocaleString("pt-BR")} fora do plano` : ""}</p>
        <div className="grid grid-cols-4 gap-1 mt-4 pt-4 border-t border-white/[.06]">
          {([["Energia", <EnergyFlame key="f" pct={kcal / goals.kcal} size={40} />, kcal / goals.kcal], ["Proteína", <Drumstick key="s" pct={prot / goals.protein} size={46} />, prot / goals.protein],
            ["Carbo", <Bread key="g" pct={carb / goals.carbs} size={48} />, carb / goals.carbs], ["Gordura", <Avocado key="d" pct={fat / goals.fat} size={38} />, fat / goals.fat]] as const).map(([l, m, v]) => (
            <div key={l} className="flex flex-col items-center justify-end gap-1">
              <div className="h-[56px] flex items-end">{m}</div>
              <p className="num text-sm leading-none">{Math.round(v * 100) || 0}%</p>
              <p className="text-[10px] text-muted">{l}</p>
            </div>))}
        </div>
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

      <section className="rise mt-4 rounded-[22px] p-5 border" style={{ borderColor: "rgba(255,159,10,.3)", background: "linear-gradient(160deg, rgba(255,159,10,.10), #0f0f11 60%)" }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden>🍕</span>
          <div className="flex-1"><p className="font-display text-xl">Fora do plano</p><p className="text-xs text-muted">Lanches, bebidas, férias, imprevistos</p></div>
          {off.length > 0 && <p className="num text-sm" style={{ color: "#ff9f0a" }}>{offKcal} kcal</p>}
        </div>
        {off.length > 0 && (
          <ul className="mt-3">
            {off.map((i) => { const x = extraInfo(i.slot); return (
              <li key={i.id}><button className="row-hover w-full flex items-center gap-3 min-h-11 px-2 text-left" onClick={() => setSheet({ kind: "edit", item: i })}>
                <span className="num text-xs text-muted w-11">{x.time}</span>
                <span aria-hidden>{x.kind === "bebida" ? "🥤" : "🍽️"}</span>
                <span className="flex-1 text-[15px] min-w-0 truncate">{i.name}</span>
                <span className="num text-sm w-14 text-right">{i.kcal}</span>
              </button></li>); })}
          </ul>
        )}
        <button className="btn w-full mt-3" style={{ borderColor: "rgba(255,159,10,.35)" }} onClick={() => setSheet({ kind: "off" })}>+ Registrar comida ou bebida</button>
      </section>

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
      <Sheet accent="#ff9f0a" open={sheet?.kind === "off"} onClose={close} title="Fora do plano">
        {sheet?.kind === "off" && <OffPlanForm date={date} onDone={close} />}
      </Sheet>
      <Sheet accent={G} open={sheet?.kind === "quiz"} onClose={close} title="Refeição">
        {sheet?.kind === "quiz" && <MealQuiz date={date} slots={slots} foods={foods} doneSlots={doneSlots} proteinSoFar={prot} proteinGoal={goals.protein} onClose={close} />}
      </Sheet>
      <Sheet accent={G} open={sheet?.kind === "foods"} onClose={close} title="Alimentos favoritos"><FoodsManager foods={foods} /></Sheet>
      <Sheet accent={G} open={sheet?.kind === "slots"} onClose={close} title="Refeições do dia"><SlotsEditor slots={slots} onDone={close} /></Sheet>
      <Sheet accent={G} open={sheet?.kind === "goals"} onClose={close} title="Metas de alimentação"><GoalsEditor goals={goals} onDone={close} /></Sheet>
    </div>
  );
}
