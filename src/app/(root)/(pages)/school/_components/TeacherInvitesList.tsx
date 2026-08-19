"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Link2, MailX, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import type { TeacherInviteSummary } from "@/app/(authentication)/_lib/api.schemas";
import Badge from "@/components/ui/badge";
import CopyButton from "@/components/ui/CopyButton";
import Surface from "@/components/ui/Surface";
import { Button } from "@/components/ui/Button";
import { RelativeTime } from "@/components/Custom/RelativeTime";
import ConfirmDialog from "@/app/(root)/_components/ConfirmDialog";
import {
  reissueTeacherInviteAction,
  revokeTeacherInviteAction,
} from "@/app/(root)/_lib/school-actions";
import Empty from "../../_components/ui/Empty";

/**
 * Teacher invitations that have been sent and not yet accepted.
 *
 * ## Why the link is not simply shown
 *
 * Only the token's hash is stored, so there is no link to display. That is the
 * point — a leaked database hands out no teacher access, and teacher access is
 * the role that exposes answer keys. The consequence used to be a dead end: an
 * admin who closed the invite dialog lost the link permanently, and creating a
 * replacement was refused because an active invite already existed.
 *
 * "Get a new link" resolves it by rotating the token. The old link stops
 * working the moment a new one is produced, which is stated on the button's own
 * row rather than buried in a tooltip, because it changes what the admin should
 * do with a link they may already have pasted somewhere.
 */
export default function TeacherInvitesList({
  invites,
  hasError,
}: {
  invites: TeacherInviteSummary[];
  hasError: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [reissued, setReissued] = useState<{ id: string; url: string } | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<TeacherInviteSummary | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const reissue = (invite: TeacherInviteSummary) => {
    setBusyId(invite.id);
    startTransition(async () => {
      const result = await reissueTeacherInviteAction({ inviteId: invite.id });
      setBusyId(null);
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      const url = result?.data?.inviteUrl;
      if (!url) {
        toast.error(t("root.schoolPage.access.invites.reissueError"));
        return;
      }
      setReissued({ id: invite.id, url });
      router.refresh();
    });
  };

  if (hasError) {
    return (
      <Empty
        title={t("root.schoolPage.access.invites.errorTitle")}
        description={t("root.schoolPage.access.invites.errorDescription")}
        action={
          <Button type="button" className="w-full" onClick={() => router.refresh()}>
            <RefreshCw className="size-4" />
            {t("root.schoolPage.teachers.retry")}
          </Button>
        }
      />
    );
  }

  if (invites.length === 0) {
    return (
      <Empty
        title={t("root.schoolPage.access.invites.emptyTitle")}
        description={t("root.schoolPage.access.invites.emptyDescription")}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Surface padding="none" divided>
        {invites.map((invite) => (
          <div key={invite.id} className="flex flex-col gap-2 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {invite.invitedEmail}
              </span>

              {invite.expired ? (
                <Badge variant="warning" size="xs">
                  {t("root.schoolPage.access.invites.expired")}
                </Badge>
              ) : (
                <span className="text-2xs text-muted-foreground">
                  {t("root.schoolPage.access.invites.expires")}{" "}
                  <RelativeTime date={String(invite.expiresAt)} />
                </span>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={isPending && busyId === invite.id}
                onClick={() => reissue(invite)}
              >
                <Link2 className="size-4" />
                {t("root.schoolPage.access.invites.newLink")}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setRevokeTarget(invite)}
              >
                <MailX className="size-4" />
                {t("root.schoolPage.access.invites.revoke")}
              </Button>
            </div>

            {/*
              The freshly minted link, shown inline on the row it belongs to.
              It is deliberately not kept after a refresh: this is the one
              moment it exists in plaintext, and a link that lingered on screen
              would end up copied from a stale render after being rotated again.
            */}
            {reissued?.id === invite.id ? (
              <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-[color-mix(in_srgb,var(--primary)_7%,transparent)] px-3 py-2">
                <code className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
                  {reissued.url}
                </code>
                <CopyButton
                  value={reissued.url}
                  label={t("root.schoolPage.inviteTeacher.copyLink")}
                  copiedLabel={t("root.schoolPage.inviteTeacher.linkCopied")}
                  onCopied={() => toast.success(t("root.schoolPage.inviteTeacher.linkCopied"))}
                  onError={() => toast.error(t("root.schoolPage.inviteTeacher.linkCopyError"))}
                  className="shrink-0"
                />
              </div>
            ) : null}
          </div>
        ))}
      </Surface>

      <p className="text-2xs text-muted-foreground">
        {t("root.schoolPage.access.invites.rotationNote")}
      </p>

      <ConfirmDialog
        open={revokeTarget !== null}
        onOpenChange={(next) => {
          if (!next) setRevokeTarget(null);
        }}
        icon={<MailX />}
        title={t("root.schoolPage.access.invites.revokeTitle", {
          email: revokeTarget?.invitedEmail ?? "",
        })}
        description={t("root.schoolPage.access.invites.revokeDescription")}
        cancelLabel={t("root.schoolPage.access.cancel")}
        confirmLabel={t("root.schoolPage.access.invites.revoke")}
        isPending={isPending && busyId === "revoke"}
        onConfirm={() => {
          const target = revokeTarget;
          if (!target) return;
          setBusyId("revoke");
          startTransition(async () => {
            const result = await revokeTeacherInviteAction({ inviteId: target.id });
            setBusyId(null);
            if (result?.serverError) {
              toast.error(result.serverError);
              return;
            }
            toast.success(
              t("root.schoolPage.access.invites.revoked", { email: target.invitedEmail }),
            );
            setRevokeTarget(null);
            router.refresh();
          });
        }}
      />
    </div>
  );
}
