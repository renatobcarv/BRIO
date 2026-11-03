import { Card, Empty, PageHeader, Verse } from "@/components/ui";
export default function Page() {
  return (
    <>
      <PageHeader eyebrow="Espiritual" title="Vida espiritual" color="#e0ac53" />
      <Card><Empty>Este espaço será construído na Fase 5.</Empty></Card>
      <Verse area="espiritual" />
    </>
  );
}
