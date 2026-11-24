import { Nav } from "@/components/nav";
import { XpProvider } from "@/components/game/xp";
import { createClient } from "@/lib/supabase/server";
import { MODULES, getSettings, moduleOn, type ModuleKey } from "@/lib/settings";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Módulos desligados pela conta somem do menu (ajustável em Configurações › Módulos).
  let off: string[] = [];
  try { const s = await getSettings(await createClient()); off = (Object.keys(MODULES) as ModuleKey[]).filter((m) => !moduleOn(s, m)); } catch { /* sem sessão: menu completo */ }
  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 h-[env(safe-area-inset-top)] bg-base/85 backdrop-blur-xl" aria-hidden />
      <XpProvider initialTotal={0} initialToday={0} trackLevel={false}>
      <Nav off={off} />
      <main className="md:pl-60 pb-32 md:pb-10">
        <div className="app-shell mx-auto max-w-3xl px-4 pt-[calc(env(safe-area-inset-top)+2rem)] md:pt-12">{children}</div>
      </main>
      </XpProvider>
    </>
  );
}
