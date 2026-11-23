import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { loadGame } from "@/lib/game-data";
import { todayISO } from "@/lib/date";
import { ATTRS, RANKS, RARITY, type Attr } from "@/lib/game";
import { GEAR, TIER, gearById, gearPct } from "@/lib/items";
import { ALL } from "@/lib/bestiary";
import { CreaturePortrait } from "@/components/body/creature-portrait";
import { StatusSheet } from "@/components/game/status";
import { CorpoView } from "./corpo-view";
import { MindView } from "./mind-view";

export const dynamic = "force-dynamic";
const A = "#ffb21e";
const WD = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** Perfil: quem você é no BRIO, tudo num lugar (nível, patente, semana, mascote, feras, itens, atributos e conquistas). */
const TABS = [["status", "Status"], ["perfil", "Perfil"], ["corpo", "Corpo"], ["mente", "Mente"]] as const;
type Tab = (typeof TABS)[number][0];

export default async function Status({ searchParams }: { searchParams: Promise<{ aba?: string; sub?: string; d?: string }> }) {
  const sp = await searchParams;
  const tab: Tab = TABS.some(([k]) => k === sp.aba) ? (sp.aba as Tab) : "status";
  const sb = await createClient();
  const [{ data: u }, s] = await Promise.all([sb.auth.getUser(), getSettings(sb)]);
  const today = todayISO(), g = await loadGame(sb, s, today);
  const user = u.user, meta = (user?.user_metadata ?? {}) as { full_name?: string; name?: string; avatar_url?: string };
  const name = meta.full_name || meta.name || user?.email?.split("@")[0] || "Caçador";
  const handle = (user?.email?.split("@")[0] ?? "brio").toLowerCase();
  const pet = g.pet as { name: string; species: string; stage: { key: string; name: string } } | null;
  const avatar = pet ? `/mascotes/${pet.species}/${pet.stage.key}.webp` : meta.avatar_url || "/pantera/sentada.webp";
  const done = g.achievements.filter((a) => a.done), streak = (() => { let n = 0; for (let i = g.week.length - 1; i >= 0 && g.week[i].xp > 0; i--) n++; return n; })();
  const nextRank = RANKS.find((r) => r.min > g.level);
  const it = g.items, rare = [...done].sort((a, b) => ["lendaria", "epica", "rara", "comum"].indexOf(a.rarity) - ["lendaria", "epica", "rara", "comum"].indexOf(b.rarity)).slice(0, 6);
  return (
    <div className="perfil-page pb-10" data-tab={tab}>
      {/* Capa: espaço pronto para arte (troque o fundo de .perfil-cover no CSS ou passe uma imagem). */}
      <div aria-hidden className="perfil-cover pointer-events-none absolute inset-x-0 top-0 -z-10 h-[360px]" style={{ background: `radial-gradient(60% 80% at 50% 0%, ${A}22, transparent 70%)` }} />
      <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <Link href="/configuracoes" aria-label="Configurações" className="grid place-items-center h-10 w-10 rounded-full bg-white/[.06]">⚙</Link>
        <span className="flex items-center gap-2 rounded-full bg-white/[.06] pl-3 pr-1 py-1"><span className="font-semibold" style={{ color: A }}>◉ {(it?.gold ?? 0).toLocaleString("pt-BR")}</span><Link href="/mascote" aria-label="Loja" className="grid place-items-center h-7 w-7 rounded-full text-black font-bold" style={{ background: A }}>+</Link></span>
      </div>

      <header className="text-center mt-4">
        <div className="mx-auto h-28 w-28 rounded-full p-1" style={{ background: `conic-gradient(${A} ${g.progress * 360}deg, rgba(255,255,255,.1) 0)` }}>
          <div className="h-full w-full rounded-full bg-[#0b0b0d] overflow-hidden grid place-items-center"><img src={avatar} alt="" className="h-[92%] w-[92%] object-contain" /></div>
        </div>
        <h1 className="text-[30px] font-bold tracking-tight mt-3 leading-none">{name}</h1>
        <p className="text-white/45 text-[14px] mt-1">@{handle} · <span style={{ color: g.rank.color }}>{g.rank.name}</span></p>
      </header>

      <div className="grid grid-cols-3 mt-6 text-center divide-x divide-white/10">
        <div><p className="text-[22px] font-bold" style={{ color: A }}>{g.level}</p><p className="text-[12px] text-white/50">Nível</p></div>
        <div><p className="text-[22px] font-bold">{done.length}<span className="text-white/35 text-[14px]">/{g.achievements.length}</span></p><p className="text-[12px] text-white/50">Conquistas</p></div>
        <div><p className="text-[22px] font-bold">{g.total.toLocaleString("pt-BR")}</p><p className="text-[12px] text-white/50">XP total</p></div>
      </div>

      </div>
      <nav aria-label="Seções do perfil" className="perfil-tabs sticky top-0 z-20 -mx-4 px-4 py-2 mt-6 bg-[#050505]/90 backdrop-blur-xl">
        <div className="max-w-xl mx-auto grid grid-cols-4 gap-1 p-1 rounded-[14px] bg-white/[.05]">
          {TABS.map(([k, l]) => <Link key={k} href={`/status?aba=${k}`} aria-current={tab === k ? "page" : undefined} className={`rounded-[11px] py-2.5 text-center text-[14px] font-semibold ${tab === k ? "bg-[#f5f5f7] text-black" : "text-white/65"}`}>{l}</Link>)}
        </div>
      </nav>
      {tab === "status" && <div className="perfil-section mt-4" data-section="status"><StatusSheet g={g} /></div>}
      {tab === "corpo" && <div className="perfil-section mt-4" data-section="corpo"><CorpoView sp={{ aba: sp.sub, d: sp.d }} /></div>}
      {tab === "mente" && <div className="perfil-section mt-4" data-section="mente"><MindView /></div>}
      {tab === "perfil" && <div className="perfil-section max-w-xl mx-auto" data-section="perfil">
      <div className="grid grid-cols-7 gap-1.5 mt-6">
        {g.week.map((d) => { const on = d.date === today, n = d.xp > 0 ? Math.min(3, Math.ceil(d.xp / 120)) : 0; return (
          <div key={d.date} className="rounded-[14px] py-2.5 text-center" style={{ background: "rgba(255,255,255,.04)", outline: on ? `1.5px solid ${A}` : undefined }}>
            <div className="flex justify-center gap-0.5 h-2">{Array.from({ length: Math.max(1, n) }, (_, k) => <i key={k} className="h-1.5 w-1.5 rounded-full" style={{ background: n ? A : "rgba(255,255,255,.2)" }} />)}</div>
            <p className="text-[12px] text-white/50 mt-1">{WD[new Date(d.date + "T12:00:00Z").getUTCDay()]}</p><p className="text-[16px] font-semibold">{d.date.slice(8)}</p>
          </div>); })}
      </div>

      <div className="grid grid-cols-[1fr_1.4fr] gap-3 mt-4">
        <Link href="/mascote" className="rounded-[20px] bg-white/[.04] p-4 text-center">
          <div className="flex justify-center -space-x-4">{(it?.army ?? []).slice(0, 3).map((t) => <div key={t.id} className="h-12 w-12 rounded-full bg-[#141416] border border-black overflow-hidden"><CreaturePortrait id={t.id} className="w-full h-full" /></div>)}
            {!(it?.army ?? []).length && <div className="h-12 w-12 rounded-full bg-white/[.06] grid place-items-center text-white/30">?</div>}</div>
          <p className="font-semibold mt-2">Feras</p><p className="text-[12px]" style={{ color: A }}>{it?.army.length ?? 0} domada(s)</p>
        </Link>
        <div className="rounded-[20px] p-4 relative overflow-hidden" style={{ background: `linear-gradient(135deg, #1a1306, #0b0b0d 70%)` }}>
          <p className="font-semibold">{streak >= 3 ? "Continue assim!" : "Hoje conta."}</p>
          <p className="text-[12.5px] text-white/55 mt-1">{streak ? `${streak} dia(s) seguidos com XP nesta semana.` : "Marque uma missão para acender a semana."}</p>
          <div className="flex gap-1 mt-3">{g.week.map((d) => <i key={d.date} className="h-2 w-2 rounded-full" style={{ background: d.xp > 0 ? A : "rgba(255,255,255,.15)" }} />)}</div>
          <span aria-hidden className="absolute -right-2 -bottom-3 text-[64px] opacity-80">🏆</span>
        </div>
      </div>

      <section className="rounded-[20px] bg-white/[.04] p-4 mt-3">
        <div className="flex justify-between items-baseline"><p className="font-semibold">Rumo a {nextRank ? nextRank.name : "o ápice"}</p><p className="text-[12px] text-white/50">{g.into.toLocaleString("pt-BR")}/{g.need.toLocaleString("pt-BR")} XP</p></div>
        <div className="h-2 rounded-full bg-white/10 mt-2"><i className="block h-2 rounded-full" style={{ width: `${g.progress * 100}%`, background: A }} /></div>
        <p className="text-[12px] text-white/45 mt-2">{nextRank ? `Patente ${nextRank.name} no nível ${nextRank.min}.` : "Você chegou ao topo das patentes."} “{g.rank.motto}”</p>
      </section>

      <section className="rounded-[20px] bg-white/[.04] p-4 mt-3">
        <p className="font-semibold">Atributos</p>
        <div className="grid gap-2 mt-3">{(Object.keys(ATTRS) as Attr[]).map((k) => (
          <div key={k} className="flex items-center gap-3 text-[13px]"><span className="w-24 text-white/65">{ATTRS[k].label}</span><div className="flex-1 h-1.5 rounded-full bg-white/10"><i className="block h-1.5 rounded-full" style={{ width: `${g.attrs[k]}%`, background: ATTRS[k].color }} /></div><span className="w-7 text-right font-semibold">{g.attrs[k]}</span></div>))}</div>
      </section>

      {pet && <Link href="/mascote" className="flex items-center gap-4 rounded-[20px] bg-white/[.04] p-4 mt-3">
        <img src={avatar} alt="" className="h-16 w-16 object-contain" />
        <span className="flex-1"><span className="block font-semibold">{pet.name}</span><span className="block text-[12px] text-white/50">{pet.stage.name}{it?.active ? ` · com ${ALL(it.active).name}` : ""}</span></span>
        <span className="text-white/30">›</span></Link>}

      <section className="rounded-[20px] bg-white/[.04] p-4 mt-3">
        <div className="flex justify-between"><p className="font-semibold">Equipamento</p><Link href="/mascote" className="text-[12px]" style={{ color: A }}>{Object.keys(it?.owned ?? {}).length}/{GEAR.length} itens ›</Link></div>
        <div className="grid grid-cols-3 gap-2 mt-3">{(["forca", "vigor", "sabedoria", "servico", "disciplina", "ordem"] as Attr[]).map((k) => { const e = it?.equipped[k], x = e ? gearById(e.id) : null; return (
          <div key={k} className="rounded-[12px] p-2 text-center bg-white/[.03] border" style={{ borderColor: x ? TIER[x.tier].color + "55" : "rgba(255,255,255,.06)" }}>
            <p className="text-[10px] text-white/45">{ATTRS[k].label}</p><p className="text-[11.5px] font-semibold leading-tight mt-0.5 line-clamp-2">{x ? x.name : "—"}</p>{x && <p className="text-[10px]" style={{ color: A }}>+{gearPct(x, it?.levels[x.id])}%</p>}</div>); })}</div>
      </section>

      <section className="rounded-[20px] bg-white/[.04] p-4 mt-3">
        <div className="flex justify-between"><p className="font-semibold">Conquistas de destaque</p><Link href="/status" className="text-[12px]" style={{ color: A }}>ver todas ›</Link></div>
        {rare.length ? <ul className="grid grid-cols-2 gap-2 mt-3">{rare.map((a) => <li key={a.id} className="rounded-[12px] p-3 bg-white/[.03]"><p className="text-[10px] uppercase tracking-wider" style={{ color: RARITY[a.rarity].color }}>{RARITY[a.rarity].label}</p><p className="text-[13px] font-semibold leading-tight">{a.title}</p></li>)}</ul>
          : <p className="text-[13px] text-white/50 mt-2">Sua primeira conquista está a um dia 100% de distância.</p>}
      </section>
      </div>}
    </div>
  );
}
