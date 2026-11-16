"use client";
export function PrintButton() {
  return <div className="no-print flex gap-2 mt-5"><button className="btn btn-accent" onClick={() => window.print()}>Imprimir / salvar PDF</button><a className="btn" href="/estudos/conquistas">Voltar</a></div>;
}
