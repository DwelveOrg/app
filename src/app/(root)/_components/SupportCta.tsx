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
import { supportEmail } from "@/app/(root)/(pages)/(small-container)/profile/_constants";
import type { ReportKind } from "@/lib/reports/reports.schemas";
import { cn } from "@/lib/utils";

/**
 * The two ways to reach a human, on the dashboard.
 *
 * ## Why these are cards and not buttons in the quick-actions row
 *
 * They are the only controls on the page that are not *about* the school — a
 * quick action takes you somewhere in your own data, and these two start a
 * conversation with us. Sitting them in the same outlined row would have made
 * "Report a problem" read as another place to visit, which is exactly what the
 * old profile-tab version failed at.
 *
 * They borrow the PDF-importer's treatment — tinted panel, gradient tile — for
 * the same reason it has one: these are offers, not navigation, and the two
 * kinds of control should not look alike. The tint is `--info` rather than the
 * importer's `--primary`, so "we can build this for you" and "something is
 * wrong" stay visually distinct while sharing a shape.
 *
 * ## Why support is a menu rather than one link
 *
 * "Contact support" has more than one honest answer: email, if you want a
 * thread you can follow; Telegram, if you want an answer in minutes. Picking
 * one for the user meant half of them were sent to the channel they do not use.
 */
export default function SupportCta({ className }: { className?: string }) {
  const { t } = useTranslation();
  const [reportKind, setReportKind] = useState<ReportKind | null>(null);

  const telegram = process.env.NEXT_PUBLIC_SUPPORT_TELEGRAM;

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {/* Contact support — a conversation, so it leaves for the user's own inbox
          or chat app rather than opening another form inside the product. */}
      <SupportPanel
        icon={LifeBuoy}
        eyebrow={t("root.dashboard.support.eyebrow")}
        title={t("root.dashboard.support.contact.title")}
        description={t("root.dashboard.support.contact.description")}
      >
        <ChannelLink
          icon={Mail}
          href={`mailto:${supportEmail}`}
          label={t("root.dashboard.support.contact.email")}
          hint={supportEmail}
        />
        {telegram ? (
          <ChannelLink
            icon={Send}
            href={telegram}
            external
            label={t("root.dashboard.support.contact.telegram")}
            hint={t("root.dashboard.support.contact.telegramHint")}
          />
        ) : null}
      </SupportPanel>

      {/* Report a problem — stays inside the product, because the thing that
          makes a report useful is the screenshot and the page context the
          dialog collects, and neither survives a mailto:. */}
      <SupportPanel
        icon={Bug}
        eyebrow={t("root.dashboard.support.eyebrow")}
        title={t("root.dashboard.support.report.title")}
        description={t("root.dashboard.support.report.description")}
      >
        <ChannelButton
          icon={Bug}
          label={t("root.dashboard.support.report.bug")}
          hint={t("root.dashboard.support.report.bugHint")}
          onClick={() => setReportKind("BUG")}
        />
        <ChannelButton
          icon={Sparkles}
          label={t("root.dashboard.support.report.idea")}
          hint={t("root.dashboard.support.report.ideaHint")}
          onClick={() => setReportKind("FEEDBACK")}
        />
        <ChannelButton
          icon={MessageCircle}
          label={t("root.dashboard.support.report.question")}
          hint={t("root.dashboard.support.report.questionHint")}
          onClick={() => setReportKind("QUESTION")}
        />
      </SupportPanel>

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
    </div>
  );
}

function SupportPanel({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--info)_28%,transparent)] p-5",
        "bg-[color-mix(in_srgb,var(--info)_7%,var(--card))]",
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-12 size-48 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--info)_22%,transparent),transparent_70%)] blur-xl"
      />

      <div className="relative flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--info)_18%,transparent)] text-info [&_svg]:size-5"
        >
          <Icon />
        </span>

        <div className="min-w-0 flex-1">
          <p className="type-micro text-info">{eyebrow}</p>
          <h3 className="type-heading mt-0.5 text-foreground">{title}</h3>
          <p className="mt-1 max-w-prose text-13 leading-relaxed text-muted-foreground">
            {description}
          </p>

          <div className="mt-3 grid gap-1.5">{children}</div>
        </div>
      </div>
    </section>
  );
}

/** Shared shape for a single channel row, so a link and a button cannot drift. */
const CHANNEL_CLASS = cn(
  "group interactive-flat flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-border/70 bg-card px-3 py-2 text-left outline-none",
  "hover:border-[color-mix(in_srgb,var(--info)_45%,transparent)]",
  "focus-visible:ring-2 focus-visible:ring-ring/50",
);

function ChannelBody({
  icon: Icon,
  label,
  hint,
  trailing,
}: {
  icon: LucideIcon;
  label: string;
  hint: string;
  trailing: React.ReactNode;
}) {
  return (
    <>
      <Icon className="size-4 shrink-0 text-info" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-13 font-medium text-foreground">{label}</span>
        <span className="block truncate text-2xs text-muted-foreground">{hint}</span>
      </span>
      {trailing}
    </>
  );
}

function ChannelLink({
  icon,
  href,
  label,
  hint,
  external = false,
}: {
  icon: LucideIcon;
  href: string;
  label: string;
  hint: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      className={CHANNEL_CLASS}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <ChannelBody
        icon={icon}
        label={label}
        hint={hint}
        trailing={
          <ArrowUpRight
            className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        }
      />
    </a>
  );
}

function ChannelButton({
  icon,
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
    <button type="button" onClick={onClick} className={CHANNEL_CLASS}>
      <ChannelBody icon={icon} label={label} hint={hint} trailing={null} />
    </button>
  );
}
