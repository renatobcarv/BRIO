// Edição do BRIO. Tudo é aberto; só o que está em FUTURE fica restrito à conta do dono (BRIO_OWNER_EMAILS, separados por vírgula, configurado no servidor).

/** Áreas do pacote à venda. */
export const CORE = ["Treino", "Dieta", "Agenda", "Finanças", "Estudos", "Livros", "Metas", "Configurações"] as const;

/** Áreas exclusivas da conta do dono (projeto aberto: todo o resto é liberado para qualquer conta). */
export const FUTURE: { href: string; label: string; hint: string }[] = [
  { href: "/pioneiro", label: "Ministério", hint: "Horas e metas de campo" },
];
export const isFutureRoute = (path: string) => FUTURE.some((f) => path === f.href || path.startsWith(f.href + "/"));

/** Conta do dono vê tudo. Sem a variável configurada, ninguém é tratado como dono. */
export function isOwner(email: string | null | undefined) {
  const list = (process.env.BRIO_OWNER_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return !!email && list.includes(email.toLowerCase());
}
