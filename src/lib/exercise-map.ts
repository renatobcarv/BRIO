/** Tradução de nomes comuns de exercício (PT-BR) para o termo de busca em inglês do wger. */
const MAP: [RegExp, string][] = [
  [/supino.*inclin/i, "incline bench press"], [/supino.*declin/i, "decline bench press"], [/supino.*halter/i, "dumbbell bench press"], [/supino/i, "bench press"],
  [/crucifixo|fly|voador|peck/i, "fly"], [/crossover|cross over/i, "cable crossover"], [/flex[aã]o/i, "push up"], [/paralela|mergulho|dips?/i, "dips"],
  [/barra fixa|pull ?up|chin/i, "pull up"], [/puxada|pulldown|pulley/i, "lat pulldown"], [/remada.*curvad/i, "bent over row"], [/remada.*baixa|remada.*sentad/i, "seated cable row"], [/remada.*unilateral|serrote/i, "one arm dumbbell row"], [/remada/i, "row"],
  [/levantamento terra.*romeno|stiff|rdl/i, "romanian deadlift"], [/terra|deadlift/i, "deadlift"],
  [/agachamento.*b[uú]lgaro|b[uú]lgaro/i, "bulgarian split squat"], [/agachamento.*frontal/i, "front squat"], [/hack/i, "hack squat"], [/goblet/i, "goblet squat"], [/agachamento|squat/i, "squat"],
  [/leg ?press/i, "leg press"], [/extensora/i, "leg extension"], [/flexora|mesa flexora/i, "leg curl"], [/afundo|passada|lunge/i, "lunge"], [/eleva[cç][aã]o p[eé]lvica|hip thrust/i, "hip thrust"],
  [/panturrilha|g[eê]meos/i, "calf raise"], [/abdu[cç]/i, "hip abduction"], [/adu[cç]/i, "hip adduction"],
  [/desenvolvimento|militar|overhead|shoulder press/i, "shoulder press"], [/eleva[cç][aã]o lateral/i, "lateral raise"], [/eleva[cç][aã]o frontal/i, "front raise"], [/crucifixo inverso|posterior|reverse fly|face pull/i, "reverse fly"], [/encolhimento/i, "shrug"],
  [/rosca.*martelo/i, "hammer curl"], [/rosca.*scott/i, "preacher curl"], [/rosca.*concentrad/i, "concentration curl"], [/rosca/i, "biceps curl"],
  [/tr[ií]ceps.*testa|skull/i, "skull crusher"], [/tr[ií]ceps.*franc[eê]s/i, "overhead triceps extension"], [/tr[ií]ceps.*corda|tr[ií]ceps.*pulley|tr[ií]ceps/i, "triceps pushdown"],
  [/prancha|plank/i, "plank"], [/abdominal|crunch/i, "crunch"], [/eleva[cç][aã]o de pernas/i, "leg raise"],
  [/corrida|esteira/i, "running"], [/bike|bicicleta|ciclismo/i, "cycling"], [/remo erg/i, "rowing"],
];
export function exerciseTerm(name: string): string {
  for (const [re, en] of MAP) if (re.test(name)) return en;
  return name;
}
