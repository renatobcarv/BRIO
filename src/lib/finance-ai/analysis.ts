// Análises financeiras sem IA e sem dependências: testáveis isoladamente.

export type Item = { id: string; date: string; month: string; kind: "receita" | "fixo" | "variavel"; name: string; amount: number; category: string | null; paid: boolean; recurring: boolean };
const isOut = (i: Item) => i.kind !== "receita";
const sum = (l: Item[]) => l.reduce((a, i) => a + i.amount, 0);
const round = (v: number) => Math.round(v * 100) / 100;
const D = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
export const daysInMonth = (month: string) => new Date(Date.UTC(+month.slice(0, 4), +month.slice(5, 7), 0)).getUTCDate();
export const shiftMonth = (month: string, n: number) => { const d = new Date(Date.UTC(+month.slice(0, 4), +month.slice(5, 7) - 1 + n, 1)); return d.toISOString().slice(0, 10); };
export const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\d{2,}/g, "").replace(/[^a-z ]+/g, " ").replace(/\s+/g, " ").trim();

/** Resumo de um mês. */
export function monthOverview(items: Item[]) {
  const inc = items.filter((i) => !isOut(i)), out = items.filter(isOut);
  const byCat = new Map<string, number>();
  for (const i of out) byCat.set(i.category ?? "outros", (byCat.get(i.category ?? "outros") ?? 0) + i.amount);
  const income = sum(inc), expenses = sum(out);
  return {
    income: round(income), income_received: round(sum(inc.filter((i) => i.paid))),
    expenses: round(expenses), expenses_paid: round(sum(out.filter((i) => i.paid))), expenses_pending: round(sum(out.filter((i) => !i.paid))),
    fixed: round(sum(out.filter((i) => i.kind === "fixo"))), variable: round(sum(out.filter((i) => i.kind === "variavel"))),
    balance: round(income - expenses), savings_rate: income ? round((income - expenses) / income) : null,
    top_categories: [...byCat].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([category, total]) => ({ category, total: round(total) })),
    transactions: items.length,
  };
}

/**
 * Projeção do fim do mês.
 * Renda e custos fixos: o que está lançado (pago ou pendente).
 * Variáveis: o maior entre o já gasto e a média dos meses anteriores (ou o ritmo atual, sem histórico).
 */
export function forecast(current: Item[], previousMonths: Item[][], today: string, month: string, extra = 0) {
  const ov = monthOverview(current);
  const dim = daysInMonth(month);
  const inMonth = today.slice(0, 7) === month.slice(0, 7);
  const elapsed = inMonth ? +today.slice(8, 10) : today > month ? dim : 0;
  const prevVar = previousMonths.filter((m) => m.length).map((m) => sum(m.filter((i) => i.kind === "variavel")));
  const avgVar = prevVar.length ? prevVar.reduce((a, b) => a + b, 0) / prevVar.length : null;
  const pace = elapsed ? (ov.variable / elapsed) * dim : ov.variable;
  const expectedVar = elapsed >= dim ? ov.variable : Math.max(ov.variable, avgVar ?? pace);
  const projected = ov.income - ov.fixed - expectedVar - extra;
  return {
    month: month.slice(0, 7), day: elapsed, days_in_month: dim, days_left: Math.max(0, dim - elapsed),
    income_expected: ov.income, fixed_expected: ov.fixed, variable_so_far: ov.variable,
    variable_expected: round(expectedVar), variable_avg_previous_months: avgVar == null ? null : round(avgVar), months_of_history: prevVar.length,
    extra_expense: extra, projected_balance: round(projected),
    status: projected < 0 ? "vermelho" : ov.income && projected < ov.income * 0.1 ? "atencao" : "ok",
    method: avgVar == null ? "variáveis projetadas pelo ritmo do mês (sem histórico anterior)" : "variáveis = maior entre o já gasto e a média dos meses anteriores",
  };
}

