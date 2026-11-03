export type Area = "inicio" | "espiritual" | "pioneiro" | "corpo" | "financas" | "metas" | "livros";
const V: Record<Area, [string, string][]> = {
  inicio: [["O que fizerem, façam de toda a alma, como para Jeová, e não para homens.", "Colossenses 3:23"],
    ["Confie em Jeová de todo o coração.", "Provérbios 3:5"]],
  espiritual: [["Tua palavra é lâmpada para o meu pé.", "Salmo 119:105"],
    ["Aproximem-se de Deus, e ele se aproximará de vocês.", "Tiago 4:8"]],
  pioneiro: [["Pregue a palavra; faça isso com urgência.", "2 Timóteo 4:2"],
    ["Como são belos sobre os montes os pés daquele que traz boas novas.", "Isaías 52:7"]],
  corpo: [["O treinamento físico é proveitoso para pouca coisa, mas a devoção a Deus é proveitosa para todas as coisas.", "1 Timóteo 4:8"]],
  financas: [["Os planos do diligente certamente levam ao êxito.", "Provérbios 21:5"],
    ["Honre a Jeová com as suas coisas valiosas.", "Provérbios 3:9"]],
  metas: [["Entregue a Jeová o que você faz, e seus planos serão bem-sucedidos.", "Provérbios 16:3"]],
  livros: [["O sábio escutará e absorverá mais instrução.", "Provérbios 1:5"],
    ["Adquira sabedoria, adquira entendimento.", "Provérbios 4:5"]],
};
export function verseFor(area: Area, d = new Date()) {
  const list = V[area];
  const day = Math.floor(d.getTime() / 86_400_000);
  return list[day % list.length];
}
