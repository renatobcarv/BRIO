// ASCENSION EVENTS: eventos dinâmicos derivados da periodização e dos registros reais. Sem dependências.
export type EvProgram = { id: string; name: string; start_date: string; phases: { kind: string; name: string; weeks: number; days: Record<string, unknown[]> }[] };
export type EvWorkout = { date: string; sets: { exercise: string; kg: number; reps: number; rpe?: number | null }[] };
export type EvInput = { today: string; programs: EvProgram[]; workouts: EvWorkout[]; meals: { date: string; protein: number }[]; proteinGoal: number; sleep: { date: string; hours: number }[]; travel?: { start: string; end: string }[] };

export type Badge = { id: string; name: string; pt: string; desc: string; kind: "glory" | "scar"; color: string; icon: string };
export type Objective = { label: string; value: number; target: number; done: boolean; unit?: string; safety?: boolean };
export type EventType = "hell_week" | "war_rations" | "genesis" | "sanctuary" | "judgment";
export type GameEvent = {
  id: string; type: EventType; title: string; tagline: string; color: string; start: string; end: string;
  stage: "anunciado" | "contagem" | "ativo" | "vitoria" | "falha" | "pausado"; daysToStart: number; program: string;
  objectives: Objective[]; rewardXp: number; boost: string; glory: Badge; scar: Badge; bonusXp: { date: string; xp: number; label: string }[];
  retro?: { sessions: number; volume: number; rpeShare: number };
};

const DAY = 86_400_000;
const D = (iso: string) => Date.parse(iso + "T12:00:00Z");
const add = (iso: string, n: number) => new Date(D(iso) + n * DAY).toISOString().slice(0, 10);
const diff = (a: string, b: string) => Math.round((D(a) - D(b)) / DAY);
const TIMED = /cardio|bike|bicicleta|caminhada|corrida|esteira|el[ií]ptico|mobilidade|alongamento|yoga/i;
const strength = (w: EvWorkout) => w.sets.filter((s) => !TIMED.test(s.exercise) && s.kg > 0 && s.reps > 0);
const vol = (w: EvWorkout) => strength(w).reduce((a, s) => a + s.kg * s.reps, 0);
const longestRun = (dates: string[]) => { let b = 0, r = 0, last = ""; for (const d of [...new Set(dates)].sort()) { r = last && add(last, 1) === d ? r + 1 : 1; b = Math.max(b, r); last = d; } return b; };

const ICON = {
  flame: "M24 4c3 8 12 12 12 24a12 12 0 0 1-24 0c0-6 3-9 5-12 1 4 3 6 5 7-2-8 1-14 2-19z",
  scar: "M10 34L38 12M14 40L42 18M8 26L30 8",
  drop: "M24 6s12 14 12 23a12 12 0 0 1-24 0c0-9 12-23 12-23z",
  hourglass: "M14 6h20M14 42h20M16 6c0 10 16 12 16 18s-16 8-16 18M32 6c0 10-16 12-16 18s16 8 16 18",
  hammer: "M10 38l16-16M22 10l8-4 12 12-4 8-8-2-6 6-4-4 6-6z",
  bolt: "M27 4L10 27h12l-3 17 17-24H24z",
  empty: "M14 14h20v24H14zM18 8h12v6H18zM14 30h20",
};
const glory = (id: string, name: string, pt: string, desc: string, icon: keyof typeof ICON, color = "#d12b65"): Badge => ({ id, name, pt, desc, kind: "glory", color, icon: ICON[icon] });
const scar = (id: string, name: string, pt: string, desc: string): Badge => ({ id, name, pt, desc, kind: "scar", color: "#6e1a1a", icon: ICON.scar });

/** Semanas de cada fase de um programa. */
function phaseWindows(p: EvProgram) {
  let acc = 0;
  return p.phases.map((f) => { const start = add(p.start_date, acc * 7); acc += Math.max(0, f.weeks); return { ...f, start, end: add(p.start_date, acc * 7 - 1) }; });
}
const plannedPerWeek = (days: Record<string, unknown[]>) => Object.values(days).filter((l) => Array.isArray(l) && l.length > 0).length;

function stageOf(today: string, start: string, end: string, success: boolean): GameEvent["stage"] {
  if (today < add(start, -7)) return "anunciado";
  if (today < start) return "contagem";
  if (today <= end) return "ativo";
  return success ? "vitoria" : "falha";
}

