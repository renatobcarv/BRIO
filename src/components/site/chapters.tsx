import { ExerciseThumb } from "@/components/body/exercise-media";
import { MuscleMap } from "@/components/body/muscle-map";
import { RANKS } from "@/lib/game";
import { SPECIES } from "@/lib/pet";

const A = "#ffb21e";

/** Capítulo em tela cheia: título grande + prévia grande da tela real, alternando lados. */
export function Chapter({ n, kicker, title, text, visual, flip = false }: { n: string; kicker: string; title: React.ReactNode; text: string; visual: React.ReactNode; flip?: boolean }) {
  return (
    <section className="relative min-h-[88vh] flex items-center border-t border-white/[.06] overflow-hidden">
      <span aria-hidden className={`absolute top-6 ${flip ? "left-4 lg:left-10" : "right-4 lg:right-10"} font-mono text-[11px] text-white/25`}>{n} / 06</span>
      <div className={`max-w-6xl mx-auto px-4 py-20 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center w-full`}>
        <div className={flip ? "lg:order-2" : ""}>
          <p className="in text-[11px] font-bold tracking-[.35em] uppercase" style={{ color: A }}>{kicker}</p>
          <h2 className="in font-display text-[clamp(38px,6vw,76px)] leading-[.95] mt-4">{title}</h2>
          <p className="in text-lg text-white/65 mt-6 max-w-md">{text}</p>
        </div>
        <div className={`in ${flip ? "lg:order-1" : ""}`}>{visual}</div>
      </div>
    </section>
  );
}

/** Moldura de tela (estilo app). */
function Screen({ children, glow = A }: { children: React.ReactNode; glow?: string }) {
  return (
    <div className="relative">
      <div aria-hidden className="absolute -inset-10 -z-10 blur-3xl opacity-40" style={{ background: `radial-gradient(50% 50% at 50% 50%, ${glow}55, transparent 70%)` }} />
      <div className="tilt rounded-[28px] border border-white/10 bg-[#0d0d0f] p-5 sm:p-7 shadow-[0_40px_120px_-40px_rgba(0,0,0,.9)]">{children}</div>
    </div>
  );
}

export function WorkoutMock() {
  const ex = [["Supino reto com barra", "4 × 8 · 80 kg"], ["Remada curvada com barra", "4 × 8 · 70 kg"], ["Desenvolvimento com halteres", "3 × 10 · 22 kg"]];
  return (
    <Screen>
      <div className="grid grid-cols-7 gap-1 text-center" aria-hidden>
        {["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"].map((d, i) => (
          <div key={d} className={`rounded-[10px] py-2 ${i === 3 ? "bg-[#f5f5f7] text-black" : ""}`}><p className={`text-[9px] ${i === 3 ? "text-black/60" : "text-white/40"}`}>{d}</p><p className="font-semibold text-[17px]">{16 + i}</p><i className="mx-auto mt-1 block h-1.5 w-1.5 rounded-full" style={{ background: i < 3 && i !== 1 ? "#30d158" : i === 1 || i > 4 ? "transparent" : A }} /></div>))}
      </div>
      <p className="text-[12px] text-white/45 mt-5">Hoje · Semana 2 · Volume</p>
      <p className="text-[30px] font-bold tracking-tight leading-tight">Peitoral · Costas</p>
      <div className="grid grid-cols-[1fr_auto] gap-4 items-center mt-3">
        <ul className="grid gap-3">
          {ex.map(([n, d]) => <li key={n} className="flex items-center gap-3"><ExerciseThumb name={n} size={52} /><span className="min-w-0"><span className="block text-[14px] font-semibold truncate">{n}</span><span className="block text-[12px] text-white/50">{d}</span></span></li>)}
        </ul>
        <div className="w-28 hidden sm:block"><MuscleMap list={ex.map(([n]) => ({ name: n, sets: 4 }))} compact /></div>
      </div>
      <div className="mt-5 rounded-[12px] bg-[#f5f5f7] text-black text-center font-semibold py-3.5">Começar treino</div>
    </Screen>
  );
}

