"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const ACTIVITIES: Record<string, { task: string; find: string; text: string; href: string; action: string }> = {
  lobo: { task: "Rastrear a trilha da matilha", find: "Pinha da Lua", text: "O lobo seguiu os rastros até os pinheiros.", href: "/treino", action: "Abrir treino" },
  coruja: { task: "Vasculhar a biblioteca", find: "Página do Carvalho", text: "A coruja descobriu uma página entre os livros mais antigos.", href: "/estudos", action: "Abrir estudos" },
  urso: { task: "Procurar mel na gruta", find: "Favo Dourado", text: "O urso encontrou mel perto da correnteza.", href: "/status?aba=corpo", action: "Ver meu corpo" },
  aguia: { task: "Sobrevoar o penhasco", find: "Pena das Alturas", text: "A águia trouxe uma pena que encontrou no ponto mais alto.", href: "/metas", action: "Ver minhas metas" },
  tubarao: { task: "Mergulhar no recife", find: "Pérola Azul", text: "O tubarão voltou com uma pérola entre os dentes.", href: "/status?aba=corpo", action: "Registrar cuidados com o corpo" },
  serpente: { task: "Explorar as fendas das ruínas", find: "Fragmento de Jade", text: "A serpente passou por uma fresta e encontrou jade.", href: "/estudos", action: "Abrir estudos" },
  leao: { task: "Patrulhar a savana", find: "Semente da Acácia", text: "O leão voltou da patrulha com uma semente da acácia.", href: "/treino", action: "Abrir treino" },
  pantera: { task: "Caçar rastros na floresta", find: "Âmbar das Raízes", text: "A pantera seguiu pegadas e desenterrou âmbar junto às raízes.", href: "/treino", action: "Abrir treino" },
  fenix: { task: "Recolher brasas do altar", find: "Brasa do Renascimento", text: "A fênix resgatou uma brasa ainda viva.", href: "/metas", action: "Ver minhas metas" },
  kitsune: { task: "Seguir as lanternas", find: "Folha de Cobre", text: "A Kitsune voltou por uma trilha escondida com uma folha brilhante.", href: "/sonhos", action: "Abrir meus sonhos" },
  qilin: { task: "Caminhar entre os lírios", find: "Pétala de Jade", text: "O Qilin recolheu uma pétala na beira da água.", href: "/metas", action: "Ver minhas metas" },
  grifo: { task: "Explorar as correntes de ar", find: "Pluma do Guardião", text: "O grifo encontrou uma pluma no arco mais alto.", href: "/treino", action: "Abrir treino" },
  genbu: { task: "Vasculhar o jardim marinho", find: "Concha Perolada", text: "Genbu encontrou uma concha onde a corrente faz uma curva.", href: "/status?aba=corpo", action: "Ver meu corpo" },
  dragao: { task: "Minerar cristais na caverna", find: "Cristal do Dragão", text: "O dragão quebrou a rocha e trouxe um cristal azul.", href: "/financas", action: "Abrir finanças" },
};

const DURATION = 20_000;
type Journal = { trip?: { day: string; end: number; species: string }; finds: Record<string, number>; last?: string };
const EMPTY: Journal = { finds: {} };

export function PetExpedition({ id, name, species, today, onDepart, onReturn, onTravelChange }: {
  id: string; name: string; species: string; today: string;
  onDepart: (line: string) => void; onReturn: (line: string) => void; onTravelChange: (away: boolean) => void;
}) {
  const key = `brio:mascote:expedicao:${id}`;
  const [journal, setJournal] = useState<Journal>(EMPTY);
  const [clock, setClock] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const activity = ACTIVITIES[species];
  const trip = journal.trip;
  const travelling = trip ? ACTIVITIES[trip.species] : null;
  const remaining = trip ? Math.max(0, Math.ceil((trip.end - clock) / 1000)) : 0;
  const claimed = journal.last === today;
  const finds = Object.entries(journal.finds).filter(([entry, count]) => ACTIVITIES[entry] && count > 0);

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem(key) ?? "null") as Journal | null;
      if (data && data.finds && typeof data.finds === "object") setJournal(data);
    } catch {}
    setClock(Date.now());
    setLoaded(true);
  }, [key]);

  useEffect(() => {
    onTravelChange(Boolean(trip));
    if (!trip) return;
    const interval = window.setInterval(() => {
      const time = Date.now();
      setClock(time);
      if (time >= trip.end) window.clearInterval(interval);
    }, 250);
    return () => window.clearInterval(interval);
  }, [trip, onTravelChange]);

  function save(value: Journal) {
    setJournal(value);
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  function depart() {
    if (!loaded || trip || claimed || !activity) return;
    const now = Date.now();
    setClock(now);
    save({ ...journal, trip: { day: today, end: now + DURATION, species } });
    onDepart(`${name} saiu para ${activity.task.charAt(0).toLowerCase() + activity.task.slice(1)}.`);
  }

  function collect() {
    if (!trip || !travelling || Date.now() < trip.end) return;
    save({ last: trip.day, finds: { ...journal.finds, [trip.species]: (journal.finds[trip.species] ?? 0) + 1 } });
    onReturn(`${travelling.text} Você recebeu: ${travelling.find}.`);
  }

  if (!activity) return null;
  return (
    <section aria-label="Expedição do mascote" className="rounded-xl border border-white/10 bg-[linear-gradient(135deg,#232123,#101013)] p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--habitat-color)]">Expedição</p>
          <h3 className="mt-0.5 font-display text-xl">{(travelling ?? activity).task}</h3>
        </div>
        {!trip && claimed && <span className="rounded-full border border-white/20 px-2 py-1 text-xs text-white/80">Feita hoje</span>}
      </div>
      {trip ? (
        <div className="mt-3 space-y-2">
          {remaining > 0 ? <>
            <p className="text-sm text-white/80">Explorando · volta em {remaining}s</p>
            <progress className="h-2 w-full accent-[var(--habitat-color)]" max={20} value={20 - remaining} aria-label="Progresso da expedição" />
          </> : <button type="button" className="btn btn-accent gap-2" onClick={collect}>
            <Image src={`/cards/expedicoes/${trip.species}.webp`} width={32} height={32} alt="" unoptimized className="rounded-md" />
            Receber {travelling?.find}
          </button>}
        </div>
      ) : claimed ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <p className="text-white/75">Seu companheiro já voltou. Agora é a sua vez.</p>
          <Link className="font-semibold text-[var(--habitat-color)] underline underline-offset-4" href={activity.href}>{activity.action} →</Link>
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm text-white/75">Seu mascote traz {activity.find} para a sua vitrine. Uma expedição por dia.</p>
          <button type="button" className="btn mt-3" disabled={!loaded} onClick={depart}>Enviar para explorar</button>
        </>
      )}
      {finds.length > 0 && <details open={claimed} className="mt-3 border-t border-white/10 pt-3">
        <summary className="cursor-pointer text-sm font-semibold text-white/85">Vitrine de achados · {finds.length} {finds.length === 1 ? "tipo" : "tipos"}</summary>
        <ul className="mt-2 grid gap-1.5 text-sm text-white/75">{finds.map(([entry, count]) => <li key={entry} className="flex items-center gap-2">
          <Image src={`/cards/expedicoes/${entry}.webp`} width={34} height={34} alt="" unoptimized className="rounded-md mix-blend-screen" />
          <span className="flex-1">{ACTIVITIES[entry].find}</span><strong className="text-[var(--habitat-color)]">×{count}</strong>
        </li>)}</ul>
      </details>}
    </section>
  );
}
