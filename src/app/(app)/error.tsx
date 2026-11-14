"use client";
import Link from "next/link";
import { useEffect } from "react";

/** Erro numa tela do app: explica, oferece tentar de novo e mostra o código para suporte (biblioteca GEN-FB-01). */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  const migr = /relation|column|does not exist|schema cache/i.test(error.message);
  return (
    <section role="alert" className="glass p-6 mt-4 max-w-lg">
      <p className="text-[11px] font-semibold tracking-[.3em] text-[#ff6961]">ALGO FALHOU NESTA TELA</p>
      <h1 className="font-display text-2xl mt-2">Não foi possível carregar.</h1>
      <p className="text-sm text-muted mt-2">
        {migr ? "Parece faltar uma migração no Supabase. Confira a lista de SQLs pendentes e rode a que falta."
          : "Pode ter sido a conexão ou um dado inesperado. Tentar de novo resolve na maioria das vezes."}
      </p>
      {error.digest && <p className="text-xs text-muted mt-3 num">Código: {error.digest}</p>}
      <div className="flex gap-2 mt-5">
        <button type="button" className="btn btn-accent flex-1" onClick={reset}>Tentar de novo</button>
        <Link href="/" className="btn flex-1">Ir para o início</Link>
      </div>
    </section>
  );
}
