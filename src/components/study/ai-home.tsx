"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createSession, deleteSession } from "@/app/(app)/estudos/ia-actions";
import { MODES, type Mode } from "@/lib/ai/pedagogy";
import { HI, Ico } from "@/components/hunt-icons";

type S = { id: string; title: string; subject: string | null; mode: string; provider: string; status: string; stage: string | null; updated_at: string; track_id: string | null };
type P = { id: string; label: string; ready: boolean; model: string };
const PENDING_KEY = "brio-ia-first";

export function AiHome({ ready, sessions, tracks, projects, providers, preset }: {
  ready: boolean; sessions: S[]; tracks: { id: string; title: string }[]; projects: { id: string; title: string }[]; providers: P[];
  preset: { track_id: string | null; item_id: string | null; project_id: string | null; subject: string };
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [more, setMore] = useState(!!preset.subject);
  const firstReady = providers.find((p) => p.ready)?.id ?? "claude";
  const [f, setF] = useState({ text: "", subject: preset.subject, goal: "", level: "", outcome: "", mode: "ensinar" as Mode, provider: firstReady as "claude" | "gemini", track_id: preset.track_id ?? "", project_id: preset.project_id ?? "" });
  const [error, setError] = useState<string | null>(null);
  const noAi = !providers.some((p) => p.ready);

  const go = () => start(async () => {
    setError(null);
    const r = await createSession({ ...f, text: f.text || null, track_id: f.track_id || null, item_id: preset.item_id, project_id: f.project_id || null });
    if (r.error || !r.id) { setError(r.error ?? "Não foi possível criar a sessão."); return; }
    // A primeira mensagem vai para o workspace, que a envia em streaming.
    const first = f.text.trim() || [f.subject && `Quero estudar: ${f.subject}.`, f.goal && `Objetivo: ${f.goal}.`, f.level && `Meu nível: ${f.level}.`, f.outcome && `Quero conseguir: ${f.outcome}.`].filter(Boolean).join(" ");
    try { if (first) sessionStorage.setItem(PENDING_KEY + r.id, first); } catch { /* sem storage: o usuário digita */ }
    router.push(`/estudos/ia/${r.id}`);
  });

  if (!ready) return <p className="hunt-card p-5 text-sm">Rode a migração <code className="text-[#ffb21e]">supabase/migrations/20261121000000_estudar_ia.sql</code> no Supabase para ativar o Estudar com IA.</p>;
  const active = sessions.filter((s) => s.status === "ativa"), closed = sessions.filter((s) => s.status !== "ativa");

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)] items-start">
      <section className="hunt-card relative p-5">
        <span aria-hidden className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#ffb21e]" style={{ boxShadow: "0 0 18px #ffb21e" }} />
        <p className="label flex items-center gap-1.5"><Ico d={HI.bolt} size={13} />Nova sessão</p>
        <h1 className="font-display text-4xl mt-2">O que você quer aprender<span className="text-[#ffb21e]">?</span></h1>
        <div className="flex flex-wrap gap-1.5 mt-4" role="group" aria-label="Pontos de partida">
          {([["Aprender do zero", "Quero aprender do zero: ", "ensinar"], ["Preparar para prova", "Tenho prova sobre: . Quero revisar e treinar questões.", "praticar"], ["Revisar matéria", "Quero revisar o que já estudei sobre: ", "revisar"], ["Entender um texto", "Me ajude a entender este texto (vou colar a seguir): ", "investigar"], ["Resolver um problema", "Estou travado neste problema: ", "socratico"], ["Projeto prático", "Quero construir um projeto para aplicar: ", "construir"], ["Testar meu nível", "Avalie meu nível em: ", "avaliar"]] as const).map(([l, t, m]) => (
            <button key={l} type="button" className={`min-h-9 px-3 border text-[12px] ${f.mode === m && f.text.startsWith(t.slice(0, 12)) ? "border-[#ffb21e] text-white" : "border-white/10 text-white/65 hover:text-white"}`} onClick={() => setF({ ...f, text: t, mode: m })}>{l}</button>))}
        </div>
        <textarea className="field mt-3 !min-h-28 py-3 text-[15px] leading-relaxed" placeholder="Ex.: quero entender recursão de verdade, sei o básico de JavaScript e travo quando a função chama ela mesma."
          value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} aria-label="O que você quer aprender" />

        <p className="label !text-[9px] mt-4 mb-2">Modo</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[.06] border border-white/[.06]">
          {(Object.keys(MODES) as Mode[]).map((m) => (
            <button key={m} type="button" aria-pressed={f.mode === m} onClick={() => setF({ ...f, mode: m })}
              className={`text-left px-3 py-2.5 transition-colors ${f.mode === m ? "bg-[#140303]" : "bg-[#080808] hover:bg-[#0e0e0e]"}`}>
              <span className={`block text-[13px] font-semibold ${f.mode === m ? "text-white" : "text-white/75"}`}>{MODES[m].label}</span>
              <span className="block text-[10.5px] text-white/45 leading-tight mt-0.5">{MODES[m].short}</span>
            </button>))}
        </div>

        <button type="button" className="text-[12px] text-white/55 mt-4 underline underline-offset-4 min-h-9" onClick={() => setMore(!more)} aria-expanded={more}>{more ? "Menos detalhes" : "Detalhar objetivo, nível e trilha (opcional)"}</button>
        {more && (
          <div className="grid sm:grid-cols-2 gap-3 mt-2">
            {([["subject", "Assunto", "Recursão"], ["goal", "Objetivo", "Resolver problemas de árvore"], ["level", "Nível atual", "Iniciante, sei loops"], ["outcome", "Resultado desejado", "Implementar sem consultar"]] as const).map(([k, l, ph]) => (
              <label key={k} className="grid gap-1"><span className="label !text-[9px]">{l}</span><input className="field" placeholder={ph} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></label>))}
            <label className="grid gap-1"><span className="label !text-[9px]">Trilha</span>
              <select className="field" value={f.track_id} onChange={(e) => setF({ ...f, track_id: e.target.value })}><option value="">Nenhuma</option>{tracks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label>
            <label className="grid gap-1"><span className="label !text-[9px]">Projeto (Build Lab)</span>
              <select className="field" value={f.project_id} onChange={(e) => setF({ ...f, project_id: e.target.value })}><option value="">Nenhum</option>{projects.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label>
          </div>)}

        <div className="flex flex-wrap items-center gap-2 mt-5">
          <div className="flex gap-px bg-white/[.06] border border-white/[.06]" role="radiogroup" aria-label="Provedor de IA">
            {providers.map((p) => (
              <button key={p.id} type="button" role="radio" aria-checked={f.provider === p.id} disabled={!p.ready} title={p.ready ? p.model : "Chave não configurada"}
                onClick={() => setF({ ...f, provider: p.id as "claude" | "gemini" })}
                className={`px-3 min-h-11 text-[12px] uppercase tracking-[.12em] ${f.provider === p.id ? "bg-[#140303] text-white" : "bg-[#080808] text-white/55"} disabled:opacity-35`}>{p.label}</button>))}
          </div>
          <button className="btn btn-accent flex-1 min-w-[180px]" disabled={pending || noAi || (!f.text.trim() && !f.subject.trim())} onClick={go}>{pending ? "Abrindo…" : "Começar a estudar →"}</button>
        </div>
        {noAi && <p className="text-[12px] text-[#ff453a] mt-3">Nenhuma IA configurada. Defina ANTHROPIC_API_KEY ou GEMINI_API_KEY na Vercel.</p>}
        {error && <p className="text-[12px] text-[#ff453a] mt-3" role="alert">{error}</p>}
      </section>

      <section>
        <p className="label flex items-center gap-1.5 mb-2"><Ico d={HI.list} size={13} />Sessões em andamento</p>
        {active.length === 0 ? <p className="text-sm text-white/45 border border-dashed border-white/10 p-4">Nenhuma sessão aberta. Comece ao lado.</p> : <List items={active} onDelete={(id) => start(async () => { await deleteSession(id); router.refresh(); })} />}
        {closed.length > 0 && <><p className="label mt-6 mb-2">Encerradas</p><List items={closed.slice(0, 20)} onDelete={(id) => start(async () => { await deleteSession(id); router.refresh(); })} /></>}
      </section>
    </div>
  );
}

function List({ items, onDelete }: { items: S[]; onDelete: (id: string) => void }) {
  return (
    <ul className="divide-y divide-white/[.06] border border-white/[.06] rounded-[8px] overflow-hidden">
      {items.map((s) => (
        <li key={s.id} className="flex items-stretch bg-[#080808]">
          <Link href={`/estudos/ia/${s.id}`} className="flex-1 min-w-0 px-4 py-3 hover:bg-[#0e0e0e]">
            <span className="block font-medium truncate">{s.title}</span>
            <span className="block text-[11px] font-mono text-white/45 mt-0.5 truncate">{MODES[s.mode as Mode]?.label ?? s.mode} · {s.provider} · {new Date(s.updated_at).toLocaleDateString("pt-BR")}{s.stage ? ` · ${s.stage}` : ""}</span>
          </Link>
          <button className="px-3 text-white/35 hover:text-[#ff453a]" aria-label={`Apagar ${s.title}`} onClick={() => { if (confirm("Apagar esta sessão e as mensagens?")) onDelete(s.id); }}>✕</button>
        </li>))}
    </ul>
  );
}
