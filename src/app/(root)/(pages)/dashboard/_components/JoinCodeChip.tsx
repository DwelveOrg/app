"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

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
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success(t("root.dashboard.school.joinCodeCopied"));
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("root.dashboard.school.joinCodeCopyError"));
    }
  };

  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--muted)]/50 px-4 py-2.5",
        className,
      )}
    >
      <div className="leading-tight">
        <p className="text-[11px] font-medium text-[var(--muted-foreground)]">
          {t("root.dashboard.school.joinCodeLabel")}
        </p>
        <code className="font-mono text-base font-semibold tracking-wide text-[var(--foreground)]">
          {code}
        </code>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--card)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        aria-label={t("root.dashboard.school.copyJoinCode")}
      >
        {copied ? (
          <Check className="h-4 w-4 text-[var(--success)]" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