export function computeEvents(g: EvInput): GameEvent[] {
  const out: GameEvent[] = [];
  const inWin = (s: string, e: string) => g.workouts.filter((w) => w.date >= s && w.date <= e);
  const push = (ev: Omit<GameEvent, "stage" | "daysToStart">) => {
    if (diff(ev.start, g.today) > 14) return;                // só aparece até 14 dias antes
    // Viagem: os dias fora saem da conta (a meta diminui na proporção).
    // Só pausa o evento inteiro se a viagem cobrir a janela toda.
    const span = diff(ev.end, ev.start) + 1;
    const awayDays = new Set<string>();
    for (const t of g.travel ?? []) for (let d = t.start > ev.start ? t.start : ev.start; d <= ev.end && d <= t.end; d = add(d, 1)) awayDays.add(d);
    const away = awayDays.size >= span;
    if (awayDays.size && !away) {
      const k = (span - awayDays.size) / span;
      ev = { ...ev, objectives: ev.objectives.map((o) => o.safety ? o : { ...o, target: Math.max(1, Math.ceil(o.target * k)), done: o.value >= Math.max(1, Math.ceil(o.target * k)) }) };
    }
    const success = ev.objectives.every((o) => o.done);
    const stage = away ? "pausado" : stageOf(g.today, ev.start, ev.end, success);
    const bonus = [...ev.bonusXp.filter((b) => b.date <= g.today), ...(stage === "vitoria" ? [{ date: add(ev.end, 1), xp: ev.rewardXp, label: `${ev.title} vencido` }] : [])];
    out.push({ ...ev, stage, daysToStart: diff(ev.start, g.today), bonusXp: bonus });
  };

  for (const p of g.programs) {
    const wins = phaseWindows(p);
    // GENESIS: primeira semana do ciclo
    if (wins[0]) {
      const s = wins[0].start, e = add(s, 6), planned = plannedPerWeek(wins[0].days), done = inWin(s, e).length;
      push({ id: `${p.id}:genesis`, type: "genesis", title: "GENESIS", tagline: "O primeiro passo de um novo ciclo.", color: "#e0393e", start: s, end: e, program: p.name,
        objectives: [{ label: "Cumprir as missões da primeira semana", value: done, target: Math.max(1, planned), done: done >= Math.max(1, planned) }],
        rewardXp: 200, boost: "+200 XP ao vencer", bonusXp: [],
        glory: glory("first_blood", "FIRST BLOOD", "Primeiro sangue", "Começou o ciclo cumprindo cada missão da primeira semana.", "bolt", "#e0393e"),
        scar: scar("false_start", "FALSE START", "Largada queimada", "O ciclo começou, mas a primeira semana ficou incompleta.") });
    }
    // HELL WEEK + WAR RATIONS: primeira semana de cada intensificação
    for (const f of wins.filter((w) => w.kind === "intensificacao")) {
      const s = f.start, e = add(s, 6), planned = Math.max(1, plannedPerWeek(f.days)), ws = inWin(s, e);
      const sets = ws.flatMap(strength), rpeShare = sets.length ? sets.filter((x) => x.rpe).length / sets.length : 0;
      const run = longestRun(g.workouts.filter((w) => w.date >= add(s, -6) && w.date <= e).map((w) => w.date));
      const safe = run <= 6 && ws.length <= planned + 1;
      push({ id: `${p.id}:hell:${s}`, type: "hell_week", title: "HELL WEEK", tagline: "A semana de intensidade. Execução, não ego.", color: "#b51224", start: s, end: e, program: p.name,
        objectives: [
          { label: "Cumprir as missões planejadas", value: ws.length, target: planned, done: ws.length >= planned },
          { label: "Registrar o RPE das séries", value: Math.round(rpeShare * 100), target: 70, unit: "%", done: rpeShare >= 0.7 },
          { label: "Respeitar o descanso (sem 7 dias seguidos nem treino extra)", value: safe ? 1 : 0, target: 1, done: safe, safety: true },
        ],
        rewardXp: 500, boost: "XP de Força ×2 durante a semana · +500 ao vencer",
        bonusXp: ws.map((w) => ({ date: w.date, xp: Math.min(300, Math.round(vol(w) / 100)), label: "Hell Week · Força ×2" })).filter((b) => b.xp > 0),
        retro: { sessions: ws.length, volume: Math.round(ws.reduce((a, w) => a + vol(w), 0)), rpeShare: Math.round(rpeShare * 100) },
        glory: glory("hellforged", "HELLFORGED", "Forjado no inferno", "Atravessou a Hell Week cumprindo tudo, com técnica e sem atalhos.", "flame", "#e0393e"),
        scar: scar("scarred", "SCARRED", "Cicatriz", "Entrou no fogo e não terminou. A cicatriz é lembrete, não sentença.") });
      const days = Array.from({ length: 7 }, (_, i) => add(s, i));
      const hit = days.filter((d) => g.proteinGoal > 0 && g.meals.filter((m) => m.date === d).reduce((a, m) => a + m.protein, 0) >= g.proteinGoal).length;
      push({ id: `${p.id}:rations:${s}`, type: "war_rations", title: "WAR RATIONS", tagline: "Combustível de guerra: proteína em dia durante a Hell Week.", color: "#ff5a6e", start: s, end: e, program: p.name,
        objectives: [{ label: "Bater a meta de proteína", value: hit, target: 5, unit: " dias", done: hit >= 5 }],
        rewardXp: 150, boost: "+150 XP ao vencer", bonusXp: [],
        glory: glory("fueled", "FUELED FOR WAR", "Abastecido para a guerra", "Proteína em dia em 5 dos 7 dias da Hell Week.", "drop", "#ff5a6e"),
        scar: scar("empty_tank", "EMPTY TANK", "Tanque vazio", "Treinou a Hell Week sem o combustível necessário.") });
    }
    // SANCTUARY: semana de deload
    for (const f of wins.filter((w) => w.kind === "deload")) {
      const s = f.start, e = add(s, 6), planned = Math.max(1, plannedPerWeek(f.days)), ws = inWin(s, e);
      const rpes = ws.flatMap(strength).filter((x) => x.rpe).map((x) => x.rpe!), avg = rpes.length ? rpes.reduce((a, b) => a + b, 0) / rpes.length : 0;
      const nights = g.sleep.filter((x) => x.date >= s && x.date <= e && x.hours >= 7);
      push({ id: `${p.id}:sanctuary:${s}`, type: "sanctuary", title: "SANCTUARY", tagline: "Recuperar também é treinar. Quem descansa bem volta mais forte.", color: "#30d158", start: s, end: e, program: p.name,
        objectives: [
          { label: "Treinar sem passar do planejado", value: ws.length, target: planned, done: ws.length >= Math.max(1, planned - 1) && ws.length <= planned },
          { label: "Manter o esforço leve (RPE médio até 7,5)", value: Math.round(avg * 10) / 10, target: 7.5, done: !rpes.length || avg <= 7.5, safety: true },
          { label: "Dormir 7h ou mais", value: nights.length, target: 4, unit: " noites", done: nights.length >= 4 },
        ],
        rewardXp: 150, boost: "XP de sono ×2 durante a semana · +150 ao vencer",
        bonusXp: nights.map((n) => ({ date: n.date, xp: 15, label: "Sanctuary · sono ×2" })),
        glory: glory("iron_patience", "IRON PATIENCE", "Paciência de ferro", "Respeitou o deload: treino leve, sono em dia.", "hourglass", "#30d158"),
        scar: scar("restless", "RESTLESS", "Inquieto", "O deload pedia descanso e não teve. Recuperação não negociada vira estagnação.") });
    }
    // JUDGMENT DAY: última semana antes do deload final (ou do fim do ciclo)
    const lastWork = [...wins].reverse().find((w) => w.kind !== "deload");
    if (lastWork) {
      const e = lastWork.end, s = add(e, -6), ws = inWin(s, e);
      const has = (re: RegExp) => ws.some((w) => strength(w).some((x) => re.test(x.exercise) && !/stiff|romeno|halter|incl/i.test(x.exercise)));
      const lifts = [has(/agach|squat/i), has(/^supino|bench/i), has(/terra|deadlift/i)].filter(Boolean).length;
      push({ id: `${p.id}:judgment:${s}`, type: "judgment", title: "JUDGMENT DAY", tagline: "A avaliação do ciclo. O que foi construído aparece agora.", color: "#d12b65", start: s, end: e, program: p.name,
        objectives: [{ label: "Registrar uma série de teste no agachamento, supino e terra", value: lifts, target: 3, done: lifts >= 3 }],
        rewardXp: 300, boost: "+300 XP ao vencer",
        bonusXp: [],
        glory: glory("proven", "PROVEN", "Comprovado", "Testou os três levantamentos no fim do ciclo. Evolução medida, não imaginada.", "hammer", "#d12b65"),
        scar: scar("untested", "UNTESTED", "Não testado", "O ciclo terminou sem a avaliação dos levantamentos.") });
    }
  }
  const order = { ativo: 0, contagem: 1, anunciado: 2, vitoria: 3, falha: 3, pausado: 5 };
  return out.sort((a, b) => order[a.stage] - order[b.stage] || a.start.localeCompare(b.start));
}
