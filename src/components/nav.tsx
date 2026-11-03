"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; color: string; icon: React.ReactNode };
const I = (d: string) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
);
const home = I("M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z");
const spirit = I("M12 3v18M7 8h10M5 21h14");
const pioneer = I("M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z");
const body = I("M4 9v6M8 6v12M16 6v12M20 9v6M8 12h8");
const money = I("M3 7h18v10H3zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z");
const goals = I("M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01");
const more = I("M5 12h.01M12 12h.01M19 12h.01");
const gear = I("M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z");

const primary: Item[] = [
  { href: "/", label: "Início", color: "#e0ac53", icon: home },
  { href: "/espiritual", label: "Espiritual", color: "#e0ac53", icon: spirit },
  { href: "/pioneiro", label: "Pioneiro", color: "#84aed4", icon: pioneer },
  { href: "/corpo", label: "Corpo", color: "#8ac295", icon: body },
];
const secondary: Item[] = [
  { href: "/financas", label: "Finanças", color: "#d9c49a", icon: money },
  { href: "/metas", label: "Metas", color: "#ac8fd6", icon: goals },
  { href: "/configuracoes", label: "Configurações", color: "#9a978f", icon: gear },
];

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

export function Nav() {
  const path = usePathname();
  const moreActive = ["/mais", ...secondary.map((s) => s.href)].some((h) => path.startsWith(h));
  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 flex-col gap-1 p-5 border-r border-white/5">
        <Link href="/" className="font-display italic text-3xl text-ink mb-8 px-3">Brio</Link>
        {[...primary, ...secondary].map((it) => {
          const on = isActive(path, it.href);
          return (
            <Link key={it.href} href={it.href} aria-current={on ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 min-h-11 text-sm transition-colors ${on ? "bg-white/[.06] text-ink" : "text-muted hover:text-ink"}`}>
              <span style={{ color: on ? it.color : undefined }}>{it.icon}</span>{it.label}
            </Link>
          );
        })}
      </aside>
      {/* Mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/[.06] bg-base/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
        <ul className="grid grid-cols-5">
          {[...primary, { href: "/mais", label: "Mais", color: "#ac8fd6", icon: more }].map((it) => {
            const on = it.href === "/mais" ? moreActive : isActive(path, it.href);
            return (
              <li key={it.href}>
                <Link href={it.href} aria-current={on ? "page" : undefined}
                  className={`flex flex-col items-center justify-center gap-1 min-h-16 text-[10px] font-mono tracking-wider uppercase ${on ? "text-ink" : "text-faint"}`}>
                  <span style={{ color: on ? it.color : undefined }}>{it.icon}</span>{it.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
export { secondary as moreItems };
