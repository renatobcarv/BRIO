"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { assessSession, endSession, reopenSession, saveNote, suggestNotes, updateSession, type Assessment, type NoteSuggestion } from "@/app/(app)/estudos/ia-actions";
import { MODES, type Mode } from "@/lib/ai/pedagogy";
import { MASTERY, masteryFromLevel } from "@/lib/learning";
import { HI, Ico } from "@/components/hunt-icons";
import { Sheet } from "@/components/kit";
import { useXp } from "@/components/game/xp";
import { Md } from "./md";

type Msg = { id?: string; role: "user" | "assistant"; content: string };
type Session = { id: string; title: string; subject: string | null; goal: string | null; level: string | null; outcome: string | null; mode: Mode; provider: "claude" | "gemini"; stage: string | null; summary: string | null; status: string };
type P = { id: string; label: string; ready: boolean; model: string };
const PENDING_KEY = "brio-ia-first";
const KIND_LABEL: Record<string, string> = { conceito: "Conceito", definicao: "Definição", exemplo: "Exemplo", insight: "Insight", resumo: "Resumo", referencia: "Referência", pergunta: "Pergunta", erro: "Erro a corrigir" };

export function Workspace({ session, initial, notes, evidence, providers, links }: {
  session: Session; initial: Msg[]; notes: { id: string; kind: string; title: string }[];
  evidence: { id: string; date: string; level: number; score: number | null; justification: string | null; topic: string }[];
  providers: P[]; links: { track: string | null; item: string | null; project: string | null };
}) {
  const router = useRouter();
  const { gain } = useXp();
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<Mode>(session.mode);
  const [provider, setProvider] = useState(session.provider);
  const [error, setError] = useState<string | null>(null);
  const [panel, setPanel] = useState(false);
  const [sugg, setSugg] = useState<(NoteSuggestion & { state: "nova" | "salva" | "descartada" })[] | null>(null);
  const [assess, setAssess] = useState<Assessment | null>(null);
  const [pending, start] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const closed = session.status !== "ativa";

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs.length, busy]);

  async function send(content: string) {
    const m = content.trim();
    if (!m || busy) return;
    setError(null); setBusy(true); setText("");
    setMsgs((x) => [...x, { role: "user", content: m }, { role: "assistant", content: "" }]);
    try {
      const r = await fetch("/api/estudar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ session_id: session.id, message: m, mode, provider }) });
      if (!r.ok || !r.body) {
        const j = await r.json().catch(() => ({ error: "Falha ao falar com a IA." }));
        setMsgs((x) => x.slice(0, -1)); setError(j.error ?? "Falha ao falar com a IA."); return;
      }
      const used = r.headers.get("x-provider"); if (used === "claude" || used === "gemini") setProvider(used);
      const reader = r.body.getReader(), dec = new TextDecoder();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, { stream: true });
        setMsgs((x) => { const c = [...x]; c[c.length - 1] = { role: "assistant", content: c[c.length - 1].content + chunk }; return c; });
      }
    } catch { setError("Conexão interrompida. Sua mensagem foi salva; tente reenviar."); }
    finally { setBusy(false); taRef.current?.focus({ preventScroll: true }); }
  }

  // Primeira mensagem vinda da tela de criação.
  useEffect(() => {
    let first: string | null = null;
    try { first = sessionStorage.getItem(PENDING_KEY + session.id); if (first) sessionStorage.removeItem(PENDING_KEY + session.id); } catch { /* ignora */ }
    if (first && initial.length === 0) send(first);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeMode = (m: Mode) => { setMode(m); start(async () => { await updateSession(session.id, { mode: m }); }); };
  const changeProvider = (p: "claude" | "gemini") => { setProvider(p); start(async () => { await updateSession(session.id, { provider: p }); }); };
  const last = evidence[0];

  const panelBody = (
    <div className="grid gap-5">
      <div>
        <p className="label !text-[9px]">Assunto</p>
        <p className="font-semibold mt-1">{session.subject || session.title}</p>
        {session.goal && <p className="text-[13px] text-white/60 mt-1"><span className="text-[#ffb21e]">Objetivo:</span> {session.goal}</p>}
        {session.level && <p className="text-[13px] text-white/60 mt-0.5"><span className="text-[#ffb21e]">Nível:</span> {session.level}</p>}
        {(links.track || links.project) && <p className="text-[12px] text-white/45 mt-1.5">{links.track && <>Trilha: {links.track}{links.item ? ` · ${links.item}` : ""}</>}{links.project && <> Projeto: {links.project}</>}</p>}
        {session.stage && <p className="text-[12px] font-mono text-white/55 mt-1.5">Etapa: {session.stage}</p>}
      </div>

      <div>
        <p className="label !text-[9px] mb-2">Modo de aprendizagem</p>
        <div className="grid grid-cols-2 gap-px bg-white/[.06] border border-white/[.06]">
          {(Object.keys(MODES) as Mode[]).map((m) => (
            <button key={m} aria-pressed={mode === m} onClick={() => changeMode(m)} disabled={busy}
              className={`text-left px-2.5 py-2 text-[12px] ${mode === m ? "bg-[#140303] text-white" : "bg-[#080808] text-white/60 hover:text-white"}`}>
              {mode === m && <span className="text-[#ff2800] mr-1">▪</span>}{MODES[m].label}</button>))}
        </div>
        <p className="text-[11px] text-white/45 mt-1.5">{MODES[mode].short}. Vale a partir da próxima mensagem.</p>
      </div>

      <div>
        <p className="label !text-[9px] mb-2">IA</p>
        <div className="flex gap-px bg-white/[.06] border border-white/[.06]">
          {providers.map((p) => <button key={p.id} disabled={!p.ready || busy} aria-pressed={provider === p.id} onClick={() => changeProvider(p.id as "claude" | "gemini")} title={p.model}
            className={`flex-1 min-h-10 text-[11px] uppercase tracking-[.12em] ${provider === p.id ? "bg-[#140303] text-white" : "bg-[#080808] text-white/50"} disabled:opacity-35`}>{p.label}</button>)}
        </div>
      </div>

      <div>
        <p className="label !text-[9px] mb-2">Domínio</p>
        {last ? (
          <div className="border border-white/[.06] p-3">
            <p className="text-[13px] font-semibold" style={{ color: MASTERY[masteryFromLevel(last.level)].color }}>{MASTERY[masteryFromLevel(last.level)].label} · nível {last.level}/5</p>
            <div className="flex gap-[3px] mt-2" aria-hidden>{[1, 2, 3, 4, 5].map((i) => <i key={i} className="h-[5px] flex-1" style={{ background: i <= last.level ? "#ff2800" : "rgba(255,255,255,.08)" }} />)}</div>
            {last.justification && <p className="text-[11.5px] text-white/55 mt-2 whitespace-pre-line line-clamp-6">{last.justification}</p>}
          </div>) : <p className="text-[12px] text-white/45">Sem avaliação ainda. Domínio só conta com evidência.</p>}
        <button className="btn w-full mt-2 inline-flex items-center justify-center gap-2" disabled={pending || busy || msgs.length < 4}
          onClick={() => start(async () => { setError(null); const r = await assessSession(session.id); if (r.error) setError(r.error); else if (r.result) { setAssess(r.result); gain(Math.max(5, r.result.level * 6), "Domínio avaliado", "#ffb21e"); router.refresh(); } })}>
          <Ico d={HI.target} size={14} />Avaliar meu domínio</button>
      </div>

      <div>
        <p className="label !text-[9px] mb-2">Anotações desta sessão · {notes.length}</p>
        {notes.length > 0 && <ul className="grid gap-1 mb-2">{notes.slice(0, 6).map((n) => <li key={n.id} className="text-[12.5px] text-white/70 truncate"><span className="text-[#ffb21e] font-mono text-[10px] mr-1.5">{KIND_LABEL[n.kind] ?? n.kind}</span>{n.title}</li>)}</ul>}
        <button className="btn w-full inline-flex items-center justify-center gap-2" disabled={pending || busy || msgs.length < 2}
          onClick={() => start(async () => { setError(null); const r = await suggestNotes(session.id); if (r.error) setError(r.error); else setSugg((r.notes ?? []).map((n) => ({ ...n, state: "nova" }))); })}>
          <Ico d={HI.pen} size={14} />Sugerir anotações</button>
      </div>

      <div className="border-t border-white/[.06] pt-4">
        {closed ? <button className="btn w-full" disabled={pending} onClick={() => start(async () => { await reopenSession(session.id); router.refresh(); })}>Reabrir sessão</button>
          : <button className="btn w-full" disabled={pending || busy} onClick={() => start(async () => { const r = await endSession(session.id); if (r.error) setError(r.error); else router.refresh(); })}>Encerrar com resumo</button>}
        {session.summary && <details className="mt-3"><summary className="text-[12px] text-white/55 cursor-pointer">Resumo da sessão</summary><div className="mt-2 text-[13px]"><Md text={session.summary} /></div></details>}
      </div>
    </div>
  );

  return (
    <div className="study-ws grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] items-start">
      <div className="min-w-0 flex flex-col min-h-[calc(100dvh-140px)]">
        <header className="flex items-center gap-3 pb-3 border-b border-white/[.06]">
          <Link href="/estudos/ia" className="text-white/50 hover:text-white min-h-11 min-w-8 grid place-items-center" aria-label="Voltar às sessões">‹</Link>
          <div className="min-w-0 flex-1">
            <p className="label !text-[9px] flex items-center gap-1.5"><Ico d={HI.bolt} size={11} />{MODES[mode].label} · {providers.find((p) => p.id === provider)?.label}{closed ? " · encerrada" : ""}</p>
            <h1 className="font-semibold text-[17px] truncate mt-0.5">{session.title}</h1>
          </div>
          <div className="lg:hidden"><button className="btn !min-h-10 inline-flex items-center gap-1.5" onClick={() => setPanel(true)}><Ico d={HI.list} size={14} />Painel</button></div>
        </header>

        <div className="flex-1 py-5 grid gap-6 content-start" aria-live="polite">
          {msgs.length === 0 && !busy && (
            <div className="text-white/55 text-[14px] max-w-prose">
              <p>Escreva o que quer aprender ou o que já sabe. O tutor vai identificar seu nível e montar o caminho.</p>
              <div className="flex flex-wrap gap-2 mt-4">{["Explique do zero, com um exemplo", "Me teste antes de explicar", "Quero um exercício prático"].map((q) => <button key={q} className="chip" onClick={() => send(q)}>{q}</button>)}</div>
            </div>)}
          {msgs.map((m, i) => m.role === "user" ? (
            <div key={i} className="justify-self-end max-w-[85%] bg-[#140303] border border-[#3a0000] px-4 py-2.5 text-[15px] whitespace-pre-wrap break-words">{m.content}</div>
          ) : (
            <div key={i} className="max-w-[72ch] min-w-0">
              <p className="label !text-[9px] mb-1.5 flex items-center gap-1.5"><span className="h-1.5 w-1.5 bg-[#ff2800]" />Tutor</p>
              {m.content ? <Md text={m.content} /> : <span className="inline-flex gap-1.5 py-2" aria-label="Pensando">{[0, 1, 2].map((k) => <i key={k} className="h-1.5 w-1.5 bg-white/50 typing-dot" style={{ animationDelay: `${k * .18}s` }} />)}</span>}
            </div>))}
          {error && <p className="text-[13px] text-[#ff453a] border border-[#ff453a44] px-3 py-2" role="alert">{error}</p>}
          {assess && (
            <div className="border border-[#ffb21e55] bg-[#ffb21e0d] p-4">
              <p className="label !text-[9px] !text-[#ffb21e]">Avaliação · nível {assess.level}/5 · {assess.score}/100</p>
              <p className="font-semibold mt-1" style={{ color: MASTERY[masteryFromLevel(assess.level)].color }}>{MASTERY[masteryFromLevel(assess.level)].label}</p>
              <p className="text-[13.5px] text-white/75 mt-2">{assess.justification}</p>
              {assess.evidence.length > 0 && <><p className="label !text-[9px] mt-3">Evidências</p><ul className="text-[13px] text-white/70 grid gap-1 mt-1">{assess.evidence.map((e, k) => <li key={k}>▪ {e}</li>)}</ul></>}
              {assess.gaps.length > 0 && <><p className="label !text-[9px] mt-3">Para subir de nível</p><ul className="text-[13px] text-white/70 grid gap-1 mt-1">{assess.gaps.map((e, k) => <li key={k}>▪ {e}</li>)}</ul></>}
              <button className="text-[12px] text-white/50 underline mt-3" onClick={() => setAssess(null)}>fechar</button>
            </div>)}
          <div ref={endRef} />
        </div>

        {!closed && (
          <form className="sticky bottom-0 bg-[#050505] pt-2 pb-[max(env(safe-area-inset-bottom),8px)] border-t border-white/[.06]" onSubmit={(e) => { e.preventDefault(); send(text); }}>
            <div className="flex items-end gap-2">
              <textarea ref={taRef} rows={1} className="field flex-1 !min-h-12 max-h-48 py-3 !resize-none leading-relaxed" placeholder={mode === "socratico" || mode === "avaliar" || mode === "revisar" ? "Sua resposta, com suas palavras…" : "Pergunte, responda ou cole seu código…"}
                value={text} onChange={(e) => { setText(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(192, e.target.scrollHeight) + "px"; }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && matchMedia("(pointer: fine)").matches) { e.preventDefault(); send(text); } }} aria-label="Mensagem para o tutor" />
              <button className="btn btn-accent !min-h-12 !px-5" disabled={busy || !text.trim()} aria-label="Enviar">{busy ? "…" : "↑"}</button>
            </div>
            <p className="text-[10.5px] text-white/35 mt-1.5 hidden sm:block">Enter envia · Shift+Enter quebra linha</p>
          </form>)}
      </div>

      <aside className="hidden lg:block sticky top-4 hunt-card p-4 max-h-[calc(100dvh-32px)] overflow-y-auto">{panelBody}</aside>
      <Sheet open={panel} onClose={() => setPanel(false)} title="Painel da sessão">{panelBody}</Sheet>

      <Sheet open={!!sugg} onClose={() => setSugg(null)} title="Anotações sugeridas">
        <p className="text-[12.5px] text-white/55 mb-3">Nada é salvo sozinho. Edite, salve ou descarte cada uma. As salvas entram na revisão espaçada.</p>
        <div className="grid gap-3">
          {sugg?.map((n, i) => (
            <div key={i} className={`border p-3 ${n.state === "salva" ? "border-[#30d15855]" : n.state === "descartada" ? "border-white/5 opacity-40" : "border-white/10"}`}>
              <select className="field !min-h-9 text-[12px] mb-2" value={n.kind} disabled={n.state !== "nova"} onChange={(e) => setSugg((x) => x!.map((y, k) => k === i ? { ...y, kind: e.target.value } : y))}>
                {Object.entries(KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
              <input className="field font-semibold" value={n.title} disabled={n.state !== "nova"} onChange={(e) => setSugg((x) => x!.map((y, k) => k === i ? { ...y, title: e.target.value } : y))} aria-label="Título" />
              <textarea className="field mt-2 !min-h-20 py-2 text-[13.5px]" value={n.body} disabled={n.state !== "nova"} onChange={(e) => setSugg((x) => x!.map((y, k) => k === i ? { ...y, body: e.target.value } : y))} aria-label="Conteúdo" />
              {n.state === "nova" ? (
                <div className="flex gap-2 mt-2">
                  <button className="btn btn-accent flex-1" disabled={pending} onClick={() => start(async () => { const e = await saveNote({ kind: n.kind as never, title: n.title, body: n.body, session_id: session.id }); if (e) setError(e); else { setSugg((x) => x!.map((y, k) => k === i ? { ...y, state: "salva" } : y)); router.refresh(); } })}>Salvar</button>
                  <button className="btn" onClick={() => setSugg((x) => x!.map((y, k) => k === i ? { ...y, state: "descartada" } : y))}>Descartar</button>
                </div>) : <p className="text-[12px] mt-2 text-white/55">{n.state === "salva" ? "✓ Salva na base de conhecimento" : "Descartada"}</p>}
            </div>))}
        </div>
      </Sheet>
    </div>
  );
}
