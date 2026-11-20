/** Bestiário do BRIO: semanas de feras (adversários) e semanas de anjos (exemplos de virtude a seguir). */
export type BeastId =
  | "aureo" | "alcion" | "vertice" | "fulgor" | "eter" | "orbita"
  | "golem" | "lobo" | "javali" | "serpe" | "titan" | "juggernaut" | "sentinela" | "guardiao" | "crocodilo" | "grifo";
export type AngelLook = { wings: number; weapon: "lanca" | "espada" | "nenhuma"; robe?: boolean; wheels?: boolean; veil?: boolean };
export type Beast = { id: BeastId; name: string; epithet: string; threat: 1 | 2 | 3 | 4 | 5; color: string; eye: string; line: string;
  angel?: AngelLook; ref?: string; virtue?: string; img?: string };

type Def = Omit<Beast, "threat">;
const B: Record<BeastId, Def> = {
  // Seres celestiais: referências de virtude, nunca adversários. Nomes e formas originais.
  aureo: { angel: { wings: 1, weapon: "lanca" }, id: "aureo", name: "Áureo", epithet: "Anéis de ouro que nunca param", color: "#ffb340", eye: "#fff4d6", virtue: "Vigilância", line: "Três anéis girando sem descanso. Atenção em cada série, do aquecimento à última repetição." },
  alcion: { angel: { wings: 3, weapon: "nenhuma" }, id: "alcion", name: "Alcíon", epithet: "Ave de luz de seis asas", color: "#ffd60a", eye: "#ffffff", virtue: "Prontidão", line: "Mergulha no instante certo, sem adiar. Comece o treino de hoje na hora." },
  vertice: { angel: { wings: 2, weapon: "espada" }, id: "vertice", name: "Vértice", epithet: "Sentinela de cristal e fogo", color: "#ff7a2f", eye: "#fff1a8", virtue: "Firmeza", line: "Não se move do posto. Firmeza também é dizer não à preguiça." },
  fulgor: { angel: { wings: 1, weapon: "nenhuma", robe: true }, id: "fulgor", name: "Fulgor", epithet: "Leão de relâmpago e bronze", color: "#c9a26b", eye: "#ffffff", virtue: "Coragem", line: "Não ruge pra se exibir; ruge quando é hora. Coragem é aparecer mesmo cansado." },
  eter: { angel: { wings: 3, weapon: "nenhuma", veil: true }, id: "eter", name: "Éter", epithet: "Seis asas de fogo branco", color: "#ff5a36", eye: "#ffe08a", virtue: "Humildade", line: "Todo o brilho guardado sob as asas. Excelência sem precisar de plateia." },
  orbita: { angel: { wings: 2, weapon: "nenhuma", wheels: true }, id: "orbita", name: "Órbita", epithet: "Rodas de safira em movimento", color: "#64d2ff", eye: "#ffffff", virtue: "Zelo", line: "Duas rodas que nunca saem do eixo. Técnica limpa até no que ninguém vê." },
  // Feras
  golem:      { id: "golem", name: "O Colosso", epithet: "Golem de pedra", color: "#ff5a36", eye: "#ffd27a", line: "Lento, pesado, paciente. Igual ao volume." },
  lobo:       { id: "lobo", name: "Lobo de Ferro", epithet: "Caçador da matilha", color: "#64d2ff", eye: "#e8f6ff", line: "Ataca quem pula série." },
  javali:     { id: "javali", name: "Javali Blindado", epithet: "Fera da trincheira", color: "#ff9f0a", eye: "#ffe08a", line: "Investe sem parar. Aguente o tranco." },
  serpe:      { id: "serpe", name: "Serpe de Obsidiana", epithet: "Predadora das cargas altas", color: "#bf5af2", eye: "#f0d4ff", line: "Aperta a cada repetição." },
  titan:      { id: "titan", name: "Titã de Magma", epithet: "Senhor da fornalha", color: "#ff3b30", eye: "#fff1a8", line: "Só se vence com técnica sob fogo." },
  juggernaut: { id: "juggernaut", name: "Juggernaut", epithet: "Carrasco da Hell Week", color: "#ff2d2d", eye: "#ffffff", line: "Não para. Não cansa. Não perdoa." },
  sentinela:  { id: "sentinela", name: "Sentinela de Cristal", epithet: "Guardião do descanso", color: "#30d158", eye: "#d6ffe2", line: "Teste de controle: menos é mais hoje." },
  crocodilo: { id: "crocodilo", name: "Carcereiro do Brejo", epithet: "Vigia das águas fundas", color: "#62cfbb", eye: "#b9fff0", line: "Avance sem deixar o cansaço decidir seu ritmo." },
  grifo: { id: "grifo", name: "Grifo de Cobre", epithet: "Vigia das alturas", color: "#d6a469", eye: "#ffe8b3", line: "A precisão vem antes do impulso." },
  guardiao:   { id: "guardiao", name: "O Último Guardião", epithet: "Chefe do ciclo", color: "#ffd60a", eye: "#ffffff", line: "Tudo o que você construiu, agora." },
};
export const ANGELS: BeastId[] = ["aureo", "alcion", "vertice", "fulgor", "eter", "orbita"];
export const FERAS: BeastId[] = ["golem", "lobo", "javali", "serpe", "titan", "juggernaut", "sentinela", "guardiao", "crocodilo", "grifo"];
export const hasEncounterArt = (id: BeastId) => FERAS.includes(id);
export const ALL = (id: BeastId) => B[id];
const clamp = (n: number) => Math.max(1, Math.min(5, n)) as Beast["threat"];