export function DietMock() {
  const meals = [["07:00", "Café da manhã", "Ovos mexidos · pão · fruta", true], ["12:30", "Almoço", "Arroz · feijão · frango · salada", true], ["16:00", "Lanche", "Iogurte · banana · aveia", false], ["19:30", "Jantar", "Patinho · batata-doce · legumes", false]] as const;
  return (
    <Screen>
      <p className="text-[12px] text-white/45">Plano do dia · Perder gordura</p>
      <p className="text-[64px] font-bold tracking-tight leading-none mt-1">2.420<span className="text-[20px] text-white/40"> kcal</span></p>
      <p className="font-mono text-[12px] text-white/50 mt-2">P 176 g · C 260 g · G 70 g · água 2,8 L</p>
      <p className="text-[12px] mt-1" style={{ color: A }}>Fase de volume: +5% de carboidrato</p>
      <ul className="mt-5 divide-y divide-white/[.06]">
        {meals.map(([t, l, d, done]) => (
          <li key={l} className="flex items-center gap-3 py-3">
            <span className="font-mono text-[12px] w-11" style={{ color: A }}>{t}</span>
            <span className="flex-1 min-w-0"><span className="block font-semibold text-[14px]">{l}</span><span className="block text-[12px] text-white/50 truncate">{d}</span></span>
            {done ? <span className="text-[12px] text-[#30d158]">✓ feita</span> : <span className="text-[12px] rounded-full bg-[#f5f5f7] text-black px-3 py-1 font-semibold">Comi</span>}
          </li>))}
      </ul>
    </Screen>
  );
}

export function StudyMock() {
  return (
    <Screen glow="#7dd3fc">
      <div className="flex gap-1.5 flex-wrap text-[11px]">{["Ensinar", "Socrático", "Praticar", "Avaliar"].map((m, i) => <span key={m} className={`rounded-full px-3 py-1 ${i === 1 ? "bg-[#f5f5f7] text-black" : "bg-white/[.06] text-white/60"}`}>{m}</span>)}</div>
      <div className="grid gap-4 mt-5 text-[14px]">
        <p className="justify-self-end max-w-[80%] rounded-[16px] rounded-br-[4px] bg-white/[.08] px-4 py-2.5">Quero entender recursão de verdade.</p>
        <div className="max-w-[90%]"><p className="text-[11px] text-white/40 mb-1">Tutor</p><p className="text-white/85">Antes de explicar: o que <b>impede</b> uma função de chamar a si mesma para sempre?</p></div>
        <p className="justify-self-end max-w-[80%] rounded-[16px] rounded-br-[4px] bg-white/[.08] px-4 py-2.5">Uma condição que para, o caso base.</p>
        <div className="max-w-[90%]"><p className="text-[11px] text-white/40 mb-1">Tutor</p><p className="text-white/85">Isso. Agora me diga, com suas palavras, o que muda se o <code className="text-[#ffb21e]">log</code> vier depois da chamada.</p></div>
      </div>
      <div className="mt-5 rounded-[14px] border border-[#ffb21e44] bg-[#ffb21e0d] p-3 text-[13px]"><span style={{ color: A }}>Domínio · nível 3/5</span><span className="text-white/60"> · resolve problemas sozinho</span></div>
    </Screen>
  );
}

