"use client";
import { useMemo, useState } from "react";
import { logFieldDay } from "@/app/(app)/pioneiro/actions";
import { Choices, QuickPick, Quiz, Stepper } from "./quiz";
import { toHMM } from "@/lib/date";

const C = "#0a84ff";
export const FIELD_ICON = "M21 11.5a8.4 8.4 0 0 1-12.2 7.5L3 20.5l1.6-5.2A8.4 8.4 0 1 1 21 11.5z";
const CATS = [
  { value: "campo", label: "Campo", sub: "de casa em casa", color: "#0a84ff", icon: FIELD_ICON },
  { value: "publico", label: "Testemunho público", sub: "carrinho e locais públicos", color: "#ffb340", icon: "M4 21V8l8-5 8 5v13M9 21v-6h6v6" },
  { value: "assembleia", label: "Assembleia", sub: "dias de assembleia", color: "#bf5af2", icon: "M3 21h18M5 21V9l7-5 7 5v12M9 13h6" },
  { value: "obra", label: "Obra", sub: "construção e manutenção", color: "#30d158", icon: "M2 20h20M4 20V10l8-6 8 6v10M10 20v-5h4v5" },
] as const;
type Cat = (typeof CATS)[number]["value"];
type NewContact = { name: string; address: string; notes: string; next_visit: string | null };
const pad = (n: number) => String(n).padStart(2, "0");
const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