/** Escolhe pela fase e semana. Na acumulação os anjos se revezam pela semana global da campanha. */
export function beastFor(kind: string | null | undefined, weekInPhase = 1, opts: { hell?: boolean; last?: boolean; week?: number; expanded?: boolean } = {}): Beast {
  if (opts.hell) return { ...B.juggernaut, threat: 5 };
  if (opts.expanded && kind === "intensificacao" && weekInPhase === 4) return { ...B.crocodilo, threat: 5 };
  if (opts.expanded && kind === "realizacao" && weekInPhase === 1 && !opts.last) return { ...B.grifo, threat: 4 };
  switch (kind) {
    case "deload": return { ...B.sentinela, threat: 1 };
    case "realizacao": return { ...B.guardiao, threat: clamp(4 + (opts.last ? 1 : 0)) };
    case "intensificacao": return weekInPhase <= 2 ? { ...B.serpe, threat: clamp(3 + (weekInPhase - 1)) } : { ...B.titan, threat: clamp(4 + (weekInPhase > 3 ? 1 : 0)) };
    case "acumulacao": { const w = opts.week ?? weekInPhase; return { ...B[ANGELS[(w - 1) % ANGELS.length]], threat: clamp(Math.min(3, weekInPhase)) }; }
    default: { const order: BeastId[] = ["golem", "lobo", "javali"]; return { ...B[order[(weekInPhase - 1) % 3]], threat: clamp(1 + ((weekInPhase - 1) % 3)) }; }
  }
}

type Prog = { id: string; start_date: string; phases: { kind: string; weeks: number; days: Record<string, unknown[]> }[] };
/** Criatura de uma semana específica da campanha. */
export const expandedBestiary = (startDate: string) => startDate >= "2026-11-19";

export function beastOfWeek(p: Prog, week: number): (Beast & { planned: number }) | null {
  let acc = 0;
  for (let i = 0; i < p.phases.length; i++) {
    const f = p.phases[i], w = Math.max(0, f.weeks);
    if (week <= acc + w) {
      const wip = week - acc;
      const planned = Object.values(f.days ?? {}).filter((l) => Array.isArray(l) && l.length > 0).length;
      return { ...beastFor(f.kind, wip, { hell: f.kind === "intensificacao" && wip === 1, last: i === p.phases.length - 1, expanded: expandedBestiary(p.start_date), week }), planned };
    }
    acc += w;
  }
  return null;
}

export type Record_ = { id: BeastId; won: number; met: number; last?: string };
/** Vitórias: cada treino concluído da campanha derrota a criatura da semana. "met" = semanas em que houve ao menos um treino. */
export function bestiaryRecord(programs: Prog[], sessions: { program_id: string | null; week_no: number | null; date: string }[]): Record<BeastId, Record_> {
  const out = Object.fromEntries((Object.keys(B) as BeastId[]).map((id) => [id, { id, won: 0, met: 0 }])) as Record<BeastId, Record_>;
  const byWeek = new Map<string, { n: number; last: string; days: Set<string> }>();
  for (const s of sessions) {
    if (!s.program_id || s.week_no == null) continue;
    const k = `${s.program_id}:${s.week_no}`, cur = byWeek.get(k);
    const days = cur?.days ?? new Set<string>(); days.add(s.date);
    byWeek.set(k, { n: days.size, last: !cur || s.date > cur.last ? s.date : cur.last, days });
  }
  for (const [k, v] of byWeek) {
    const [pid, wk] = k.split(":"), p = programs.find((x) => x.id === pid);
    const b = p && beastOfWeek(p, +wk);
    if (!b) continue;
    const r = out[b.id]; r.met++;
    // Cada treino concluído na semana derrota a criatura daquela semana uma vez.
    r.won += v.n; if (!r.last || v.last > r.last) r.last = v.last;
  }
  return out;
}

/** Caçada da semana atual: fera/anjo, treinos feitos e quantos faltam para abater (e levar para a Clareira). */
export function currentHunt(p: Prog | null, sessions: { program_id: string | null; week_no: number | null; date: string }[], today: string) {
  if (!p) return null;
  const days = Math.floor((Date.parse(today + "T12:00:00Z") - Date.parse(p.start_date + "T12:00:00Z")) / 864e5);
  if (days < 0) return null;
  const week = Math.floor(days / 7) + 1, b = beastOfWeek(p, week);
  if (!b) return null;
  const done = new Set(sessions.filter((s) => s.program_id === p.id && s.week_no === week).map((s) => s.date)).size;
  const planned = Math.max(1, b.planned);
  return { beast: b, week, done, planned, left: Math.max(0, planned - done), won: done > 0 };
}
