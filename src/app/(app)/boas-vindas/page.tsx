import { createClient } from "@/lib/supabase/server";
import { getSettings, MODULES, moduleOn, type ModuleKey } from "@/lib/settings";
import { Onboarding } from "@/components/onboarding/onboarding";

export const dynamic = "force-dynamic";
export default async function Page() {
  const sb = await createClient();
  const [{ data: u }, s] = await Promise.all([sb.auth.getUser(), getSettings(sb)]);
  const name = String(u.user?.user_metadata?.name ?? "").trim().split(/\s+/)[0] || "";
  const modules = Object.fromEntries((Object.keys(MODULES) as ModuleKey[]).map((m) => [m, moduleOn(s, m)])) as Record<ModuleKey, boolean>;
  return <Onboarding name={name} modules={modules} cats={s.finance_categories} />;
}
