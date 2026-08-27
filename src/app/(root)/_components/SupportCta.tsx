"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  Bug,
  LifeBuoy,
  Mail,
  MessageCircle,
  Send,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import ReportProblemDialog from "@/components/Custom/ReportProblem/ReportProblemDialog";
import { supportEmail } from "@/app/(root)/(pages)/profile/_constants";
import type { ReportKind } from "@/lib/reports/reports.schemas";
import { cn } from "@/lib/utils";

/**
 * Reaching a person, on the dashboard.
 *
 * ## Why this is one panel and not two
 *
 * It used to be a `sm:grid-cols-2` pair — "Contact support" beside "Report a
 * problem" — and grid rows stretch. Contact holds one channel (two only where a
 * Telegram is configured); report holds three. So the left card was pinned to
 * the right card's height and spent roughly 200px on nothing, with a border and
 * a tint drawn around the emptiness to make sure it read as a hole rather than
 * as air. Equal-height columns with unequal content is that bug's whole shape,
 * and no amount of padding tuning removes it: the fix is to stop coupling two
 * heights that were never going to match.
 *
 * One panel instead, with the counts designed in rather than discovered:
 *
 * - Reaching us is a *conversation*, so it leaves for the user's own inbox or
 *   chat app. Those are chips in the header — content-sized, so one or two of
 *   them wrap without ever leaving a gap.
 * - Reporting stays inside the product, because the dialog sends the message
 *   and page context directly instead of depending on a configured mail client.
 *   The three report entry points fill a three-column grid at every width, so
 *   nothing here can render a ragged row.
 *
 * The panel keeps the PDF-importer's treatment — tinted surface, gradient-free
 * icon tile — for the same reason it has one: this is an offer, not navigation,
 * and the two kinds of control should not look alike. The tint is `--info`
 * rather than the importer's `--primary`, so "we can build this for you" and
 * "something is wrong" stay distinct while sharing a shape.
 */
export default function SupportCta({ className }: { className?: string }) {
  const { t } = useTranslation();
  const [reportKind, setReportKind] = useState<ReportKind | null>(null);

  const telegram = process.env.NEXT_PUBLIC_SUPPORT_TELEGRAM;

  return (
    <section
      className={cn(
        "@container relative overflow-hidden rounded-2xl p-5",
        "border border-[color-mix(in_srgb,var(--info)_28%,transparent)]",
        "bg-[color-mix(in_srgb,var(--info)_7%,var(--card))]",
        className,
      )}
    >

      <div className="relative flex flex-col gap-5">
        <div className="flex flex-col gap-4 @xl:flex-row @xl:items-start @xl:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span
              aria-hidden="true"
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--info)_18%,transparent)] text-info [&_svg]:size-5"
            >
              <LifeBuoy />
            </span>

            <div className="min-w-0">
              <h3 className="type-heading text-foreground">
                {t("root.dashboard.support.title")}
              </h3>
              <p className="mt-1 max-w-[62ch] text-13 leading-relaxed text-pretty text-muted-foreground">
                {t("root.dashboard.support.description")}
              </p>
            </div>
          </div>

          {/* Content-sized, so one chip or two both sit flush — the header can
              never inherit a height it has nothing to fill.

              Thresholds here are content-box widths: `container-type:
              inline-size` queries the box *inside* the padding, so this panel's
              `p-5` puts it 40px below its own rendered width. `@xl` is 36rem,
              which a 1024px window clears at 40.3rem; `@2xl` did not, and the
              header stacked with the corner left empty. */}
          <div className="flex flex-wrap items-center gap-2 @xl:shrink-0 @xl:justify-end">
            <ChannelChip
              icon={Mail}
              href={`mailto:${supportEmail}`}
              label={t("root.dashboard.support.contact.email")}
              detail={supportEmail}
            />
            {telegram ? (
              <ChannelChip
                icon={Send}
                href={telegram}
                external
                label={t("root.dashboard.support.contact.telegram")}
                title={t("root.dashboard.support.contact.telegramHint")}
              />
            ) : null}
          </div>
        </div>

        {/* Always three, so the row is always full. */}
        <div className="grid gap-2 @md:grid-cols-3">
          <ReportTile
            icon={Bug}
            label={t("root.dashboard.support.report.bug")}
            hint={t("root.dashboard.support.report.bugHint")}
            onClick={() => setReportKind("BUG")}
          />
          <ReportTile
            icon={Sparkles}
            label={t("root.dashboard.support.report.idea")}
            hint={t("root.dashboard.support.report.ideaHint")}
            onClick={() => setReportKind("FEEDBACK")}
          />
          <ReportTile
            icon={MessageCircle}
            label={t("root.dashboard.support.report.question")}
            hint={t("root.dashboard.support.report.questionHint")}
            onClick={() => setReportKind("QUESTION")}
          />
        </div>
      </div>

      {/*
        Keyed on the kind so opening "Suggest an idea" after "Report a bug"
        remounts the dialog with the new default rather than keeping whichever
        was pressed first — the same rule the Support tab follows.
      */}
      {reportKind ? (
        <ReportProblemDialog
          key={reportKind}
          open
          defaultKind={reportKind}
          onOpenChange={(next) => {
            if (!next) setReportKind(null);
          }}
        />
      ) : null}
    </section>
  );
}

/**
 * A way out of the product: mail, or chat.
 *
 * Single-line by design. `detail` — the support address — appears only once the
 * panel is wide enough to carry it without pushing the chip past its neighbour,
 * because the address is useful to read and copy but is not what the control is
 * *for*; the label is.
 */
function ChannelChip({
  icon: Icon,
  href,
  label,
  detail,
  title,
  external = false,
}: {
  icon: LucideIcon;
  href: string;
  label: string;
  detail?: string;
  title?: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      title={title ?? detail}
      className={cn(
        "group interactive-flat inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-2 outline-none",
        "hover:border-[color-mix(in_srgb,var(--info)_45%,transparent)]",
        "focus-visible:ring-2 focus-visible:ring-ring/50",
      )}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <Icon className="size-4 shrink-0 text-info" aria-hidden="true" />
      <span className="text-13 font-medium text-foreground">{label}</span>
      {detail ? (
        <span className="hidden max-w-[34ch] truncate text-2xs text-muted-foreground @5xl:inline">
          {detail}
        </span>
      ) : null}
      <ArrowUpRight
        className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </a>
  );
}

/** One kind of report. Opens the dialog; never leaves the product. */
function ReportTile({
  icon: Icon,
  label,
  hint,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "interactive-flat flex w-full cursor-pointer items-start gap-2.5 rounded-xl border border-border/70 bg-card px-3 py-2.5 text-left outline-none",
        "hover:border-[color-mix(in_srgb,var(--info)_45%,transparent)]",
        "focus-visible:ring-2 focus-visible:ring-ring/50",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-info" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-13 font-medium text-foreground">{label}</span>
        <span className="block text-2xs leading-4 text-pretty text-muted-foreground">
          {hint}
        </span>
      </span>
    </button>
  );
}
