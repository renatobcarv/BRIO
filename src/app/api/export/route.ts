import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TABLES } from "@/lib/tables";
import { todayISO } from "@/lib/date";

export const dynamic = "force-dynamic";

export async function GET() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const out: Record<string, unknown[]> = {};
  for (const t of TABLES) {
    const { data } = await sb.from(t).select("*");
    out[t] = (data ?? []).map(({ user_id: _u, ...r }) => r);
  }
  return new NextResponse(JSON.stringify({ app: "brio", version: 1, exported_at: new Date().toISOString(), data: out }, null, 2), {
    headers: { "content-type": "application/json", "content-disposition": `attachment; filename="brio-backup-${todayISO()}.json"` },
  });
}
