"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteDream, saveDream, setDreamDone } from "@/app/(app)/sonhos/actions";
import { Field, Sheet } from "@/components/kit";
import { haptic, useXp } from "@/components/game/xp";

export type Dream = { id: string; title: string; why: string | null; category: string; target_date: string | null; image: string | null; position: number; done_at: string | null };
const CAT: Record<string, { label: string; e: string }> = {
  familia: { label: "Família", e: "❤️" }, casa: { label: "Casa", e: "🏡" }, viagem: { label: "Viagem", e: "✈️" }, carreira: { label: "Carreira", e: "🚀" },
  espiritual: { label: "Espiritual", e: "📖" }, saude: { label: "Saúde", e: "💪" }, financas: { label: "Finanças", e: "💰" }, experiencia: { label: "Experiência", e: "✨" },
};
// Fundo quando não há foto: degradês da paleta
const FALLBACK = ["linear-gradient(150deg,#d12b65,#3a0618 70%)", "linear-gradient(150deg,#b51224,#1a0508 70%)", "linear-gradient(150deg,#ff4d8a,#2a0512 70%)", "linear-gradient(150deg,#f5f5f7 -40%,#b51224 60%,#0a0a0a)"];
const daysTo = (iso: string, today: string) => Math.round((Date.parse(iso) - Date.parse(today)) / 864e5);
const br = (iso: string) => iso.split("-").reverse().join("/");

export function DreamBoard({ today, dreams, ready, maria }: { today: string; dreams: Dream[]; ready: boolean; maria: { photo: string | null; phrase: string } }) {
  const [form, setForm] = useState<null | Partial<Dream>>(null);
  const open = dreams.filter((d) => !d.done_at), done = dreams.filter((d) => d.done_at);
  return (
    <div className="dream-board">
      <header className="rise mb-6 flex items-end justify-between gap-3">
        <div><p className="label" style={{ color: "#ff4d8a" }}>Quadro de sonhos</p><h1 className="font-display text-4xl md:text-5xl mt-2 leading-tight">Por quem e para onde.</h1></div>
        <button className="btn btn-accent shrink-0" onClick={() => setForm({ category: "experiencia" })}>+ Sonho</button>
      </header>
      {!ready && <p className="glass p-4 mb-4 text-sm text-[#ff6961]">Rode a migração <b>supabase/migrations/20261120000000_sonhos.sql</b> no Supabase.</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 auto-rows-[160px] sm:auto-rows-[190px]">
        {/* Maria Luisa em destaque */}
        <section className="rise relative col-span-2 row-span-2 rounded-[28px] overflow-hidden border border-white/10" style={{ background: maria.photo ? undefined : FALLBACK[0] }}>
          {maria.photo && <img src={maria.photo} alt="Maria Luisa" className="absolute inset-0 h-full w-full object-cover" />}
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 35%, rgba(10,10,10,.85))" }} />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className="text-[10px] font-bold tracking-[.35em] text-[#ff8fb5]">MEU MAIOR MOTIVO</p>
            <p className="font-display text-3xl mt-1">Maria Luisa</p>
            {maria.phrase && <p className="text-white/85 mt-1 italic">“{maria.phrase}”</p>}
            {!maria.photo && <Link href="/configuracoes#maria-luisa" className="inline-block text-xs underline mt-2">Adicionar a foto dela</Link>}
          </div>
        </section>

        {open.map((d, i) => (
          <button key={d.id} onClick={() => setForm(d)} className={`rise press relative text-left rounded-[24px] overflow-hidden border border-white/10 ${i % 5 === 1 ? "row-span-2" : ""}`}
            style={{ background: d.image ? undefined : FALLBACK[(i + 1) % FALLBACK.length], animationDelay: `${(i + 1) * 60}ms` }}>
            {d.image && <img src={d.image} alt="" className="absolute inset-0 h-full w-full object-cover" />}
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 30%, rgba(10,10,10,.88))" }} />
            <span className="absolute top-3 left-3 text-[10px] font-semibold rounded-full px-2 py-1 bg-black/55 backdrop-blur">{CAT[d.category]?.e} {CAT[d.category]?.label}</span>
            <span className="absolute inset-x-0 bottom-0 p-3.5">
              <span className="block font-semibold leading-snug line-clamp-2">{d.title}</span>
              {d.target_date && <span className="block text-[11px] text-white/75 mt-0.5 num">{daysTo(d.target_date, today) >= 0 ? `em ${daysTo(d.target_date, today)} dias · ${br(d.target_date)}` : `prazo ${br(d.target_date)}`}</span>}
            </span>
          </button>
        ))}

        <button onClick={() => setForm({ category: "experiencia" })} className="rise press rounded-[24px] border border-dashed border-[#d12b6577] grid place-items-center text-center p-4 hover:bg-white/[.03]">
          <span><span className="block text-3xl text-[#ff4d8a]">+</span><span className="block text-sm mt-1">Novo sonho</span><span className="block text-[11px] text-muted">com foto, prazo e porquê</span></span>
        </button>
      </div>

      {done.length > 0 && (
        <section className="mt-8">
          <p className="label mb-3" style={{ color: "#30d158" }}>Realizados · {done.length}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {done.map((d) => (
              <button key={d.id} onClick={() => setForm(d)} className="press relative h-32 rounded-2xl overflow-hidden border border-[#30d15866] text-left">
                {d.image && <img src={d.image} alt="" className="absolute inset-0 h-full w-full object-cover grayscale-[.3]" />}
                <div className="absolute inset-0 bg-black/55" />
                <span className="absolute top-2 right-2 text-[10px] font-bold rounded-full px-2 py-1 bg-[#30d158] text-black">✓ REALIZADO</span>
                <span className="absolute inset-x-0 bottom-0 p-3 text-sm font-semibold line-clamp-2">{d.title}</span>
              </button>))}
          </div>
        </section>
      )}

      <Sheet open={!!form} onClose={() => setForm(null)} title={form?.id ? "Sonho" : "Novo sonho"} accent="#d12b65">
        {form && <DreamForm key={form.id ?? "novo"} d={form} onDone={() => setForm(null)} />}
      </Sheet>
    </div>
  );
}

