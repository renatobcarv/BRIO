import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-dvh grid place-items-center px-4">
      <div className="text-center max-w-sm">
        <p className="num text-6xl text-muted">404</p>
        <h1 className="font-display text-2xl mt-3">Página não encontrada</h1>
        <p className="text-sm text-muted mt-2">O endereço pode ter mudado ou não existe.</p>
        <Link href="/" className="btn btn-accent mt-6 inline-flex">Voltar ao início</Link>
      </div>
    </main>
  );
}
