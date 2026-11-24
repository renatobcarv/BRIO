"use client";
import { useState, useTransition } from "react";
import { savePrefs } from "@/app/(app)/configuracoes/actions";
import { MODULES, type ModuleKey } from "@/lib/settings";

/** Liga/desliga módulos da conta: o menu e a Home mostram só o que você usa. */
export function ModulesEditor({ on }: { on: Record<ModuleKey, boolean> }) {
  const [state, setState] = useState(on), [msg, setMsg] = useState(""), [busy, start] = useTransition();
  const flip = (k: ModuleKey) => { const v = !state[k]; setState({ ...state, [k]: v }); start(async () => setMsg((await savePrefs({ modules: { [k]: v } })) ?? "Salvo. Recarregue para ver o menu atualizado.")); };
  return (
    <div className="grid gap-2">
      {(Object.keys(MODULES) as ModuleKey[]).map((k) => (
        <button key={k} type="button" role="switch" aria-checked={state[k]} disabled={busy} onClick={() => flip(k)} className="flex items-center gap-3 rounded-[12px] bg-white/[.04] p-3 text-left">
          <span className="flex-1"><span className="block text-[14px] font-semibold">{MODULES[k].label}</span><span className="block text-[12px] text-white/50">{MODULES[k].hint}</span></span>
          <span className="relative h-6 w-11 rounded-full transition-colors" style={{ background: state[k] ? "#ffb21e" : "rgba(255,255,255,.15)" }}><i className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all" style={{ left: state[k] ? 22 : 2 }} /></span>
        </button>))}
      {msg && <p className="text-[12.5px]" style={{ color: "#ffb21e" }}>{msg}</p>}
    </div>
  );
}
