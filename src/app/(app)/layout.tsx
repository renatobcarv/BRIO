import { Nav } from "@/components/nav";
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 h-[env(safe-area-inset-top)] bg-base/85 backdrop-blur-xl" aria-hidden />
      <Nav />
      <main className="md:pl-60 pb-28 md:pb-10">
        <div className="mx-auto max-w-3xl px-4 pt-[calc(env(safe-area-inset-top)+2rem)] md:pt-12">{children}</div>
      </main>
    </>
  );
}
