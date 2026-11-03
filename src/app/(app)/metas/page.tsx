import { Card, Empty, PageHeader, Verse } from "@/components/ui";
export default function Page() {
  return (
    <>
      <PageHeader eyebrow="Metas" title="Metas e objetivos" color="#ac8fd6" />
      <Card><Empty>Este espaço será construído na Fase 7.</Empty></Card>
      <Verse area="metas" />
    </>
  );
}
