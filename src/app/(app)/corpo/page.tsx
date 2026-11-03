import { Card, Empty, PageHeader, Verse } from "@/components/ui";
export default function Page() {
  return (
    <>
      <PageHeader eyebrow="Corpo" title="Treino, água e dieta" color="#8ac295" />
      <Card><Empty>Este espaço será construído na Fase 4.</Empty></Card>
      <Verse area="corpo" />
    </>
  );
}
