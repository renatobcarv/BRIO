"use client";
import { useEffect, useState } from "react";

const TZ = "America/Sao_Paulo";
function parts(d: Date) {
  const h = Number(new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", hour12: false }).format(d)) % 24;
  const date = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(d);
  if (h >= 5 && h < 12) return { hi: "Bom dia", line: "Jeová em primeiro lugar. O resto se organiza.", date };
  if (h >= 12 && h < 18) return { hi: "Boa tarde", line: "Mantenha o ritmo. Constância vence intensidade.", date };
  return { hi: "Boa noite", line: h < 5 ? "Descanse. Amanhã é dia de recomeçar." : "Feche o dia com gratidão.", date };
}

/** Saudação calculada no relógio de São Paulo e atualizada a cada minuto. */
export function Greeting({ name }: { name: string }) {
  const [p, setP] = useState<ReturnType<typeof parts> | null>(null);
  useEffect(() => { const tick = () => setP(parts(new Date())); tick(); const id = setInterval(tick, 60_000); return () => clearInterval(id); }, []);
  return (
    <header className="rise mb-6 min-h-[112px]">
      <p className="label text-gold capitalize">{p?.date ?? " "}</p>
      <h1 className="font-display text-4xl md:text-5xl mt-2 leading-tight">{p ? `${p.hi}, ${name}.` : " "}</h1>
      <p className="font-display italic text-muted text-lg mt-1">{p?.line ?? " "}</p>
    </header>
  );
}
