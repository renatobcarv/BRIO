// Conta como consumido só o que foi comido: refeições marcadas como feitas + registros fora do plano.
export const isOffPlan = (slot: string) => slot.startsWith("extra|");
export const eaten = <T extends { slot: string; date?: string }>(items: T[], done: Set<string> | string[]) => {
  const d = done instanceof Set ? done : new Set(done);
  return items.filter((i) => isOffPlan(i.slot) || d.has(i.date ? `${i.date}|${i.slot}` : i.slot));
};
