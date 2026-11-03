import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SearchHit } from "@/lib/books";

export const dynamic = "force-dynamic";
const https = (u?: string | null) => (u ? u.replace(/^http:/, "https:").replace("&edge=curl", "") : null);
const strip = (s?: string | null) => (s ? s.replace(/<[^>]+>/g, "").trim() : null);

type GItem = { id: string; volumeInfo?: { title?: string; subtitle?: string; authors?: string[]; publisher?: string; publishedDate?: string;
  description?: string; pageCount?: number; categories?: string[]; imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  industryIdentifiers?: { type: string; identifier: string }[] } };

async function google(q: string, pt: boolean): Promise<SearchHit[]> {
  const isIsbn = /^[\d-]{10,17}$/.test(q.trim());
  const query = isIsbn ? `isbn:${q.replace(/-/g, "")}` : q;
  const key = process.env.GOOGLE_BOOKS_API_KEY ? `&key=${process.env.GOOGLE_BOOKS_API_KEY}` : "";
  const r = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20&printType=books&country=BR${pt ? "&langRestrict=pt" : ""}${key}`, { next: { revalidate: 3600 } });
  if (!r.ok) throw new Error("google " + r.status);
  const j = (await r.json()) as { items?: GItem[] };
  return (j.items ?? []).map((it) => {
    const v = it.volumeInfo ?? {};
    const isbn = v.industryIdentifiers?.find((x) => x.type === "ISBN_13")?.identifier ?? v.industryIdentifiers?.find((x) => x.type === "ISBN_10")?.identifier ?? null;
    return {
      source_id: "g:" + it.id, title: [v.title, v.subtitle].filter(Boolean).join(": ") || "Sem título", authors: (v.authors ?? []).join(", "),
      cover_url: https(v.imageLinks?.thumbnail ?? v.imageLinks?.smallThumbnail), isbn, publisher: v.publisher ?? null,
      year: v.publishedDate ? Number(v.publishedDate.slice(0, 4)) || null : null, pages: v.pageCount || null,
      description: strip(v.description), categories: v.categories ?? [],
    };
  });
}

type ODoc = { key: string; title: string; author_name?: string[]; first_publish_year?: number; number_of_pages_median?: number; isbn?: string[]; cover_i?: number; publisher?: string[]; subject?: string[] };
async function openLibrary(q: string): Promise<SearchHit[]> {
  const r = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&language=por&limit=20&fields=key,title,author_name,first_publish_year,number_of_pages_median,isbn,cover_i,publisher,subject`, { next: { revalidate: 3600 } });
  if (!r.ok) throw new Error("openlibrary " + r.status);
  const j = (await r.json()) as { docs?: ODoc[] };
  return (j.docs ?? []).map((d) => ({
    source_id: "o:" + d.key, title: d.title, authors: (d.author_name ?? []).join(", "),
    cover_url: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null,
    isbn: d.isbn?.find((x) => x.length === 13) ?? d.isbn?.[0] ?? null, publisher: d.publisher?.[0] ?? null,
    year: d.first_publish_year ?? null, pages: d.number_of_pages_median ?? null, description: null, categories: (d.subject ?? []).slice(0, 3),
  }));
}

export async function GET(req: NextRequest) {
  const sb = await createClient();
  const { data } = await sb.auth.getClaims();
  if (!data?.claims) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 200);
  if (q.length < 2) return NextResponse.json({ results: [] });
  // Português primeiro; completa com outras edições só se faltar resultado.
  let results: SearchHit[] = [];
  const add = (more: SearchHit[]) => { results = [...results, ...more.filter((m) => !results.some((r) => r.source_id === m.source_id || (r.title.toLowerCase() === m.title.toLowerCase() && r.authors === m.authors)))]; };
  try { add(await google(q, true)); } catch { /* segue */ }
  if (results.length < 5) { try { add(await openLibrary(q)); } catch { /* segue */ } }
  if (results.length < 5) { try { add(await google(q, false)); } catch { /* segue */ } }
  return NextResponse.json({ results: results.slice(0, 24) });
}
