import Link from "next/link";
import type { Metadata } from "next";
import { BrioMark } from "@/components/brand";

export const metadata: Metadata = { title: "BRIO · Vigor com honra", description: "Um sistema pessoal de constância: vida espiritual, serviço, corpo, finanças e metas." };

const PILARES = [
  { c: "#ffb340", t: "Vida espiritual", d: "Estudo, leitura da Bíblia e reflexão em primeiro lugar. O resto se organiza em volta disso." },
  { c: "#0a84ff", t: "Ministério", d: "Horas, revisitas e estudos com metas mensais claras e um registro sem atrito." },
  { c: "#e0393e", t: "War Room", d: "Campanhas de treino periodizadas, progressão de carga e eventos que testam a execução." },
  { c: "#30d158", t: "Corpo", d: "Água, dieta, peso e sono: o básico bem feito, todos os dias." },
  { c: "#64d2ff", t: "Finanças", d: "Dinheiro como ferramenta: orçamento, reservas, investimentos e patrimônio." },
  { c: "#bf5af2", t: "Metas", d: "Objetivos de longo prazo quebrados em passos que cabem na semana." },
];
const RANKS = ["Initiate", "Squire", "Sentinel", "Vanguard", "Paladin", "Warden", "Champion", "Sovereign", "Ascendant", "Apex"];

export default function Sobre() {
  return (
    <main className="min-h-dvh brio-aura px-4 pb-16">
      <div className="max-w-xl mx-auto">
        <section className="flex flex-col items-center text-center pt-16 rise">
          <BrioMark size={128} />
          <h1 className="font-display text-6xl tracking-[.22em] mt-6 pl-[.22em]">BRIO</h1>
          <p className="text-lg text-ink/85 mt-3">Vigor com honra.</p>
          <p className="text-sm text-muted mt-4 max-w-sm">Um sistema pessoal de constância. Não é sobre motivação, é sobre estrutura: fazer o certo de novo amanhã.</p>
          <Link href="/login" className="press mt-8 min-h-14 px-10 rounded-2xl grid place-items-center font-semibold text-white"
            style={{ background: "linear-gradient(160deg,#ff6a3d,#e0393e 55%,#8a1a1d)", boxShadow: "0 14px 34px -14px #e0393e" }}>Entrar</Link>
        </section>

        <section className="mt-16 rise rise-1">
          <p className="text-[11px] font-semibold tracking-[.3em] text-muted">O NOME</p>
          <p className="font-display text-2xl mt-3 leading-snug"><b>brio</b> <span className="text-muted text-base">s.m.</span> amor-próprio, honra, coragem e determinação.</p>
          <ul className="grid gap-3 mt-5 text-sm text-ink/80">
            <li><b className="text-ink">Honra.</b> O que impede de aceitar a mediocridade e leva a cumprir o dever com responsabilidade.</li>
            <li><b className="text-ink">Coragem.</b> A força interior para enfrentar obstáculos e derrotas sem baixar a cabeça.</li>
            <li><b className="text-ink">Persistência.</b> A energia de não se conformar com o superficial e buscar o melhor de si.</li>
          </ul>
        </section>

        <section className="mt-16">
          <p className="text-[11px] font-semibold tracking-[.3em] text-muted">OS PILARES</p>
          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            {PILARES.map((p, i) => (
              <div key={p.t} className="rise rounded-3xl p-5 border" style={{ animationDelay: `${i * 60}ms`, borderColor: p.c + "33", background: `linear-gradient(160deg, ${p.c}14, #0a0a0c 60%)` }}>
                <span className="block h-1.5 w-8 rounded-full" style={{ background: p.c, boxShadow: `0 0 12px ${p.c}` }} />
                <p className="font-semibold mt-3">{p.t}</p>
                <p className="text-sm text-muted mt-1">{p.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <p className="text-[11px] font-semibold tracking-[.3em]" style={{ color: "#ffb340" }}>ASCENSION</p>
          <p className="font-display text-2xl mt-3">Cada dia cumprido vira XP.</p>
          <p className="text-sm text-muted mt-2">Dez patentes, atributos, insígnias e eventos. A gamificação está lá para tornar visível o que a constância constrói em silêncio.</p>
          <div className="flex flex-wrap gap-1.5 mt-4">{RANKS.map((r, i) => <span key={r} className="tag" style={{ opacity: .45 + i * .06 }}>{r}</span>)}</div>
        </section>

        <section className="mt-16 text-center">
          <p className="font-display italic text-xl text-ink/90 leading-snug">“O que a pessoa semear, isso também colherá.”</p>
          <p className="text-xs text-muted mt-2">Gálatas 6:7</p>
          <p className="text-[11px] text-faint mt-12">BRIO é um app pessoal e privado. O acesso é restrito.</p>
        </section>
      </div>
    </main>
  );
}
