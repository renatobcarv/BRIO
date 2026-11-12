"use client";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { signIn } from "@/app/actions";

const AVISOS: Record<string, string> = {
  config: "Faltam as variáveis do Supabase na Vercel. Adicione e faça um novo deploy.",
  conexao: "Não foi possível falar com o Supabase. Confira a URL e a chave.",
};

function Aviso() {
  const erro = useSearchParams().get("erro");
  return erro && AVISOS[erro] ? <p role="alert" className="glass p-4 mt-6 text-sm text-[#ff453a]">{AVISOS[erro]}</p> : null;
}

export default function Login() {
  const [error, action, pending] = useActionState(signIn, null);
  return (
    <main className="min-h-dvh grid place-items-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display italic text-6xl text-center rise">Brio</h1>
        <p className="text-center text-muted mt-3 rise rise-1">Vigor com honra.</p>
        <Suspense><Aviso /></Suspense>
        <form action={action} className="glass p-6 mt-10 grid gap-4 rise rise-2">
          <label className="grid gap-2">
            <span className="label">E-mail</span>
            <input name="email" type="email" autoComplete="email" required
              className="min-h-12 rounded-xl bg-white/[.04] border border-white/10 px-4 outline-none focus:border-gold/60" />
          </label>
          <label className="grid gap-2">
            <span className="label">Senha</span>
            <input name="password" type="password" autoComplete="current-password" required
              className="min-h-12 rounded-xl bg-white/[.04] border border-white/10 px-4 outline-none focus:border-gold/60" />
          </label>
          {error && <p role="alert" className="text-sm text-[#ff453a]">{error}</p>}
          <button disabled={pending}
            className="min-h-12 rounded-xl bg-gold text-base font-medium text-[#1a1408] disabled:opacity-60">
            {pending ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="font-display italic text-faint text-center mt-10 text-sm">“O que fizerem, façam de toda a alma.” — Col. 3:23</p>
      </div>
    </main>
  );
}
