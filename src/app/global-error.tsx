"use client";
/** Último recurso: erro no layout raiz. Sem dependências de CSS do app. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR"><body style={{ background: "#000", color: "#f5f5f7", fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100dvh", margin: 0 }}>
      <div role="alert" style={{ textAlign: "center", padding: 24, maxWidth: 420 }}>
        <h1 style={{ fontSize: 24 }}>O BRIO não conseguiu abrir.</h1>
        <p style={{ color: "#b0b0b6" }}>Verifique a conexão e tente de novo.</p>
        {error.digest && <p style={{ color: "#b0b0b6", fontSize: 12 }}>Código: {error.digest}</p>}
        <button type="button" onClick={reset} style={{ marginTop: 16, minHeight: 44, padding: "0 20px", borderRadius: 12, border: 0, background: "#f5f5f7", color: "#000", fontWeight: 600 }}>Tentar de novo</button>
      </div>
    </body></html>
  );
}
