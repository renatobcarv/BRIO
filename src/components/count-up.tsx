"use client";
import { useEffect, useRef, useState } from "react";

/** Número que conta até o valor (e entre valores) com desaceleração suave. */
export function CountUp({ value, format = (v: number) => Math.round(v).toLocaleString("pt-BR"), duration = 900, className, style }:
  { value: number; format?: (v: number) => string; duration?: number; className?: string; style?: React.CSSProperties }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setShown(value); from.current = value; return; }
    const start = performance.now(), a = from.current, b = value;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration), e = 1 - Math.pow(1 - p, 4);
      setShown(a + (b - a) * e);
      if (p < 1) raf = requestAnimationFrame(tick); else from.current = b;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span className={className} style={style}>{format(shown)}</span>;
}
