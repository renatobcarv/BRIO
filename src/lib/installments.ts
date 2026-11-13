// Parcelas: divide um total em N parcelas em centavos (a diferença vai para a 1ª) e gera as datas mês a mês.
export function splitCents(total: number, n: number) {
  const cents = Math.round(total * 100), base = Math.floor(cents / n), rest = cents - base * n;
  return Array.from({ length: n }, (_, i) => (base + (i === 0 ? rest : 0)) / 100);
}
/** Mesma data em meses seguintes; dia 31 vira o último dia do mês quando preciso. */
export function addMonths(iso: string, k: number) {
  const [y, m, d] = iso.split("-").map(Number), t = new Date(Date.UTC(y, m - 1 + k, 1));
  const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(Math.min(d, last)).padStart(2, "0")}`;
}
export function plan(input: { total?: number; each?: number; n: number; first: string }) {
  const n = Math.max(2, Math.min(72, Math.round(input.n)));
  const values = input.each != null ? Array(n).fill(Math.round(input.each * 100) / 100) : splitCents(input.total ?? 0, n);
  return values.map((amount, i) => ({ no: i + 1, amount, date: addMonths(input.first, i) }));
}