/** Cobranças recorrentes: marcadas como mensais ou com mesmo nome e valor parecido (±10%) em 2+ meses. */
export function subscriptions(items: Item[], currentMonth: string) {
  const groups = new Map<string, Item[]>();
  for (const i of items.filter(isOut)) { const k = normalize(i.name); if (k) groups.set(k, [...(groups.get(k) ?? []), i]); }
  const out: { name: string; amount: number; months: number; flagged_recurring: boolean; is_new: boolean; price_change: number | null; last_date: string; category: string | null }[] = [];
  for (const list of groups.values()) {
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
    const months = [...new Set(sorted.map((i) => i.month))];
    const last = sorted.at(-1)!, flagged = sorted.some((i) => i.recurring);
    // Maioria dos valores a ±10% da mediana: tolera um reajuste de preço.
    const amounts = sorted.map((i) => i.amount).sort((a, b) => a - b), med = amounts[Math.floor(amounts.length / 2)];
    const similar = sorted.filter((i) => Math.abs(i.amount - med) <= Math.max(1, med * 0.1)).length * 2 > sorted.length;
    if (!flagged && !(months.length >= 2 && similar)) continue;
    const prev = sorted.filter((i) => i.month !== last.month).at(-1);
    const change = prev && Math.abs(last.amount - prev.amount) > prev.amount * 0.02 ? round(last.amount - prev.amount) : null;
    out.push({ name: last.name, amount: last.amount, months: months.length, flagged_recurring: flagged, is_new: months.length <= 2 && months[0] >= shiftMonth(currentMonth, -1),
      price_change: change, last_date: last.date, category: last.category });
  }
  return out.sort((a, b) => b.amount - a.amount);
}

const mean = (l: number[]) => l.reduce((a, b) => a + b, 0) / l.length;
const std = (l: number[]) => { const m = mean(l); return Math.sqrt(mean(l.map((x) => (x - m) ** 2))); };

/** Alertas: categoria acima do padrão, gasto isolado fora do comum, duplicadas, teto estourado, contas vencidas. */
export function anomalies(items: Item[], today: string, budgets: Record<string, number>, days = 30) {
  const since = new Date(D(today) - days * 86_400_000).toISOString().slice(0, 10);
  const month = today.slice(0, 7) + "-01";
  const out: { severity: "alta" | "media" | "baixa"; kind: string; message: string; amount?: number; ids?: string[] }[] = [];
  const outs = items.filter(isOut);
  // Duplicadas
  const seen = new Map<string, Item[]>();
  for (const i of outs.filter((i) => i.date >= since)) { const k = `${i.date}|${normalize(i.name)}|${i.amount}`; seen.set(k, [...(seen.get(k) ?? []), i]); }
  for (const l of seen.values()) if (l.length > 1) out.push({ severity: "alta", kind: "duplicada", message: `${l.length}× "${l[0].name}" de ${l[0].amount} em ${l[0].date}`, amount: l[0].amount, ids: l.map((i) => i.id) });
  // Teto estourado
  const cur = outs.filter((i) => i.month === month);
  for (const [cat, limit] of Object.entries(budgets)) {
    if (!limit) continue;
    const s = sum(cur.filter((i) => i.category === cat));
    if (s > limit) out.push({ severity: "alta", kind: "teto_estourado", message: `${cat}: ${round(s)} de ${limit}`, amount: round(s - limit) });
    else if (s > limit * 0.8) out.push({ severity: "media", kind: "teto_perto", message: `${cat}: ${Math.round((s / limit) * 100)}% do teto`, amount: round(s) });
  }
  // Categoria acima do padrão (precisa de 3+ meses anteriores)
  const prevMonths = [1, 2, 3, 4, 5, 6].map((k) => shiftMonth(month, -k));
  const cats = [...new Set(outs.map((i) => i.category ?? "outros"))];
  for (const c of cats) {
    const hist = prevMonths.map((m) => sum(outs.filter((i) => i.month === m && (i.category ?? "outros") === c))).filter((v) => v > 0);
    if (hist.length < 3) continue;
    const now = sum(cur.filter((i) => (i.category ?? "outros") === c)), m = mean(hist), s = std(hist);
    if (now > m + 2 * s && now > m * 1.2) out.push({ severity: "media", kind: "categoria_acima_do_padrao", message: `${c}: ${round(now)} no mês, média ${round(m)}`, amount: round(now - m) });
  }
  // Gasto isolado fora do comum na categoria
  for (const i of outs.filter((i) => i.date >= since && !i.recurring)) {
    const peers = outs.filter((p) => p.id !== i.id && (p.category ?? "outros") === (i.category ?? "outros") && !p.recurring).map((p) => p.amount);
    if (peers.length < 5) continue;
    const m = mean(peers), s = std(peers);
    if (i.amount > m + 2 * s && i.amount > m * 2) out.push({ severity: "baixa", kind: "gasto_fora_do_comum", message: `"${i.name}" ${i.amount} em ${i.date}, média da categoria ${round(m)}`, amount: i.amount, ids: [i.id] });
  }
  // Vencidas
  for (const i of items.filter((i) => !i.paid && i.date < today)) out.push({ severity: "media", kind: isOut(i) ? "conta_vencida" : "receita_atrasada", message: `"${i.name}" ${i.amount}, previsto para ${i.date}`, amount: i.amount, ids: [i.id] });
  const rank = { alta: 0, media: 1, baixa: 2 };
  return out.sort((a, b) => rank[a.severity] - rank[b.severity]);
}
