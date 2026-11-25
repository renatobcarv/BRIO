"use client";
import { useEffect, useMemo, useState } from "react";
import { STAGES, fieldTitle, plantStage, wilted } from "@/lib/garden";

/**
 * Plantação das metas. Pronta para assets (ver docs/assets-plantacao.md):
 *  - Plantas:  /metas/plantas/{area}/{fase}.webp  → cai para /metas/plantas/padrao/{fase}.webp → cai para o desenho em SVG.
 *              Murcha: /metas/plantas/{area}/murcha-{fase}.webp (mesma cadeia).
 *  - Cenário:  /metas/campo/ceu.webp, /metas/campo/solo.webp e /metas/campo/grama-{1..4}.webp (a grama sobe de camada com o vigor).
 * Sem os arquivos, tudo aparece desenhado em código, então nada quebra.
 */
type G = { id: string; title: string; pct: number; color: string; area: string; deadline: string | null };
const rnd = (i: number) => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };
const NEXT = [0.05, 0.25, 0.5, 0.75, 1, 1];

/** Imagem com cadeia de fallback: mostra o desenho e só troca pela imagem depois que ela carregar de verdade. */
const probe = new Map<string, boolean>();
function Asset({ srcs, alt, className, style, fallback }: { srcs: string[]; alt: string; className?: string; style?: React.CSSProperties; fallback: React.ReactNode }) {
  const key = srcs.join("|");
  const [src, setSrc] = useState<string | null>(() => srcs.find((x) => probe.get(x)) ?? null);
  useEffect(() => {
    let alive = true;
    (async () => {
      for (const x of srcs) {
        if (probe.get(x) === false) continue;
        const ok = probe.get(x) ?? await new Promise<boolean>((res) => { const im = new Image(); im.onload = () => res(true); im.onerror = () => res(false); im.src = x; });
        probe.set(x, ok);
        if (ok) { if (alive) setSrc(x); return; }
      }
      if (alive) setSrc(null);
    })();
    return () => { alive = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return src ? <img src={src} alt={alt} className={className} style={style} draggable={false} /> : <>{fallback}</>;
}

/** Desenho da planta (fallback), detalhado por fase, com flores na cor da área. */
function PlantSvg({ stage, color, dry }: { stage: number; color: string; dry: boolean }) {
  const stem = dry ? "#8a7a4a" : "#2f9e4f", leaf = dry ? "#a48f58" : "#43c766", leaf2 = dry ? "#8c7a48" : "#2fae55";
  return (
    <svg viewBox="-60 -150 120 160" className={`h-full w-full ${dry ? "" : "garden-sway"}`} style={{ transformOrigin: "50% 100%" }} aria-hidden>
      <ellipse cx="0" cy="4" rx="34" ry="7" fill="#000" opacity=".35" />
      <path d="M-26 2 q26 -12 52 0 z" fill="#5a3d22" />
      {stage === 0 && <g><ellipse cx="0" cy="-4" rx="9" ry="6" fill="#9a6a35" /><path d="M-3 -8 q3 -6 6 0" stroke="#c99a5a" fill="none" strokeWidth="1.5" /></g>}
      {stage >= 1 && stage <= 4 && <path d={`M0 0 C ${dry ? 8 : -2} -30, ${dry ? 10 : 2} -60, ${dry ? 18 : 0} -${[0, 28, 55, 85, 105][stage]}`} stroke={stem} strokeWidth={2.5 + stage} fill="none" strokeLinecap="round" />}
      {stage >= 1 && stage <= 4 && <path d="M0 -14 q -18 -6 -24 -22 q 18 2 24 18" fill={leaf} />}
      {stage >= 2 && stage <= 4 && <path d="M0 -30 q 20 -6 26 -24 q -20 2 -26 20" fill={leaf2} />}
      {stage >= 3 && stage <= 4 && <><path d="M0 -50 q -22 -4 -28 -22 q 22 0 28 18" fill={leaf} /><path d="M0 -68 q 20 -4 26 -20 q -20 0 -26 16" fill={leaf2} /></>}
      {stage === 4 && <g transform={`translate(${dry ? 18 : 0} -108)`}>{[0, 60, 120, 180, 240, 300].map((a) => <ellipse key={a} cx="0" cy="-11" rx="7" ry="12" fill={dry ? "#a48f58" : color} transform={`rotate(${a})`} />)}<circle r="7" fill="#ffd60a" /><circle r="3" fill="#ff9f0a" /></g>}
      {stage === 5 && <g>
        <path d="M-6 0 q 2 -40 -2 -70 l 16 0 q -4 30 -2 70 z" fill={dry ? "#6b5636" : "#6b4423"} />
        <path d="M2 -60 q -18 -10 -26 -24 M4 -66 q 18 -8 24 -22" stroke={dry ? "#6b5636" : "#6b4423"} strokeWidth="5" fill="none" strokeLinecap="round" />
        {[[0, -110, 42], [-30, -92, 30], [30, -92, 30], [-14, -128, 26], [16, -130, 26]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={dry ? "#7f7a4e" : i % 2 ? "#2fa152" : "#37b35c"} />)}
        {[[-20, -100], [12, -118], [26, -96], [-6, -88], [0, -132], [-30, -116]].map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r="5.5" fill={dry ? "#9c8a55" : color} /><circle cx={x - 1.5} cy={y - 1.5} r="1.6" fill="#fff" opacity=".6" /></g>)}
      </g>}
    </svg>
  );
}

export function GoalGarden({ goals, vigor, studyH, activeDays, today }: { goals: G[]; vigor: number; studyH: number; activeDays: number; today: string }) {
  const [sel, setSel] = useState<string | null>(goals[0]?.id ?? null);
  const list = goals.slice(0, 10), blooming = list.filter((g) => plantStage(g.pct) >= 4).length, cur = list.find((g) => g.id === sel);
  const grassLayer = vigor >= 0.75 ? 4 : vigor >= 0.5 ? 3 : vigor >= 0.25 ? 2 : vigor > 0.05 ? 1 : 0;
  const blades = useMemo(() => Array.from({ length: Math.round(60 + vigor * 340) }, (_, i) => ({ x: rnd(i + 1) * 100, h: 8 + rnd(i + 7) * (10 + vigor * 46), lean: (rnd(i + 3) - 0.5) * 12, c: ["#3fbf5f", "#2e9e4d", "#56d977"][i % 3], d: (i % 9) * 0.3 })), [vigor]);
  const flowers = useMemo(() => Array.from({ length: Math.round(vigor * 24) }, (_, i) => ({ x: rnd(i + 91) * 100, y: rnd(i + 33) * 14, c: ["#ffd60a", "#ff9f0a", "#f5f5f7", "#ff8ad1"][i % 4] })), [vigor]);
  return (
    <section className="hunt-card relative overflow-hidden p-0 mb-4" aria-label="Plantação das metas">
      <div className="flex flex-wrap items-end justify-between gap-3 p-5 pb-3">
        <div><p className="label">Sua plantação</p><p className="font-display text-3xl sm:text-4xl mt-1">{fieldTitle(vigor, blooming, list.length)}</p>
          <p className="text-[12.5px] text-white/55 mt-1">Cada avanço numa meta faz a planta crescer. Cada hora de estudo e cada dia de missão cumprida engrossam a grama.</p></div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {([["Grama", `${Math.round(vigor * 100)}%`], ["Estudo", `${studyH.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} h`], ["Missão", `${activeDays} d`]] as const).map(([l, v]) => (
            <div key={l} className="rounded-[10px] bg-white/[.05] px-3 py-1.5"><p className="text-[16px] font-bold">{v}</p><p className="text-[10px] text-white/50">{l} · 30 d</p></div>))}
        </div>
      </div>

      {/* Cena: no celular rola para o lado, para as plantas terem tamanho de verdade. */}
      <div className="overflow-x-auto">
        <div className="relative isolate min-w-[760px] aspect-[16/7]">
          <Asset srcs={["/metas/campo/ceu.webp"]} alt="" className="absolute inset-0 -z-30 h-full w-full object-cover" fallback={<div className="absolute inset-0 -z-30 bg-[linear-gradient(180deg,#0a1322,#14241a_70%)]">
            <div className="absolute right-[10%] top-[12%] h-16 w-16 rounded-full" style={{ background: "#ffd28a", opacity: 0.2 + vigor * 0.6, boxShadow: `0 0 ${20 + vigor * 60}px #ffd28a` }} />
            <div className="absolute inset-x-0 bottom-[22%] h-[30%] bg-[radial-gradient(60%_100%_at_30%_100%,#1f3a24,transparent_70%),radial-gradient(50%_100%_at_80%_100%,#1a3320,transparent_70%)]" /></div>} />
          <Asset srcs={["/metas/campo/solo.webp"]} alt="" className="absolute inset-x-0 bottom-0 -z-20 h-[24%] w-full object-cover" fallback={<div className="absolute inset-x-0 bottom-0 -z-20 h-[24%] bg-[linear-gradient(180deg,#4a331b,#1a120a)]" />} />
          {grassLayer > 0 && <Asset key={grassLayer} srcs={[`/metas/campo/grama-${grassLayer}.webp`]} alt="" className="absolute inset-x-0 bottom-[18%] -z-10 h-[22%] w-full object-cover object-bottom" fallback={
            <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="absolute inset-x-0 bottom-[20%] -z-10 h-[24%] w-full" aria-hidden>
              {blades.map((b, i) => <path key={i} d={`M${b.x} 40 q ${b.lean / 6} -${b.h / 3} ${b.lean / 3} -${b.h / 1.6}`} stroke={b.c} strokeWidth=".45" fill="none" className="garden-blade" style={{ animationDelay: `${b.d}s` }} />)}
              {flowers.map((f, i) => <circle key={i} cx={f.x} cy={40 - 6 - f.y} r=".7" fill={f.c} />)}
            </svg>} />}
          {list.map((g, i) => { const st = plantStage(g.pct), dry = wilted(g.pct, g.deadline, today), x = ((i + 1) / (list.length + 1)) * 100, on = sel === g.id, size = [9, 12, 15, 18, 20, 25][st];
            const pre = dry ? "murcha-" : "";
            return (
              <button key={g.id} type="button" onClick={() => setSel(g.id)} aria-pressed={on} aria-label={`${g.title}: ${STAGES[st]}, ${Math.round(g.pct * 100)}%`}
                className="absolute bottom-[16%] -translate-x-1/2 text-center" style={{ left: `${x}%`, width: `${size * 0.9}%` }}>
                <span className="block aspect-[3/4] w-full" style={{ filter: on ? `drop-shadow(0 0 14px ${g.color})` : undefined }}>
                  <Asset srcs={[`/metas/plantas/${g.area}/${pre}${st}.webp`, `/metas/plantas/padrao/${pre}${st}.webp`]} alt="" className={`h-full w-full object-contain object-bottom ${dry ? "" : "garden-sway"}`} style={{ transformOrigin: "50% 100%" }}
                    fallback={<PlantSvg stage={st} color={g.color} dry={dry} />} />
                </span>
                <span className="mt-1 inline-block max-w-full truncate rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: on ? g.color : "rgba(0,0,0,.6)", color: on ? "#111" : "#fff" }}>{Math.round(g.pct * 100)}%</span>
              </button>); })}
          {!list.length && <p className="absolute inset-x-0 top-1/3 text-center text-white/70">Crie uma meta para plantar a primeira semente.</p>}
        </div>
      </div>

      {/* Detalhe de cada planta */}
      <div className="grid gap-2 p-4 sm:grid-cols-2">
        {list.map((g) => { const st = plantStage(g.pct), dry = wilted(g.pct, g.deadline, today), nx = NEXT[st], on = sel === g.id; return (
          <button key={g.id} type="button" onClick={() => setSel(g.id)} className="flex items-center gap-3 rounded-[14px] border p-3 text-left transition-colors" style={{ borderColor: on ? g.color : "rgba(255,255,255,.07)", background: on ? `${g.color}12` : "rgba(255,255,255,.02)" }}>
            <span className="h-12 w-10 shrink-0"><Asset srcs={[`/metas/plantas/${g.area}/${dry ? "murcha-" : ""}${st}.webp`, `/metas/plantas/padrao/${dry ? "murcha-" : ""}${st}.webp`]} alt="" className="h-full w-full object-contain object-bottom" fallback={<PlantSvg stage={st} color={g.color} dry={dry} />} /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold">{g.title}</span>
              <span className="block text-[11.5px]" style={{ color: dry ? "#ff8a80" : g.color }}>{dry ? "Murchando · prazo vencido" : STAGES[st]}</span>
              <span className="mt-1 block h-1.5 rounded-full bg-white/10"><i className="block h-1.5 rounded-full" style={{ width: `${Math.min(100, g.pct * 100)}%`, background: g.color }} /></span>
              <span className="mt-1 block text-[11px] text-white/50">{st >= 5 ? "Árvore com frutos: meta concluída!" : `${Math.round(g.pct * 100)}% · ${STAGES[st + 1]} em ${Math.max(1, Math.round((nx - g.pct) * 100))}%`}</span>
            </span>
          </button>); })}
      </div>
      {cur && wilted(cur.pct, cur.deadline, today) && <p className="px-5 pb-4 text-[12.5px] text-[#ff8a80]">{cur.title} está murchando: o prazo passou. Ajuste o prazo ou a meta para ela voltar a crescer.</p>}
    </section>
  );
}
