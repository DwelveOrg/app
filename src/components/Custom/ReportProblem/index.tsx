"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { LifeBuoy } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import ReportProblemDialog from "./ReportProblemDialog";

/**
 * The report control, everywhere.
 *
 * A floating button rather than a menu item, because the moment a user wants it
 * is the moment something on the page has gone wrong — and a control you have
 * to navigate to reach is a control that asks you to leave the broken screen
 * before you can describe it. That was the old shape: reporting lived in the
 * profile Support tab, three clicks from wherever the problem was, by which
 * point the URL and the state were gone.
 *
 * It sits above page content and below dialogs and toasts, offset on small
 * screens to clear the mobile navigation bar.
 *
 * ## Where it deliberately does not appear
 *
 * A live exam attempt. The exam room's rule is that while an attempt is running
 * there is nothing else on screen to click — on a delivery with
 * `detectLeaveScreen` set to `SUBMIT`, a floating button that opens a modal is
 * an invitation to end the attempt. A student who hits a problem mid-exam has
 * the exam's own controls; everything else waits until they are out.
 */
const HIDDEN_PATHS = [/^\/exam\/[^/]+\/attempt/];

export default function ReportProblem() {
  const pathname = usePathname();

  if (HIDDEN_PATHS.some((pattern) => pattern.test(pathname))) {
    return null;
  }

  // The open state lives one level down so that walking into the exam room
  // *destroys* it rather than parking it. Held here, a dialog left open on the
  // cover screen would reappear by itself on the submitted screen afterwards.
  return <ReportProblemLauncher />;
}

function ReportProblemLauncher() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("report.launcher")}
        title={t("report.launcher")}
        className={cn(
          "group fixed right-4 bottom-24 z-40 inline-flex items-center md:right-6 md:bottom-6",
          "size-12 justify-center rounded-full border border-border bg-card text-muted-foreground shadow-elev-3",
          "transition-[width,border-color,color] duration-[var(--dur-2)] ease-[var(--ease-out-quint)]",
          "hover:border-primary/40 hover:text-foreground",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
          "md:hover:w-auto md:hover:justify-start md:hover:pr-4 md:hover:pl-3.5",
          "md:focus-visible:w-auto md:focus-visible:justify-start md:focus-visible:pr-4 md:focus-visible:pl-3.5",
        )}
      >
        <LifeBuoy className="size-5 shrink-0" aria-hidden="true" />
        {/*
          Collapsed to the mark until hover, so the control is reachable from
          every screen without occupying a labelled slot on every screen. The
          label is `hidden` while collapsed — not merely zero-width — so it
          contributes no gap, which is what made the circle look wrong before.
        */}
        <span className="hidden whitespace-nowrap text-13 font-medium md:group-hover:ml-2 md:group-hover:inline md:group-focus-visible:ml-2 md:group-focus-visible:inline">
          {t("report.launcher")}
        </span>
      </button>

      <ReportProblemDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
