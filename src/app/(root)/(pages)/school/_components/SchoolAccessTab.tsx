"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Crown, RefreshCw, ShieldCheck, ShieldOff } from "lucide-react";
import { useTranslation } from "react-i18next";

import type {
  SchoolBlocklistEntry,
  SchoolRosterMember,
  TeacherInviteSummary,
} from "@/app/(authentication)/_lib/api.schemas";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/badge";
import RowActionsMenu, { type RowAction } from "@/components/ui/RowActionsMenu";
import Surface from "@/components/ui/Surface";
import TabBar from "@/components/ui/TabBar";
import { Button } from "@/components/ui/Button";
import Empty from "../../_components/ui/Empty";
import BlockMemberDialog from "./BlockMemberDialog";
import DemoteAdminDialog from "./DemoteAdminDialog";
import PromoteTeacherDialog from "./PromoteTeacherDialog";
import SchoolBlocklistTab from "./SchoolBlocklistTab";
import TeacherInvitesList from "./TeacherInvitesList";

type AccessTab = "admins" | "invites" | "blocklist";

/**
 * Everything about who can do what in this school, on one surface.
 *
 * ## The model this screen makes visible
 *
 * There is exactly one **owner** — whoever created the school. They cannot be
 * demoted, removed, or blocked, by anyone, including themselves; a school whose
 * creator can be locked out of it by an admin they appointed is a school that
 * can be taken.
 *
 * **Admins** are appointed. Each one either can or cannot appoint further
 * admins, and only the owner decides which. An admin who *can* appoint may
 * create admins who *cannot* — the permission never propagates, so the set of
 * people able to widen the admin group stays small and stays visible here, in
 * one list, with the owner able to see every one of them.
 *
 * The badges are the whole explanation: "Owner" and "Can add admins" are the
 * only two facts that change what a row's menu offers.
 */
