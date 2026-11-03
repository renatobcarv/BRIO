import { Card, Empty, PageHeader, Verse } from "@/components/ui";
export default function Page() {
  return (
    <>
      <PageHeader eyebrow="Pioneiro" title="Serviço de campo" color="#84aed4" />
      <Card><Empty>Este espaço será construído na Fase 3.</Empty></Card>
      <Verse area="pioneiro" />
    </>
  );
}
