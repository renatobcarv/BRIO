import Link from "next/link";
import type { Metadata } from "next";
import { BrioWordmark } from "@/components/brand";
import { SiteMotion } from "@/components/site/motion";
import { Pricing } from "@/components/site/pricing";

export const metadata: Metadata = { title: "BRIO · Constância com propósito", description: "Fé, corpo, dinheiro e estudos num só lugar. Missões diárias, sequência e XP que vêm do que você faz de verdade. A partir de R$ 0." };

const FIRE = "linear-gradient(135deg,#ff9f0a,#b7791f 70%)";

/** Celular com uma miniatura do app (desenhada em código, mostra o que o app faz de verdade). */
function Phone() {
  return (
    <div className="hero-stage" style={{ perspective: "1400px" }}>
      <div className="mx-auto w-[280px] sm:w-[310px] rounded-[10px] p-2.5 border border-white/15 bg-[#0b0b0d] shadow-[0_60px_120px_-40px_rgba(255,178,30,.6)]"
        style={{ transform: "rotateX(calc((1 - var(--p, 0)) * 18deg)) rotateZ(calc((1 - var(--p, 0)) * -4deg))", transition: "transform .1s linear" }}>
        <div className="rounded-[10px] overflow-hidden bg-black p-3.5 grid gap-2.5" aria-hidden>
          <div className="flex justify-between text-[10px] text-white/60 px-1"><span>9:41</span><span>●●● 5G</span></div>
          <div className="rounded-[8px] p-3 border" style={{ borderColor: "#ff9f0a99", background: "radial-gradient(90% 60% at 50% 0%, #3a0505, #0d0707)" }}>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              <div><p className="text-[9px] tracking-[.3em] text-[#ffb21e] font-bold">MISSÃO DIÁRIA · CHAMA</p><p className="text-[12px] font-semibold">Treinamento para ficar mais forte</p></div>
            </div>
            <div className="grid grid-cols-3 gap-1.5 mt-2.5 text-center">
              {[["5", "dias 100%"], ["12", "recorde"], ["4/6", "hoje"]].map(([v, l]) => <div key={l} className="rounded-lg bg-white/5 py-1.5"><p className="num text-base text-[#ffb21e]">{v}</p><p className="text-[8px] text-white/60">{l}</p></div>)}
            </div>
            {["Oração + estudo pessoal", "Treino feito", "Meta de água"].map((t, i) => (
              <div key={t} className="flex items-center justify-between mt-1.5 rounded-lg px-2 py-1.5 bg-white/[.04] text-[11px]"><span className={i < 2 ? "line-through text-white/50" : ""}>{t}</span><span className="font-mono text-[10px]" style={{ color: i < 2 ? "#ffb21e" : "#ffffff66" }}>[{i < 2 ? 1 : 0}/1]</span></div>))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[8px] p-2.5 border border-[#b7791f66]" style={{ background: "linear-gradient(160deg,#250404,#0a0a0a)" }}>
              <p className="text-[8px] tracking-[.25em] text-[#ffb21e] font-bold">COVIL</p><p className="text-[12px] font-semibold mt-0.5">Upper A</p>
              <div className="flex gap-0.5 mt-2">{[1, 1, 1, 0, 0].map((x, i) => <i key={i} className="h-5 flex-1 rounded-sm" style={{ background: x ? "#ff9f0a" : "#ffffff14" }} />)}</div>
            </div>
            <div className="rounded-[8px] p-2.5 border border-white/10 bg-white/[.03]">
              <p className="text-[8px] tracking-[.25em] text-[#ffb21e] font-bold">DIETA</p><p className="num text-[18px] mt-0.5">1.840</p><p className="text-[9px] text-white/60">de 2.500 kcal</p>
            </div>
          </div>
          <div className="rounded-[8px] p-2.5 border border-[#ff9f0a44] bg-[#0d0707] flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg grid place-items-center text-xs" style={{ background: "linear-gradient(135deg,#ff9f0a,#b7791f)" }}>✦</span>
            <p className="text-[11px] text-white/80">“reunião quinta 19h30 e dentista sábado” → <b className="text-white">2 compromissos</b></p>
          </div>
        </div>
      </div>
    </div>
  );
}

const BENTO = [
  { t: "Comece o dia sabendo o que importa", f: "missão diária", c: "#ffb21e", big: true, d: "Uma lista curta de objetivos com sequência, recorde e contagem até a meia-noite. O fogo cresce com a sua constância.", tex: "radial-gradient(70% 60% at 30% 20%, rgba(255,178,30,.28), transparent 70%)" },
  { t: "Treine com plano, não com palpite", f: "covil · periodização", c: "#ffb21e", wide: true, d: "Campanha em fases, sugestão de carga por série e um treino guiado com cronômetro.", tex: "repeating-linear-gradient(90deg, rgba(255,159,10,.12) 0 2px, transparent 2px 14px)" },
  { t: "Coma o que planejou (e registre o que não)", f: "dieta", c: "#ffb21e", d: "Metas de macros, refeições salvas e o que foi fora do plano, sem culpa.", tex: "radial-gradient(60% 60% at 80% 100%, rgba(255,159,10,.24), transparent 70%)" },
  { t: "Fale e a agenda se organiza", f: "central de operações · IA", c: "#ffb21e", d: "Linha do tempo do dia, Google Agenda em duas vias e IA que transforma frase em compromisso.", tex: "radial-gradient(50% 50% at 50% 50%, rgba(255,178,30,.2), transparent 60%)" },
  { t: "Seu dinheiro sem surpresa", f: "finanças · parcelas", c: "#ffb21e", wide: true, d: "Orçamento por categoria, compras parceladas que fecham no centavo e um assistente que lê seus números.", tex: "linear-gradient(180deg, rgba(255,159,10,.16), transparent 60%)" },
  { t: "Estude até fechar", f: "central de estudos", c: "#ffb21e", wide: true, d: "Objetivo, fraquezas, plano feito pela IA, revisão espaçada e o próximo passo sempre à vista.", tex: "radial-gradient(70% 60% at 20% 100%, rgba(255,159,10,.22), transparent 70%)" },
];
const FEATS = [
  ["Missão diária", "Comece o dia sabendo o que importa", "Poucos objetivos, o principal em destaque e contagem até a meia-noite. Bateu tudo? A sequência sobe."],
  ["Covil", "Treine com plano, não com palpite", "Campanha em fases, carga sugerida por série e treino guiado com cronômetro de descanso."],
  ["Dieta", "Coma o que planejou", "Macros do dia, refeições salvas e o que saiu do plano registrado sem culpa, de cerveja a pão com ovo."],
  ["Central de Operações", "Fale e a agenda se organiza", "Linha do tempo do dia, Google Agenda em duas vias e IA que transforma frase em compromisso."],
  ["Finanças", "Dinheiro sem surpresa", "Orçamento por categoria, parcelas que fecham no centavo e assistente que lê os seus números."],
  ["Central de Estudos", "Estude até fechar", "Objetivo, pontos fracos, plano feito pela IA e revisão espaçada no momento certo."],
  ["Espiritual", "Fé com rotina", "Leitura da Bíblia, estudo pessoal, diário e registro de ministério com metas de pioneiro."],
  ["Quadro de sonhos", "Lembre por quem você luta", "Fotos de quem você ama e do que quer conquistar, com prazo e o porquê de cada sonho."],
  ["Status", "Veja a sua evolução", "Patentes, XP, recordes e o bestiário de vitórias semanais. Constância vira prova."],
];
const LADDER = ["Brasa", "Chama", "Fogueira", "Inferno", "Fogo branco", "Rubi"];
const FAQ = [
  ["Preciso de cartão para testar?", "Não. Você cria a conta, usa 14 dias com tudo liberado e decide depois."],
  ["Funciona no celular?", "Foi feito primeiro para o celular. Abra no navegador e toque em “Adicionar à Tela de Início”: vira um app, sem loja."],
  ["De onde vem o XP?", "Só do que você registra de verdade: treino feito, refeição marcada, estudo com tempo. Clique vazio não vale ponto."],
  ["Meus dados ficam com quem?", "Com você. Cada conta só enxerga os próprios dados (bloqueio no banco), e você pode exportar tudo quando quiser."],
  ["E a parte espiritual?", "Leitura da Bíblia, estudo pessoal, diário e registro de ministério com metas de pioneiro. Textos bíblicos na Tradução do Novo Mundo."],
];

export default function Site() {
  const label = "in text-[11px] font-bold tracking-[.35em] uppercase text-[#ffb21e]";
  const h2 = "in font-display text-[clamp(30px,5vw,52px)] leading-[1.05] mt-3";
  const em = "bg-clip-text text-transparent [background-image:linear-gradient(90deg,#ffb21e,#ff9f0a)]";
  return (
    <main className="site min-h-dvh overflow-x-clip bg-[#050505]">
      <SiteMotion />
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 bg-white text-black px-3 py-2 rounded-lg">Pular para o conteúdo</a>
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-black/70 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <Link href="/sobre" aria-label="BRIO, início"><BrioWordmark height={26} /></Link>
          <nav aria-label="Seções" className="hidden md:flex gap-6 text-sm text-white/70">
            <a href="#produto" className="hover:text-white">Produto</a><a href="#pantera" className="hover:text-white">Por que</a><a href="#planos" className="hover:text-white">Planos</a><a href="#faq" className="hover:text-white">Dúvidas</a>
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/login" className="min-h-11 inline-flex items-center px-3 text-sm">Entrar</Link>
            <Link href="/cadastro?plano=essencial" className="min-h-11 inline-flex items-center px-4 rounded-full text-sm font-semibold text-white press" style={{ background: FIRE }}>Teste grátis</Link>
          </div>
        </div>
      </header>

      <div id="conteudo" />
      {/* hero com a pantera */}
      <section className="relative isolate">
        <img src="/pantera/olhar.webp" alt="" aria-hidden className="absolute right-[-18%] sm:right-0 top-0 h-full max-h-[900px] w-auto object-cover opacity-60 lg:opacity-90 -z-10 [mask-image:linear-gradient(90deg,transparent,#000_35%,#000_75%,transparent)]" />
        <div className="absolute inset-0 -z-20" style={{ background: "radial-gradient(45% 50% at 75% 35%, rgba(255,178,30,.22), transparent 70%)" }} />
        <div className="max-w-6xl mx-auto px-4 pt-14 sm:pt-24 pb-16 grid lg:grid-cols-[1.1fr_.9fr] gap-10 items-center">
          <div>
            <span className="in inline-flex items-center gap-2 rounded-full border border-[#ff9f0a66] bg-black/60 px-3 py-1.5 text-xs text-white/80" data-i="0"><i className="h-2 w-2 rounded-full bg-[#ffb21e] shadow-[0_0_10px_#ffb21e]" />14 dias grátis · sem cartão</span>
            <h1 className="in font-display text-[clamp(42px,8.5vw,84px)] leading-[.98] mt-5" data-i="1">Pare de começar.<br /><span className={em}>Comece a continuar</span><span className="text-[#ffb21e]">.</span></h1>
            <p className="in text-lg text-white/75 mt-6 max-w-xl" data-i="2">Motivação acaba na quarta-feira. A pantera não caça por motivação, caça por instinto. O BRIO transforma fé, treino, dieta, dinheiro e estudos numa rotina que você repete até virar quem você é.</p>
            <div className="in flex flex-col sm:flex-row gap-3 mt-8" data-i="3">
              <Link href="/cadastro?plano=essencial" className="min-h-14 px-8 rounded-[8px] grid place-items-center font-semibold text-white press" style={{ background: FIRE, boxShadow: "0 18px 40px -14px #ff9f0a" }}>Quero minha rotina de pantera →</Link>
              <a href="#produto" className="min-h-14 px-8 rounded-[8px] grid place-items-center border border-white/15 bg-black/40 press">Ver o que tem dentro</a>
            </div>
            <ul className="in flex flex-wrap gap-x-5 gap-y-2 mt-6 text-sm text-white/65" data-i="4">{["A partir de R$ 0", "Celular e computador", "Seus dados só seus"].map((t) => <li key={t} className="flex items-center gap-1.5"><span className="text-[#ffb21e]">✓</span>{t}</li>)}</ul>
          </div>
          <div className="in" data-i="2"><Phone /></div>
        </div>
        <div className="max-w-6xl mx-auto px-4 pb-14">
          <p className="text-center text-[11px] tracking-[.3em] uppercase text-white/50 mb-4">O dia que você já entende</p>
          <div className="flex flex-wrap justify-center gap-2">
            {["Oração", "Leitura da Bíblia", "Treino", "Água", "Refeições", "Estudo", "Orçamento", "Sono"].map((p, i) => <span key={p} className="rounded-full border border-white/10 bg-white/[.04] px-4 py-2 text-sm" style={i === 2 ? { borderColor: "#ff9f0a", background: "#ff9f0a22" } : i === 5 ? { borderColor: "#ffb21e", color: "#ffb21e" } : undefined}>{p}</span>)}
          </div>
        </div>
      </section>

      {/* marquee */}
      <div className="border-y border-white/5 py-4 overflow-hidden" aria-hidden>
        <div className="flex gap-10 whitespace-nowrap w-max animate-[marq_40s_linear_infinite] text-white/50 font-mono text-sm uppercase tracking-widest">
          {[...FEATS, ...FEATS].map(([k], i) => <span key={i}><span className="text-[#ffb21e] mr-3">●</span>{k}</span>)}
        </div>
      </div>

      {/* a pantera */}
      <section id="pantera" className="relative scroll-mt-20 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-24 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className={label}>Instinto, não humor</p>
            <h2 className={h2}>Enquanto você espera vontade,<br /><span className={em}>a pantera já caçou.</span></h2>
            <p className="in text-lg text-white/75 mt-6">Ela não pensa se está a fim. Ela observa, espera o momento e age. O BRIO faz o mesmo com você: mostra a próxima ação, conta o tempo até a meia-noite e transforma cada dia cumprido em sequência. Disciplina repetida vira caráter.</p>
            <Link href="/cadastro?plano=essencial" className="in inline-grid place-items-center min-h-14 px-8 mt-8 rounded-[8px] font-semibold text-white press" style={{ background: FIRE }}>Começar hoje →</Link>
          </div>
          <div className="in relative mx-auto w-full max-w-[440px] aspect-[4/5]">
            <img src="/pantera/sentada.webp" alt="Pantera negra sentada, olhar fixo: o mascote do BRIO" loading="lazy" className="absolute inset-0 h-full w-full object-cover rounded-[10px] border border-white/10" />
            <div className="absolute inset-0 rounded-[10px]" style={{ background: "radial-gradient(60% 40% at 50% 100%, rgba(255,178,30,.35), transparent 70%)" }} />
            {[["21 dias", "sequência", "left-[-6%] top-[14%]"], ["+40 XP", "treino feito", "right-[-6%] top-[42%]"], ["6/6", "missões hoje", "left-[4%] bottom-[8%]"]].map(([b, t, pos]) => (
              <span key={t} className={`absolute ${pos} rounded-[8px] border border-[#ff9f0a66] bg-black/75 backdrop-blur px-4 py-2.5`}><b className="num block text-xl text-[#ffb21e]">{b}</b><span className="text-xs text-white/70">{t}</span></span>))}
          </div>
        </div>
      </section>

      {/* funcionalidades numeradas */}
      <section id="produto" className="max-w-6xl mx-auto px-4 py-20 scroll-mt-20">
        <p className={label}>O que muda na sua vida</p>
        <h2 className={h2}>Menos apps. <span className={em}>Mais constância.</span></h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-10">
          {FEATS.map(([k, t, d], i) => (
            <article key={k} data-i={i % 3} className="in tilt glowcard relative rounded-[10px] p-6 border border-white/10 bg-[#0b0b0b] overflow-hidden">
              <span className="font-mono text-xs text-[#ffb21e]">{String(i + 1).padStart(3, "0")}</span>
              <h3 className="font-display text-xl mt-3 leading-tight">{t}</h3>
              <p className="font-mono text-[11px] uppercase tracking-wider text-[#ffb21e] mt-1">{k}</p>
              <p className="text-sm text-white/70 mt-3">{d}</p>
            </article>))}
        </div>
      </section>

      {/* gamificação */}
      <section className="max-w-6xl mx-auto px-4 py-20 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <p className={label}>Gamificação de verdade</p>
          <h2 className={h2}>Quem se vê evoluir, continua. <span className={em}>Quem continua, vence.</span></h2>
          <div className="in mt-6 rounded-[8px] border-l-4 border-[#ff9f0a] bg-white/[.04] p-5 text-white/85"><b>XP só sai de ação real.</b> Treino registrado, refeição marcada, estudo com tempo, leitura feita. Clique vazio não vale ponto.</div>
          <ul className="grid gap-4 mt-6">
            {[["Missões do dia", "Poucos objetivos, tirados do seu plano. Você sabe por onde começar."], ["Sequência e fogo", "Dias seguidos mudam a cor do fogo, da brasa ao rubi."], ["Eventos e bestiário", "Desafios semanais que viram troféus guardados."]].map(([t, d], i) => (
              <li key={t} data-i={i} className="in flex gap-3"><span className="mt-1 h-2.5 w-2.5 shrink-0 bg-[#ffb21e]" /><div><b>{t}</b><p className="text-sm text-white/65">{d}</p></div></li>))}
          </ul>
        </div>
        <div className="in tilt relative rounded-[10px] border border-white/10 bg-[#0b0b0b] p-6">
          <div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full px-3 py-1 text-black font-semibold bg-[#ffb21e]">Nível 7 · 1.240 XP</span><span className="rounded-full px-3 py-1 text-white" style={{ background: FIRE }}>+40 XP treino feito</span></div>
          <p className="text-xs text-white/50 mt-6 uppercase tracking-widest">Seu fogo</p><p className="font-display text-3xl mt-1">Fogueira<span className="text-[#ffb21e]">.</span></p>
          <div className="h-2 rounded-full bg-white/10 mt-4 overflow-hidden"><i className="block h-full w-[62%]" style={{ background: FIRE }} /></div>
          <ol className="grid gap-1.5 mt-6">{LADDER.map((n, i) => <li key={n} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${i === 2 ? "bg-[#ff9f0a26] border border-[#ff9f0a66]" : "bg-white/[.03]"}`}><span className="font-mono text-xs text-white/40">{String(i + 1).padStart(2, "0")}</span>{n}</li>)}</ol>
        </div>
      </section>

      {/* passos */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <p className={label}>Como começa</p>
        <h2 className={h2}>Hoje à noite <span className={em}>você já tem uma rotina.</span></h2>
        <ol className="grid md:grid-cols-3 gap-4 mt-10">
          {[["Monte", "Diga o que quer cuidar: fé, corpo, dinheiro, estudos. O BRIO sugere as missões."], ["Cumpra", "Abra de manhã, faça e registre com um toque. Cada registro vira XP."], ["Ajuste", "Veja a semana, os recordes e onde travou. Corte o que não serve."]].map(([t, d], i) => (
            <li key={t} data-i={i} className="in rounded-[10px] p-6 border border-white/10 bg-white/[.03]">
              <span className={`num text-4xl ${em}`}>{i + 1}</span><h3 className="font-display text-xl mt-2">{t}</h3><p className="text-sm text-white/70 mt-1">{d}</p>
            </li>))}
        </ol>
      </section>

      {/* confiança */}
      <section className="bg-[#f5f5f7] text-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <p className="in text-[11px] font-bold tracking-[.35em] uppercase text-[#b7791f]">Privacidade</p>
          <h2 className="in font-display text-[clamp(30px,5vw,48px)] mt-3">Sua vida é sua.</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
            {[["Só você vê", "Cada conta enxerga apenas os próprios dados, com bloqueio no banco."], ["Fotos privadas", "As fotos ficam num cofre privado, com link temporário."], ["Chaves no servidor", "Chaves de IA e de integração nunca chegam ao navegador."], ["Sai quando quiser", "Seus registros podem ser exportados a qualquer momento."]].map(([t, d], i) => (
              <div key={t} data-i={i} className="in rounded-[8px] bg-white p-5 border border-black/10"><b>{t}</b><p className="text-sm text-black/65 mt-1">{d}</p></div>))}
          </div>
        </div>
      </section>

      {/* história */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <p className={label}>Por que o BRIO existe</p>
        <h2 className={h2}>Nasceu de uma rotina real, <span className={em}>não de uma sala de reunião.</span></h2>
        <div className="grid md:grid-cols-3 gap-4 mt-10">
          {[["O problema", "Um app para treino, outro para dieta, planilha para dinheiro, caderno para estudo. Tudo separado, nada constante."], ["A virada", "Juntar tudo num lugar só, com uma missão por dia e um fogo que mostra a constância. O que é medido, é cuidado."], ["A missão", "Ajudar quem quer viver com ordem: cuidar da fé, do corpo, da família e do dinheiro com responsabilidade antes do conforto."]].map(([t, d], i) => (
            <article key={t} data-i={i} className={`in tilt relative rounded-[10px] p-6 border ${i === 2 ? "border-[#ff9f0a88]" : "border-white/10"} bg-[#0b0b0b]`} style={i === 2 ? { background: "radial-gradient(80% 80% at 50% 120%, rgba(255,178,30,.3), #0b0b0b)" } : undefined}>
              <span className="font-mono text-xs uppercase tracking-wider text-[#ffb21e]">{t}</span><p className="text-white/80 mt-3">{d}</p>
            </article>))}
        </div>
      </section>

      {/* mito x fato */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <h2 className={`${h2} text-center`}>Mito <span className={em}>×</span> fato</h2>
        <div className="grid sm:grid-cols-2 gap-3 mt-10">
          {[["Mito", "“Preciso de motivação para começar.”"], ["Fato", "Motivação vem depois da ação. Comece pequeno e repita."], ["Mito", "“Segunda-feira eu começo.”"], ["Fato", "O BRIO conta até a meia-noite de hoje. O dia 1 é agora."]].map(([k, t], i) => (
            <div key={i} data-i={i} className={`in rounded-[8px] p-5 border ${k === "Fato" ? "border-[#ff9f0a88] bg-[#ff9f0a14]" : "border-white/10 bg-white/[.03] text-white/60"}`}>
              <span className={`text-xs font-bold uppercase tracking-widest ${k === "Fato" ? "text-[#ffb21e]" : "text-white/40"}`}>{k === "Fato" ? "✓ Fato" : "✕ Mito"}</span><p className="mt-2 text-lg">{t}</p>
            </div>))}
        </div>
      </section>

      {/* planos */}
      <section id="planos" className="max-w-6xl mx-auto px-4 py-20 scroll-mt-20">
        <p className={`${label} text-center`}>Planos</p>
        <h2 className={`${h2} text-center`}>Preço de hábito, <span className={em}>não de luxo.</span></h2>
        <p className="in text-center text-white/70 mt-2">Comece de graça. Suba de plano quando fizer sentido.</p>
        <div className="mt-8"><Pricing /></div>
      </section>

      {/* faq */}
      <section id="faq" className="max-w-6xl mx-auto px-4 py-20 grid lg:grid-cols-[.8fr_1.2fr] gap-10 scroll-mt-20">
        <div><p className={label}>Dúvidas</p><h2 className={h2}>Perguntas frequentes</h2></div>
        <div className="grid gap-2">
          {FAQ.map(([q, a], i) => (
            <details key={q} data-i={i} className="in group rounded-[8px] border border-white/10 bg-white/[.03] px-5 open:bg-white/[.05]">
              <summary className="min-h-14 flex items-center justify-between gap-4 cursor-pointer list-none font-medium">{q}<span aria-hidden className="text-muted transition-transform group-open:rotate-45 text-xl">+</span></summary>
              <p className="pb-5 text-white/75 text-[15px]">{a}</p>
            </details>))}
        </div>
      </section>

      {/* cta final com e-mail */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="in relative rounded-[10px] p-8 sm:p-16 text-center overflow-hidden border border-[#ff9f0a66]" style={{ background: "radial-gradient(80% 90% at 50% 120%, rgba(255,159,10,.55), transparent 60%), #0a0505" }}>
          <img src="/pantera/olhar.webp" alt="" aria-hidden loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-25 -z-0" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[.3em] text-white/60">14 dias grátis · sem cartão · cancele quando quiser</p>
            <h2 className="font-display text-[clamp(32px,6vw,60px)] mt-4 leading-tight">A próxima versão de você <span className={em}>começa com seu e-mail.</span></h2>
            <form action="/cadastro" method="get" className="mt-8 mx-auto max-w-lg flex flex-col sm:flex-row gap-2 rounded-[8px] sm:rounded-full border border-white/15 bg-black/70 p-2">
              <input type="hidden" name="plano" value="essencial" />
              <label htmlFor="cta-email" className="sr-only">E-mail</label>
              <input id="cta-email" name="email" type="email" inputMode="email" autoComplete="email" required placeholder="voce@email.com" className="flex-1 min-h-12 bg-transparent px-4 outline-none text-white placeholder:text-white/40" />
              <button type="submit" className="min-h-12 px-6 rounded-full font-semibold text-white press" style={{ background: FIRE }}>Criar conta →</button>
            </form>
            <a href="#planos" className="inline-block mt-4 text-sm text-white/60 underline">Ou compare os planos</a>
          </div>
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
