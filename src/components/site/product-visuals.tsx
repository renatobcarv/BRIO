import Image from "next/image";
import { ACHIEVEMENT_ART, RANK_ART, criticArt, libraryArt, pageArt, streakArt, studyArt, studyCertificateArt, xpArt } from "./showcase-art";
import { ATTRS, RANKS, RARITY, achievements, type Achievement } from "@/lib/game";

const EMPTY_RECORDS = {
  today: "2026-01-01", checks: [], fullDays: [], study: [], chapters: [], pioneer: [],
  workouts: [], waterDays: [], waterGoal: 0, sleep: [], readingPages: [], booksFinished: [],
  finance: [], weights: [],
};
// Só conquistas das áreas do pacote (sem espiritual, ministério e dias limpos).
const HIDDEN = /^(limpo|assuma|biblia|campo|diario)/;
const CATALOG = achievements(EMPTY_RECORDS).filter((a) => !HIDDEN.test(a.id));
const FEATURED_IDS = ["dia1", "livro50", "total600", "seq30", "pesometa", "babilonia12"];

function AchievementTile({ award }: { award: Achievement }) {
  const rarity = RARITY[award.rarity];

  return (
    <li className="flex min-w-0 flex-col items-start rounded-xl border border-white/10 bg-white/[.03] p-3 sm:p-4">
      <Image src={ACHIEVEMENT_ART[award.id]} alt="" width={82} height={82} unoptimized className="medal-float h-[72px] w-[72px] object-contain sm:h-[82px] sm:w-[82px]" />
      <p className="mt-2 text-sm font-semibold text-white">{award.title}</p>
      <p className="mt-0.5 text-xs font-medium" style={{ color: rarity.color }}>{rarity.label}</p>
      <p className="mt-1 text-xs leading-snug text-white/65">{award.desc}</p>
    </li>
  );
}

