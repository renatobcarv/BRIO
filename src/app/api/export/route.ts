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
    // Pagina de 1000 em 1000 (limite padrão do Supabase por consulta).
    const rows: Record<string, unknown>[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await sb.from(t).select("*").order("id").range(from, from + 999);
      if (error || !data?.length) break;
      rows.push(...data);
      if (data.length < 1000) break;
    }
    out[t] = rows.map(({ user_id: _u, ...r }) => r);
  }
  return new NextResponse(JSON.stringify({ app: "brio", version: 1, exported_at: new Date().toISOString(), data: out }, null, 2), {
    headers: { "content-type": "application/json", "content-disposition": `attachment; filename="brio-backup-${todayISO()}.json"` },
  });
}
