"use client";
import { useEffect } from "react";

/** Revelar ao rolar (GEN-MO-10) sem esconder conteúdo sem JS (GEN-MO-02): só esconde depois que <html> ganha a classe .mo. */
export function SiteMotion() {
  useEffect(() => {
    const root = document.documentElement;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    root.classList.add("mo");
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("on"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -12% 0px" });
    document.querySelectorAll<HTMLElement>(".in").forEach((el) => { el.style.setProperty("--d", `${Math.min(+(el.dataset.i ?? 0), 8) * 90}ms`); io.observe(el); });
    // Hero inclinado que endireita com a rolagem (GEN-LAY-03)
    const stage = document.querySelector<HTMLElement>(".hero-stage");
    const onScroll = () => { if (stage) stage.style.setProperty("--p", String(Math.min(1, scrollY / 420))); };
    onScroll(); addEventListener("scroll", onScroll, { passive: true });
    // Inclinação + luz seguindo o mouse, só com hover real (GEN-MO-14)
    const tilt = matchMedia("(hover: hover)").matches ? [...document.querySelectorAll<HTMLElement>(".tilt")] : [];
    const move = (e: PointerEvent) => { const el = e.currentTarget as HTMLElement, r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.setProperty("--rx", `${(0.5 - y) * 6}deg`); el.style.setProperty("--ry", `${(x - 0.5) * 8}deg`); el.style.setProperty("--mx", `${x * 100}%`); el.style.setProperty("--my", `${y * 100}%`); };
    const leave = (e: PointerEvent) => { const el = e.currentTarget as HTMLElement; el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); };
    tilt.forEach((el) => { el.addEventListener("pointermove", move); el.addEventListener("pointerleave", leave); });
    return () => { io.disconnect(); removeEventListener("scroll", onScroll); root.classList.remove("mo"); tilt.forEach((el) => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); }); };
  }, []);
  return null;
}
