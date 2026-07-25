"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import type { SchoolRole } from "@/app/(authentication)/_types/auth";
import Empty from "../Empty";
import JoinSchoolDialog from "./JoinSchoolDialog";

type RoleEmptyStateProps = {
  role?: SchoolRole | null;
  entity: "class" | "school";
};

const CTA_CLASS =
  "h-11 w-full cursor-pointer rounded-xl bg-[var(--primary)] px-5 text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]";

export default function RoleEmptyState({ role, entity }: RoleEmptyStateProps) {
  const { t } = useTranslation();

  const canCreate = role === "ADMIN";

  // Admin without a school: offer to create one.
  if (entity === "school" && canCreate) {
    return (
      <Empty
        action={
          <Button asChild size="lg" className={CTA_CLASS}>
            <Link href="/schools/new">{t("root.empty.actions.createSchool")}</Link>
          </Button>
        }
      />
    );
  }

  // Any non-admin (a fresh account or a student) reaching a school/class empty
  // state has no membership yet — the one real next step is to join a school
  // with a code, so surface the working join dialog instead of a dead-end
  // "Join class" button that can never be enabled here.
  if (!canCreate) {
    return (
      <Empty
        title={t("root.empty.join.title")}
        description={t("root.empty.join.description")}
        action={
          <JoinSchoolDialog
            trigger={
              <Button type="button" size="lg" className={CTA_CLASS}>
                {t("root.empty.actions.joinSchool")}
              </Button>
            }
          />
        }
      />
    );
  }

  // Admin + class entity (rare — admins normally create classes from the
  // Classes page): keep the create affordance.
  return (
    <Empty
      action={
        <Button type="button" size="lg" disabled className={CTA_CLASS}>
          {t("root.empty.actions.createClass")}
        </Button>
      }
    />
  );
}
