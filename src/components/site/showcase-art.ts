import type { StaticImageData } from "next/image";
import achievement_40 from "../../../public/medalhas/status/40.webp";
import achievement_66dias from "../../../public/medalhas/status/66dias.webp";
import achievement_agua100 from "../../../public/medalhas/status/agua100.webp";
import achievement_agua30 from "../../../public/medalhas/status/agua30.webp";
import achievement_assuma from "../../../public/medalhas/status/assuma.webp";
import achievement_babilonia from "../../../public/medalhas/status/babilonia.webp";
import achievement_babilonia12 from "../../../public/medalhas/status/babilonia12.webp";
import achievement_biblia from "../../../public/medalhas/status/biblia.webp";
import achievement_biblia100 from "../../../public/medalhas/status/biblia100.webp";
import achievement_biscoitos from "../../../public/medalhas/status/biscoitos.webp";
import achievement_campo12 from "../../../public/medalhas/status/campo12.webp";
import achievement_campo20d from "../../../public/medalhas/status/campo20d.webp";
import achievement_campo50 from "../../../public/medalhas/status/campo50.webp";
import achievement_campo600 from "../../../public/medalhas/status/campo600.webp";
import achievement_composto from "../../../public/medalhas/status/composto.webp";
import achievement_deep from "../../../public/medalhas/status/deep.webp";
import achievement_dia1 from "../../../public/medalhas/status/dia1.webp";
import achievement_diario from "../../../public/medalhas/status/diario.webp";
import achievement_estudo30 from "../../../public/medalhas/status/estudo30.webp";
import achievement_formiga from "../../../public/medalhas/status/formiga.webp";
import achievement_limpo30 from "../../../public/medalhas/status/limpo30.webp";
import achievement_limpo365 from "../../../public/medalhas/status/limpo365.webp";
import achievement_limpo7 from "../../../public/medalhas/status/limpo7.webp";
import achievement_limpo90 from "../../../public/medalhas/status/limpo90.webp";
import achievement_livro1 from "../../../public/medalhas/status/livro1.webp";
import achievement_livro12 from "../../../public/medalhas/status/livro12.webp";
import achievement_livro50 from "../../../public/medalhas/status/livro50.webp";
import achievement_manha from "../../../public/medalhas/status/manha.webp";
import achievement_maratona from "../../../public/medalhas/status/maratona.webp";
import achievement_nunca2 from "../../../public/medalhas/status/nunca2.webp";
import achievement_peso5 from "../../../public/medalhas/status/peso5.webp";
import achievement_pesometa from "../../../public/medalhas/status/pesometa.webp";
import achievement_proteina30 from "../../../public/medalhas/status/proteina30.webp";
import achievement_seq30 from "../../../public/medalhas/status/seq30.webp";
import achievement_seq7 from "../../../public/medalhas/status/seq7.webp";
import achievement_sobra3 from "../../../public/medalhas/status/sobra3.webp";
import achievement_sono30 from "../../../public/medalhas/status/sono30.webp";
import achievement_total400 from "../../../public/medalhas/status/total400.webp";
import achievement_total500 from "../../../public/medalhas/status/total500.webp";
import achievement_total600 from "../../../public/medalhas/status/total600.webp";
import achievement_treino200 from "../../../public/medalhas/status/treino200.webp";
import achievement_treino50 from "../../../public/medalhas/status/treino50.webp";
import rank0 from "../../../public/medalhas/patentes/0.webp";
import rank1 from "../../../public/medalhas/patentes/1.webp";
import rank2 from "../../../public/medalhas/patentes/2.webp";
import rank3 from "../../../public/medalhas/patentes/3.webp";
import rank4 from "../../../public/medalhas/patentes/4.webp";
import rank5 from "../../../public/medalhas/patentes/5.webp";
import rank6 from "../../../public/medalhas/patentes/6.webp";
import rank7 from "../../../public/medalhas/patentes/7.webp";
import rank8 from "../../../public/medalhas/patentes/8.webp";
import rank9 from "../../../public/medalhas/patentes/9.webp";
export { default as missionArt } from "../../../public/painel/missao.webp";
export { default as xpArt } from "../../../public/painel/xp.webp";
export { default as libraryArt } from "../../../public/medalhas/livros/livros.webp";
export { default as pageArt } from "../../../public/medalhas/livros/paginas.webp";
export { default as streakArt } from "../../../public/medalhas/livros/sequencia.webp";
export { default as criticArt } from "../../../public/medalhas/livros/critico.webp";
export { default as studyArt } from "../../../public/medalhas/estudo-dominio.webp";
export { default as studyCertificateArt } from "../../../public/medalhas/estudo-cem-horas.webp";
export { default as eventArt } from "../../../public/medalhas/evento-hellforged.webp";
export { default as beastArt } from "../../../public/bestiario/lobo-encontro.webp";

export const RANK_ART = [rank0, rank1, rank2, rank3, rank4, rank5, rank6, rank7, rank8, rank9] as const;

export const ACHIEVEMENT_ART: Record<string, StaticImageData> = {
  "40": achievement_40,
  "66dias": achievement_66dias,
  "agua100": achievement_agua100,
  "agua30": achievement_agua30,
  "assuma": achievement_assuma,
  "babilonia": achievement_babilonia,
  "babilonia12": achievement_babilonia12,
  "biblia": achievement_biblia,
  "biblia100": achievement_biblia100,
  "biscoitos": achievement_biscoitos,
  "campo12": achievement_campo12,
  "campo20d": achievement_campo20d,
  "campo50": achievement_campo50,
  "campo600": achievement_campo600,
  "composto": achievement_composto,
  "deep": achievement_deep,
  "dia1": achievement_dia1,
  "diario": achievement_diario,
  "estudo30": achievement_estudo30,
  "formiga": achievement_formiga,
  "limpo30": achievement_limpo30,
  "limpo365": achievement_limpo365,
  "limpo7": achievement_limpo7,
  "limpo90": achievement_limpo90,
  "livro1": achievement_livro1,
  "livro12": achievement_livro12,
  "livro50": achievement_livro50,
  "manha": achievement_manha,
  "maratona": achievement_maratona,
  "nunca2": achievement_nunca2,
  "peso5": achievement_peso5,
  "pesometa": achievement_pesometa,
  "proteina30": achievement_proteina30,
  "seq30": achievement_seq30,
  "seq7": achievement_seq7,
  "sobra3": achievement_sobra3,
  "sono30": achievement_sono30,
  "total400": achievement_total400,
  "total500": achievement_total500,
  "total600": achievement_total600,
  "treino200": achievement_treino200,
  "treino50": achievement_treino50,
};
