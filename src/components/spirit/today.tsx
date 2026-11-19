"use client";
import { useState, useTransition } from "react";
import { addJournal } from "@/app/(app)/espiritual/actions";
import { useXp } from "@/components/game/xp";

// Perguntas de reflexão (autoria própria, sem citar textos). Uma por dia.
const Q = [
  "Pelo que você é grato a Jeová hoje, de forma bem específica?",
  "Que qualidade de Jeová você percebeu em algo pequeno esta semana?",
  "Que pessoa você pode encorajar hoje, e como?",
  "O que está pesando no seu coração que você ainda não entregou em oração?",
  "Que decisão de hoje mostraria que o Reino vem em primeiro lugar?",
  "Que ponto do seu estudo recente você pode aplicar ainda hoje?",
  "Onde você precisa de mais paciência, e com quem?",
  "Que pensamento você quer vigiar hoje?",
  "Qual promessa de Jeová mais te dá força agora?",
  "O que você aprendeu com uma dificuldade recente?",
  "Como sua família pode sentir o amor de Jeová por meio de você hoje?",
  "Que conversa no ministério você quer preparar melhor?",
  "Que hábito te aproxima de Jeová e merece mais espaço?",
  "Pelo que você quer pedir perdão e o que vai fazer diferente?",
];

export function SpiritToday({ today, bibleToday, studyMin, prayed, grateful }: { today: string; bibleToday: boolean; studyMin: number; prayed: boolean; grateful: boolean }) {
  const { gain, celebrate } = useXp();
  const [g, setG] = useState(["", "", ""]);
  const [done, setDone] = useState(grateful);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const day = Math.floor(Date.parse(today + "T12:00:00Z") / 864e5);
  const q = Q[day % Q.length];
  const steps = [["Leitura da Bíblia", bibleToday], ["Estudo pessoal", studyMin > 0], ["Oração registrada", prayed], ["Gratidão", done]] as const;
  const n = steps.filter(([, ok]) => ok).length;
  return (
    <section className="hunt-card relative p-5 lg:p-7 mb-4 span-all overflow-hidden">
      <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full" style={{ background: "radial-gradient(circle, rgba(242,223,174,.18), transparent 70%)" }} />
      <p className="label">Momento de hoje</p>
      <p className="serif text-[22px] sm:text-[26px] leading-snug mt-2 max-w-[40ch] text-white/90" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}>{q}</p>
      <div className="grid sm:grid-cols-4 gap-px bg-white/[.06] border border-white/[.06] mt-5">
        {steps.map(([l, ok]) => (
          <div key={l} className="bg-[#070a0e] px-3 py-2.5 flex items-center gap-2">
            <span className="h-5 w-5 grid place-items-center border" style={{ borderColor: ok ? "#9fd0f5" : "rgba(255,255,255,.2)", background: ok ? "#9fd0f5" : "transparent" }}>{ok && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#06121d" strokeWidth="3" aria-hidden><path d="M5 12l5 5L20 7" /></svg>}</span>
            <span className={`text-[13px] ${ok ? "text-white" : "text-white/55"}`}>{l}</span>
          </div>))}
      </div>
      <p className="text-[12px] text-white/50 mt-2">{n === 4 ? "Dia completo com Jeová." : `${n} de 4 hoje. Pequenos passos, todo dia.`}</p>
      {!done && (
        <div className="mt-5">
          <p className="label !text-[9px] mb-2">Três motivos de gratidão</p>
          <div className="grid sm:grid-cols-3 gap-2">
            {g.map((v, i) => <input key={i} className="field" placeholder={["Hoje agradeço por…", "Também por…", "E por…"][i]} value={v} onChange={(e) => setG(g.map((x, k) => (k === i ? e.target.value : x)))} />)}
          </div>
          {err && <p className="text-[12.5px] text-[#ff8a80] mt-2" role="alert">{err}</p>}
          <button className="btn btn-accent mt-3" disabled={pending || !g.some((x) => x.trim())} onClick={() => start(async () => {
            try { await addJournal("gratidao", `## Gratidão\n${g.filter((x) => x.trim()).map((x) => `- ${x.trim()}`).join("\n")}`); setDone(true); gain(10, "Gratidão", "#9fd0f5"); if (n + 1 === 4) celebrate("Dia completo com Jeová", "Leitura, estudo, oração e gratidão"); }
            catch { setErr("Não consegui salvar. Tente de novo."); }
          })}>Guardar gratidão</button>
        </div>)}
    </section>
  );
}
