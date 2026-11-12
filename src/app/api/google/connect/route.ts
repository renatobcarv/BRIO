import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { authUrl, googleReady } from "@/lib/google";

export async function GET(req: NextRequest) {
  if (!googleReady()) return NextResponse.redirect(new URL("/agenda?google=config", req.url));
  const state = randomBytes(16).toString("hex");
  const res = NextResponse.redirect(authUrl(new URL("/api/google/callback", req.url).toString(), state));
  res.cookies.set("g_state", state, { httpOnly: true, secure: true, sameSite: "lax", path: "/api/google", maxAge: 600 });
  return res;
}
