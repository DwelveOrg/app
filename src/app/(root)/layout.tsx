import SideBar from "@/app/(root)/_components/Sidebar";
import ReportProblem from "@/components/Custom/ReportProblem";
import ShellBackdrop from "@/components/Custom/ShellBackdrop";
import { getUser } from "@/app/(root)/_utils/getUser";

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The sidebar needs the role for one row: Assignments shows a student the
  // tests set for them and staff the tests they have set, and is locked only
  // for an account with no membership at all. Read here rather than in the
  // sidebar itself, which is a client component.
  const user = await getUser();

  return (
    // Flush-left sidebar over the canvas, with a single scrolling content column. The top bar was
    // removed — each page owns its own header, and the sidebar is the only persistent chrome.
    //
    // The canvas is --background in both themes now, and panels sit *above* it on --card carrying
    // elevation. Previously the canvas was --muted in light and --background in dark, which meant
    // light-mode panels had to be separated by a border alone because they were the lighter surface.
    <div className="flex h-dvh min-h-0 overflow-hidden bg-background text-foreground md:h-screen">
      <SideBar schoolRole={user?.schoolRole ?? null} />
      <div className="layout-enter relative isolate flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* The canvas itself. It sits in the content column rather than behind
            the whole shell because the sidebar is its own surface (`--sidebar`)
            and should not be lit from underneath. The column does not scroll —
            `main` inside it does — so the field stays put and costs nothing on
            scroll. */}
        <ShellBackdrop />

        <main className="content-scroll relative z-10 min-h-0 min-w-0 flex-1 overflow-y-auto pb-24 md:pb-0">
          <div className="mx-auto w-full min-w-0 max-w-[1180px] px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Reachable from every page in the shell, because the moment someone
          wants it is the moment the page they are on has gone wrong. */}
      <ReportProblem />
    </div>
  );
}
