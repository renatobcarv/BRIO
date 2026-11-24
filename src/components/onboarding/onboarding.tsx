"use client";
import Image from "next/image";
import { useEffect, useRef, useState, useTransition, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { accountSummary } from "@/app/(app)/boas-vindas/actions";
import { saveGoal } from "@/app/(app)/metas/actions";
import { saveDream } from "@/app/(app)/sonhos/actions";
import { savePartner, savePrefs } from "@/app/(app)/configuracoes/actions";
import { choosePet, drawPet } from "@/app/(app)/mascote-actions";
import { ModulesEditor } from "@/components/settings/modules";
import { Consult } from "@/components/body/consult";
import { ImportStatement } from "@/components/finance/import";
import { PetRoulette } from "@/components/pet/roulette";
import { PetPortrait } from "@/components/pet/portrait";
import { SPECIES, STAGES } from "@/lib/pet";
import type { FinCategory, ModuleKey } from "@/lib/settings";
import styles from "./onboarding.module.css";

const A = "#ffb21e";
type Mode = "rapido" | "avancado";
type Step = "modo" | "areas" | "metas" | "pessoa" | "sonhos" | "treino" | "financas" | "mascote" | "resumo" | "tutorial";
const CHAPTERS: Record<Step, { label: string; color: string; art: string }> = {
  modo: { label: "Boas-vindas", color: "#ffc66d", art: "modo" },
  areas: { label: "Suas áreas", color: "#c7a7ff", art: "areas" },
  metas: { label: "Primeira meta", color: "#ff9d91", art: "metas" },
  pessoa: { label: "Pessoa especial", color: "#f7a9cf", art: "pessoa" },
  sonhos: { label: "Quadro dos sonhos", color: "#b9b1ff", art: "sonhos" },
  treino: { label: "Treino e dieta", color: "#ffb07b", art: "treino" },
  financas: { label: "Finanças", color: "#8ce5ae", art: "financas" },
  mascote: { label: "Seu mascote", color: "#8ddcff", art: "mascote" },
  resumo: { label: "Seu BRIO", color: "#ffe09a", art: "resumo" },
  tutorial: { label: "Tour do BRIO", color: "#9de9b9", art: "resumo" },
};
const TOUR_ART = ["modo", "treino", "resumo", "metas", "mascote", "areas"];

function ChapterArt({ art, priority = false }: { art: string; priority?: boolean }) {
  return <Image src={`/cards/onboarding/${art}.webp`} width={320} height={320} priority={priority} unoptimized alt="" className={styles.art} />;
}

function Notice({ children }: { children: string }) {
  return <p role="alert" className={styles.notice}><span aria-hidden="true">!</span>{children}</p>;
}

function Sparks() {
  return <span className={styles.sparks} aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>;
}

const KEY = "brio:onboarding";
const GOALS = [
  { t: "Perder peso", area: "fisica", unit: "kg", hint: "Quantos kg quer perder?" }, { t: "Ganhar massa muscular", area: "fisica", unit: "kg", hint: "Quantos kg quer ganhar?" },
  { t: "Ler livros este ano", area: "pessoal", unit: "livros", hint: "Quantos livros?" }, { t: "Guardar dinheiro", area: "financeira", unit: "R$", hint: "Quanto quer juntar?" },
  { t: "Treinar com constância", area: "fisica", unit: "treinos", hint: "Quantos treinos até o prazo?" }, { t: "Ler a Bíblia inteira", area: "espiritual", unit: "capítulos", hint: "Meta de capítulos" },
] as const;
const TOUR = [
  { t: "Início: o seu dia", d: "Marque as missões do checklist, veja a semana e acompanhe a sequência. Cada missão vale XP." },
  { t: "Treino: o Mestre treina com você", d: "Abra o treino do dia em modo guiado. Registre carga, repetições e o esforço (RPE): o app ajusta as próximas séries e a próxima semana." },
  { t: "Status: quem você está se tornando", d: "Nível, patentes, atributos, conquistas, corpo e a aba Mente, com testes que ensinam enquanto desafiam." },
  { t: "Metas e Sonhos", d: "Cada 1% de progresso numa meta vale XP. No quadro dos sonhos ficam os seus porquês." },
  { t: "Mascote e feras", d: "Seu mascote evolui com o seu XP real. Feras derrotadas no treino podem deixar itens e, raramente, ser domadas." },
  { t: "Ajuste tudo quando quiser", d: "Em Configurações você liga e desliga módulos, edita a rotina, a pessoa especial e muito mais." },
];

export function Onboarding({ name, modules, cats }: { name: string; modules: Record<ModuleKey, boolean>; cats: FinCategory[] }) {
  const router = useRouter();
  const chapterHeading = useRef<HTMLHeadingElement>(null);
  const [mode, setMode] = useState<Mode | null>(null), [i, setI] = useState(0), [msg, setMsg] = useState(""), [busy, start] = useTransition();
  useEffect(() => { try { const v = JSON.parse(localStorage.getItem(KEY) ?? "null"); if (v?.mode) { setMode(v.mode); setI(v.i ?? 0); } } catch { /* sem storage */ } }, []);
  useEffect(() => { try { if (mode) localStorage.setItem(KEY, JSON.stringify({ mode, i })); } catch { /* sem storage */ } }, [mode, i]);
  const on = (m: ModuleKey) => modules[m] !== false;
  const steps: Step[] = (["modo", "areas", "metas", ...(mode === "avancado" ? ["pessoa", "sonhos"] as Step[] : []), "treino", ...(mode === "avancado" ? ["financas"] as Step[] : []), "mascote", "resumo", "tutorial"] as Step[])
    .filter((s) => (s === "sonhos" ? on("sonhos") : s === "treino" ? on("treino") || on("dieta") : s === "financas" ? on("financas") : s === "mascote" ? on("mascote") : true));
  const index = Math.min(i, steps.length - 1);
  const step = steps[index];
  const chapter = CHAPTERS[step];
  useEffect(() => {
    if (step !== "modo") chapterHeading.current?.focus({ preventScroll: true });
  }, [step]);
  const next = () => { setMsg(""); setI((x) => Math.min(steps.length - 1, x + 1)); window.scrollTo({ top: 0 }); };
  const back = () => { setMsg(""); setI(Math.max(0, index - 1)); window.scrollTo({ top: 0 }); };
  const finish = () => start(async () => { const e = await savePrefs({ onboarded: true }); if (e) return setMsg(e); try { localStorage.removeItem(KEY); } catch { /* ok */ } router.push("/"); router.refresh(); });

  return (
    <div className={styles.shell} style={{ "--chapter": chapter.color } as CSSProperties}>
      {step !== "modo" && (
        <nav className={styles.progress} aria-label="Navegação da configuração">
          <button type="button" onClick={back} className={styles.back}>← Voltar</button>
          <div className={styles.track} role="progressbar" aria-label="Progresso da configuração" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={index + 1}>
            {steps.map((item, k) => <span key={item} data-state={k === index ? "current" : k < index ? "complete" : undefined} />)}
          </div>
          <span className={styles.count}>{index + 1}/{steps.length}</span>
        </nav>
      )}
      <div key={step} className={styles.chapter}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p>{step === "modo" ? "Bem-vindo ao BRIO" : "Configure seu BRIO"}</p>
            <h1 ref={chapterHeading} tabIndex={-1}>{step === "modo" ? (name ? `Olá, ${name}.` : "Olá.") : chapter.label}</h1>
            {step === "modo" && <span>Escolha um caminho para montar seu BRIO.</span>}
          </div>
          <div className={styles.heroVisual}>
            <ChapterArt art={chapter.art} priority={step === "modo"} />
            <Sparks />
          </div>
        </header>
        <div className={styles.content}>
        {step === "modo" && <section>
          <div className={styles.modes}>
            {([["rapido", "Rápido", "≈ 3 min · o essencial: áreas, uma meta, treino e mascote. O resto você ajusta depois."], ["avancado", "Avançado", "≈ 10 min · tudo: metas, pessoa especial, sonhos com fotos, treino e dieta com especialistas, extrato bancário e mascote."]] as const).map(([k, t, d]) => (
              <button key={k} onClick={() => { setMode(k); setI(1); }} className={styles.mode} data-mode={k}>
                <ChapterArt art={k === "rapido" ? "metas" : "resumo"} />
                <span><strong>{t}</strong><span>{d}</span></span>
                <span aria-hidden="true">→</span>
              </button>))}
          </div>
        </section>}

        {step === "areas" && <section><H t="O que você quer no seu BRIO?" d="Ligue só o que vai usar. Dá para mudar quando quiser em Configurações." /><div className="mt-5"><ModulesEditor on={modules} /></div><Next onClick={next} /></section>}

        {step === "metas" && <GoalsStep max={mode === "avancado" ? 3 : 1} spiritual={on("espiritual")} onDone={next} />}

        {step === "pessoa" && <section>
          <H t="Por quem você luta?" d="Opcional: alguém especial (filho, esposa, mãe…) que vai aparecer na sua tela inicial como lembrete do seu porquê." />
          <form className="grid gap-3 mt-5" action={(fd) => start(async () => { try { await savePartner(fd); next(); } catch (e) { setMsg((e as Error).message); } })}>
            <input name="name" className="field" placeholder="Nome" maxLength={60} />
            <textarea name="phrase" className="field" placeholder="Uma frase que te lembra por quê" maxLength={300} />
            <label className="btn cursor-pointer">Escolher foto (opcional)<input type="file" name="photo" accept="image/*" className="sr-only" /></label>
            <button className="btn btn-accent" disabled={busy}>{busy ? "Salvando…" : "Salvar e continuar"}</button>
          </form><Skip onClick={next} /></section>}

        {step === "sonhos" && <section>
          <H t="Um sonho para o seu quadro" d="Uma viagem, uma casa, uma conquista. Com foto, ele vira um lembrete visual na Home." />
          <form className="grid gap-3 mt-5" action={(fd) => start(async () => { const e = await saveDream(fd); if (e) setMsg(e); else next(); })}>
            <input name="title" className="field" placeholder="Ex.: Conhecer o Japão" required maxLength={120} />
            <textarea name="why" className="field" placeholder="Por que isso importa para você?" maxLength={1000} />
            <select name="category" className="field" defaultValue="experiencia">{[["experiencia", "Experiência"], ["viagem", "Viagem"], ["casa", "Casa"], ["familia", "Família"], ["carreira", "Carreira"], ["saude", "Saúde"], ["financas", "Finanças"], ["espiritual", "Espiritual"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            <label className="btn cursor-pointer">Importar foto<input type="file" name="image" accept="image/*" className="sr-only" /></label>
            <button className="btn btn-accent" disabled={busy}>{busy ? "Salvando…" : "Salvar sonho"}</button>
          </form><Skip onClick={next} /></section>}

        {step === "treino" && <section>
          <H t="Treino e dieta sob medida" d="O Mestre Augusto (treinador de periodização) e a Helena (nutricionista) fazem algumas perguntas e montam a sua campanha e o seu plano alimentar, com base em estudos." />
          <Consult />
          <p className="text-[12.5px] text-white/45 mt-3">Quando terminar a consulta, a página recarrega e você continua daqui.</p>
          <Next onClick={next} label="Já fiz / continuar" /><Skip onClick={next} /></section>}

        {step === "financas" && <section>
          <H t="Importe seu extrato" d="Exporte o extrato do app do seu banco em OFX ou CSV e importe aqui: o BRIO separa receitas e gastos e sugere categorias. Sem senha de banco." />
          <ImportStatement cats={cats} /><Next onClick={next} /><Skip onClick={next} /></section>}

        {step === "mascote" && <PetStep onDone={next} />}

        {step === "resumo" && <Summary onNext={next} />}

        {step === "tutorial" && <Tour onFinish={finish} busy={busy} />}
        </div>
      </div>
      {msg && <Notice>{msg}</Notice>}
    </div>
  );
}

function H({ t, d }: { t: string; d: string }) { return <><h2 className="font-display text-3xl font-bold leading-tight">{t}</h2><p className="text-white/60 mt-2 text-[14.5px]">{d}</p></>; }
function Next({ onClick, label = "Continuar" }: { onClick: () => void; label?: string }) { return <button className={styles.next} onClick={onClick}>{label}</button>; }
function Skip({ onClick }: { onClick: () => void }) { return <button className={styles.skip} onClick={onClick}>Pular por agora</button>; }

function GoalsStep({ max, spiritual, onDone }: { max: number; spiritual: boolean; onDone: () => void }) {
  const [list, setList] = useState<{ t: string; area: string; unit: string; target: string; deadline: string }[]>([]), [err, setErr] = useState(""), [busy, start] = useTransition();
  const add = (g: (typeof GOALS)[number] | null) => list.length < max && setList([...list, { t: g?.t ?? "", area: g?.area ?? "pessoal", unit: g?.unit ?? "", target: "", deadline: "" }]);
  const save = () => start(async () => {
    try { for (const [k, g] of list.entries()) if (g.t.trim() && Number(g.target) > 0) await saveGoal({ title: g.t.trim(), area: g.area as "pessoal", unit: g.unit, start_value: 0, target: Number(g.target), current: 0, deadline: g.deadline || null, objective_id: null, featured: k === 0, auto_source: null, auto_ref: null }); onDone(); }
    catch (e) { setErr((e as Error).message || "Confira as metas."); }
  });
  return (<section>
    <H t={max > 1 ? "Suas metas principais" : "Sua meta principal"} d={`Escolha ${max > 1 ? `até ${max}` : "uma"} e dê um número. Cada 1% de progresso vale XP.`} />
    <div className="flex flex-wrap gap-2 mt-5">{GOALS.filter((g) => spiritual || g.area !== "espiritual").map((g) => <button key={g.t} disabled={list.length >= max} onClick={() => add(g)} className={styles.choice}>{g.t}</button>)}
      <button disabled={list.length >= max} onClick={() => add(null)} className="rounded-full px-4 min-h-10 border border-dashed border-white/25 text-[14px] disabled:opacity-40">+ Outra</button></div>
    <div className="grid gap-3 mt-4">{list.map((g, k) => (
      <div key={k} className="hunt-card p-4 grid gap-2">
        <input className="field" value={g.t} placeholder="Meta" onChange={(e) => setList(list.map((x, j) => (j === k ? { ...x, t: e.target.value } : x)))} />
        <div className="grid grid-cols-[1fr_90px] gap-2"><input className="field" inputMode="decimal" placeholder={GOALS.find((x) => x.t === g.t)?.hint ?? "Número alvo"} value={g.target} onChange={(e) => setList(list.map((x, j) => (j === k ? { ...x, target: e.target.value.replace(",", ".") } : x)))} />
          <input className="field" placeholder="unidade" value={g.unit} onChange={(e) => setList(list.map((x, j) => (j === k ? { ...x, unit: e.target.value } : x)))} /></div>
        <label className="text-[12px] text-white/50">Prazo (opcional)<input type="date" className="field w-full mt-1" value={g.deadline} onChange={(e) => setList(list.map((x, j) => (j === k ? { ...x, deadline: e.target.value } : x)))} /></label>
        <button className="text-[12px] text-white/45 justify-self-start" onClick={() => setList(list.filter((_, j) => j !== k))}>Remover</button>
      </div>))}</div>
    {err && <Notice>{err}</Notice>}
    <button className={styles.next} disabled={busy || !list.some((g) => g.t.trim() && Number(g.target) > 0)} onClick={save}>{busy ? "Salvando…" : "Salvar e continuar"}</button>
    <Skip onClick={onDone} />
  </section>);
}

function PetStep({ onDone }: { onDone: () => void }) {
  const [spin, setSpin] = useState<string | null>(null), [got, setGot] = useState<string | null>(null), [nm, setNm] = useState(""), [err, setErr] = useState(""), [busy, start] = useTransition();
  const sp = got ? SPECIES.find((s) => s.key === got) : null;
  return (<section>
    <H t="Seu companheiro de jornada" d="O primeiro sorteio é grátis. O mascote evolui com o seu XP real e te dá bônus nos dias bons." />
    <div className="mt-5 min-h-[220px] grid place-items-center">
      {spin ? <PetRoulette result={spin} onDone={() => { setGot(spin); setSpin(null); }} />
        : sp ? <div className={styles.reveal}><Sparks /><PetPortrait species={sp.key} stage={STAGES[0]} size={150} className="mx-auto" /><p className="label" style={{ color: A }}>Você tirou</p><p className="font-display text-5xl mt-1">{sp.name}</p><p className="text-white/60 text-[14px] mt-1">{sp.trait}</p></div>
        : <button className="btn btn-accent !min-h-16 !px-10 text-lg" disabled={busy} onClick={() => start(async () => { const r = await drawPet(); if (r.error) setErr(r.error); else if (r.species) setSpin(r.species); })}>Girar a roleta</button>}
    </div>
    {sp && <form className="grid gap-2 mt-4" onSubmit={(e) => { e.preventDefault(); start(async () => { const x = await choosePet(sp.key, nm || sp.name); if (x) setErr(x); else onDone(); }); }}>
      <input className="field" placeholder={`Nome do seu ${sp.name.toLowerCase()}`} value={nm} onChange={(e) => setNm(e.target.value)} maxLength={30} />
      <button className="btn btn-accent !min-h-14" disabled={busy}>Adotar e continuar</button></form>}
    {err && <Notice>{err}</Notice>}
    <Skip onClick={onDone} />
  </section>);
}

function Summary({ onNext }: { onNext: () => void }) {
  const [s, setS] = useState<Awaited<ReturnType<typeof accountSummary>> | null>(null);
  useEffect(() => { accountSummary().then(setS).catch(() => setS(null)); }, []);
  const Row = ({ t, v }: { t: string; v: React.ReactNode }) => <div className="flex justify-between gap-4 py-2.5 border-b border-white/[.06] last:border-0 text-[14px]"><span className="text-white/55">{t}</span><span className="text-right font-medium">{v}</span></div>;
  return (<section>
    <H t="Sua conta está pronta." d="Aqui está o que montamos juntos. Tudo pode ser ajustado depois." />
    <div className="hunt-card p-5 mt-5">{!s ? <p className="text-white/50 text-sm">Carregando…</p> : <>
      <Row t="Áreas" v={s.modules.length ? `${s.modules.length} ligadas` : "todas"} />
      <Row t="Metas" v={s.goals.length ? s.goals.join(" · ") : "—"} />
      {s.partner && <Row t="Pessoa especial" v={s.partner} />}
      {s.dreams.length > 0 && <Row t="Sonhos" v={s.dreams.join(" · ")} />}
      <Row t="Campanha de treino" v={s.program ?? "—"} />
      <Row t="Plano alimentar" v={s.diet ? `${s.diet.kcal} kcal · ${s.diet.protein} g de proteína` : "—"} />
      {s.finance > 0 && <Row t="Lançamentos importados" v={s.finance} />}
      <Row t="Mascote" v={s.pet ? `${s.pet.name} (${SPECIES.find((x) => x.key === s.pet!.species)?.name ?? s.pet.species})` : "—"} />
    </>}</div>
    <Next onClick={onNext} label="Ver como usar o app" />
  </section>);
}

function Tour({ onFinish, busy }: { onFinish: () => void; busy: boolean }) {
  const [k, setK] = useState(0), t = TOUR[k];
  return (<section>
    <p className="label" style={{ color: A }}>Como usar · {k + 1}/{TOUR.length}</p>
    <div key={k} className={styles.tourCard}>
      <ChapterArt art={TOUR_ART[k]} />
      <div><h2 className="font-display text-2xl leading-tight">{t.t}</h2><p className="mt-2 text-sm leading-relaxed text-white/80">{t.d}</p></div>
      {k === TOUR.length - 1 && <Sparks />}
    </div>
    <div className="flex gap-1 mt-4 justify-center">{TOUR.map((_, j) => <i key={j} className="h-1.5 w-6 rounded-full" style={{ background: j <= k ? A : "rgba(255,255,255,.12)" }} />)}</div>
    {k < TOUR.length - 1 ? <Next onClick={() => setK(k + 1)} label="Próximo" />
      : <button className={styles.next} disabled={busy} onClick={onFinish}>{busy ? "Abrindo…" : "Começar a usar o BRIO"}</button>}
  </section>);
}
