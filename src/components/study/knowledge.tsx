"use client";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { deleteNote, gradeReview, saveNote } from "@/app/(app)/estudos/ia-actions";
import { MASTERY, type Mastery } from "@/lib/learning";
import { HI, Ico } from "@/components/hunt-icons";
import { Sheet } from "@/components/kit";
import { useXp } from "@/components/game/xp";
import { Md } from "./md";

type Note = { id: string; created_at: string; kind: string; title: string; body: string; track_id: string | null; session_id: string | null; project_id: string | null; in_review: boolean; review_at: string | null; interval_days: number; hits: number; misses: number; mastery: string; last_reviewed: string | null };
type Ev = { id: string; date: string; kind: string; topic: string; level: number; score: number | null; justification: string | null };
const KINDS: Record<string, string> = { conceito: "Conceito", definicao: "Definição", exemplo: "Exemplo", insight: "Insight", resumo: "Resumo", referencia: "Referência", pergunta: "Pergunta", erro: "Erro a corrigir" };
const EV: Record<string, string> = { avaliacao: "Avaliação", explicacao: "Explicação", desafio: "Desafio", revisao: "Revisão", projeto: "Projeto" };

export function Knowledge({ today, ready, notes, tracks, evidence }: { today: string; ready: boolean; notes: Note[]; tracks: { id: string; title: string }[]; evidence: Ev[] }) {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("todos");
  const [edit, setEdit] = useState<Note | "new" | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const due = useMemo(() => notes.filter((n) => n.in_review && n.review_at && n.review_at <= today), [notes, today]);
  const list = notes.filter((n) => (kind === "todos" || n.kind === kind) && (!q || `${n.title} ${n.body}`.toLowerCase().includes(q.toLowerCase())));
  const byMastery = (Object.keys(MASTERY) as Mastery[]).map((m) => [m, notes.filter((n) => n.mastery === m).length] as const);
  const trackName = (id: string | null) => tracks.find((t) => t.id === id)?.title;

  if (!ready) return <p className="hunt-card p-5 text-sm">Rode a migração <code className="text-[#ffb21e]">20261121000000_estudar_ia.sql</code> no Supabase para ativar a Base de Conhecimento.</p>;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
      <div className="min-w-0">
        {/* Revisão do dia */}
        <section className="hunt-card relative p-5">
          <span aria-hidden className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#ff2800]" style={{ boxShadow: "0 0 18px #ff2800" }} />
          <p className="label flex items-center gap-1.5"><Ico d={HI.clock} size={13} />Revisão espaçada</p>
          <p className="num text-6xl leading-none mt-2">{due.length}<span className="text-xl text-white/40"> {due.length === 1 ? "pendente" : "pendentes"}</span></p>
          <p className="text-[12.5px] text-white/55 mt-2">Recuperação ativa: você responde antes de ver a resposta. Errou, volta amanhã; acertou, o intervalo cresce.</p>
          <button className="btn btn-accent mt-4 w-full sm:w-auto" disabled={!due.length} onClick={() => setReviewing(true)}>{due.length ? "Começar revisão →" : "Tudo revisado hoje"}</button>
        </section>

        {/* Lista */}
        <div className="flex flex-wrap items-center gap-2 mt-6 mb-3">
          <p className="label flex items-center gap-1.5 mr-auto"><Ico d={HI.book} size={13} />Base de conhecimento · {notes.length}</p>
          <button className="btn !min-h-10 inline-flex items-center gap-1.5" onClick={() => setEdit("new")}><Ico d={HI.plus} size={14} />Anotação</button>
        </div>
        <div className="grid sm:grid-cols-[1fr_auto] gap-2 mb-3">
          <input className="field" placeholder="Buscar em títulos e conteúdos" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar" />
          <select className="field" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Tipo"><option value="todos">Todos os tipos</option>{Object.entries(KINDS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        </div>
        {list.length === 0 ? <p className="text-sm text-white/45 border border-dashed border-white/10 p-5">{notes.length ? "Nada encontrado." : "Vazio por enquanto. Salve anotações sugeridas pelo tutor ou crie a sua."}</p> : (
          <ul className="divide-y divide-white/[.06] border border-white/[.06] rounded-[8px] overflow-hidden">
            {list.map((n) => (
              <li key={n.id}>
                <button className="w-full text-left bg-[#080808] hover:bg-[#0e0e0e] px-4 py-3" onClick={() => setEdit(n)}>
                  <span className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider">
                    <span className="text-[#ffb21e]">{KINDS[n.kind] ?? n.kind}</span>
                    <span style={{ color: MASTERY[n.mastery as Mastery]?.color }}>· {MASTERY[n.mastery as Mastery]?.label}</span>
                    {n.in_review && n.review_at && <span className="text-white/35 ml-auto">{n.review_at <= today ? "revisar hoje" : `revisão ${n.review_at.split("-").reverse().slice(0, 2).join("/")}`}</span>}
                  </span>
                  <span className="block font-medium mt-1">{n.title}</span>
                  {n.body && <span className="block text-[13px] text-white/50 mt-0.5 line-clamp-2">{n.body}</span>}
                  {(trackName(n.track_id) || n.session_id) && <span className="block text-[11px] text-white/35 mt-1">{trackName(n.track_id) ? `Trilha: ${trackName(n.track_id)}` : ""}{n.session_id ? " · da sessão com IA" : ""}</span>}
                </button>
              </li>))}
          </ul>)}
      </div>

      <aside className="grid gap-5 lg:sticky lg:top-4">
        <section className="hunt-card p-4">
          <p className="label !text-[9px] mb-3">Domínio por anotação</p>
          <ul className="grid gap-2">
            {byMastery.map(([m, c]) => (
              <li key={m} className="flex items-center gap-2 text-[13px]"><i className="h-2 w-2" style={{ background: MASTERY[m].color }} /><span className="flex-1">{MASTERY[m].label}</span><span className="num text-lg">{c}</span></li>))}
          </ul>
        </section>
        <section className="hunt-card p-4">
          <p className="label !text-[9px] mb-3">Evidências recentes</p>
          {evidence.length === 0 ? <p className="text-[12.5px] text-white/45">Avalie uma sessão, faça revisões ou conclua um projeto para registrar evidências.</p> : (
            <ul className="grid gap-3">{evidence.slice(0, 8).map((e) => (
              <li key={e.id}>
                <p className="text-[10px] font-mono text-white/40 uppercase">{EV[e.kind] ?? e.kind} · {e.date.split("-").reverse().slice(0, 2).join("/")} · nível {e.level}/5</p>
                <p className="text-[13px] font-medium truncate">{e.topic}</p>
                {e.justification && <details><summary className="text-[11px] text-white/45 cursor-pointer">por quê</summary><p className="text-[12px] text-white/60 whitespace-pre-line mt-1">{e.justification}</p></details>}
              </li>))}</ul>)}
          <Link href="/estudos/ia" className="btn w-full mt-4">Estudar com IA</Link>
        </section>
      </aside>

      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit === "new" ? "Nova anotação" : "Anotação"}>
        {edit && <NoteForm note={edit === "new" ? null : edit} tracks={tracks} onDone={() => setEdit(null)} />}
      </Sheet>
      <Sheet open={reviewing} onClose={() => setReviewing(false)} title={`Revisão · ${due.length}`}>
        {reviewing && <Review queue={due} onDone={() => setReviewing(false)} />}
      </Sheet>
    </div>
  );
}

