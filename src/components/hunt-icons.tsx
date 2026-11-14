/** Ícones de traço do modo caçador: geométricos, cantos vivos, 1.8px, herdam a cor. */
export const HI = {
  flame: "M12 2l5 7-2-.5 4 6.5-3.5 7h-7L5 15l4-6.5L7 9z",
  target: "M12 3v3M12 18v3M3 12h3M18 12h3M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 11v2",
  protein: "M4 14l6-6 6 6-6 6zM14 4l6 6M17 3l4 4",
  carb: "M4 10h16l-2 10H6zM8 10V6h8v4",
  fat: "M12 3l7 10a7 7 0 1 1-14 0z",
  sunrise: "M3 18h18M6 18a6 6 0 0 1 12 0M12 5v3M5 9l2 2M19 9l-2 2",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2",
  snack: "M5 8h14l-1.5 12h-11zM9 8V5h6v3",
  moon: "M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z",
  cup: "M6 4h12l-2 16H8zM6 9h12",
  fork: "M7 3v7a2 2 0 0 0 4 0V3M9 10v11M16 3c-2 2-2 7 0 8v10",
  drop: "M12 3l6 9a6 6 0 1 1-12 0z",
  bed: "M3 18V8M3 14h18v4M21 14v-3a3 3 0 0 0-3-3h-7v6",
  bolt: "M13 2L5 14h6l-1 8 8-12h-6z",
  scale: "M4 20h16l-2-13H6zM9 7a3 3 0 0 1 6 0M12 11l2 3",
  chart: "M4 20V4M4 20h16M8 16l4-5 3 3 5-7",
  plus: "M12 5v14M5 12h14",
  dumbbell: "M3 10v4M21 10v4M6 7v10M18 7v10M6 12h12",
  star: "M12 3l2.6 6 6.4.6-4.8 4.3 1.4 6.4L12 17l-5.6 3.3 1.4-6.4L3 9.6 9.4 9z",
  book: "M3 6c3-1.5 6-1.5 9 0v13c-3-1.5-6-1.5-9 0zM21 6c-3-1.5-6-1.5-9 0v13c3-1.5 6-1.5 9 0z",
  clock: "M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
  pin: "M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11zM12 8v4",
  people: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 6",
  coin: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9 9h4.5a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3H15M12 7v2M12 15v2",
  up: "M5 15l7-7 7 7",
  down: "M5 9l7 7 7-7",
  pen: "M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5z",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  trophy: "M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7",
  flag: "M5 21V4M5 4h11l-2 4 2 4H5",
  list: "M9 6h11M9 12h11M9 18h11M4 6h1M4 12h1M4 18h1",
} as const;
export function Ico({ d, size = 16, className = "", color = "currentColor" }: { d: string; size?: number; className?: string; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden className={`shrink-0 ${className}`}><path d={d} /></svg>;
}
export const slotIcon = (label: string) => /caf[eé]|manh/i.test(label) ? HI.sunrise : /almo/i.test(label) ? HI.sun : /janta|ceia|noite/i.test(label) ? HI.moon : /lanche|tarde/i.test(label) ? HI.snack : /pr[eé]|p[oó]s.?treino/i.test(label) ? HI.bolt : HI.fork;
