// Teste de fumaça: abre cada tela e falha se alguma der erro de servidor ou erro de JavaScript na página.
// Uso: npm run build && npx next start -p 3126 & node scripts/smoke.cjs http://localhost:3126
(async () => {
const { chromium } = require("playwright");
const base = process.argv[2] ?? "http://localhost:3000";
const PUBLIC = ["/sobre", "/login", "/cadastro", "/privacidade", "/termos"];
const PRIVATE = ["/", "/treino", "/corpo", "/metas", "/financas", "/espiritual", "/estudos", "/livros", "/agenda", "/mascote", "/bestiario", "/status", "/mais", "/configuracoes"];
const b = await chromium.launch(), p = await b.newPage();
let fail = 0; const errs = []; p.on("pageerror", (e) => errs.push(e.message));
for (const path of [...PUBLIC, ...PRIVATE]) {
  errs.length = 0;
  const r = await p.goto(base + path, { waitUntil: "load" }).catch((e) => ({ status: () => 0, e }));
  const s = r.status(), bad = s === 0 || s >= 500 || errs.length > 0;
  if (bad) fail++;
  console.log(`${bad ? "✗" : "✓"} ${path} → ${s} ${p.url().replace(base, "")}${errs.length ? " · " + errs[0] : ""}`);
}
await b.close();
process.exit(fail ? 1 : 0);
})();