export function SpiritMock() {
  return (
    <Screen glow="#9fd0f5">
      <div className="h-32 -mx-5 -mt-5 sm:-mx-7 sm:-mt-7 rounded-t-[28px]" style={{ background: "radial-gradient(70% 90% at 80% 0%, rgba(159,208,245,.45), transparent 70%), radial-gradient(60% 80% at 0% 100%, rgba(242,223,174,.3), transparent 70%), #0a0f15" }} />
      <p className="text-[11px] uppercase tracking-[.2em] mt-5 text-[#f2dfae]">Salmos 23</p>
      <p className="text-[32px] leading-tight mt-1" style={{ fontFamily: "var(--font-serif)" }}>Jeová é o meu pastor</p>
      <div className="mt-4 grid gap-3 text-[16px] leading-relaxed text-white/85" style={{ fontFamily: "var(--font-serif)" }}>
        <p>Nada me faltará. A <mark className="bg-[#9fd0f5]/25 text-white px-0.5">confiança</mark> vem de saber quem cuida.</p>
        <p className="border-l-2 border-[#f2dfae] pl-3 italic text-white/70">Aplicação: orar antes de decidir.</p>
      </div>
      <div className="flex gap-2 mt-5 text-[12px]">{["Bíblia", "Estudo", "Oração", "Gratidão"].map((t, i) => <span key={t} className="flex items-center gap-1.5 rounded-full bg-white/[.05] px-3 py-1.5"><i className="h-2 w-2 rounded-full" style={{ background: i < 3 ? "#9fd0f5" : "rgba(255,255,255,.2)" }} />{t}</span>)}</div>
    </Screen>
  );
}

export function PetMock() {
  return (
    <div className="relative grid place-items-center py-6">
      <div aria-hidden className="absolute h-[440px] w-[440px] max-w-full rounded-full pet-aura" style={{ background: `radial-gradient(circle, ${A}40, transparent 65%)` }} />
      <img src="/mascotes/dragao/lenda.webp" alt="Dragão lendário" className="relative w-[min(420px,80vw)] aspect-square object-contain pet-breathe" />
      <p className="relative mt-2 text-[12px] uppercase tracking-[.3em]" style={{ color: A }}>Lendário · o mais raro</p>
    </div>
  );
}

export function RankMock() {
  return (
    <ol className="grid grid-cols-5 gap-x-3 gap-y-5">
      {RANKS.map((r, i) => (
        <li key={r.name} className="text-center">
          <img src={`/medalhas/patentes/${i}.webp`} alt={`Insígnia ${r.name}`} className="w-full aspect-square object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,.7)]" style={{ filter: i >= 7 ? `drop-shadow(0 0 14px ${A}66)` : undefined }} loading="lazy" />
          <p className="text-[12px] font-semibold mt-1 truncate" style={{ color: i >= 7 ? A : "#f5f5f7" }}>{r.name}</p>
          <p className="text-[10px] text-white/40">nível {r.min}+</p>
        </li>))}
    </ol>
  );
}

const STATUS = ["dia1", "seq7", "seq30", "66dias", "treino50", "treino200", "maratona", "biblia", "biblia100", "campo50", "campo600", "estudo30", "deep", "livro1", "livro12", "livro50", "limpo7", "limpo90", "limpo365", "agua30", "agua100", "sono30", "proteina30", "peso5", "pesometa", "babilonia", "composto", "formiga", "manha", "nunca2", "total400", "total600"];
/** Mural de medalhas: as artes reais das conquistas, flutuando. */
export function MedalWall() {
  return (
    <section className="relative py-24 border-t border-white/[.06] overflow-hidden">
      <div aria-hidden className="absolute inset-0 -z-10" style={{ background: `radial-gradient(50% 50% at 50% 40%, ${A}18, transparent 70%)` }} />
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p className="in text-[11px] font-bold tracking-[.35em] uppercase" style={{ color: A }}>Conquistas</p>
        <h2 className="in font-display text-[clamp(38px,6vw,76px)] leading-[.95] mt-4">42 medalhas.<br /><span className="bg-clip-text text-transparent [background-image:linear-gradient(90deg,#ffd28a,#ffb21e,#ff9f0a)]">Cada uma, uma prova.</span></h2>
        <p className="in text-lg text-white/60 mt-5 max-w-xl mx-auto">Primeiro passo, 66 dias, mil páginas, um ano limpo. Mais as medalhas de leitura, de estudo e os títulos raros.</p>
      </div>
      <div className="max-w-6xl mx-auto px-4 mt-12 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-5">
        {STATUS.map((m, i) => (
          <img key={m} src={`/medalhas/status/${m}.webp`} alt="" data-i={i % 8} className="in w-full aspect-square object-contain medal-float" style={{ animationDelay: `${(i % 7) * 0.4}s` }} loading="lazy" />))}
      </div>
      <div className="max-w-3xl mx-auto px-4 mt-12 grid grid-cols-3 gap-6">
        {[["titulo-phoenix", "Fênix"], ["titulo-titan", "Titã"], ["titulo-archon", "Arconte"]].map(([f, t]) => (
          <figure key={f} className="text-center"><img src={`/medalhas/${f}.webp`} alt={`Título ${t}`} className="w-full aspect-square object-contain" style={{ filter: `drop-shadow(0 0 24px ${A}55)` }} loading="lazy" /><figcaption className="text-[11px] uppercase tracking-[.25em] mt-2" style={{ color: A }}>Título raro · {t}</figcaption></figure>))}
      </div>
    </section>
  );
}

