// A voz do Mestre: frases curtas, firmes e úteis, escolhidas pelas regras do treino (sem IA, instantâneo, offline).
const pick = <T,>(l: readonly T[], seed: string) => { let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) | 0; return l[Math.abs(h) % l.length]; };
const kg = (n: number) => `${String(n).replace(".", ",")} kg`;

export function briefing(o: { wave: string | null; label: string; main?: { name: string; kg: number; sets: number; reps: string } | null; beast?: string | null; seed: string }) {
  const open = pick(["Hoje é simples.", "Escuta.", "Foco.", "Mais um dia no Covil."], o.seed);
  const w = o.wave === "Semana de força" ? "Semana de força: poucas repetições, carga alta, descanso longo." : o.wave === "Semana metabólica" ? "Semana metabólica: mais repetições, descanso curto. Vai queimar." : o.wave ? "Semana de volume: ritmo constante, qualidade em cada repetição." : "";
  const m = o.main && o.main.kg > 0 ? `O teste é o ${o.main.name.toLowerCase()}: ${o.main.sets}×${o.main.reps} com ${kg(o.main.kg)}. O resto é apoio.` : "";
  const b = o.beast ? `${o.beast} está à espreita. Termine e ela cai.` : "";
  return [open, w, m, b].filter(Boolean).join(" ");
}

export function reactSet(o: { reps: number; rpe: number | null; targetReps: number; targetRpe: number | null; pr: boolean; nextKg: number | null; curKg: number; last: boolean; seed: string }) {
  if (o.pr) return pick(["Isso é seu. Ninguém tira.", "Recorde. Lembre desse peso nos dias ruins.", "Novo marco. O corpo obedeceu."], o.seed);
  if (!o.rpe) return pick(["Anote o RPE. Sem ele eu treino no escuro.", "Feito. Diga o esforço (RPE) e eu ajusto a próxima."], o.seed);
  const t = o.targetRpe ?? 8;
  if (o.reps < o.targetReps && o.rpe >= 9.5) return o.last ? "Faltaram repetições. Fica registrado, sem drama. Próxima sessão a gente corrige." : `Pesou demais. ${o.nextKg && o.nextKg < o.curKg ? `Desce para ${kg(o.nextKg)}.` : "Segura a carga."} Técnica primeiro.`;
  if (o.rpe <= t - 1.5) return o.last ? "Sobrou força. Na próxima sessão a carga sobe." : `Sobra força. ${o.nextKg && o.nextKg > o.curKg ? `Próxima: ${kg(o.nextKg)}.` : "Mantém e capricha na execução."}`;
  if (o.rpe >= t + 1) return o.last ? "No limite. Bom trabalho, agora recupera." : `RPE alto. ${o.nextKg && o.nextKg < o.curKg ? `Próxima: ${kg(o.nextKg)}.` : "Segura a carga."}`;
  return pick(["No alvo. É assim.", "Exato. Repete.", "Limpo. Próxima.", "Bom. Nem mais, nem menos."], o.seed);
}

const CUES: [RegExp, string[]][] = [
  [/agachamento|hack|leg press|goblet|búlgaro|afundo|passada/i, ["Pés firmes, joelhos acompanham a ponta dos pés.", "Respira fundo antes de descer e trava o abdômen.", "Desce controlando, sobe empurrando o chão."]],
  [/supino|flexão|paralelas/i, ["Escápulas juntas e para baixo, peito alto.", "Barra desce controlada até o peito, sem quicar.", "Pés no chão. Força começa nas pernas."]],
  [/terra|stiff|good morning|elevação pélvica/i, ["Coluna neutra. Quadril vai para trás, não para baixo.", "Barra colada no corpo o tempo todo.", "Aperta o glúteo no topo, sem hiperestender."]],
  [/remada|puxada|barra fixa|pulldown/i, ["Puxa com o cotovelo, não com a mão.", "Peito aberto, ombro longe da orelha.", "Segura 1 segundo no final do movimento."]],
  [/desenvolvimento|elevação/i, ["Abdômen firme, sem jogar o tronco.", "Sobe controlando, desce mais devagar ainda.", "Ombro longe da orelha."]],
  [/rosca|tríceps/i, ["Cotovelo parado. Só o antebraço se move.", "Amplitude completa vale mais que carga.", "Desce em 2 segundos."]],
];
export function restLine(nextName: string | null, seed: string) {
  if (!nextName) return "Respira. Bebe água. Está quase.";
  const c = CUES.find(([re]) => re.test(nextName));
  return `Agora: ${nextName}. ${c ? pick(c[1], seed) : "Execução antes de carga."}`;
}

export function verdict(o: { done: number; total: number; prs: number; volume: number; beast?: string | null }) {
  const pct = o.total ? o.done / o.total : 0;
  const a = pct >= 1 ? "Sessão completa." : pct >= 0.7 ? "Sessão sólida." : "Sessão curta, mas feita. Aparecer conta.";
  const b = o.prs ? ` ${o.prs} recorde(s). Guarde isso.` : "";
  const c = o.beast && pct >= 0.7 ? ` ${o.beast} caiu.` : "";
  return `${a}${b}${c} ${Math.round(o.volume).toLocaleString("pt-BR")} kg movidos.`;
}

export function absence(days: number) {
  if (days < 3) return null;
  if (days < 7) return `${days} dias fora. Não falhe duas vezes. Hoje, nem que sejam 20 minutos.`;
  return `${days} dias longe do Covil. Sem culpa: volta leve, começa pelo básico. O corpo lembra.`;
}

/** Legenda do RPE para quem está começando: quantas repetições ainda sairiam. */
export const RPE_HINT: Record<string, string> = { "6": "sobravam 4+", "7": "sobravam 3", "8": "sobravam 2", "9": "sobrava 1", "10": "não saía mais" };