function NoteForm({ note, tracks, onDone }: { note: Note | null; tracks: { id: string; title: string }[]; onDone: () => void }) {
  const [f, setF] = useState({ kind: note?.kind ?? "conceito", title: note?.title ?? "", body: note?.body ?? "", track_id: note?.track_id ?? "", in_review: note?.in_review ?? true });
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-2">
        <select className="field" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} aria-label="Tipo">{Object.entries(KINDS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <select className="field" value={f.track_id} onChange={(e) => setF({ ...f, track_id: e.target.value })} aria-label="Trilha"><option value="">Sem trilha</option>{tracks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select>
      </div>
      <input className="field font-semibold" placeholder="Título ou pergunta (ex.: O que é uma closure?)" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <textarea className="field !min-h-40 py-2.5 leading-relaxed" placeholder="Resposta, definição ou explicação com suas palavras" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
      <label className="flex items-center gap-2 text-sm min-h-11"><input type="checkbox" className="h-5 w-5" checked={f.in_review} onChange={(e) => setF({ ...f, in_review: e.target.checked })} />Incluir na revisão espaçada</label>
      {note && note.body && <details><summary className="text-[12px] text-white/50 cursor-pointer">Pré-visualizar</summary><div className="mt-2"><Md text={note.body} /></div></details>}
      {error && <p className="text-[12.5px] text-[#ff453a]" role="alert">{error}</p>}
      <div className="flex gap-2">
        {note && <button className="btn text-white/60" disabled={pending} onClick={() => { if (confirm("Apagar anotação?")) start(async () => { const e = await deleteNote(note.id); if (e) setError(e); else onDone(); }); }}>Apagar</button>}
        <button className="btn btn-accent flex-1" disabled={pending || !f.title.trim()} onClick={() => start(async () => { const e = await saveNote({ kind: f.kind as never, title: f.title, body: f.body, track_id: f.track_id || null, in_review: f.in_review, session_id: note?.session_id ?? null, project_id: note?.project_id ?? null }, note?.id); if (e) setError(e); else onDone(); })}>Salvar</button>
      </div>
    </div>
  );
}

function Review({ queue, onDone }: { queue: Note[]; onDone: () => void }) {
  const { gain } = useXp();
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState("");
  const [res, setRes] = useState<{ quality: number; feedback?: string; next?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [pending, start] = useTransition();
  const n = queue[i];
  if (!n) return <div className="text-center py-6"><p className="font-display text-3xl">Revisão feita<span className="text-[#ffb21e]">.</span></p><p className="text-sm text-white/55 mt-2">As próximas datas já foram calculadas.</p><button className="btn btn-accent mt-5" onClick={onDone}>Fechar</button></div>;
  const next = () => { setI(i + 1); setAnswer(""); setRes(null); setRevealed(false); setError(null); };
  const grade = (self?: number) => start(async () => {
    setError(null);
    let r: Awaited<ReturnType<typeof gradeReview>>;
    try { r = await gradeReview(n.id, answer, self); } catch { r = { error: "Sem conexão com o servidor. Use a autoavaliação." }; }
    if (r.error) { setError(r.error); setRevealed(true); return; }
    setRes({ quality: r.quality!, feedback: r.feedback, next: r.next }); setRevealed(true);
    if (r.quality! >= 3) gain(5, "Revisão acertada", "#ffb21e");
  });
  return (
    <div className="grid gap-3">
      <p className="text-[11px] font-mono text-white/40">{i + 1} de {queue.length} · {KINDS[n.kind] ?? n.kind}</p>
      <p className="font-semibold text-[18px] leading-snug">{n.title}</p>
      <textarea className="field !min-h-32 py-2.5 leading-relaxed" placeholder="Responda com suas palavras antes de ver a resposta." value={answer} disabled={!!res} onChange={(e) => setAnswer(e.target.value)} autoFocus />
      {!res && <button className="btn btn-accent" disabled={pending || answer.trim().length < 2} onClick={() => grade()}>{pending ? "Corrigindo…" : "Conferir com a IA"}</button>}
      {error && <p className="text-[12.5px] text-[#ff453a]" role="alert">{error}</p>}
      {revealed && (
        <div className="border border-white/10 p-3">
          <p className="label !text-[9px] mb-1">Referência</p>
          <Md text={n.body || "(sem conteúdo)"} />
        </div>)}
      {error && !res && answer.trim().length >= 2 && (
        <div>
          <p className="text-[12px] text-white/55 mb-2">Autoavaliação: como foi sua resposta?</p>
          <div className="grid grid-cols-4 gap-1.5">{[[1, "Errei"], [3, "Com esforço"], [4, "Acertei"], [5, "Fácil"]].map(([q, l]) => <button key={q} className="btn !min-h-10 text-[12px]" disabled={pending} onClick={() => grade(Number(q))}>{l}</button>)}</div>
        </div>)}
      {res && (
        <div className={`border p-3 ${res.quality >= 3 ? "border-[#30d15855]" : "border-[#ff453a55]"}`}>
          <p className="font-semibold" style={{ color: res.quality >= 3 ? "#30d158" : "#ff453a" }}>{res.quality >= 3 ? "Acertou" : "Precisa revisar"} · {res.quality}/5</p>
          {res.feedback && <p className="text-[13.5px] text-white/75 mt-1">{res.feedback}</p>}
          {res.next && <p className="text-[11px] font-mono text-white/45 mt-2">Próxima revisão: {res.next.split("-").reverse().join("/")}</p>}
          <button className="btn btn-accent w-full mt-3" onClick={next}>Próxima →</button>
        </div>)}
    </div>
  );
}
