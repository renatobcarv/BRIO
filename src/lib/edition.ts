// Edição comercial do BRIO. O pacote vendido tem 8 áreas; o resto fica como "implementação futura"
// e só aparece para a conta do dono (BRIO_OWNER_EMAILS, separados por vírgula, configurado no servidor).

/** Áreas do pacote à venda. */
export const CORE = ["Treino", "Dieta", "Agenda", "Finanças", "Estudos", "Livros", "Metas", "Configurações"] as const;

/** Áreas em desenvolvimento: fora do pacote, visíveis só para o dono. */
export const FUTURE: { href: string; label: string; hint: string }[] = [
  { href: "/espiritual", label: "Espiritual", hint: "Leitura, diário e reflexão" },
  { href: "/pioneiro", label: "Ministério", hint: "Horas e metas de campo" },
  { href: "/mascote", label: "Mascote", hint: "Companheiro que cresce com você" },
  { href: "/bestiario", label: "Bestiário", hint: "Feras e vitórias" },
  { href: "/sonhos", label: "Sonhos", hint: "Quadro dos seus sonhos" },
  { href: "/eventos", label: "Eventos", hint: "Desafios semanais" },
];
export const isFutureRoute = (path: string) => FUTURE.some((f) => path === f.href || path.startsWith(f.href + "/"));

/** Conta do dono vê tudo. Sem a variável configurada, ninguém é tratado como dono. */
export function isOwner(email: string | null | undefined) {
  const list = (process.env.BRIO_OWNER_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return !!email && list.includes(email.toLowerCase());
}
