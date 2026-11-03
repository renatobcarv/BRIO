import { Card, Empty, PageHeader, Verse } from "@/components/ui";
export default function Page() {
  return (
    <>
      <PageHeader eyebrow="Finanças" title="Fluxo e patrimônio" color="#d9c49a" />
      <Card><Empty>Este espaço será construído na Fase 6.</Empty></Card>
      <Verse area="financas" />
    </>
  );
}
