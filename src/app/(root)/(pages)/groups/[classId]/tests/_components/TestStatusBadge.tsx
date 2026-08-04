"use client";

import { Archive, FileEdit, Send } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { TestStatus } from "@/app/(root)/_lib/tests.schemas";
import Badge from "@/components/ui/badge";
import { TEST_STATUS_TONE } from "../_constants";

const STATUS_ICON = {
  DRAFT: FileEdit,
  PUBLISHED: Send,
  ARCHIVED: Archive,
} as const;

/**
 * A test's lifecycle state. Icon plus text carry the meaning; the tint only reinforces it, so the
 * badge still reads when colour is unavailable.
 */
export default function TestStatusBadge({
  status,
  className,
}: {
  status: TestStatus;
  className?: string;
}) {
  const { t } = useTranslation();
  const Icon = STATUS_ICON[status];

  return (
    <Badge variant={TEST_STATUS_TONE[status]} size="sm" className={className}>
      <Icon aria-hidden="true" />
      {t(`root.tests.status.${status}`)}
    </Badge>
  );
}
