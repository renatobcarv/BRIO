"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { saveMindSession } from "@/app/(app)/status/mind-actions";
import { DOMAINS, ability, correctMemory, domainIndex, indexOf, make, mindXp, nextLevel, type Cell, type Domain } from "@/lib/mind";

const A = "#ffb21e";
type Session = { date: string; kind: "teste" | "treino"; score: number | null; domains: Partial<Record<Domain, number | null>> };
type Ans = { domain: Domain; d: number; ok: boolean };
const KEYS = Object.keys(DOMAINS) as Domain[];

function Shape({ c, size = 22 }: { c: Cell; size?: number }) {
  const f = c.fill ? A : "none", st = { stroke: A, strokeWidth: 2 };
  const one = c.shape === "circulo" ? <circle cx="12" cy="12" r="8" fill={f} {...st} /> : c.shape === "quadrado" ? <rect x="4" y="4" width="16" height="16" fill={f} {...st} /> : <path d="M12 4l9 16H3z" fill={f} {...st} />;
  return <span className="inline-flex flex-wrap justify-center gap-0.5">{Array.from({ length: c.n }, (_, i) => <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden>{one}</svg>)}</span>;
}
const cellLabel = (c: Cell) => `${c.n} ${c.shape}${c.n > 1 ? "s" : ""} ${c.fill ? "preenchido" : "vazado"}`;

/** Mente: teste completo e treino diário, adaptativos, com explicação depois de cada questão. */
export function MindLab({ history }: { history: Session[] }) {
  const [mode, setMode] = useState<null | "teste" | "treino">(null);
  const last = history.find((h) => h.kind === "teste" && h.score) ?? history.find((h) => h.score);
  const weakest = useMemo(() => { const d = last?.domains ?? {}; return [...KEYS].sort((a, b) => (d[a] ?? 100) - (d[b] ?? 100))[0]; }, [last]);
  if (mode) return <Runner mode={mode} focus={weakest} onExit={() => setMode(null)} />;
  const trend = history.filter((h) => h.score).slice(0, 12).reverse();
  return (
    <div className="grid gap-4 max-w-3xl mx-auto">
      <section className="hunt-card p-6 relative overflow-hidden">
        <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full" style={{ background: `radial-gradient(circle, ${A}26, transparent 70%)` }} />
        <p className="label" style={{ color: A }}>Mente</p>
        <div className="flex items-end gap-4 mt-1">
          <p className="font-display text-7xl leading-none" style={{ color: last?.score ? A : "rgba(255,255,255,.25)" }}>{last?.score ?? "—"}</p>
          <p className="text-[13px] text-white/55 pb-2">Índice cognitivo estimado<br /><span className="text-white/40">média 100 · não é QI clínico</span></p>
        </div>
        {trend.length > 1 && <svg viewBox={`0 0 ${trend.length * 20} 40`} className="mt-3 h-10 w-full" preserveAspectRatio="none" aria-label="Evolução do índice">
          <polyline fill="none" stroke={A} strokeWidth="2" points={trend.map((t, i) => `${i * 20 + 10},${40 - ((t.score! - 70) / 75) * 36}`).join(" ")} /></svg>}
        <div className="grid gap-2 mt-4">{KEYS.map((k) => { const v = last?.domains[k] ?? null; return (
          <div key={k} className="flex items-center gap-3 text-[13px]"><span className="w-40 text-white/70">{DOMAINS[k].label}</span>
            <div className="flex-1 h-2 rounded-full bg-white/10"><i className="block h-2 rounded-full" style={{ width: v ? `${((v - 70) / 75) * 100}%` : 0, background: A }} /></div>
            <span className="w-8 text-right font-semibold">{v ?? "—"}</span></div>); })}</div>
      </section>
      <div className="grid gap-3 sm:grid-cols-2">
        <button onClick={() => setMode("teste")} className="hunt-card p-5 text-left border" style={{ borderColor: A + "55" }}>
          <p className="font-display text-2xl">Teste completo</p><p className="text-[13px] text-white/60 mt-1">20 questões adaptativas nas 4 áreas · ~12 min. Mede seu índice e mostra onde você é forte.</p>
          <p className="text-[12px] mt-2" style={{ color: A }}>+80 XP base</p></button>
        <button onClick={() => setMode("treino")} className="hunt-card p-5 text-left">
          <p className="font-display text-2xl">Treino de hoje</p><p className="text-[13px] text-white/60 mt-1">8 questões focadas em {DOMAINS[weakest].label.toLowerCase()}, com explicação de cada uma. Aprenda o padrão, não decore a resposta.</p>
          <p className="text-[12px] mt-2" style={{ color: A }}>+25 XP base</p></button>
      </div>
      <section className="hunt-card p-5 text-[13px] text-white/60 leading-relaxed">
        <p className="font-semibold text-white">Dá para ficar mais inteligente?</p>
        <p className="mt-1">Aprender de verdade (estudar, ler, resolver problemas novos) eleva o desempenho cognitivo ao longo do tempo: cada ano de educação soma em média 1 a 5 pontos de QI (Ritchie e Tucker-Drob, 2018). Já repetir o mesmo tipo de questão melhora o resultado <i>nela</i>, mas quase não transfere para a inteligência em geral (Melby-Lervåg et al., 2016). Por isso as questões aqui mudam sempre e vêm com explicação: o objetivo é aprender a pensar, não decorar.</p>
      </section>
    </div>
  );
}

