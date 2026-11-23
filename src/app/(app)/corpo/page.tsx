import { redirect } from "next/navigation";

/** Corpo agora vive no Perfil. */
export default async function Page({ searchParams }: { searchParams: Promise<{ aba?: string; d?: string }> }) {
  const sp = await searchParams;
  if (sp.aba === "treino" || sp.aba === "programa") redirect(sp.aba === "programa" ? "/treino?aba=programa" : "/treino");
  redirect(`/status?aba=corpo${sp.aba ? `&sub=${sp.aba}` : ""}${sp.d ? `&d=${sp.d}` : ""}`);
}
