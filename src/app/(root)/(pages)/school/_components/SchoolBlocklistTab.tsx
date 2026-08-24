"use client";

import { useState, useTransition } from "react";
import { Ban, RotateCcw, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import type { SchoolBlocklistEntry } from "@/app/(authentication)/_lib/api.schemas";
import Avatar from "@/components/ui/Avatar";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Surface from "@/components/ui/Surface";
import Textarea from "@/components/ui/textarea";
import { Button } from "@/components/ui/Button";
import { RelativeTime } from "@/components/Custom/RelativeTime";
import ConfirmDialog from "@/app/(root)/_components/ConfirmDialog";
import {
  blockFromSchoolAction,
  unblockFromSchoolAction,
} from "@/app/(root)/_lib/school-actions";
import Empty from "../../_components/ui/Empty";
import { useRefreshSchoolDirectory } from "../_hooks/useSchoolDirectory";

/**
 * Who is barred from this school, and the one control that adds to the list.
 *
 * The list is keyed on the email address rather than on an account, which is
 * the only version of a block that survives someone signing up again: barring
 * a user id would stop exactly one account, and the join code would let the
 * same person back in five minutes later under a new one.
 *
 * Lifting a block is one press and takes effect immediately — it does not
 * re-admit anyone, it only stops refusing them, which is why it is not styled
 * as a destructive action.
 */
export default function SchoolBlocklistTab({
  entries,
  hasError,
  onRetry,
}: {
  entries: SchoolBlocklistEntry[];
  hasError: boolean;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  const refreshDirectory = useRefreshSchoolDirectory();
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [adding, startAdding] = useTransition();
  const [liftTarget, setLiftTarget] = useState<SchoolBlocklistEntry | null>(null);

  const add = () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    startAdding(async () => {
      const result = await blockFromSchoolAction({
        email: trimmed,
        reason: reason.trim() || undefined,
      });
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      if (result?.validationErrors) {
        toast.error(t("root.schoolPage.access.blocklist.invalidEmail"));
        return;
      }
      toast.success(t("root.schoolPage.access.blocklist.added", { email: trimmed }));
      setEmail("");
      setReason("");
      void refreshDirectory();
    });
  };

  return (
    <div className="space-y-5">
      <Surface as="section" padding="md" className="space-y-3">
        <p className="type-label text-foreground">
          {t("root.schoolPage.access.blocklist.addTitle")}
        </p>
        <p className="text-2xs text-muted-foreground">
          {t("root.schoolPage.access.blocklist.addHint")}
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("root.schoolPage.access.blocklist.emailLabel")}>
            {(field) => (
              <Input
                {...field}
                type="email"
                value={email}
                placeholder={t("root.schoolPage.access.blocklist.emailPlaceholder")}
                onChange={(event) => setEmail(event.target.value)}
              />
            )}
          </Field>
          <Field label={t("root.schoolPage.access.block.reasonLabel")}>
            {(field) => (
              <Textarea
                {...field}
                rows={1}
                maxLength={500}
                value={reason}
                placeholder={t("root.schoolPage.access.block.reasonPlaceholder")}
                onChange={(event) => setReason(event.target.value)}
              />
            )}
          </Field>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            loading={adding}
            disabled={!email.trim()}
            onClick={add}
          >
            <Ban className="size-4" />
            {t("root.schoolPage.access.blocklist.addAction")}
          </Button>
        </div>
      </Surface>

      {hasError ? (
        <Empty
          title={t("root.schoolPage.access.blocklist.errorTitle")}
          description={t("root.schoolPage.access.blocklist.errorDescription")}
          action={
            <Button type="button" className="w-full" onClick={onRetry}>
              <RotateCcw className="size-4" />
              {t("root.schoolPage.teachers.retry")}
            </Button>
          }
        />
      ) : entries.length === 0 ? (
        <Empty
          title={t("root.schoolPage.access.blocklist.emptyTitle")}
          description={t("root.schoolPage.access.blocklist.emptyDescription")}
        />
      ) : (
        <Surface padding="none" divided>
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 px-4 py-3">
              <Avatar name={entry.fullName ?? entry.email} size="sm" tint="seeded" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {entry.fullName ?? entry.email}
                </p>
                {entry.fullName ? (
                  <p className="truncate text-xs text-muted-foreground">{entry.email}</p>
                ) : null}
                {entry.reason ? (
                  <p className="mt-1 text-2xs text-muted-foreground">{entry.reason}</p>
                ) : null}
                <div className="mt-1 flex flex-wrap items-center gap-x-2 text-2xs text-muted-foreground">
                  {entry.createdAt ? <RelativeTime date={String(entry.createdAt)} /> : null}
                  {entry.blockedBy ? (
                    <span>
                      {t("root.schoolPage.access.blocklist.by", { name: entry.blockedBy })}
                    </span>
                  ) : null}
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setLiftTarget(entry)}
              >
                <UserPlus className="size-4" />
                {t("root.schoolPage.access.blocklist.lift")}
              </Button>
            </div>
          ))}
        </Surface>
      )}

      <LiftBlockDialog entry={liftTarget} onDone={() => setLiftTarget(null)} />
    </div>
  );
}

function LiftBlockDialog({
  entry,
  onDone,
}: {
  entry: SchoolBlocklistEntry | null;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const refreshDirectory = useRefreshSchoolDirectory();
  const [isPending, startTransition] = useTransition();

  const lift = () => {
    if (!entry) return;
    startTransition(async () => {
      const result = await unblockFromSchoolAction({ entryId: entry.id });
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success(t("root.schoolPage.access.blocklist.lifted", { email: entry.email }));
      onDone();
      void refreshDirectory();
    });
  };

  return (
    <ConfirmDialog
      open={entry !== null}
      onOpenChange={(next) => {
        if (!next) onDone();
      }}
      tone="default"
      icon={<UserPlus />}
      title={t("root.schoolPage.access.blocklist.liftTitle", { email: entry?.email ?? "" })}
      description={t("root.schoolPage.access.blocklist.liftDescription")}
      cancelLabel={t("root.schoolPage.access.cancel")}
      confirmLabel={t("root.schoolPage.access.blocklist.lift")}
      isPending={isPending}
      onConfirm={lift}
    />
  );
}