function Runner({ mode, focus, onExit }: { mode: "teste" | "treino"; focus: Domain; onExit: () => void }) {
  const plan = useMemo<Domain[]>(() => mode === "teste" ? Array.from({ length: 20 }, (_, i) => KEYS[i % 4]) : Array.from({ length: 8 }, (_, i) => (i % 4 === 3 ? KEYS[(KEYS.indexOf(focus) + 1) % 4] : focus)), [mode, focus]);
  const [lvl, setLvl] = useState<Record<Domain, number>>({ logico: 2, numerico: 2, verbal: 2, memoria: 2 });
  const [i, setI] = useState(0), [ans, setAns] = useState<Ans[]>([]), [picked, setPicked] = useState<number | null>(null), [typed, setTyped] = useState("");
  const [seed] = useState(() => Date.now() % 1e9), [saved, setSaved] = useState<string | null>(null), [busy, start] = useTransition();
  const dom = plan[i], item = useMemo(() => (dom ? make(dom, seed + i * 7919, lvl[dom]) : null), [dom, i, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const [showDigits, setShowDigits] = useState(-1);
  useEffect(() => { // memória: mostra um dígito por vez
    if (item?.kind !== "memoria") return; setShowDigits(0);
    const t = setInterval(() => setShowDigits((k) => { if (k + 1 >= item.digits.length) { clearInterval(t); return -2; } return k + 1; }), 900);
    return () => clearInterval(t);
  }, [item]);
  useEffect(() => { // fim da sessão: salva uma vez
    if (item || saved || busy) return;
    const ab = ability(ans), doms = Object.fromEntries(KEYS.map((k) => [k, domainIndex(ab[k])])) as Record<Domain, number | null>;
    start(async () => setSaved((await saveMindSession({ kind: mode, score: indexOf(ab), domains: doms, total: ans.length, correct: ans.filter((x) => x.ok).length })) ?? "ok"));
  }, [item]); // eslint-disable-line react-hooks/exhaustive-deps
  const answered = picked !== null;
  const ok = !item ? false : item.kind === "memoria" ? picked === 1 : picked === item.answer;
  const answer = (p: number) => { if (answered || !item) return; const good = item.kind === "memoria" ? p === 1 : p === item.answer; setPicked(p); setAns((a) => [...a, { domain: item.domain, d: item.d, ok: good }]); setLvl((l) => ({ ...l, [item.domain]: nextLevel(l[item.domain], good) })); navigator.vibrate?.(good ? 25 : [40, 30, 40]); };
  const next = () => { setPicked(null); setTyped(""); setI(i + 1); };
  if (!item) {
    const ab = ability(ans), idx = indexOf(ab), correct = ans.filter((a) => a.ok).length;
    const doms = Object.fromEntries(KEYS.map((k) => [k, domainIndex(ab[k])])) as Record<Domain, number | null>;
    return (
      <section className="hunt-card p-6 max-w-xl mx-auto chat-in text-center">
        <p className="label" style={{ color: A }}>{mode === "teste" ? "Resultado do teste" : "Treino concluído"}</p>
        <p className="font-display text-7xl mt-2" style={{ color: A }}>{idx ?? "—"}</p>
        <p className="text-[13px] text-white/55">índice estimado · {correct}/{ans.length} acertos · +{mindXp(mode, correct, ans.length)} XP</p>
        <div className="grid gap-2 mt-5 text-left">{KEYS.filter((k) => doms[k] != null).map((k) => <div key={k} className="flex justify-between text-[13px]"><span className="text-white/70">{DOMAINS[k].label}</span><b>{doms[k]}</b></div>)}</div>
        {saved && saved !== "ok" && <p className="text-[12px] mt-3" style={{ color: A }}>{saved}</p>}
        <button className="btn btn-accent w-full mt-5" onClick={onExit}>Voltar</button>
      </section>);
  }
  return (
    <section className="hunt-card p-5 sm:p-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between"><p className="label" style={{ color: A }}>{DOMAINS[item.domain].label} · nível {item.d}</p><button className="text-[13px] text-white/50" onClick={onExit}>Sair</button></div>
      <div className="flex gap-[3px] mt-2" aria-hidden>{plan.map((_, k) => <i key={k} className="h-1 flex-1 rounded-full" style={{ background: k < i ? A : k === i ? A + "88" : "rgba(255,255,255,.1)" }} />)}</div>
      <div key={i} className="chat-in mt-5">
        {item.kind === "serie" && <><p className="text-[15px] text-white/70">Qual número continua a sequência?</p>
          <p className="font-display text-3xl sm:text-4xl mt-3 tracking-wide">{item.seq.join("  ·  ")}  ·  <span style={{ color: A }}>?</span></p></>}
        {item.kind === "matriz" && <><p className="text-[15px] text-white/70">Qual figura completa a matriz?</p>
          <div className="grid grid-cols-3 gap-2 mt-3 max-w-[300px] mx-auto">{item.grid.map((c, k) => <div key={k} className="aspect-square rounded-[10px] border border-white/10 bg-white/[.03] grid place-items-center p-1" aria-label={c ? cellLabel(c) : "vazio"}>{c ? <Shape c={c} /> : <span className="text-3xl" style={{ color: A }}>?</span>}</div>)}</div></>}
        {item.kind === "analogia" && <p className="text-[20px] font-semibold leading-snug">{item.q}</p>}
        {item.kind === "memoria" && <>
          <p className="text-[15px] text-white/70">{item.reverse ? "Memorize e digite na ordem INVERSA." : "Memorize e digite na mesma ordem."}</p>
          <div className="h-28 grid place-items-center">{showDigits >= 0 ? <span key={showDigits} className="chat-in font-display text-7xl" style={{ color: A }}>{item.digits[showDigits]}</span> : showDigits === -2 ? <span className="text-white/40 text-sm">Sua vez.</span> : null}</div>
          {showDigits === -2 && !answered && <form onSubmit={(e) => { e.preventDefault(); answer(correctMemory(item, typed) ? 1 : 0); }} className="flex gap-2">
            <input autoFocus inputMode="numeric" value={typed} onChange={(e) => setTyped(e.target.value)} className="field flex-1 text-center text-2xl tracking-[.3em]" aria-label="Sequência" />
            <button className="btn btn-accent">OK</button></form>}
        </>}
        {"opts" in item && <div className={`grid gap-2 mt-5 ${item.kind === "matriz" ? "grid-cols-2" : "sm:grid-cols-2"}`}>{(item.opts as unknown[]).map((o, k) => {
          const right = answered && k === item.answer, wrong = answered && k === picked && !right;
          return <button key={k} disabled={answered} onClick={() => answer(k)} className="rounded-[14px] border p-3 min-h-14 text-[16px] font-semibold transition-colors"
            style={{ borderColor: right ? "#30d158" : wrong ? "#ff453a" : "rgba(255,255,255,.1)", background: right ? "#30d15822" : wrong ? "#ff453a22" : "rgba(255,255,255,.04)" }}>
            {item.kind === "matriz" ? <Shape c={o as Cell} /> : String(o)}</button>; })}</div>}
      </div>
      {answered && <div className="chat-in mt-5 rounded-[14px] p-4 border" style={{ borderColor: ok ? "#30d15855" : "#ff453a55" }}>
        <p className="font-semibold" style={{ color: ok ? "#30d158" : "#ff8a80" }}>{ok ? "Certo." : "Não foi dessa vez."}</p>
        <p className="text-[14px] text-white/75 mt-1">{item.kind === "memoria" ? `Era ${(item.reverse ? [...item.digits].reverse() : item.digits).join(" ")}. ${item.why}` : `Por quê: ${item.why}`}</p>
        <p className="text-[12px] text-white/45 mt-1">{ok ? "A próxima fica mais difícil." : "A próxima fica um pouco mais fácil: a gente sobe junto."}</p>
        <button className="btn btn-accent w-full mt-3" onClick={next}>{i + 1 < plan.length ? "Próxima" : "Ver resultado"}</button>
      </div>}
    </section>
  );
}
