// Importa extrato bancário (OFX ou CSV) em lançamentos. Gratuito: o banco exporta o arquivo, nada de API. Sem dependências.
export type BankRow = { date: string; amount: number; name: string; category: string; kind: "receita" | "fixo" | "variavel" };

const RULES: [RegExp, string, BankRow["kind"]][] = [
  [/sal[aá]rio|folha|pagto.*empresa|proventos/i, "salario", "receita"],
  [/ifood|rappi|mercado|supermerc|padaria|a[cç]ougue|restaurante|lanchonete|atacad|assa[ií]|carrefour|p[aã]o de a[cç]/i, "alimentacao", "variavel"],
  [/uber|99\s?(app|pop|taxi)?|posto|combust|shell|ipiranga|petrobr|estaciona|ped[aá]gio|sem parar|metr[oô]|bilhete/i, "transporte", "fixo"],
  [/netflix|spotify|amazon prime|disney|youtube|apple\.com|google|hbo|max\b|deezer|icloud/i, "assinaturas", "fixo"],
  [/aluguel|condom[ií]nio|iptu/i, "moradia", "fixo"],
  [/enel|light|cemig|copel|sabesp|[aá]gua|energia|g[aá]s|internet|vivo|claro|tim\b|oi\b/i, "contas", "fixo"],
  [/farm[aá]cia|drogaria|droga|raia|pague menos|cl[ií]nica|hospital|laborat|unimed|odonto/i, "saude", "variavel"],
  [/faculdade|universidade|mensalidade|escola|curso/i, "faculdade", "fixo"],
  [/renner|riachuelo|c&a|zara|shein|centauro|netshoes|cal[cç]ados/i, "roupas", "variavel"],
  [/cinema|ingresso|steam|playstation|xbox|bar\b|show/i, "lazer", "variavel"],
];

export function categorize(name: string, amount: number): Pick<BankRow, "category" | "kind"> {
  for (const [re, category, kind] of RULES) if (re.test(name) && (kind === "receita") === amount > 0) return { category, kind };
  return amount > 0 ? { category: "extra", kind: "receita" } : { category: "outros", kind: "variavel" };
}

const num = (s: string) => {
  let t = s.replace(/[R$\s]/g, "");
  if (/,\d{1,2}$/.test(t)) t = t.replace(/\./g, "").replace(",", "."); // 1.234,56
  else t = t.replace(/,/g, ""); // 1,234.56
  return Number(t);
};
const iso = (s: string): string | null => {
  let m = s.match(/^(\d{4})-?(\d{2})-?(\d{2})/); if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{2})\/(\d{2})\/(\d{2,4})/); if (m) return `${m[3].length === 2 ? "20" + m[3] : m[3]}-${m[2]}-${m[1]}`;
  return null;
};
const row = (date: string | null, amount: number, name: string): BankRow | null => {
  if (!date || !Number.isFinite(amount) || amount === 0) return null;
  const n = name.replace(/\s+/g, " ").trim().slice(0, 120) || "Sem descrição";
  return { date, amount: Math.round(amount * 100) / 100, name: n, ...categorize(n, amount) };
};

export function parseOFX(text: string): BankRow[] {
  const out: BankRow[] = [];
  for (const b of text.split(/<STMTTRN>/i).slice(1)) {
    const tag = (t: string) => b.match(new RegExp(`<${t}>([^<\\r\\n]*)`, "i"))?.[1]?.trim() ?? "";
    const r = row(iso(tag("DTPOSTED")), Number(tag("TRNAMT").replace(",", ".")), tag("MEMO") || tag("NAME"));
    if (r) out.push(r);
  }
  return out;
}

export function parseCSV(text: string): BankRow[] {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const sep = [";", ",", "\t"].sort((a, b) => lines[0].split(b).length - lines[0].split(a).length)[0];
  const split = (l: string) => (l.match(new RegExp(`("([^"]|"")*"|[^${sep}]*)(${sep}|$)`, "g")) ?? []).map((c) => c.replace(new RegExp(`${sep}$`), "").replace(/^"|"$/g, "").replace(/""/g, '"').trim()).slice(0, -1);
  const head = split(lines[0]).map((h) => h.toLowerCase());
  const find = (re: RegExp) => head.findIndex((h) => re.test(h));
  const di = find(/data|date/), vi = find(/valor|amount|quantia|montante/), ni = find(/descri|hist[oó]rico|lan[cç]amento|title|estabelec|memo|nome/);
  if (di < 0 || vi < 0) return [];
  const out: BankRow[] = [];
  for (const l of lines.slice(1)) { const c = split(l); const r = row(iso(c[di] ?? ""), num(c[vi] ?? ""), c[ni] ?? ""); if (r) out.push(r); }
  return out;
}

export const parseStatement = (fileName: string, text: string) => (/\.ofx$/i.test(fileName) || /<OFX>/i.test(text) ? parseOFX(text) : parseCSV(text));

/** Remove o que já existe (mesma data, valor e descrição). */
export function dedupe(rows: BankRow[], existing: { date: string; amount: number; name: string }[]) {
  const key = (d: string, a: number, n: string) => `${d}|${Math.abs(a).toFixed(2)}|${n.toLowerCase()}`;
  const have = new Set(existing.map((e) => key(e.date, e.amount, e.name)));
  return rows.filter((r) => { const k = key(r.date, r.amount, r.name); if (have.has(k)) return false; have.add(k); return true; });
}
