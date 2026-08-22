import type { Metadata } from "next";

import SideBar from "@/app/(root)/_components/Sidebar";
import { PRIVATE_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  robots: PRIVATE_ROBOTS,
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Flush-left sidebar over the canvas, with a single scrolling content column. The top bar was
    // removed — each page owns its own header, and the sidebar is the only persistent chrome.
    //
    // The canvas is --background in both themes now, and panels sit *above* it on --card carrying
    // elevation. Previously the canvas was --muted in light and --background in dark, which meant
    // light-mode panels had to be separated by a border alone because they were the lighter surface.
    <div className="flex h-dvh min-h-0 overflow-hidden bg-background text-foreground md:h-screen">
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
