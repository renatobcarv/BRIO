// BRIO — exporta o localStorage de um HTML antigo (pioneiro.html, Dashboard_Financeiro.html, Central_Renato.html).
// Como usar: abra o HTML antigo no navegador → F12 → aba Console → cole este arquivo inteiro → Enter.
// Um arquivo "legado-<pagina>.json" será baixado.
(() => {
  const dump = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i), v = localStorage.getItem(k);
    try { dump[k] = JSON.parse(v); } catch { dump[k] = v; }
  }
  const page = (location.pathname.split("/").pop() || "pagina").replace(/\.html?$/, "");
  const blob = new Blob([JSON.stringify({ app: "brio-legado", origem: page, data: dump }, null, 2)], { type: "application/json" });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `legado-${page}.json` });
  document.body.appendChild(a); a.click(); a.remove();
  console.log(`Brio: ${Object.keys(dump).length} chaves exportadas de ${page}.`);
})();
