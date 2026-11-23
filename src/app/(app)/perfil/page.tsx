import { redirect } from "next/navigation";

/** O Perfil agora vive dentro de Status. */
export default async function Page({ searchParams }: { searchParams: Promise<{ aba?: string; sub?: string; d?: string }> }) {
  const sp = await searchParams;
  const aba = !sp.aba || sp.aba === "geral" ? "perfil" : sp.aba;
  redirect(`/status?aba=${aba}${sp.sub ? `&sub=${sp.sub}` : ""}${sp.d ? `&d=${sp.d}` : ""}`);
}