const AREAS = [["agenda", "Agenda com IA"], ["financas", "Finanças"], ["metas", "Metas"], ["sonhos", "Quadro de sonhos"], ["pioneiro", "Pioneiro"], ["estudos", "Estudos"], ["treino", "Treino"], ["conquistas", "Conquistas"]];
/** E ainda: capas ilustradas das áreas. */
export function AreaStrip() {
  return (
    <section className="py-20 border-t border-white/[.06]">
      <div className="max-w-6xl mx-auto px-4"><p className="text-[11px] font-bold tracking-[.35em] uppercase" style={{ color: A }}>E ainda</p><h3 className="font-display text-[clamp(28px,4vw,48px)] leading-none mt-3">Toda a sua vida, num app só.</h3></div>
      <div className="mt-8 flex gap-4 overflow-x-auto snap-x px-4 lg:px-[max(1rem,calc((100vw_-_72rem)/2))] pb-4">
        {AREAS.map(([k, l]) => (
          <figure key={k} className="snap-start shrink-0 relative w-[220px] sm:w-[260px] aspect-[4/5] rounded-[22px] overflow-hidden border border-white/10">
            <img src={`/cards/${k}.webp`} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
            <figcaption className="absolute left-4 bottom-4 text-[20px] font-bold">{l}</figcaption>
          </figure>))}
      </div>
    </section>
  );
}

const RAR: Record<string, string> = { comum: "Comum", incomum: "Incomum", raro: "Raro", epico: "Épico", lendario: "Lendário" };
/** Galeria dos mascotes no seu lar (artes do BRIO), rolando na horizontal. */
export function PetGallery() {
  return (
    <section className="py-16 border-t border-white/[.06]">
      <div className="max-w-6xl mx-auto px-4 flex items-end justify-between gap-4">
        <div><p className="text-[11px] font-bold tracking-[.35em] uppercase" style={{ color: A }}>Os mascotes</p><h3 className="font-display text-[clamp(28px,4vw,48px)] leading-none mt-3">Cada um com seu lar.</h3></div>
        <p className="text-[13px] text-white/45 hidden sm:block">arraste para o lado →</p>
      </div>
      <div className="mt-8 flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 lg:px-[max(1rem,calc((100vw_-_72rem)/2))] pb-4" style={{ scrollbarWidth: "thin" }}>
        {SPECIES.map((x) => (
          <figure key={x.key} className="snap-start shrink-0 relative w-[260px] sm:w-[300px] aspect-[3/4] rounded-[22px] overflow-hidden border border-white/10">
            <img src={`/mascotes/lares/${x.key}-1600.webp`} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
            <img src={`/mascotes/${x.key}/jovem.webp`} alt={x.name} className="absolute left-1/2 -translate-x-1/2 bottom-[22%] w-[72%] aspect-square object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,.6)]" loading="lazy" />
            <figcaption className="absolute left-4 right-4 bottom-4">
              <p className="text-[10px] uppercase tracking-[.25em]" style={{ color: x.rarity === "lendario" || x.rarity === "epico" ? A : "rgba(255,255,255,.6)" }}>{RAR[x.rarity]}</p>
              <p className="text-[22px] font-bold leading-tight">{x.name}</p>
              <p className="text-[12px] text-white/60 leading-snug mt-0.5 line-clamp-2">{x.trait}</p>
            </figcaption>
          </figure>))}
      </div>
    </section>
  );
}
