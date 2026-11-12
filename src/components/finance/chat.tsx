"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { clearChat, resolveProposal } from "@/app/(app)/financas/actions";

const A = "#3ee6c1";
type Msg = { role: "user" | "assistant"; content: string; error?: boolean };
type Proposal = { id: string; kind: string; summary: string; status: string };
const SUGGESTIONS = ["Como estou este mês?", "Posso gastar R$ 200 em lazer?", "Tem algo estranho nos meus gastos?", "Quais são minhas assinaturas?", "Compare com o mês passado", "Quanto falta para minhas metas?"];

/** Markdown mínimo e seguro: negrito, listas e quebras de linha (sem HTML cru). */
function Rich({ text }: { text: string }) {
  const inline = (s: string, k: string) => s.split(/(\*\*[^*]+\*\*)/g).map((p, i) => p.startsWith("**") && p.endsWith("**") ? <strong key={k + i} className="font-semibold text-ink">{p.slice(2, -2)}</strong> : <span key={k + i}>{p}</span>);
  const blocks: React.ReactNode[] = []; let list: string[] = [];
  const flush = () => { if (list.length) { blocks.push(<ul key={"l" + blocks.length} className="grid gap-1 my-1">{list.map((li, i) => <li key={i} className="flex gap-2"><span className="text-muted">•</span><span>{inline(li, "li" + i)}</span></li>)}</ul>); list = []; } };
  text.split("\n").forEach((line, i) => {
    const m = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)/);
    if (m) list.push(m[1]); else { flush(); if (line.trim()) blocks.push(<p key={"p" + i}>{inline(line.replace(/^#+\s*/, ""), "p" + i)}</p>); }
  });
  flush();
  return <div className="grid gap-1.5">{blocks}</div>;
}

function Typing() {
  return (
    <div className="flex gap-1.5 px-4 py-3.5" aria-label="Assistente digitando">
      {[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 rounded-full bg-white/50 typing-dot" style={{ animationDelay: `${i * 0.18}s` }} />)}
    </div>
  );
}

export function FinanceChat({ initial, pending }: { initial: Msg[]; pending: Proposal[] }) {
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [proposals, setProposals] = useState<Proposal[]>(pending);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [, start] = useTransition();
  const end = useRef<HTMLDivElement>(null);
  const area = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { end.current?.scrollIntoView({ behavior: msgs.length > initial.length ? "smooth" : "auto", block: "end" }); }, [msgs, busy, proposals, initial.length]);

  const send = async (q: string) => {
    const message = q.trim();
    if (!message || busy) return;
    setText(""); setBusy(true);
    setMsgs((m) => [...m, { role: "user", content: message }]);
    try {
      const r = await fetch("/api/financas/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message }) });
      const j = await r.json();
      if (!r.ok) setMsgs((m) => [...m, { role: "assistant", content: j.error ?? "Algo deu errado.", error: true }]);
      else { setMsgs((m) => [...m, { role: "assistant", content: j.reply }]); if (j.proposals?.length) setProposals((p) => [...p, ...j.proposals]); }
    } catch { setMsgs((m) => [...m, { role: "assistant", content: "Sem conexão. Tente de novo.", error: true }]); }
    finally { setBusy(false); area.current?.focus(); }
  };
  const resolve = (p: Proposal, ok: boolean) => start(async () => {
    try { await resolveProposal(p.id, ok); setProposals((l) => l.map((x) => (x.id === p.id ? { ...x, status: ok ? "confirmed" : "cancelled" } : x))); }
    catch (e) { setMsgs((m) => [...m, { role: "assistant", content: (e as Error).message, error: true }]); }
  });

  return (
    <div style={{ ["--accent" as string]: A }} className="flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="relative h-10 w-10 rounded-2xl grid place-items-center" style={{ background: "linear-gradient(135deg, #ffb340, #3ee6c1)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#120f08" strokeWidth="2" aria-hidden><path d="M12 3l2.2 5.3L20 9l-4.4 3.8L17 19l-5-3-5 3 1.4-6.2L4 9l5.8-.7z" /></svg>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-base" style={{ background: "#30d158" }} />
          </span>
          <div><p className="font-display text-lg leading-tight">Assistente</p><p className="text-xs text-muted">Lê seus lançamentos, metas e tetos · Claude</p></div>
        </div>
        {msgs.length > 0 && <button className="text-sm text-muted min-h-11 px-2" onClick={() => { if (confirm("Apagar a conversa?")) start(async () => { await clearChat(); setMsgs([]); setProposals([]); }); }}>Limpar</button>}
      </div>

      <div className="grid gap-3 pb-40">
        {msgs.length === 0 && (
          <section className="glass rise p-5">
            <p className="font-display italic text-xl">Pergunte sobre o seu dinheiro.</p>
            <p className="text-sm text-muted mt-1">Eu respondo com os números que você lança no BRIO. Para mudar tetos, metas ou categorias, eu proponho e você confirma.</p>
          </section>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`flex msg-in ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-3xl px-4 py-3 text-[15px] leading-relaxed ${m.role === "user"
              ? "rounded-br-lg text-[#120f08]" : `glass rounded-bl-lg ${m.error ? "!border-[#ff453a]/40 text-[#ff453a]" : ""}`}`}
              style={m.role === "user" ? { background: A } : undefined}>
              {m.role === "user" ? <p className="whitespace-pre-wrap">{m.content}</p> : <Rich text={m.content} />}
            </div>
          </div>
        ))}
        {proposals.map((p) => (
          <div key={p.id} className="msg-in glass p-4 border-l-2" style={{ borderLeftColor: p.status === "confirmed" ? "#30d158" : p.status === "cancelled" ? "#5d5b56" : A }}>
            <p className="label">{p.status === "pending" ? "Alteração proposta" : p.status === "confirmed" ? "Aplicada ✓" : "Cancelada"}</p>
            <p className="mt-1">{p.summary}</p>
            {p.status === "pending" && (
              <div className="flex gap-2 mt-3">
                <button className="btn flex-1" onClick={() => resolve(p, false)}>Cancelar</button>
                <button className="btn btn-accent flex-1" onClick={() => resolve(p, true)}>Confirmar</button>
              </div>
            )}
          </div>
        ))}
        {busy && <div className="flex justify-start msg-in"><div className="glass rounded-3xl rounded-bl-lg"><Typing /></div></div>}
        <div ref={end} />
      </div>

      <div className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-0 md:left-60 z-30 px-4 pb-3 pt-6 bg-gradient-to-t from-base via-base/95 to-transparent">
        <div className="mx-auto max-w-3xl">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {SUGGESTIONS.map((s) => <button key={s} className="chip shrink-0 !bg-base/60 backdrop-blur" disabled={busy} onClick={() => send(s)}>{s}</button>)}
          </div>
          <form className="flex items-end gap-2 rounded-3xl border border-white/10 bg-[#111113]/90 backdrop-blur-xl p-1.5 pl-4"
            onSubmit={(e) => { e.preventDefault(); send(text); }}>
            <textarea ref={area} rows={1} value={text} placeholder="Pergunte algo…" aria-label="Mensagem para o assistente"
              className="flex-1 resize-none bg-transparent outline-none py-2.5 text-[15px] max-h-32"
              onChange={(e) => { setText(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(128, e.target.scrollHeight) + "px"; }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }} />
            <button type="submit" disabled={busy || !text.trim()} aria-label="Enviar" className="h-11 w-11 shrink-0 rounded-full grid place-items-center transition-opacity disabled:opacity-40" style={{ background: A }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#120f08" strokeWidth="2.2" strokeLinecap="round" aria-hidden><path d="M12 19V5M5 12l7-7 7 7" /></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