function DreamForm({ d, onDone }: { d: Partial<Dream>; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [cat, setCat] = useState(d.category ?? "experiencia");
  const [preview, setPreview] = useState<string | null>(d.image ?? null);
  const { celebrate } = useXp();
  return (
    <form className="grid gap-3" action={(fd) => start(async () => { fd.set("category", cat); if (d.id) fd.set("id", d.id); const e = await saveDream(fd); if (e) setErr(e); else { haptic(15); onDone(); } })}>
      <label className="relative block h-40 rounded-2xl overflow-hidden border border-dashed border-white/20 cursor-pointer" style={{ background: preview ? undefined : FALLBACK[0] }}>
        {preview && <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <span className="absolute inset-0 grid place-items-center bg-black/30 text-sm font-semibold">{preview ? "Trocar foto" : "📷 Escolher foto do sonho"}</span>
        <input type="file" name="image" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) setPreview(URL.createObjectURL(f)); }} />
      </label>
      <Field label="Sonho"><input name="title" className="field" defaultValue={d.title ?? ""} placeholder="Ex.: Viajar com a Maria para a praia" required /></Field>
      <div className="flex flex-wrap gap-1.5">{Object.entries(CAT).map(([k, c]) => <button key={k} type="button" className="chip !min-h-9 text-xs" aria-pressed={cat === k} onClick={() => setCat(k)}>{c.e} {c.label}</button>)}</div>
      <Field label="Por que isso importa"><textarea name="why" className="field !min-h-[70px]" defaultValue={d.why ?? ""} placeholder="O que muda quando acontecer?" /></Field>
      <Field label="Até quando (opcional)"><input type="date" name="target_date" className="field" defaultValue={d.target_date ?? ""} /></Field>
      {err && <p role="alert" className="text-sm text-[#ff6961]">{err}</p>}
      <div className="flex gap-2 flex-wrap">
        {d.id && <button type="button" className="btn text-muted" disabled={pending} onClick={() => { if (confirm("Excluir este sonho?")) start(async () => { const e = await deleteDream(d.id!); if (e) setErr(e); else onDone(); }); }}>Excluir</button>}
        {d.id && <button type="button" className="btn" disabled={pending} onClick={() => start(async () => { const e = await setDreamDone(d.id!, !d.done_at); if (e) setErr(e); else { if (!d.done_at) celebrate("Sonho realizado", d.title ?? ""); onDone(); } })}>{d.done_at ? "Voltar para o quadro" : "✓ Realizei"}</button>}
        <button className="btn btn-accent flex-1" disabled={pending}>{pending ? "Salvando…" : "Salvar"}</button>
      </div>
    </form>
  );
}
