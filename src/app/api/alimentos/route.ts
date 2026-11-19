// Busca de alimentos: tabela rápida local (aprox. TACO) + Open Food Facts (base aberta mundial, inclui produtos do Brasil).
import { NextResponse } from "next/server";
import { searchLocal } from "@/lib/food-table";

export const dynamic = "force-dynamic";
type Hit = { name: string; brand?: string; kcal: number; p: number; c: number; g: number; unit: "g" | "ml"; portion?: number; portionLabel?: string; source: "TACO" | "Open Food Facts" };

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim().slice(0, 80) ?? "";
  if (q.length < 2) return NextResponse.json({ items: [] });
  const local: Hit[] = searchLocal(q).map((f) => ({ ...f, unit: f.unit ?? "g", source: "TACO" }));
  let off: Hit[] = [];
  try {
    const u = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=12&fields=product_name,product_name_pt,brands,nutriments,serving_quantity,quantity`;
    const r = await fetch(u, { headers: { "User-Agent": "BRIO/1.0 (app pessoal)" }, next: { revalidate: 86400 }, signal: AbortSignal.timeout(6000) });
    if (r.ok) {
      const j = (await r.json()) as { products?: { product_name?: string; product_name_pt?: string; brands?: string; serving_quantity?: number; nutriments?: Record<string, number> }[] };
      off = (j.products ?? []).map((p) => {
        const n = p.nutriments ?? {}, kcal = n["energy-kcal_100g"] ?? (n["energy_100g"] ? n["energy_100g"] / 4.184 : NaN);
        return { name: (p.product_name_pt || p.product_name || "").trim(), brand: p.brands?.split(",")[0]?.trim(), kcal: Math.round(kcal), p: +(n.proteins_100g ?? 0).toFixed(1), c: +(n.carbohydrates_100g ?? 0).toFixed(1), g: +(n.fat_100g ?? 0).toFixed(1), unit: "g" as const, portion: p.serving_quantity ? Math.round(p.serving_quantity) : undefined, source: "Open Food Facts" as const };
      }).filter((x) => x.name && Number.isFinite(x.kcal) && x.kcal >= 0 && x.kcal < 950).slice(0, 10);
    }
  } catch { /* sem rede: segue só com a tabela local */ }
  return NextResponse.json({ items: [...local, ...off] }, { headers: { "Cache-Control": "private, max-age=3600" } });
}
