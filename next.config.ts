import type { NextConfig } from "next";

// Headers de segurança na borda (biblioteca GEN-SEG-05). CSP começa em modo relatório (flag CSP_ENFORCE).
const supabase = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'", // Next injeta scripts inline de hidratação
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabase} https://*.supabase.co`,
  "font-src 'self' data:",
  `connect-src 'self' ${supabase} https://*.supabase.co wss://*.supabase.co`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com",
  "object-src 'none'",
].join("; ");
const enforce = process.env.NEXT_PUBLIC_FLAG_CSP_ENFORCE === "1";

const config: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }] },
  experimental: { serverActions: { bodySizeLimit: "20mb" } },
  poweredByHeader: false,
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        { key: enforce ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only", value: csp },
      ],
    }];
  },
};
export default config;
