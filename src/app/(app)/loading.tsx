export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Carregando">
      <div className="skeleton h-3.5 w-36 rounded-full" />
      <div className="skeleton h-10 w-64 rounded-xl mt-3 mb-6" />
      {[150, 220, 120].map((h, i) => <div key={i} className="skeleton rounded-[22px] mt-4" style={{ height: h }} />)}
    </div>
  );
}
