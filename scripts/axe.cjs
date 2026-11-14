// Auditoria de acessibilidade (biblioteca GEN-A11Y-01). Uso: node scripts/axe.cjs http://localhost:3000 /login /sobre ...
(async () => {
const { chromium, devices } = require("playwright");
const { AxeBuilder } = require("@axe-core/playwright");
const [base, ...paths] = process.argv.slice(2);
const b = await chromium.launch();
let total = 0;
for (const [name, ctx] of [["mobile", { ...devices["iPhone 13"] }], ["desktop", { viewport: { width: 1280, height: 800 } }]]) {
  const c = await b.newContext({ ...ctx, reducedMotion: "reduce" });
  const p = await c.newPage();
  for (const path of paths) {
    await p.goto(base + path); await p.waitForTimeout(1200);
    const r = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    total += r.violations.length;
    console.log(`${name} ${path}: ${r.violations.length} violação(ões)`);
    for (const v of r.violations) console.log(`  - [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length}) → ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`);
  }
  await c.close();
}
await b.close();
process.exitCode = total ? 1 : 0;
})();