export function FieldQuiz({ today, contacts, onClose }: { today: string; contacts: { id: string; name: string; address: string | null }[]; onClose: () => void }) {
  const now = new Date();
  const nowStr = `${pad(now.getHours())}:${pad(Math.floor(now.getMinutes() / 15) * 15)}`;
  const startDefault = `${pad(Math.max(0, now.getHours() - 2))}:${pad(Math.floor(now.getMinutes() / 15) * 15)}`;
  const [cat, setCat] = useState<Cat | null>(null);
  const [mode, setMode] = useState<"horario" | "duracao">("horario");
  const [start, setStart] = useState(startDefault);
  const [end, setEnd] = useState(nowStr);
  const [dur, setDur] = useState(120);
  const [rv, setRv] = useState(0);
  const [visited, setVisited] = useState<string[]>([]);
  const [newC, setNewC] = useState<NewContact[]>([]);
  const [draft, setDraft] = useState<NewContact>({ name: "", address: "", notes: "", next_visit: null });
  const [notes, setNotes] = useState("");

  const minutes = useMemo(() => {
    if (cat === "obra" && mode === "duracao") return dur;
    if (mode === "duracao") return dur;
    const d = toMin(end) - toMin(start); return d > 0 ? d : d + 24 * 60;
  }, [mode, start, end, dur, cat]);
  const xp = Math.round(minutes / 2);
  const addDraft = () => { if (!draft.name.trim()) return; setNewC([...newC, draft]); setDraft({ name: "", address: "", notes: "", next_visit: null }); };
  const toggleVisited = (id: string) => setVisited((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));

  const report = [
    `${CATS.find((c) => c.value === cat)?.label ?? "Serviço"} · ${toHMM(minutes)}${mode === "horario" ? ` (${start}–${end})` : ""}`,
    `${rv} ${rv === 1 ? "revisita feita" : "revisitas feitas"}`,
    newC.length ? `${newC.length} ${newC.length === 1 ? "novo contato" : "novos contatos"} para revisitar` : "Nenhum contato novo",
  ];

  return (
    <Quiz color={C} xp={xp} onClose={onClose} rewardTitle="Serviço registrado" rewardLines={report}
      onFinish={() => logFieldDay({ date: today, category: cat ?? "campo", start: mode === "horario" ? start : null, end: mode === "horario" ? end : null,
        minutes, return_visits: rv, notes, contacts: draft.name.trim() ? [...newC, draft] : newC, visited_ids: visited })}
      steps={[
        { title: "Como foi o serviço hoje?", content: <Choices value={cat} onChange={(v) => { setCat(v); if (v === "obra") { setMode("duracao"); setDur(480); } }} options={[...CATS]} />, canNext: !!cat },
        { title: "De que horas até que horas?", hint: "O app calcula a duração. Cada hora vale 30 XP de Serviço.", canNext: minutes > 0 && minutes <= 16 * 60, content: (
          <div className="grid gap-4">
            <div className="inline-flex p-1 rounded-2xl bg-white/[.04] border border-white/[.06] gap-1">
              {(["horario", "duracao"] as const).map((m) => <button key={m} onClick={() => setMode(m)} className={`min-h-10 px-4 rounded-xl text-sm ${mode === m ? "bg-white/[.1] text-ink" : "text-muted"}`}>{m === "horario" ? "Horário" : "Só a duração"}</button>)}
            </div>
            {mode === "horario" ? (
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1.5"><span className="label">Início</span><input type="time" className="field num text-xl !min-h-14 text-center" value={start} onChange={(e) => setStart(e.target.value)} /></label>
                <label className="grid gap-1.5"><span className="label">Fim</span><input type="time" className="field num text-xl !min-h-14 text-center" value={end} onChange={(e) => setEnd(e.target.value)} /></label>
              </div>
            ) : <QuickPick values={[30, 60, 90, 120, 180, 240, 480]} value={dur} onChange={setDur} format={toHMM} color={C} />}
            <p className="text-center"><span className="num text-5xl text-glow" style={{ color: C, ["--glow" as string]: C } as React.CSSProperties}>{toHMM(minutes)}</span><span className="text-muted ml-2">horas</span></p>
          </div>) },
        { title: "Fez revisitas?", hint: contacts.length ? "Toque nos contatos que você visitou hoje." : undefined, content: (
          <div className="grid gap-5">
            <Stepper value={rv} onChange={setRv} max={50} color={C} />
            {contacts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {contacts.map((c) => <button key={c.id} className="chip !min-h-11" aria-pressed={visited.includes(c.id)} onClick={() => { toggleVisited(c.id); if (!visited.includes(c.id)) setRv((r) => Math.max(r, visited.length + 1)); }}>{c.name}</button>)}
              </div>
            )}
          </div>) },
        { title: "Novos contatos para revisitar?", hint: "Anote para não esquecer. Você vê todos na aba Pioneiro.", skippable: true, content: (
          <div className="grid gap-3">
            {newC.map((c, k) => (
              <div key={k} className="flex items-center gap-3 rounded-xl bg-white/[.04] p-3">
                <span className="h-8 w-8 rounded-full grid place-items-center text-sm font-semibold text-black" style={{ background: C }}>{c.name[0]?.toUpperCase()}</span>
                <span className="flex-1 min-w-0"><span className="block truncate">{c.name}</span><span className="text-xs text-muted truncate block">{c.address || "sem endereço"}</span></span>
                <button className="text-muted min-h-9 px-2" onClick={() => setNewC(newC.filter((_, j) => j !== k))} aria-label="Remover">✕</button>
              </div>
            ))}
            <input className="field" placeholder="Nome" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <input className="field" placeholder="Endereço ou referência" value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
            <input className="field" placeholder="Assunto da conversa / observação" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
            <label className="grid gap-1.5"><span className="label">Voltar em</span><input type="date" className="field" value={draft.next_visit ?? ""} onChange={(e) => setDraft({ ...draft, next_visit: e.target.value || null })} /></label>
            <button className="btn" disabled={!draft.name.trim()} onClick={addDraft}>+ Adicionar outro</button>
          </div>) },
        { title: "Relatório do dia", hint: "Confira e conclua.", content: (
          <div className="grid gap-3">
            <div className="rounded-2xl p-4 border" style={{ borderColor: C + "55", background: `linear-gradient(160deg, ${C}22, #141416)` }}>
              {report.map((l) => <p key={l} className="text-[15px] py-1">{l}</p>)}
            </div>
            <textarea className="field" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anotações do dia (opcional): uma experiência, um texto usado…" />
          </div>) },
      ]} />
  );
}
