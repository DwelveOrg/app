"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Share2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import ConfirmDialog from "@/app/(root)/_components/ConfirmDialog";
import type { ApiLibraryTestSummary } from "@/app/(root)/_lib/tests.schemas";
import { useDuplicateTestMutation } from "@/app/(root)/_hooks/useTests";
import { studioRoutes } from "@/app/(root)/_constants/tests";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Field from "@/components/ui/Field";

export type AssignableClass = { id: string; name: string };

type AssignTestDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `null` while closed, so the dialog holds no stale test between openings. */
  test: ApiLibraryTestSummary | null;
  classes: AssignableClass[];
};

/**
 * Assigns a saved test to another class.
 *
 * Assigning copies: the target class gets its own independent draft, not a
 * second reference to the same paper. That is the trade for a test belonging to
 * exactly one class, and the copy explains it plainly — editing the original
 * afterwards will not change what the new class sits.
 *
 * The copy lands as a DRAFT with no availability window, so it is never live
 * the moment it is made. The teacher opens it in the studio and publishes when
 * the class is ready, which is also where the dates get set.
 */
export default function AssignTestDialog({
  open,
  onOpenChange,
  test,
  classes,
}: AssignTestDialogProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const assign = useDuplicateTestMutation();
  const [targetId, setTargetId] = useState("");

  /**
   * Every close clears the choice, so reopening on another test cannot inherit
   * the previous one. Resetting on close rather than on open keeps it out of an
   * effect: the dialog opens with the state it already holds.
   */
  const closeAndReset = (next: boolean) => {
    if (!next) setTargetId("");
    onOpenChange(next);
  };

  // The source class is excluded: "assign to the class it is already in" is the
  // plain duplicate the class list already offers, and offering it here would
  // silently make a second copy where the teacher expected a move.
  const targets = classes.filter((item) => item.id !== test?.class.id);
  const selected = targets.find((item) => item.id === targetId) ?? null;

  const handleAssign = () => {
    if (!test || !selected) return;

    assign.mutate(
      { testId: test.id, classId: selected.id },
      {
        onSuccess: (created) => {
          toast.success(
            t("root.tests.library.assign.success", {
              title: created.title,
              className: selected.name,
            }),
          );
          closeAndReset(false);
          // Straight into the copy: it is a draft that still needs publishing,
          // and leaving the teacher on the library would hide that.
          router.push(studioRoutes.builder(created.id));
          router.refresh();
        },
        onError: (error) =>
          toast.error(
            error instanceof Error
              ? error.message
              : t("root.tests.errorGeneric"),
          ),
      },
    );
  };

  const hasTargets = targets.length > 0;

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={closeAndReset}
      tone="default"
      icon={<Share2 />}
      title={t("root.tests.library.assign.title", { title: test?.title ?? "" })}
      description={
        hasTargets
          ? t("root.tests.library.assign.description")
          : t("root.tests.library.assign.noClasses")
      }
      cancelLabel={t("root.tests.actions.cancel")}
      confirmLabel={t("root.tests.library.assign.confirm")}
      isPending={assign.isPending}
      onConfirm={handleAssign}
      confirmDisabled={!hasTargets || !selected}
    >
      {hasTargets ? (
        <Field
          label={t("root.tests.library.assign.classLabel")}
          hint={t("root.tests.library.assign.hint")}
        >
          {({ id, "aria-describedby": describedBy }) => (
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger
                id={id}
                aria-describedby={describedBy}
                className="w-full"
              >
                <SelectValue
                  placeholder={t("root.tests.library.assign.classPlaceholder")}
                />
              </SelectTrigger>
              <SelectContent>
                {targets.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>
      ) : null}
    </ConfirmDialog>
  );
}
