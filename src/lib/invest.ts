// Cálculos de investimento, sem dependências (testáveis).
export const INV_TYPES = {
  reserva: { label: "Reserva de emergência", color: "#30d158" },
  renda_fixa: { label: "Renda fixa (CDB/LCI/LCA)", color: "#f5f5f7" },
  tesouro: { label: "Tesouro Direto", color: "#3a7bd5" },
  acoes: { label: "Ações", color: "#ff4d8a" },
  fiis: { label: "Fundos imobiliários", color: "#f5f5f7" },
  etf: { label: "ETFs", color: "#ff5a6e" },
  cripto: { label: "Cripto", color: "#d12b65" },
  previdencia: { label: "Previdência", color: "#7ee2a0" },
  outro: { label: "Outro", color: "#9a978f" },
} as const;
export type InvType = keyof typeof INV_TYPES;
export const LIQUIDITY = { diaria: "Diária", d30: "Até 30 dias", vencimento: "No vencimento", variavel: "Variável (bolsa)" } as const;
export type Liquidity = keyof typeof LIQUIDITY;

/** Taxa mensal equivalente a uma taxa anual (% a.a.). */
export const monthlyRate = (annualPct: number) => Math.pow(1 + annualPct / 100, 1 / 12) - 1;

/** Valor futuro com aporte mensal no fim de cada mês. */
export function futureValue(present: number, monthly: number, annualPct: number, months: number) {
  const i = monthlyRate(annualPct);
  if (months <= 0) return present;
  if (Math.abs(i) < 1e-12) return present + monthly * months;
  const g = Math.pow(1 + i, months);
  return present * g + monthly * ((g - 1) / i);
}

/** Série mês a mês: total, aportado e juros. */
export function projection(present: number, monthly: number, annualPct: number, months: number) {
  const out: { month: number; total: number; contributed: number; interest: number }[] = [];
  for (let m = 0; m <= months; m++) {
    const total = futureValue(present, monthly, annualPct, m), contributed = present + monthly * m;
    out.push({ month: m, total, contributed, interest: total - contributed });
  }
  return out;
}

/** Quantos meses até atingir um alvo (null se nunca, em até 100 anos). */
export function monthsToTarget(present: number, monthly: number, annualPct: number, target: number) {
  if (present >= target) return 0;
  for (let m = 1; m <= 1200; m++) if (futureValue(present, monthly, annualPct, m) >= target) return m;
  return null;
}

/** Meses de custo de vida cobertos pela reserva. */
export const reserveMonths = (reserve: number, monthlyCost: number) => (monthlyCost > 0 ? reserve / monthlyCost : null);