export default function SchoolAccessTab({
  admins,
  teachers,
  invites,
  blocklist,
  invitesError,
  blocklistError,
  membersError,
  /** The viewer's own membership id, so their row cannot offer self-actions. */
  viewerMemberId,
  viewerIsOwner,
  viewerCanManageAdmins,
}: {
  admins: SchoolRosterMember[];
  teachers: SchoolRosterMember[];
  invites: TeacherInviteSummary[];
  blocklist: SchoolBlocklistEntry[];
  invitesError: boolean;
  blocklistError: boolean;
  membersError: boolean;
  viewerMemberId: string | undefined;
  viewerIsOwner: boolean;
  viewerCanManageAdmins: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [tab, setTab] = useState<AccessTab>("admins");
  const [promoteTarget, setPromoteTarget] = useState<SchoolRosterMember | null>(null);
  const [demoteTarget, setDemoteTarget] = useState<SchoolRosterMember | null>(null);
  const [blockTarget, setBlockTarget] = useState<SchoolRosterMember | null>(null);

  const canPromote = viewerIsOwner || viewerCanManageAdmins;

  const rowActions = (member: SchoolRosterMember): RowAction[] => {
    // The owner's row has no actions at all, for anyone. Not "disabled" — the
    // owner is not a role that can be edited, so offering the control and
    // refusing it would only teach that the rule is a permission problem.
    if (member.isOwner || member.memberId === viewerMemberId) return [];

    const actions: RowAction[] = [];

    if (member.role === "TEACHER" && canPromote) {
      actions.push({
        label: t("root.schoolPage.access.actions.promote"),
        icon: ShieldCheck,
        keepOpen: true,
        onSelect: () => setPromoteTarget(member),
      });
    }

    if (member.role === "ADMIN" && viewerIsOwner) {
      actions.push({
        label: t("root.schoolPage.access.actions.demote"),
        icon: ShieldOff,
        keepOpen: true,
        onSelect: () => setDemoteTarget(member),
      });
    }

    // Blocking an admin is the owner's call; blocking a teacher is any admin's.
    if (member.role === "TEACHER" || viewerIsOwner) {
      actions.push({
        label: t("root.schoolPage.access.actions.block"),
        icon: Ban,
        destructive: true,
        keepOpen: true,
        onSelect: () => setBlockTarget(member),
      });
    }

    return actions;
  };

  return (
    <div className="space-y-5">
      <TabBar
        layoutId="school-access"
        ariaLabel={t("root.schoolPage.access.title")}
        value={tab}
        onSelect={(next) => setTab(next as AccessTab)}
        items={[
          { value: "admins", label: t("root.schoolPage.access.tabs.admins") },
          {
            value: "invites",
            label: t("root.schoolPage.access.tabs.invites"),
            count: invites.length,
          },
          {
            value: "blocklist",
            label: t("root.schoolPage.access.tabs.blocklist"),
            count: blocklist.length,
          },
        ]}
      />

      {tab === "admins" ? (
        membersError ? (
          <Empty
            title={t("root.schoolPage.teachers.errorTitle")}
            description={t("root.schoolPage.teachers.errorDescription")}
            action={
              <Button type="button" className="w-full" onClick={() => router.refresh()}>
                <RefreshCw className="size-4" />
                {t("root.schoolPage.teachers.retry")}
              </Button>
            }
          />
        ) : (
          <div className="space-y-5">
            <MemberList
              heading={t("root.schoolPage.access.adminsHeading")}
              note={t("root.schoolPage.access.adminsNote")}
              members={admins}
              emptyTitle={t("root.schoolPage.access.adminsEmpty")}
              rowActions={rowActions}
            />
            <MemberList
              heading={t("root.schoolPage.access.teachersHeading")}
              note={
                canPromote
                  ? t("root.schoolPage.access.teachersNote")
                  : t("root.schoolPage.access.teachersNoteReadOnly")
              }
              members={teachers}
              emptyTitle={t("root.schoolPage.teachers.emptyTitle")}
              rowActions={rowActions}
            />
          </div>
        )
      ) : tab === "invites" ? (
        <TeacherInvitesList invites={invites} hasError={invitesError} />
      ) : (
        <SchoolBlocklistTab entries={blocklist} hasError={blocklistError} />
      )}

      {promoteTarget ? (
        <PromoteTeacherDialog
          open
          onOpenChange={(next) => {
            if (!next) setPromoteTarget(null);
          }}
          memberId={promoteTarget.memberId}
          teacherName={promoteTarget.fullName}
          canDelegate={viewerIsOwner}
        />
      ) : null}

      {demoteTarget ? (
        <DemoteAdminDialog
          open
          onOpenChange={(next) => {
            if (!next) setDemoteTarget(null);
          }}
          memberId={demoteTarget.memberId}
          adminName={demoteTarget.fullName}
        />
      ) : null}

      {blockTarget ? (
        <BlockMemberDialog
          open
          onOpenChange={(next) => {
            if (!next) setBlockTarget(null);
          }}
          memberId={blockTarget.memberId}
          memberName={blockTarget.fullName}
        />
      ) : null}
    </div>
  );
}

function MemberList({
  heading,
  note,
  members,
  emptyTitle,
  rowActions,
}: {
  heading: string;
  note: string;
  members: SchoolRosterMember[];
  emptyTitle: string;
  rowActions: (member: SchoolRosterMember) => RowAction[];
}) {
  const { t } = useTranslation();

  return (
    <section className="space-y-2">
      <div>
        <h3 className="type-label text-foreground">{heading}</h3>
        <p className="mt-0.5 text-2xs text-muted-foreground">{note}</p>
      </div>

      {members.length === 0 ? (
        <Empty title={emptyTitle} />
      ) : (
        <Surface padding="none" divided>
          {members.map((member) => (
            <div key={member.memberId} className="flex items-center gap-3 px-4 py-3">
              <Avatar name={member.fullName} size="sm" tint="seeded" />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate text-sm font-medium text-foreground">
                    {member.fullName}
                  </span>
                  {member.isOwner ? (
                    <Badge variant="primary" size="xs">
                      <Crown aria-hidden="true" />
                      {t("root.schoolPage.access.badges.owner")}
                    </Badge>
                  ) : member.role === "ADMIN" && member.canManageAdmins ? (
                    <Badge variant="neutral" size="xs">
                      {t("root.schoolPage.access.badges.canManageAdmins")}
                    </Badge>
                  ) : null}
                </div>
                <p className="truncate text-xs text-muted-foreground">{member.email}</p>
              </div>

              <RowActionsMenu
                label={t("root.schoolPage.access.rowMenu", { name: member.fullName })}
                contentClassName="w-56"
                actions={rowActions(member)}
              />
            </div>
          ))}
        </Surface>
      )}
    </section>
  );
}
