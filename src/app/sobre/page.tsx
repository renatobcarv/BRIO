import Link from "next/link";
import type { Metadata } from "next";
import { BrioMark, BrioWordmark } from "@/components/brand";
import { SiteMotion } from "@/components/site/motion";
import { Pricing } from "@/components/site/pricing";

export const metadata: Metadata = { title: "BRIO · Constância com propósito", description: "Fé, corpo, dinheiro e estudos num só lugar. Missões diárias, sequência e XP que vêm do que você faz de verdade. A partir de R$ 0." };

const FIRE = "linear-gradient(135deg,#d12b65,#b51224 70%)";

/** Celular com uma miniatura do app (desenhada em código, mostra o que o app faz de verdade). */
function Phone() {
  return (
    <div className="hero-stage" style={{ perspective: "1400px" }}>
      <div className="mx-auto w-[280px] sm:w-[310px] rounded-[44px] p-2.5 border border-white/15 bg-[#0b0b0d] shadow-[0_60px_120px_-40px_rgba(209,43,101,.6)]"
        style={{ transform: "rotateX(calc((1 - var(--p, 0)) * 18deg)) rotateZ(calc((1 - var(--p, 0)) * -4deg))", transition: "transform .1s linear" }}>
        <div className="rounded-[36px] overflow-hidden bg-black p-3.5 grid gap-2.5" aria-hidden>
          <div className="flex justify-between text-[10px] text-white/60 px-1"><span>9:41</span><span>●●● 5G</span></div>
          <div className="rounded-2xl p-3 border" style={{ borderColor: "#d12b6599", background: "radial-gradient(90% 60% at 50% 0%, #3a0618, #0d070a)" }}>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              <div><p className="text-[9px] tracking-[.3em] text-[#ff4d8a] font-bold">MISSÃO DIÁRIA · CHAMA</p><p className="text-[12px] font-semibold">Treinamento para ficar mais forte</p></div>
            </div>
            <div className="grid grid-cols-3 gap-1.5 mt-2.5 text-center">
              {[["5", "dias 100%"], ["12", "recorde"], ["4/6", "hoje"]].map(([v, l]) => <div key={l} className="rounded-lg bg-white/5 py-1.5"><p className="num text-base text-[#ff4d8a]">{v}</p><p className="text-[8px] text-white/60">{l}</p></div>)}
            </div>
            {["Oração + estudo pessoal", "Treino feito", "Meta de água"].map((t, i) => (
              <div key={t} className="flex items-center justify-between mt-1.5 rounded-lg px-2 py-1.5 bg-white/[.04] text-[11px]"><span className={i < 2 ? "line-through text-white/50" : ""}>{t}</span><span className="font-mono text-[10px]" style={{ color: i < 2 ? "#ff4d8a" : "#ffffff66" }}>[{i < 2 ? 1 : 0}/1]</span></div>))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl p-2.5 border border-[#b5122466]" style={{ background: "linear-gradient(160deg,#2a050b,#0a0a0a)" }}>
              <p className="text-[8px] tracking-[.25em] text-[#ff4d8a] font-bold">WAR ROOM</p><p className="text-[12px] font-semibold mt-0.5">Upper A</p>
              <div className="flex gap-0.5 mt-2">{[1, 1, 1, 0, 0].map((x, i) => <i key={i} className="h-5 flex-1 rounded-sm" style={{ background: x ? "#d12b65" : "#ffffff14" }} />)}</div>
            </div>
            <div className="rounded-2xl p-2.5 border border-white/10 bg-white/[.03]">
              <p className="text-[8px] tracking-[.25em] text-[#ff4d8a] font-bold">DIETA</p><p className="num text-[18px] mt-0.5">1.840</p><p className="text-[9px] text-white/60">de 2.500 kcal</p>
            </div>
          </div>
          <div className="rounded-2xl p-2.5 border border-[#d12b6544] bg-[#0d070a] flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg grid place-items-center text-xs" style={{ background: "linear-gradient(135deg,#d12b65,#b51224)" }}>✦</span>
            <p className="text-[11px] text-white/80">“reunião quinta 19h30 e dentista sábado” → <b className="text-white">2 compromissos</b></p>
          </div>
        </div>
      </div>
    </div>
  );
}

const BENTO = [
  { t: "Comece o dia sabendo o que importa", f: "missão diária", c: "#ff4d8a", big: true, d: "Uma lista curta de objetivos com sequência, recorde e contagem até a meia-noite. O fogo cresce com a sua constância.", tex: "radial-gradient(70% 60% at 30% 20%, rgba(209,43,101,.28), transparent 70%)" },
  { t: "Treine com plano, não com palpite", f: "war room · periodização", c: "#ff4d8a", wide: true, d: "Campanha em fases, sugestão de carga por série e um treino guiado com cronômetro.", tex: "repeating-linear-gradient(90deg, rgba(181,18,36,.12) 0 2px, transparent 2px 14px)" },
  { t: "Coma o que planejou (e registre o que não)", f: "dieta", c: "#ff4d8a", d: "Metas de macros, refeições salvas e o que foi fora do plano, sem culpa.", tex: "radial-gradient(60% 60% at 80% 100%, rgba(181,18,36,.24), transparent 70%)" },
  { t: "Fale e a agenda se organiza", f: "central de operações · IA", c: "#ff4d8a", d: "Linha do tempo do dia, Google Agenda em duas vias e IA que transforma frase em compromisso.", tex: "radial-gradient(50% 50% at 50% 50%, rgba(209,43,101,.2), transparent 60%)" },
  { t: "Seu dinheiro sem surpresa", f: "finanças · parcelas", c: "#ff4d8a", wide: true, d: "Orçamento por categoria, compras parceladas que fecham no centavo e um assistente que lê seus números.", tex: "linear-gradient(180deg, rgba(181,18,36,.16), transparent 60%)" },
  { t: "Estude até fechar", f: "central de estudos", c: "#ff4d8a", wide: true, d: "Objetivo, fraquezas, plano feito pela IA, revisão espaçada e o próximo passo sempre à vista.", tex: "radial-gradient(70% 60% at 20% 100%, rgba(181,18,36,.22), transparent 70%)" },
];
const FAQ = [
  ["Preciso de cartão para testar?", "Não. Você cria a conta, usa 14 dias com tudo liberado e decide depois."],
  ["Funciona no celular?", "Foi feito primeiro para o celular. Abra no navegador e toque em “Adicionar à Tela de Início”: vira um app, sem loja."],
  ["De onde vem o XP?", "Só do que você registra de verdade: treino feito, refeição marcada, estudo com tempo. Clique vazio não vale ponto."],
  ["Meus dados ficam com quem?", "Com você. Cada conta só enxerga os próprios dados (bloqueio no banco), e você pode exportar tudo quando quiser."],
  ["E a parte espiritual?", "Leitura da Bíblia, estudo pessoal, diário e registro de ministério com metas de pioneiro. Textos bíblicos na Tradução do Novo Mundo."],
];

export default function Site() {
  return (
    <main className="site min-h-dvh overflow-x-clip">
      <SiteMotion />
      {/* topo */}
      <nav className="sticky top-0 z-40 backdrop-blur-xl bg-black/60 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/sobre" className="flex items-center gap-2"><BrioWordmark height={26} /></Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <a href="#planos" className="hidden sm:inline-flex min-h-11 items-center px-3 text-sm text-muted hover:text-ink">Planos</a>
            <Link href="/login" className="min-h-11 inline-flex items-center px-3 text-sm">Entrar</Link>
            <Link href="/cadastro?plano=essencial" className="min-h-11 inline-flex items-center px-4 rounded-full text-sm font-semibold text-white press" style={{ background: FIRE }}>Começar grátis</Link>
          </div>
        </div>
      </nav>

      {/* hero */}
      <section className="relative max-w-6xl mx-auto px-4 pt-12 sm:pt-20 pb-10 grid lg:grid-cols-2 gap-10 items-center">
        <div className="absolute inset-x-0 -top-20 h-[520px] -z-10 pointer-events-none" style={{ background: "radial-gradient(50% 50% at 30% 30%, rgba(209,43,101,.24), transparent 70%), radial-gradient(40% 40% at 80% 20%, rgba(181,18,36,.2), transparent 70%)" }} />
        <div className="text-center lg:text-left">
          <p className="in text-[11px] font-bold tracking-[.35em] text-[#ff4d8a]" data-i="0">CONSTÂNCIA COM PROPÓSITO</p>
          <h1 className="in font-display text-[clamp(40px,8vw,72px)] leading-[1.02] mt-4" data-i="1">Faça o certo de novo amanhã.<br /><span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg,#ff4d8a,#d12b65,#b51224)" }}>E veja isso crescer.</span></h1>
          <p className="in text-lg text-white/75 mt-5 max-w-xl mx-auto lg:mx-0" data-i="2">Fé, treino, dieta, dinheiro e estudos num app só. Missões curtas todo dia, sequência que vira fogo e XP que vem do que você faz de verdade.</p>
          <div className="in flex flex-col sm:flex-row gap-3 mt-8 justify-center lg:justify-start" data-i="3">
            <Link href="/cadastro?plano=essencial" className="min-h-14 px-8 rounded-2xl grid place-items-center font-semibold text-white press" style={{ background: FIRE, boxShadow: "0 18px 40px -16px #d12b65" }}>Testar 14 dias grátis</Link>
            <a href="#planos" className="min-h-14 px-8 rounded-2xl grid place-items-center border border-white/15 press">Ver planos · a partir de R$ 0</a>
          </div>
          <p className="in text-xs text-muted mt-4" data-i="4">Sem cartão. Funciona no celular e no computador.</p>
        </div>
        <div className="in" data-i="2"><Phone /></div>
      </section>

      {/* bento */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <p className="in text-center text-[11px] font-bold tracking-[.35em] text-muted">TUDO QUE VOCÊ CUIDA, NUM LUGAR</p>
        <h2 className="in font-display text-[clamp(30px,5vw,48px)] text-center mt-3">Menos apps. Mais constância.</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-10">
          {BENTO.map((b, i) => (
            <article key={b.t} data-i={i} className={`in tilt glowcard relative rounded-[26px] p-6 border border-white/10 overflow-hidden ${b.big ? "sm:col-span-2 lg:row-span-2" : b.wide ? "sm:col-span-2" : ""}`}
              style={{ background: `${b.tex}, #0b0b0d` }}>
              <p className="font-mono text-[11px] uppercase tracking-wider" style={{ color: b.c }}>{b.f}</p>
              <h3 className={`font-display mt-2 leading-tight ${b.big ? "text-3xl" : "text-xl"}`}>{b.t}</h3>
              <p className="text-sm text-white/70 mt-2">{b.d}</p>
              {b.big && <div className="mt-6 flex items-end gap-3" aria-hidden>{["#f5f5f7", "#ff8fb5", "#ff4d8a", "#d12b65", "#b51224", "#7a0c18"].map((c, k) => <span key={c} className="text-[28px] leading-none" style={{ filter: `drop-shadow(0 0 ${6 + k * 3}px ${c})`, fontSize: 18 + k * 6 }}>🔥</span>)}</div>}
            </article>))}
        </div>
      </section>

      {/* como funciona */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="in font-display text-[clamp(30px,5vw,48px)] text-center">Três passos. Todo dia.</h2>
        <ol className="grid md:grid-cols-3 gap-4 mt-10">
          {[["1", "Abra e veja a missão", "Poucos objetivos, o principal em destaque e quanto tempo falta para o dia acabar."], ["2", "Faça e registre", "Treino guiado, refeição com um toque, estudo com cronômetro. Cada registro vira XP."], ["3", "Veja o fogo crescer", "Sequência que muda de cor, patentes, eventos semanais e um bestiário de vitórias."]].map(([n, t, d], i) => (
            <li key={n} data-i={i} className="in rounded-[26px] p-6 border border-white/10 bg-white/[.03]">
              <span className="num text-4xl bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg,#ff4d8a,#d12b65)" }}>{n}</span>
              <h3 className="font-display text-xl mt-2">{t}</h3><p className="text-sm text-white/70 mt-1">{d}</p>
            </li>))}
        </ol>
      </section>

      {/* planos */}
      <section id="planos" className="max-w-6xl mx-auto px-4 py-16 scroll-mt-20">
        <p className="in text-center text-[11px] font-bold tracking-[.35em] text-[#ff4d8a]">PLANOS</p>
        <h2 className="in font-display text-[clamp(30px,5vw,48px)] text-center mt-3">Preço de hábito, não de luxo.</h2>
        <p className="in text-center text-white/70 mt-2">Comece de graça. Suba de plano quando fizer sentido.</p>
        <div className="mt-8"><Pricing /></div>
      </section>

      {/* faq */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="in font-display text-[clamp(28px,4vw,40px)] text-center">Perguntas comuns</h2>
        <div className="grid gap-2 mt-8">
          {FAQ.map(([q, a], i) => (
            <details key={q} data-i={i} className="in group rounded-2xl border border-white/10 bg-white/[.03] px-5 open:bg-white/[.05]">
              <summary className="min-h-14 flex items-center justify-between gap-4 cursor-pointer list-none font-medium">{q}<span aria-hidden className="text-muted transition-transform group-open:rotate-45 text-xl">+</span></summary>
              <p className="pb-5 text-white/75 text-[15px]">{a}</p>
            </details>))}
        </div>
      </section>

      {/* cta final */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="in relative rounded-[36px] p-10 sm:p-16 text-center overflow-hidden border border-[#d12b6566]" style={{ background: "radial-gradient(80% 90% at 50% 120%, rgba(181,18,36,.5), transparent 60%), #0d0609" }}>
          <div className="mx-auto w-fit"><BrioMark size={72} /></div>
          <h2 className="font-display text-[clamp(30px,6vw,56px)] mt-6 leading-tight">Hoje é o dia 1.</h2>
          <p className="text-white/75 mt-3 max-w-md mx-auto">O que você fizer de toda a alma hoje vira a base de amanhã.</p>
          <Link href="/cadastro?plano=essencial" className="inline-grid place-items-center min-h-14 px-10 mt-8 rounded-2xl font-semibold text-white press" style={{ background: FIRE, boxShadow: "0 18px 40px -16px #d12b65" }}>Criar minha conta grátis</Link>
        </div>
      </section>

      <footer className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row gap-3 items-center justify-between text-sm text-muted">
          <span className="flex items-center gap-3"><BrioWordmark height={18} /> Vigor com honra</span>
          <span className="flex gap-4"><Link href="/privacidade" className="hover:text-ink min-h-11 inline-flex items-center">Privacidade</Link><Link href="/termos" className="hover:text-ink min-h-11 inline-flex items-center">Termos</Link><Link href="/login" className="hover:text-ink min-h-11 inline-flex items-center">Entrar</Link></span>
        </div>
      </footer>
    </main>
  );
}
