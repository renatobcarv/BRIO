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
const book = I("M4 5a2 2 0 0 1 2-2h6v17H6a2 2 0 0 0-2 2zM20 5a2 2 0 0 0-2-2h-6v17h6a2 2 0 0 1 2 2z");
const star = I("M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z");
const gear = I("M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z");

const primary: Item[] = [
  { href: "/", label: "Início", color: "#ffb340", icon: home },
  { href: "/espiritual", label: "Espiritual", color: "#ffb340", icon: spirit },
  { href: "/pioneiro", label: "Pioneiro", color: "#0a84ff", icon: pioneer },
  { href: "/corpo", label: "Corpo", color: "#30d158", icon: body },
];
const secondary: Item[] = [
  { href: "/status", label: "Status", color: "#ffb340", icon: star },
  { href: "/financas", label: "Finanças", color: "#3ee6c1", icon: money },
  { href: "/livros", label: "Livros", color: "#ff9f0a", icon: book },
  { href: "/metas", label: "Metas", color: "#bf5af2", icon: goals },
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
        <Link href="/" className="font-display text-2xl text-ink mb-8 px-3 tracking-tight">Brio</Link>
        {[...primary, ...secondary].map((it) => {
          const on = isActive(path, it.href);
          return (
            <Link key={it.href} href={it.href} aria-current={on ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 min-h-11 text-sm transition-colors ${on ? "bg-white/[.08] text-ink" : "text-muted hover:text-ink"}`}>
              <span style={{ color: on ? it.color : undefined }}>{it.icon}</span>{it.label}
            </Link>
          );
        })}
      </aside>
      {/* Mobile: cápsula flutuante */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] pointer-events-none" aria-label="Navegação principal">
        <ul className="pointer-events-auto mx-auto max-w-md flex items-center justify-between gap-1 rounded-full p-1.5 border border-white/[.09] bg-[#161618]/90 backdrop-blur-xl shadow-[0_20px_40px_-16px_rgba(0,0,0,1)]">
          {[...primary, { href: "/mais", label: "Mais", color: "#bf5af2", icon: more }].map((it) => {
            const on = it.href === "/mais" ? moreActive : isActive(path, it.href);
            return (
              <li key={it.href} className={on ? "flex-[1.6]" : "flex-1"} style={{ transition: "flex .35s cubic-bezier(.34,1.56,.64,1)" }}>
                <Link href={it.href} aria-current={on ? "page" : undefined} aria-label={it.label}
                  className={`flex items-center justify-center gap-2 h-12 rounded-full transition-colors ${on ? "bg-[#f5f5f7] text-black shadow-[0_0_24px_-4px_rgba(255,255,255,.55)]" : "text-muted hover:text-ink"}`}>
                  {it.icon}
                  {on && <span className="text-[12px] font-semibold nav-label">{it.label}</span>}
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
