"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

const Login = z.object({ email: z.string().email(), password: z.string().min(6) });

export async function signIn(_: string | null, form: FormData): Promise<string | null> {
  const parsed = Login.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return "Confira o e-mail e a senha.";
  if (!hasSupabaseEnv) return "O app está sem as variáveis do Supabase. Confira na Vercel.";
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return "E-mail ou senha incorretos.";
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
