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

// Cadastro (teste grátis sem cartão; plano escolhido vai no metadata — biblioteca GEN-JOR-02)
const SignUp = z.object({ name: z.string().trim().min(2, "Seu nome, por favor.").max(60), email: z.string().trim().email("E-mail inválido."), password: z.string().min(8, "A senha precisa de 8 caracteres ou mais.").max(72),
  plan: z.string().max(20), focus: z.array(z.string().max(20)).max(8) });
export type SignUpState = { error?: string; sent?: string } | null;
export async function signUp(_: SignUpState, form: FormData): Promise<SignUpState> {
  const r = SignUp.safeParse({ name: form.get("name"), email: form.get("email"), password: form.get("password"), plan: form.get("plan") ?? "gratis", focus: form.getAll("focus").map(String) });
  if (!r.success) return { error: r.error.issues[0]?.message ?? "Confira os campos." };
  if (!hasSupabaseEnv) return { error: "Cadastro indisponível no momento." };
  const { planById } = await import("@/lib/plans");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email: r.data.email, password: r.data.password,
    options: { data: { name: r.data.name, plan: planById(r.data.plan).id, focus: r.data.focus, trial_started: new Date().toISOString() } } });
  if (error) return { error: /registered|exists/i.test(error.message) ? "Esse e-mail já tem conta. Entre pelo login." : /signups not allowed|disabled/i.test(error.message) ? "Os cadastros estão fechados no momento." : error.message };
  if (data.session) redirect("/?bemvindo=1");
  return { sent: r.data.email };
}
