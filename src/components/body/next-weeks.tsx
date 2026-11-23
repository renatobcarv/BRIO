"use client";
import { CreaturePortrait } from "@/components/body/creature-portrait";
import { beastOfWeek } from "@/lib/bestiary";
import { PHASE_KINDS, type Program } from "@/lib/training";

const br = (iso: string) => `${iso.slice(8)}/${iso.slice(5, 7)}`;
const add = (iso: string, d: number) => { const x = new Date(iso + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + d); return x.toISOString().slice(0, 10); };

/** Próximas semanas da campanha: data, fase e a fera (ou anjo) de cada uma. */
export function NextWeeks({ p, week, count = 4 }: { p: Program; week: number; count?: number }) {
  const items = Array.from({ length: count }, (_, i) => week + 1 + i).map((w) => {
    let acc = 0, phase = p.phases[0];
    for (const f of p.phases) { if (w <= acc + f.weeks) { phase = f; break; } acc += f.weeks; }
    return { w, b: beastOfWeek(p as never, w), phase, from: add(p.start_date, (w - 1) * 7) };
  }).filter((x) => x.b);
  if (!items.length) return null;
  return (
    <div className="mt-4">
      <p className="label !text-[9px] mb-2">Próximas semanas</p>
      <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
        {items.map(({ w, b, phase, from }) => (
          <div key={w} className="snap-start shrink-0 w-[132px] rounded-[12px] p-2.5 border border-white/[.07]" style={{ background: `radial-gradient(90% 70% at 50% 20%, ${b!.color}22, #0b0b0d 75%)` }}>
            <div className="mx-auto h-16 w-16"><CreaturePortrait id={b!.id} className="w-full h-full" /></div>
            <p className="text-[10px] text-white/45 mt-1">Sem. {w} · {br(from)}</p>
            <p className="text-[13px] font-bold leading-tight truncate">{b!.name}</p>
            <p className="text-[10px] truncate" style={{ color: PHASE_KINDS[phase.kind as keyof typeof PHASE_KINDS]?.color }}>{b!.angel ? "anjo · exemplo" : `${"●".repeat(b!.threat)} ameaça`}</p>
          </div>))}
      </div>
    </div>
  );
}
