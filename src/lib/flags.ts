// Feature flags simples por constante (biblioteca GEN-CFG-02). Mudanças grandes nascem desligadas.
export const FLAGS = {
  /** CSP aplicada de verdade. Desligada = só relatório (Content-Security-Policy-Report-Only), sem bloquear nada. */
  CSP_ENFORCE: process.env.NEXT_PUBLIC_FLAG_CSP_ENFORCE === "1",
} as const;
