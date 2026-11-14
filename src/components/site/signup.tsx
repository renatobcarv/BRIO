"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useState } from "react";
import { signUp, type SignUpState } from "@/app/actions";
import { BrioMark } from "@/components/brand";
import { PLANS, brlPrice, planById } from "@/lib/plans";

const FIRE = "linear-gradient(160deg,#ff6a3d,#e0393e 55%,#8a1a1d)";
const AREAS = [
  { id: "espiritual", e: "📖", t: "Vida espiritual", c: "#ffb340" }, { id: "ministerio", e: "💬", t: "Ministério", c: "#0a84ff" },
  { id: "treino", e: "🏋️", t: "Treino", c: "#e0393e" }, { id: "dieta", e: "🥗", t: "Dieta", c: "#30d158" },
  { id: "financas", e: "💰", t: "Finanças", c: "#3ee6c1" }, { id: "estudos", e: "🎓", t: "Estudos", c: "#bf5af2" },
  { id: "agenda", e: "📅", t: "Agenda", c: "#5ab0ff" }, { id: "habitos", e: "🔥", t: "Hábitos", c: "#ff9f0a" },
];
const STEPS = ["Você", "Foco", "Plano"];

function strength(p: string) {
  let s = 0; if (p.length >= 8) s++; if (p.length >= 12) s++; if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++; if (/\d/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
  return Math.min(4, s);
}

export function SignUpFlow() {
  const sp = useSearchParams();
  const [state, action, pending] = useActionState<SignUpState, FormData>(signUp, null);
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ name: "", email: "", password: "", show: false });
  const [focus, setFocus] = useState<string[]>(["habitos"]);
  const [plan, setPlan] = useState(planById(sp.get("plano")).id);
  const st = strength(f.password), stLabel = ["muito fraca", "fraca", "ok", "boa", "forte"][st], stColor = ["#ff453a", "#ff9f0a", "#ffd60a", "#30d158", "#30d158"][st];
  const can0 = f.name.trim().length >= 2 && /^\S+@\S+\.\S+$/.test(f.email) && f.password.length >= 8;
  const first = f.name.trim().split(" ")[0];

  if (state?.sent) return (
    <Shell>
      <div className="text-center" role="status">
        <div className="mx-auto h-20 w-20 rounded-full grid place-items-center text-4xl" style={{ background: "rgba(48,209,88,.15)", boxShadow: "0 0 40px -10px #30d158" }}>✉️</div>
        <h1 className="font-display text-3xl mt-6">Confira seu e-mail</h1>
        <p className="text-white/75 mt-3">Mandamos um link para <b className="text-ink">{state.sent}</b>. Toque nele para ativar a conta e começar o dia 1.</p>
        <p className="text-xs text-muted mt-4">Não chegou? Veja a caixa de spam ou promoções.</p>
        <Link href="/login" className="btn mt-8 inline-flex">Já confirmei, quero entrar</Link>
      </div>
    </Shell>
  );

  return (
    <Shell>
      <form action={action} className="grid gap-6" onSubmit={(e) => { if (step < 2) { e.preventDefault(); setStep(step + 1); } }}>
        {/* progresso */}
        <ol className="flex gap-2" aria-label="Etapas do cadastro">
          {STEPS.map((s, i) => (
            <li key={s} className="flex-1" aria-current={i === step ? "step" : undefined}>
              <span className="block h-1.5 rounded-full transition-all duration-500" style={{ background: i <= step ? "linear-gradient(90deg,#ffd27a,#ff6a3d)" : "rgba(255,255,255,.1)", boxShadow: i === step ? "0 0 12px #ff6a3d" : "none" }} />
              <span className={`block text-[11px] mt-1.5 ${i === step ? "text-ink font-semibold" : "text-muted"}`}>{i + 1}. {s}</span>
            </li>))}
        </ol>

        {/* campos sempre no form (vão juntos no envio) */}
        <input type="hidden" name="plan" value={plan} />
        {focus.map((x) => <input key={x} type="hidden" name="focus" value={x} />)}

        <div className={`${step !== 0 ? "hidden" : "grid"} gap-4 step-in-right`}>
          <div><h1 className="font-display text-[clamp(28px,6vw,36px)] leading-tight">Vamos começar seu dia 1.</h1><p className="text-white/70 mt-1">Leva menos de um minuto. Sem cartão.</p></div>
          <label className="grid gap-1.5"><span className="label">Como podemos te chamar?</span>
            <input name="name" className="field !min-h-14" autoComplete="given-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Seu nome" required /></label>
          <label className="grid gap-1.5"><span className="label">E-mail</span>
            <input name="email" type="email" inputMode="email" autoComplete="email" className="field !min-h-14" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="voce@email.com" required /></label>
          <label className="grid gap-1.5"><span className="label">Senha</span>
            <span className="relative block">
              <input name="password" type={f.show ? "text" : "password"} autoComplete="new-password" className="field !min-h-14 pr-24 w-full" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} placeholder="8 caracteres ou mais" minLength={8} required aria-describedby="forca" />
              <button type="button" onClick={() => setF({ ...f, show: !f.show })} className="absolute right-2 top-1/2 -translate-y-1/2 min-h-11 px-3 text-xs text-muted">{f.show ? "Ocultar" : "Mostrar"}</button>
            </span>
            <span id="forca" className="flex items-center gap-2 text-xs" aria-live="polite">
              <span className="flex gap-1 flex-1">{[0, 1, 2, 3].map((i) => <i key={i} className="h-1 flex-1 rounded-full transition-colors" style={{ background: f.password && i < Math.max(1, st) ? stColor : "rgba(255,255,255,.1)" }} />)}</span>
              {f.password && <span style={{ color: stColor }}>Senha {stLabel}</span>}
            </span>
          </label>
        </div>

        <div className={`${step !== 1 ? "hidden" : "grid"} gap-4 step-in-right`}>
          <div><h2 className="font-display text-[clamp(26px,6vw,34px)] leading-tight">{first ? `${first}, o` : "O"} que você quer cuidar?</h2><p className="text-white/70 mt-1">Escolha quantos quiser. Dá para mudar depois.</p></div>
          <div className="grid grid-cols-2 gap-2.5">
            {AREAS.map((a) => { const on = focus.includes(a.id); return (
              <button key={a.id} type="button" aria-pressed={on} onClick={() => setFocus(on ? focus.filter((x) => x !== a.id) : [...focus, a.id])}
                className="press min-h-20 rounded-2xl p-3 text-left border transition-all"
                style={{ borderColor: on ? a.c : "rgba(255,255,255,.1)", background: on ? `linear-gradient(160deg, ${a.c}33, transparent 80%)` : "rgba(255,255,255,.03)", boxShadow: on ? `0 10px 30px -18px ${a.c}` : "none" }}>
                <span className="text-2xl">{a.e}</span>
                <span className="flex items-center justify-between mt-1"><span className="font-semibold text-sm">{a.t}</span><span aria-hidden className="h-5 w-5 rounded-full border grid place-items-center text-[11px]" style={{ borderColor: on ? a.c : "rgba(255,255,255,.3)", background: on ? a.c : "transparent", color: "#000" }}>{on ? "✓" : ""}</span></span>
              </button>); })}
          </div>
        </div>

        <div className={`${step !== 2 ? "hidden" : "grid"} gap-4 step-in-right`}>
          <div><h2 className="font-display text-[clamp(26px,6vw,34px)] leading-tight">Escolha seu plano</h2><p className="text-white/70 mt-1">14 dias com tudo liberado. Sem cartão.</p></div>
          <div className="grid gap-2.5" role="radiogroup" aria-label="Plano">
            {PLANS.map((p) => { const on = plan === p.id; return (
              <button key={p.id} type="button" role="radio" aria-checked={on} onClick={() => setPlan(p.id)}
                className="press relative rounded-2xl p-4 text-left border transition-all"
                style={{ borderColor: on ? "#ff6a3d" : "rgba(255,255,255,.1)", background: on ? "linear-gradient(160deg, rgba(255,106,61,.18), transparent 80%)" : "rgba(255,255,255,.03)" }}>
                <span className="flex items-center justify-between gap-3">
                  <span><span className="font-semibold">{p.name}</span>{p.highlight && <span className="ml-2 text-[10px] font-bold tracking-wider text-[#ff9f0a]">MAIS ESCOLHIDO</span>}<span className="block text-xs text-muted mt-0.5">{p.tagline}</span></span>
                  <span className="text-right shrink-0"><span className="num text-xl">{brlPrice(p.price)}</span>{p.price > 0 && <span className="text-xs text-muted">/mês</span>}</span>
                </span>
                {on && <span className="block text-xs text-white/70 mt-2">{p.features.slice(p.id === "gratis" ? 0 : 1, p.id === "gratis" ? 3 : 4).join(" · ")}</span>}
              </button>); })}
          </div>
          <p className="text-[11px] text-muted">Ao criar a conta você aceita os <Link href="/termos" className="underline">Termos</Link> e a <Link href="/privacidade" className="underline">Política de Privacidade</Link>.</p>
        </div>

        {state?.error && <p role="alert" className="rounded-2xl border border-[#ff453a55] bg-[#ff453a14] p-3 text-sm text-[#ff8a80]">{state.error}</p>}

        <div className="flex gap-2">
          {step > 0 && <button type="button" className="btn !min-h-14 px-5" onClick={() => setStep(step - 1)}>Voltar</button>}
          <button type="submit" disabled={pending || (step === 0 && !can0) || (step === 1 && !focus.length)}
            className="flex-1 min-h-14 rounded-2xl font-semibold text-white press disabled:opacity-40" style={{ background: FIRE, boxShadow: "0 14px 34px -14px #e0393e" }}>
            {pending ? "Criando sua conta…" : step < 2 ? "Continuar" : `Criar conta${plan !== "gratis" ? " e testar grátis" : ""}`}
          </button>
        </div>
        <p className="text-center text-sm text-muted">Já tem conta? <Link href="/login" className="text-ink underline underline-offset-4">Entrar</Link></p>
      </form>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh grid lg:grid-cols-[1.05fr_1fr]">
      {/* painel da marca (desktop) */}
      <aside className="hidden lg:flex relative overflow-hidden flex-col justify-between p-12 border-r border-white/5" style={{ background: "radial-gradient(80% 60% at 30% 100%, rgba(255,106,61,.35), transparent 60%), radial-gradient(60% 50% at 90% 10%, rgba(191,90,242,.22), transparent 60%), #070506" }}>
        <Link href="/sobre" className="flex items-center gap-2 w-fit"><BrioMark size={34} glow={false} /><span className="font-display tracking-[.2em] text-lg">BRIO</span></Link>
        <div>
          <p className="font-display text-5xl leading-[1.05]">Constância<br />com propósito.</p>
          <ul className="grid gap-3 mt-8 text-white/80">
            {["Missão diária curta, com o principal em destaque", "Sequência que vira fogo e XP do que é real", "Fé, treino, dieta, dinheiro e estudos num lugar"].map((t) => <li key={t} className="flex gap-3"><span className="text-[#ff9f0a]">✦</span>{t}</li>)}
          </ul>
        </div>
        <p className="text-sm text-white/60 italic">“Tudo o que fizerem, trabalhem nisso de toda a alma.” — Colossenses 3:23</p>
      </aside>
      <section className="relative flex flex-col px-5 py-8 sm:px-10 lg:px-16 lg:py-14">
        <div className="absolute inset-x-0 top-0 h-72 -z-10 lg:hidden" style={{ background: "radial-gradient(60% 80% at 50% 0%, rgba(255,106,61,.25), transparent 70%)" }} />
        <Link href="/sobre" className="flex items-center gap-2 lg:hidden w-fit"><BrioMark size={30} glow={false} /><span className="font-display tracking-[.2em]">BRIO</span></Link>
        <div className="w-full max-w-md mx-auto my-auto pt-8 lg:pt-0">{children}</div>
      </section>
    </main>
  );
}
