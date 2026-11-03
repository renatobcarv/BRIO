import { addDays } from "./date";
/** Dias seguidos com registro, contando até hoje (ou ontem, se hoje ainda vazio). */
export function dayStreak(days: Set<string>, today: string) {
  let d = days.has(today) ? today : addDays(today, -1), n = 0;
  while (days.has(d)) { n++; d = addDays(d, -1); }
  return n;
}
