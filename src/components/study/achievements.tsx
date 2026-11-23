"use client";
import { CardArt } from "@/components/card-art";
import { useRef, useState, useTransition } from "react";
import { deleteCertificate, saveCertificate } from "@/app/(app)/estudos/cert-actions";
import { MASTERY, masteryFromLevel, type LearnAch } from "@/lib/learning";
import { HI, Ico } from "@/components/hunt-icons";
import { Medal } from "@/components/game/medal";
import { Sheet } from "@/components/kit";

type Ev = { id: string; date: string; kind: string; topic: string; level: number; score: number | null };
type Cert = { id: string; title: string; issuer: string | null; issued_at: string | null; expires_at: string | null; hours: number | null; credential_id: string | null; url: string | null; skills: string | null; notes: string | null; kind: string; track_id: string | null; file_url: string | null };
const TIER = { bronze: "#c8875a", prata: "#cfd3da", ouro: "#ffb21e" } as const;
const KIND: Record<string, string> = { curso: "Curso", graduacao: "Graduação", pos: "Pós", idioma: "Idioma", evento: "Evento", certificacao: "Certificação", outro: "Outro" };
const br = (d: string | null) => (d ? d.split("-").reverse().join("/") : "");

export function Achievements({ achievements, brioCerts, certs, certsReady, tracks }: { achievements: LearnAch[]; brioCerts: Ev[]; certs: Cert[]; certsReady: boolean; tracks: { id: string; title: string }[] }) {
  const [edit, setEdit] = useState<Cert | "new" | null>(null);
  const [q, setQ] = useState(""), [kind, setKind] = useState("todos");
  const got = achievements.filter((a) => a.got).length, hours = certs.reduce((a, c) => a + Number(c.hours ?? 0), 0);
  const list = certs.filter((c) => (kind === "todos" || c.kind === kind) && (!q || `${c.title} ${c.issuer ?? ""} ${c.skills ?? ""}`.toLowerCase().includes(q.toLowerCase())));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="grid gap-6">
      <section className="hunt-card relative isolate overflow-hidden p-5 lg:p-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-center">
        <CardArt name="conquistas" />
        <span aria-hidden className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#ffb21e]" style={{ boxShadow: "0 0 18px #ffb21e" }} />
        <div>
          <p className="label flex items-center gap-1.5"><Ico d={HI.trophy} size={13} />Conquistas de aprendizado</p>
          <p className="num text-6xl leading-none mt-2">{got}<span className="text-xl text-white/40"> / {achievements.length}</span></p>
          <p className="text-[12.5px] text-white/55 mt-2">Só contam evidências: avaliações, revisões corretas, projetos e certificados. Tempo de tela não vale.</p>
        </div>
        <div className="grid grid-cols-3 border border-white/[.06] divide-x divide-white/[.06]">
          {([[HI.star, "Certificados BRIO", String(brioCerts.length)], [HI.book, "Certificados", String(certs.length)], [HI.clock, "Horas", String(Math.round(hours))]] as const).map(([ic, l, v]) => (
            <div key={l} className="p-3 text-center"><p className="label !text-[9px] flex items-center justify-center gap-1"><Ico d={ic} size={11} />{l}</p><p className="num text-3xl mt-1 text-[#ffb21e]">{v}</p></div>))}
        </div>
      </section>

      {/* Conquistas */}
      <section>
        <p className="label mb-3">Medalhas</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-px bg-white/[.06] border border-white/[.06] rounded-[8px] overflow-hidden">
          {achievements.map((a) => (
            <div key={a.id} className={`bg-[#080808] p-4 ${a.got ? "" : "opacity-60"}`}>
              <Medal color={TIER[a.tier]} earned={a.got} art={`estudo-${a.id}`} />
              <p className="font-semibold text-[14px] mt-2 leading-tight">{a.title}</p>
              <p className="text-[11.5px] text-white/50 mt-1 leading-snug">{a.desc}</p>
              {!a.got && <><div className="flex gap-[2px] mt-2.5">{Array.from({ length: Math.min(a.goal, 10) }, (_, i) => <i key={i} className="h-[4px] flex-1" style={{ background: i < Math.round((a.cur / a.goal) * Math.min(a.goal, 10)) ? "#ffb21e" : "rgba(255,255,255,.08)" }} />)}</div><p className="font-mono text-[10px] text-white/40 mt-1">{a.cur}/{a.goal}</p></>}
              {a.got && <p className="label !text-[9px] mt-2" style={{ color: TIER[a.tier] }}>{a.tier}</p>}
            </div>))}
        </div>
      </section>

      {/* Certificados BRIO */}
      <section>
        <p className="label mb-1">Certificados BRIO</p>
        <p className="text-[12.5px] text-white/50 mb-3">Emitidos quando uma avaliação ou projeto atinge nível 4+ (aplica em situação real). São registros pessoais, para imprimir ou salvar em PDF.</p>
        {brioCerts.length === 0 ? <p className="text-sm text-white/45 border border-dashed border-white/10 p-5">Nenhum ainda. Estude com IA, use o modo Avaliar e peça “Avaliar meu domínio”, ou conclua e avalie um projeto.</p> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {brioCerts.map((e) => { const m = MASTERY[masteryFromLevel(e.level)]; return (
              <a key={e.id} href={`/certificado/${e.id}`} target="_blank" rel="noopener" className="group relative border border-[#3a0000] bg-[#0a0606] p-4 hover:border-[#ffb21e66] transition-colors">
                <span className="absolute inset-1.5 border border-[#ffb21e1a] pointer-events-none" />
                <p className="label !text-[9px] !text-[#ffb21e]">{e.kind === "projeto" ? "Projeto aplicado" : "Domínio"} · {br(e.date)}</p>
                <p className="font-display text-2xl mt-2 leading-tight">{e.topic}</p>
                <p className="text-[12px] mt-2" style={{ color: m.color }}>{m.label} · nível {e.level}/5{e.score != null ? ` · ${e.score}/100` : ""}</p>
                <p className="text-[11px] text-white/45 mt-3 group-hover:text-white">Abrir certificado →</p>
              </a>); })}
          </div>)}
      </section>

      {/* Certificados externos */}
      <section>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="mr-auto"><p className="label">Meus certificados</p><p className="text-[12.5px] text-white/50 mt-1">Cursos, faculdade, idiomas, eventos e certificações, com arquivo e link de validação.</p></div>
          <button className="btn btn-accent inline-flex items-center gap-1.5" disabled={!certsReady} onClick={() => setEdit("new")}><Ico d={HI.plus} size={14} />Indexar certificado</button>
        </div>
        {!certsReady ? <p className="hunt-card p-5 text-sm">Rode a migração <code className="text-[#ffb21e]">20261122000000_certificados.sql</code> no Supabase.</p> : <>
          {certs.length > 0 && <div className="grid sm:grid-cols-[1fr_auto] gap-2 mb-3">
            <input className="field" placeholder="Buscar por nome, instituição ou habilidade" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar certificados" />
            <select className="field" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Tipo"><option value="todos">Todos</option>{Object.entries(KIND).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          </div>}
          {list.length === 0 ? <p className="text-sm text-white/45 border border-dashed border-white/10 p-5">{certs.length ? "Nada encontrado." : "Nenhum certificado indexado ainda."}</p> : (
            <ul className="divide-y divide-white/[.06] border border-white/[.06] rounded-[8px] overflow-hidden">
              {list.map((c) => (
                <li key={c.id} className="bg-[#080808] flex flex-wrap sm:flex-nowrap items-center gap-3 px-4 py-3">
                  <span className="h-10 w-10 shrink-0 grid place-items-center border border-white/10 text-[#ffb21e]"><Ico d={HI.book} size={18} /></span>
                  <button className="min-w-0 flex-1 text-left" onClick={() => setEdit(c)}>
                    <span className="block font-medium truncate">{c.title}</span>
                    <span className="block text-[11.5px] font-mono text-white/45 truncate">{KIND[c.kind]}{c.issuer ? ` · ${c.issuer}` : ""}{c.issued_at ? ` · ${br(c.issued_at)}` : ""}{c.hours ? ` · ${c.hours} h` : ""}{c.expires_at && c.expires_at < today ? " · vencido" : ""}</span>
                    {c.skills && <span className="block text-[11.5px] text-white/50 truncate mt-0.5">{c.skills}</span>}
                  </button>
                  <span className="flex gap-2 shrink-0">
                    {c.file_url && <a className="btn !min-h-9 !px-3 text-[12px]" href={c.file_url} target="_blank" rel="noopener noreferrer">Arquivo</a>}
                    {c.url && <a className="btn !min-h-9 !px-3 text-[12px]" href={c.url} target="_blank" rel="noopener noreferrer">Validar</a>}
                  </span>
                </li>))}
            </ul>)}
        </>}
      </section>

      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit === "new" ? "Indexar certificado" : "Certificado"}>
        {edit && <CertForm c={edit === "new" ? null : edit} tracks={tracks} onDone={() => setEdit(null)} />}
      </Sheet>
    </div>
  );
}

