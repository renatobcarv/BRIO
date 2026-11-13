import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_URL, SUPABASE_KEY } from "@/lib/supabase/env";

export async function middleware(req: NextRequest) {
  const isLogin = req.nextUrl.pathname.startsWith("/login");
  const url = SUPABASE_URL;
  const key = SUPABASE_KEY;

  // Sem configuração: nunca libera o app, só mostra o login com aviso.
  if (!url || !key) {
    if (isLogin) return NextResponse.next();
    return NextResponse.redirect(new URL("/login?erro=config", req.url));
  }

  let res = NextResponse.next({ request: req });
  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    });
    // getClaims valida o token localmente (sem ida ao servidor de auth a cada página).
    const { data } = await supabase.auth.getClaims();
    const user = data?.claims?.sub ?? null;
    if (!user && !isLogin) return NextResponse.redirect(new URL("/login", req.url));
    if (user && isLogin) return NextResponse.redirect(new URL("/", req.url));
    return res;
  } catch {
    // Falha ao falar com o Supabase: bloqueia por segurança.
    if (isLogin) return res;
    return NextResponse.redirect(new URL("/login?erro=conexao", req.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|apple-touch-icon.png|icon-192.png|icon-512.png|sobre|privacidade|termos|api/agenda).*)"],
};
