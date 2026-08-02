import SideBar from "@/app/(root)/_components/Sidebar";

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Flat app shell: flush-left sidebar (paints --card) over a muted canvas with
    // a single scrolling content column. The top bar was removed — each page owns
    // its own header, and the sidebar is the only persistent chrome.
    <div className="flex h-dvh min-h-0 overflow-hidden bg-[var(--muted)] text-[var(--foreground)] md:h-screen dark:bg-[var(--background)]">
      <SideBar />
      <div className="layout-enter relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <main className="content-scroll min-h-0 min-w-0 flex-1 overflow-y-auto pb-24 md:pb-0">
          <div className="mx-auto w-full min-w-0 max-w-[1180px] px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
