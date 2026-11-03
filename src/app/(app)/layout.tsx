import { Nav } from "@/components/nav";
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="md:pl-60 pb-28 md:pb-10">
        <div className="mx-auto max-w-3xl px-4 pt-8 md:pt-12">{children}</div>
      </main>
    </>
  );
}