function CertForm({ c, tracks, onDone }: { c: Cert | null; tracks: { id: string; title: string }[]; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const f = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="grid gap-1"><span className="label !text-[9px]">{label}</span><input name={name} className="field" defaultValue={(c as Record<string, unknown> | null)?.[name] as string ?? ""} {...props} /></label>);
  return (
    <form ref={formRef} className="grid gap-3" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); start(async () => { const err = await saveCertificate(fd); if (err) setError(err); else onDone(); }); }}>
      {c && <input type="hidden" name="id" value={c.id} />}
      {f("title", "Nome do certificado", { required: true, placeholder: "Ex.: Fundamentos de SQL" })}
      <div className="grid grid-cols-2 gap-2">
        {f("issuer", "Instituição", { placeholder: "Ex.: Alura, USP" })}
        <label className="grid gap-1"><span className="label !text-[9px]">Tipo</span><select name="kind" className="field" defaultValue={c?.kind ?? "curso"}>{Object.entries(KIND).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {f("issued_at", "Emitido em", { type: "date" })}{f("expires_at", "Validade", { type: "date" })}{f("hours", "Horas", { inputMode: "decimal" })}
      </div>
      {f("credential_id", "Código / ID da credencial")}
      {f("url", "Link de validação", { type: "url", placeholder: "https://" })}
      {f("skills", "Habilidades", { placeholder: "Ex.: SQL, modelagem, joins" })}
      <label className="grid gap-1"><span className="label !text-[9px]">Trilha relacionada</span><select name="track_id" className="field" defaultValue={c?.track_id ?? ""}><option value="">Nenhuma</option>{tracks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label>
      <label className="grid gap-1"><span className="label !text-[9px]">Arquivo (PDF ou imagem, até 10 MB){c?.file_url ? " · já anexado" : ""}</span><input name="file" type="file" accept="application/pdf,image/*" className="field py-2" /></label>
      <label className="grid gap-1"><span className="label !text-[9px]">Observações</span><textarea name="notes" className="field !min-h-16 py-2" defaultValue={c?.notes ?? ""} /></label>
      {error && <p className="text-[12.5px] text-[#ff453a]" role="alert">{error}</p>}
      <div className="flex gap-2">
        {c && <button type="button" className="btn text-white/60" disabled={pending} onClick={() => { if (confirm("Apagar certificado e o arquivo?")) start(async () => { const e = await deleteCertificate(c.id); if (e) setError(e); else onDone(); }); }}>Apagar</button>}
        <button className="btn btn-accent flex-1" disabled={pending}>{pending ? "Salvando…" : "Salvar"}</button>
      </div>
    </form>
  );
}
