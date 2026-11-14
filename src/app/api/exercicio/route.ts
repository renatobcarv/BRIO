import { NextResponse } from "next/server";
import { exerciseTerm } from "@/lib/exercise-map";

// Imagem e ficha do exercício pela API aberta do wger (wger.de, conteúdo CC-BY-SA). Cache de 30 dias.
type Sug = { value: string; data: { id: number; base_id?: number; name: string; category?: string; image?: string | null; image_thumbnail?: string | null } };
const BASE = "https://wger.de";

async function search(term: string, language: string): Promise<Sug[]> {
  const r = await fetch(`${BASE}/api/v2/exercise/search/?language=${language}&term=${encodeURIComponent(term)}`, { next: { revalidate: 2592000 }, headers: { Accept: "application/json" } });
  if (!r.ok) return [];
  const j = (await r.json()) as { suggestions?: Sug[] };
  return j.suggestions ?? [];
}

export async function GET(req: Request) {
  const n = new URL(req.url).searchParams.get("n")?.slice(0, 80).trim();
  if (!n) return NextResponse.json({ error: "nome" }, { status: 400 });
  try {
    const term = exerciseTerm(n);
    let list = await search(term, "english");
    if (!list.some((s) => s.data.image)) list = [...list, ...(await search(n, "portuguese"))];
    const hit = list.find((s) => s.data.image) ?? list[0];
    if (!hit) return NextResponse.json({ img: null }, { headers: { "Cache-Control": "public, max-age=86400" } });
    const abs = (p?: string | null) => (p ? (p.startsWith("http") ? p : BASE + p) : null);
    return NextResponse.json({
      img: abs(hit.data.image), thumb: abs(hit.data.image_thumbnail) ?? abs(hit.data.image), name: hit.data.name, category: hit.data.category ?? null,
      url: `${BASE}/exercise/${hit.data.base_id ?? hit.data.id}/view/`,
    }, { headers: { "Cache-Control": "public, max-age=604800" } });
  } catch {
    return NextResponse.json({ img: null, error: "indisponível" }, { status: 502 });
  }
}
