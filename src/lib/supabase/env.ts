// Aceita os nomes antigos (anon) e novos (publishable) da Supabase/Vercel.
// Acesso literal é necessário para o Next embutir as variáveis NEXT_PUBLIC_.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
  "";
export const hasSupabaseEnv = Boolean(SUPABASE_URL && SUPABASE_KEY);
