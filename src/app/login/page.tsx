"use client";
import Link from "next/link";
import { Suspense, useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "@/app/actions";
import { BrioMark } from "@/components/brand";

const AVISOS: Record<string, string> = {
  config: "Faltam as variáveis do Supabase na Vercel. Adicione e faça um novo deploy.",
  conexao: "Não foi possível falar com o Supabase. Confira a URL e a chave.",
};

function Aviso() {
  const erro = useSearchParams().get("erro");
  return erro && AVISOS[erro] ? <p role="alert" className="rounded-2xl border border-[#ff453a]/40 bg-[#ff453a]/10 p-4 mt-6 text-sm text-[#ff6961]">{AVISOS[erro]}</p> : null;
}

export default function Login() {
  const [error, action, pending] = useActionState(signIn, null);
  const [show, setShow] = useState(false);
  return (
    <main className="min-h-dvh brio-aura grid place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center rise">
          <BrioMark size={112} />
          <h1 className="font-display text-5xl tracking-[.2em] mt-5 pl-[.2em]">BRIO</h1>
          <p className="text-muted mt-2 text-sm tracking-wide">Vigor com honra.</p>
        </div>
        <Suspense><Aviso /></Suspense>
        <form action={action} className="mt-10 grid gap-3 rise rise-1">
          <input name="email" type="email" autoComplete="email" required placeholder="E-mail" aria-label="E-mail" className="field !min-h-14" />
          <div className="relative">
            <input name="password" type={show ? "text" : "password"} autoComplete="current-password" required placeholder="Senha" aria-label="Senha" className="field !min-h-14 pr-20 w-full" />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted px-2 py-1">{show ? "Ocultar" : "Mostrar"}</button>
          </div>
          {error && <p role="alert" className="text-sm text-[#ff6961]">{error}</p>}
          <button disabled={pending} className="press min-h-14 rounded-2xl text-base font-semibold text-white disabled:opacity-60 mt-1"
            style={{ background: "linear-gradient(160deg,#ff6a3d,#e0393e 55%,#8a1a1d)", boxShadow: "0 14px 34px -14px #e0393e" }}>
            {pending ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="text-center mt-6 rise rise-2 text-sm text-muted">Novo por aqui? <Link href="/cadastro?plano=essencial" className="text-ink underline underline-offset-4">Criar conta grátis</Link></p>
        <p className="text-center mt-2 rise rise-2"><Link href="/sobre" className="text-xs text-muted underline underline-offset-4">Conhecer o BRIO</Link></p>
        <p className="font-display italic text-faint text-center mt-12 text-sm rise rise-3">“Tudo o que fizerem, trabalhem nisso de toda a alma, como para Jeová, e não para homens.”<br /><span className="not-italic text-xs">Colossenses 3:23</span></p>
      </div>
    </main>
  );
}
