import Link from "next/link";
import { HI, Ico } from "@/components/hunt-icons";

const TABS = [
  ["/estudos", "Trilhas", HI.flag], ["/estudos/ia", "Estudar com IA", HI.bolt], ["/estudos/conhecimento", "Conhecimento", HI.book], ["/estudos/lab", "Build Lab", HI.dumbbell], ["/estudos/conquistas", "Conquistas", HI.trophy],
] as const;

/** Navegação única da seção Estudos (reaproveita o padrão de blocos do Corpo/Finanças). */
export function StudyNav({ current }: { current: string }) {
  return (
    <nav aria-label="Seções de estudo" className="sticky top-0 z-30 -mx-4 px-4 py-2 mb-4 bg-[#050505]/90 backdrop-blur-xl md:static md:mx-0 md:px-0 md:bg-transparent md:backdrop-blur-none">
      <div className="grid grid-cols-5 gap-px bg-white/[.06] border border-white/[.06] rounded-[8px] overflow-hidden">
        {TABS.map(([href, label, icon]) => { const on = current === href; return (
          <Link key={href} href={href} aria-current={on ? "page" : undefined}
            className={`relative min-h-12 px-1.5 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-[10px] sm:text-[12px] uppercase tracking-[.1em] text-center transition-colors ${on ? "bg-[#140303] text-white" : "bg-[#080808] text-white/55 hover:text-white"}`}>
            {on && <span aria-hidden className="absolute inset-x-0 top-0 h-[2px] bg-[#ff2800]" style={{ boxShadow: "0 0 12px #ff2800" }} />}
            <Ico d={icon} size={14} color={on ? "#ffb21e" : "currentColor"} /><span className="leading-tight">{label}</span>
          </Link>); })}
      </div>
    </nav>
  );
}
