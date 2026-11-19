type Habitat = {
  name: string;
  description: string;
  effect: "forest" | "water" | "embers" | "wind";
  color: string;
  items: [string, string][];
};

export const HABITATS: Record<string, Habitat> = {
  lobo: { name: "Covil da Lua", description: "A matilha encontra abrigo entre os pinheiros quando a lua aparece.", effect: "wind", color: "#a5ccff", items: [["Arco de pedra", "Marca a entrada do covil."], ["Pinha", "O vento espalha sementes pela trilha."]] },
  coruja: { name: "Biblioteca do Carvalho", description: "Livros e lamparinas ocupam os ocos do carvalho antigo.", effect: "forest", color: "#ffc689", items: [["Lamparina", "Mantém a sala de leitura iluminada à noite."], ["Estante", "Guarda os livros dos antigos moradores do bosque."]] },
  urso: { name: "Gruta do Mel", description: "Rochas lisas e água corrente cercam o descanso do urso.", effect: "wind", color: "#ffcc85", items: [["Favo de mel", "O tesouro favorito do morador da gruta."], ["Pedra de descanso", "A superfície lisa aquece com o sol da manhã."]] },
  aguia: { name: "Ninho das Alturas", description: "Do penhasco, a águia vê o reino inteiro.", effect: "wind", color: "#ffe0a7", items: [["Ninho", "Construído com galhos firmes na beira da montanha."], ["Pena dourada", "Indica a direção do vento acima do vale."]] },
  tubarao: { name: "Aquário Azul", description: "A luz atravessa o vidro e desenha ondas no fundo do aquário.", effect: "water", color: "#82e9ff", items: [["Naufrágio em miniatura", "Um abrigo de cerâmica entre os corais."], ["Recife", "As correntes passam entre o coral e as pedras."]] },
  serpente: { name: "Ruínas de Jade", description: "Colunas cobertas de musgo guardam um santuário aos pés da mata.", effect: "forest", color: "#99f5a7", items: [["Cristal de jade", "Ilumina as fendas do santuário."], ["Coluna caída", "Oferece uma passagem fresca por baixo das pedras."]] },
  leao: { name: "Trono da Savana", description: "O leão observa a savana do alto de uma rocha aquecida pelo sol.", effect: "wind", color: "#ffce86", items: [["Rocha do trono", "O ponto mais alto da clareira."], ["Acácia", "A sombra mais fresca do território."]] },
  pantera: { name: "Floresta dos Fortes", description: "Raízes gigantes e mata fechada. Aqui, só os mais fortes ficam de pé.", effect: "forest", color: "#9cf286", items: [["Pedra da Pantera", "Entre as raízes, ela marca o centro do território."], ["Raízes antigas", "As trilhas escondidas começam por baixo da mata."]] },
  fenix: { name: "Templo das Brasas", description: "O calor do vulcão mantém aceso o altar da Fênix.", effect: "embers", color: "#ffb065", items: [["Braseiro", "As brasas acesas marcam o lugar do renascimento."], ["Altar vulcânico", "A pedra escura guarda o calor da lava."]] },
  dragao: { name: "Caverna do Tesouro", description: "Cristais azuis iluminam os tesouros no fundo da montanha.", effect: "embers", color: "#73e6ff", items: [["Baú de ferro", "O dragão guarda suas relíquias sob a tampa pesada."], ["Cristal azul", "Brilha nas partes mais fundas da caverna."]] },
  kitsune: { name: "Bosque das Lanternas", description: "Entre folhas de cobre, uma Kitsune guarda os caminhos do bosque.", effect: "forest", color: "#ffb372", items: [["Lanterna de madeira", "Ilumina a entrada da toca."], ["Folhas de bordo", "Formam um tapete macio diante do abrigo."]] },
  qilin: { name: "Jardim de Jade", description: "Lírios e pedras lisas marcam o caminho do Qilin junto à água.", effect: "forest", color: "#a8f3ba", items: [["Lírio-d’água", "Balança devagar quando a água passa."], ["Pedra lisa", "Marca a passagem entre o jardim e a névoa."]] },
  grifo: { name: "Cidadela das Nuvens", description: "Arcos antigos cercam o ninho do grifo no alto das nuvens.", effect: "wind", color: "#ffe09c", items: [["Ninho dourado", "Trançado com ramos que resistem ao vento das alturas."], ["Arco suspenso", "Enquadra a vista para o resto do reino."]] },
  genbu: { name: "Santuário dos Corais", description: "Genbu guarda um santuário entre corais e jardins de ervas marinhas.", effect: "water", color: "#84f1e4", items: [["Concha perolada", "Reflete a luz que chega da superfície."], ["Jardim marinho", "As folhas se inclinam com a corrente."]] },
};
