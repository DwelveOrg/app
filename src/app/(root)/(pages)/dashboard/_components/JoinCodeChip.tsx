"use client";

import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import CopyButton from "@/components/ui/CopyButton";
import { cn } from "@/lib/utils";

type JoinCodeChipProps = {
  /** The student join code to display and copy. */
  code: string;
  className?: string;
};

/**
 * Compact, copyable student-join-code chip. Extracted so the dashboard header
 * and the empty-school setup state share one implementation of the label +
 * monospace code + copy affordance instead of re-declaring it (see the
 * "reuse before you create" rule in CLAUDE.md).
 */
export default function JoinCodeChip({ code, className }: JoinCodeChipProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-3 rounded-xl border border-border bg-muted/50 px-4 py-2.5",
        className,
      )}
    >
      <div className="leading-tight">
        <p className="type-caption font-medium text-muted-foreground">
          {t("root.dashboard.school.joinCodeLabel")}
        </p>
        <code className="font-mono text-base font-semibold tracking-wide text-foreground">
          {code}
        </code>
      </div>
      <CopyButton
        value={code}
        label={t("root.dashboard.school.copyJoinCode")}
        copiedLabel={t("root.dashboard.school.joinCodeCopied")}
        onCopied={() => toast.success(t("root.dashboard.school.joinCodeCopied"))}
        onError={() => toast.error(t("root.dashboard.school.joinCodeCopyError"))}
      />
    </div>
  );
}
