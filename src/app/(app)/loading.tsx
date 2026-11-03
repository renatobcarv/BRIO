export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Carregando" className="animate-pulse">
      <div className="h-3 w-32 rounded bg-white/10" />
      <div className="h-10 w-64 rounded bg-white/10 mt-3 mb-6" />
      {[0, 1, 2].map((i) => <div key={i} className="glass h-36 mt-4" />)}
    </div>
  );
}
