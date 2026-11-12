"use client";
import { useState } from "react";
import { addStudy } from "@/app/(app)/espiritual/actions";
import { Choices, QuickPick, Quiz } from "./quiz";

const C = "#ffb340";
const TYPES = [
  { value: "publicacao", label: "Publicação", color: "#ffb340", icon: "M6 3h9l4 4v14H6zM14 3v5h5" },
  { value: "biblia", label: "Bíblia", color: "#ff9f0a", icon: "M4 5a2 2 0 0 1 2-2h6v17H6a2 2 0 0 0-2 2zM20 5a2 2 0 0 0-2-2h-6v17h6a2 2 0 0 1 2 2z" },
  { value: "meio_semana", label: "Reunião do meio de semana", color: "#0a84ff", icon: "M3 5h18v12H8l-5 4z" },
  { value: "sentinela", label: "Sentinela", color: "#64d2ff", icon: "M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" },
  { value: "pesquisa", label: "Pesquisa de tema", color: "#bf5af2", icon: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5" },
  { value: "outro", label: "Outro", color: "#8e8e93", icon: "M12 5v14M5 12h14" },
] as const;
type T = (typeof TYPES)[number]["value"];

export function StudyQuiz({ today, onClose }: { today: string; onClose: () => void }) {
  const [type, setType] = useState<T | null>(null);
  const [minutes, setMinutes] = useState(30);
  const [material, setMaterial] = useState("");
  const [learned, setLearned] = useState("");
  const [apply, setApply] = useState("");
  const xp = Math.min(minutes, 180);
  return (
    <Quiz color={C} xp={xp} onClose={onClose} rewardTitle="Estudo registrado"
      rewardLines={[`${minutes} min de ${TYPES.find((t) => t.value === type)?.label.toLowerCase() ?? "estudo"}`, "Sabedoria aumentou"]}
      onFinish={async () => {
        try {
          await addStudy({ date: today, type: type ?? "outro", material, minutes,
            takeaway: [learned.trim(), apply.trim() && `Vou aplicar: ${apply.trim()}`].filter(Boolean).join("\n") });
          return null;
        } catch (e) { return (e as Error).message; }
      }}
      steps={[
        { title: "O que você estudou?", content: <Choices value={type} onChange={setType} options={[...TYPES]} />, canNext: !!type },
        { title: "Por quanto tempo?", hint: "Cada minuto vale 1 XP de Sabedoria.", content: (
          <div className="grid gap-4">
            <QuickPick values={[15, 30, 45, 60, 90, 120]} value={minutes} onChange={setMinutes} format={(v) => `${v} min`} color={C} />
            <label className="flex items-center gap-3"><span className="text-sm text-muted">Outro:</span>
              <input className="field !w-28 num" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(Math.max(1, Math.min(600, Number(e.target.value) || 1)))} aria-label="Minutos" /> <span className="text-sm text-muted">min</span></label>
          </div>) },
        { title: "Qual material?", hint: "Ex.: Sentinela de novembro, parágrafos 1–8.", skippable: true, content: <input className="field" value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Opcional" autoFocus /> },
        { title: "O que você aprendeu?", hint: "Uma frase basta. É o que fixa o estudo.", skippable: true, content: (
          <div className="grid gap-3">
            <textarea className="field" rows={3} value={learned} onChange={(e) => setLearned(e.target.value)} placeholder="O ponto principal para mim foi…" />
            <textarea className="field" rows={2} value={apply} onChange={(e) => setApply(e.target.value)} placeholder="Como vou aplicar (opcional)" />
          </div>) },
      ]} />
  );
}