export function StatusPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#101012]">
      <div className="flex items-center gap-4 bg-[radial-gradient(ellipse_at_top_left,#b77b3330,transparent_70%)] p-5">
        <Image src={RANK_ART[6]} alt="" width={104} height={104} unoptimized className="h-20 w-20 shrink-0 object-contain sm:h-24 sm:w-24" />
        <div>
          <p className="text-sm text-[#ffcf81]">Status · exemplo</p>
          <p className="mt-1 text-2xl font-bold">{RANKS[6].name}</p>
          <p className="text-sm text-white/65">Nível {RANKS[6].min} · atributos em evolução</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-px border-t border-white/10 bg-white/10 sm:grid-cols-3">
        {Object.values(ATTRS).map(({ label }, i) => (
          <div key={label} className="bg-[#101012] p-3">
            <p className="text-xs text-white/65">{label}</p>
            <p className="mt-0.5 font-semibold text-white">{[24, 19, 16, 14, 18, 12][i]}</p>
          </div>
        ))}
      </div>
      <ol className="grid grid-cols-3 gap-2 border-t border-white/10 p-4 min-[460px]:grid-cols-5" aria-label="As dez patentes do Ascension">
        {RANKS.map((rank, i) => (
          <li key={rank.name} className="min-w-0 text-center">
            <Image src={RANK_ART[i]} alt="" width={58} height={58} unoptimized className="mx-auto h-12 w-12 object-contain sm:h-14 sm:w-14" />
            <p className="break-words text-[11px] text-white/80">{rank.name}</p>
            <p className="text-[10px] text-white/55">Nível {rank.min}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function AchievementGallery() {
  const featured = FEATURED_IDS.flatMap((id) => CATALOG.filter((award) => award.id === id));
  const remaining = CATALOG.filter((award) => !FEATURED_IDS.includes(award.id));

  return (
    <section id="conquistas" className="scroll-mt-20 border-t border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <div className="flex items-center gap-4">
          <Image src={xpArt} alt="" width={82} height={82} unoptimized className="h-16 w-16 shrink-0 object-contain sm:h-20 sm:w-20" />
          <div>
            <h2 className="font-display text-[clamp(30px,5vw,52px)]">{CATALOG.length} conquistas ilustradas</h2>
            <p className="mt-2 max-w-2xl text-sm text-white/70 sm:text-[16px]">Cada medalha tem um objetivo próprio. Complete missões, termine livros, avance no treino e acompanhe o que falta para a próxima.</p>
          </div>
        </div>
        <ul className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {featured.map((award) => <AchievementTile key={award.id} award={award} />)}
        </ul>
        <details className="mt-4 rounded-xl border border-white/10 bg-white/[.03]">
          <summary className="cursor-pointer px-4 py-4 font-medium text-[#ffe0a8]">Ver as outras {remaining.length} conquistas</summary>
          <ul className="grid grid-cols-2 gap-2 px-3 pb-3 sm:grid-cols-3 lg:grid-cols-6">
            {remaining.map((award) => <AchievementTile key={award.id} award={award} />)}
          </ul>
        </details>
        <ul className="mt-7 grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-white/[.03] p-3 sm:gap-5" aria-label="Títulos especiais">
          {[["phoenix", "Fênix"], ["titan", "Titã"], ["archon", "Arconte"]].map(([key, title]) => (
            <li key={key} className="text-center">
              <Image src={`/medalhas/titulo-${key}.webp`} alt="" width={78} height={78} unoptimized className="mx-auto h-14 w-14 object-contain sm:h-[78px] sm:w-[78px]" />
              <p className="mt-1 text-xs font-medium text-[#ffdfaa]">Título · {title}</p>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-white/70">
          <Image src={studyArt} alt="" width={48} height={48} unoptimized />
          <Image src={studyCertificateArt} alt="" width={48} height={48} unoptimized />
          <p className="basis-48 grow">Os estudos também têm medalhas e certificados, conquistados com avaliações e projetos.</p>
        </div>
      </div>
    </section>
  );
}

type Cover = "agenda" | "sonhos" | "livros" | "financas" | "pioneiro" | "corpo";
function CoverImage({ cover }: { cover: Cover }) {
  return <Image src={`/sobre/capas/${cover}.webp`} alt="" width={560} height={420} unoptimized className="aspect-[16/9] w-full object-cover object-center" />;
}

export function AreaPreview({ cover }: { cover: "agenda" | "sonhos" | "livros" }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-white/10 bg-[#101012]">
      <CoverImage cover={cover} />
      <figcaption className="p-4 sm:p-5">
        {cover === "agenda" ? (
          <>
            <p className="mb-3 text-sm font-semibold text-[#ffcf81]">Quinta-feira · exemplo de agenda</p>
            <ol className="divide-y divide-white/10">
              {[["07:30", "Treino"], ["14:00", "Reunião de projeto"], ["19:30", "Estudo pessoal"]].map(([time, item]) => (
                <li key={time} className="flex gap-4 py-2 text-sm"><time className="font-mono text-white/60">{time}</time><span>{item}</span></li>
              ))}
            </ol>
          </>
        ) : cover === "sonhos" ? (
          <>
            <p className="mb-3 text-sm font-semibold text-[#ffcf81]">Meu quadro · exemplos de sonhos</p>
            <ul className="flex flex-wrap gap-2 text-sm text-white/85">
              {["Conhecer o litoral", "Construir um lar", "Ter tempo em família"].map((item) => <li key={item} className="rounded-full border border-white/15 px-3 py-1.5">{item}</li>)}
            </ul>
          </>
        ) : (
          <>
            <p className="mb-3 text-sm font-semibold text-[#ffcf81]">Medalhas da estante</p>
            <ul className="grid grid-cols-2 gap-2 min-[460px]:grid-cols-4">
              {([[libraryArt, "Devorador de livros"], [pageArt, "Páginas viradas"], [streakArt, "Chama da leitura"], [criticArt, "Crítico"]] as const).map(([art, name]) => (
                <li key={name} className="text-center text-xs text-white/75">
                  <Image src={art} alt="" width={58} height={58} unoptimized className="mx-auto h-14 w-14 object-contain" />
                  {name}
                </li>
              ))}
            </ul>
          </>
        )}
      </figcaption>
    </figure>
  );
}

const MORE_AREAS = [
  { title: "Finanças", description: "Saiba quanto entrou, quanto saiu e o que falta pagar. Organize parcelas, caixinhas e investimentos.", cover: "financas" },
  { title: "Corpo", description: "Registre água, sono e peso e acompanhe a tendência em relação à sua meta.", cover: "corpo" },
  { title: "Livros", description: "Estante, diário de leitura por dia, anotações e medalhas do Bronze à Lenda.", cover: "livros" },
] as const;

export function MoreAreas() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
      <h2 className="font-display text-[clamp(30px,5vw,52px)]">Mais áreas do BRIO</h2>
      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MORE_AREAS.map((area) => (
          <article key={area.title} className="overflow-hidden rounded-xl border border-white/10 bg-white/[.03]">
            <CoverImage cover={area.cover} />
            <div className="p-4">
              <h3 className="text-xl font-semibold">{area.title}</h3>
              <p className="mt-1 text-sm text-white/65">{area.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
