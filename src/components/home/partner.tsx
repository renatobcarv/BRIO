import Link from "next/link";

export function Partner({ photo, phrase }: { photo: string | null; phrase: string }) {
  if (!photo) {
    return (
      <Link href="/configuracoes#maria-luisa" className="glass rise p-5 mt-4 flex items-center gap-4">
        <span className="h-16 w-16 rounded-2xl bg-white/5 grid place-items-center text-2xl">♡</span>
        <span><span className="label block">Maria Luisa</span>
          <span className="font-display italic text-xl block">{phrase}</span>
          <span className="text-sm text-muted">Toque para adicionar a foto dela</span></span>
      </Link>
    );
  }
  return (
    <figure className="glass rise mt-4 overflow-hidden !p-0 relative">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo} alt="Maria Luisa" className="w-full aspect-[4/5] md:aspect-[16/10] object-cover object-[50%_35%]" />
      <figcaption className="absolute inset-x-0 bottom-0 p-6 pt-24 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
        <p className="label text-white/70">Maria Luisa</p>
        <p className="font-display italic text-3xl md:text-4xl text-white mt-1 leading-tight">{phrase}</p>
      </figcaption>
    </figure>
  );
}
