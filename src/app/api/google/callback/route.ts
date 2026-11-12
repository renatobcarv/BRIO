import { NextResponse, type NextRequest } from "next/server";
import { exchangeCode } from "@/lib/google";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const u = req.nextUrl, back = (q: string) => { const r = NextResponse.redirect(new URL(`/agenda?google=${q}`, req.url)); r.cookies.delete("g_state"); return r; };
  const code = u.searchParams.get("code"), state = u.searchParams.get("state");
  if (!code || !state || state !== req.cookies.get("g_state")?.value) return back("erro");
  try {
    const t = await exchangeCode(code, new URL("/api/google/callback", req.url).toString());
    if (!t.refresh) return back("sem-refresh");
    const sb = await createClient();
    const { error } = await sb.from("google_calendar").upsert({ refresh_token: t.refresh, email: t.email, calendar_id: "primary", connected_at: new Date().toISOString() });
    return back(error ? "migracao" : "ok");
  } catch { return back("erro"); }
}
