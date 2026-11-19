import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageEditor } from "@/components/spirit/page-editor";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const sb = await createClient();
  const { data: p } = await sb.from("spirit_pages").select("*").eq("id", id).maybeSingle();
  if (!p) notFound();
  const paths = [p.cover_path, ...[...String(p.content).matchAll(/\(img:([^)\s]+)\)/g)].map((m) => m[1])].filter(Boolean) as string[];
  const signed = paths.length ? (await sb.storage.from("privado").createSignedUrls(paths, 3600)).data ?? [] : [];
  const images = Object.fromEntries(signed.filter((x) => x.path && x.signedUrl).map((x) => [x.path!, x.signedUrl]));
  return <div className="peace" style={{ ["--accent" as string]: "#9fd0f5" }}><PageEditor page={p} images={images} /></div>;
}
