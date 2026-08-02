"use client";

import { useRouter } from "next/navigation";
import { Copy, LoaderCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/Button";
import { useDuplicateTestMutation } from "../_hooks/useDuplicateTestMutation";

/**
 * Deep-clones a test as a fresh draft and opens the copy. This is the intended
 * route for reusing last term's paper, and the only way to change a published
 * test without unpublishing it.
 */
export default function DuplicateTestButton({
  testId,
  classId,
}: {
  testId: string;
  classId: string;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const duplicate = useDuplicateTestMutation();

  const handleDuplicate = () => {
    duplicate.mutate(
      { testId },
      {
        onSuccess: (created) => {
          toast.success(t("root.tests.list.duplicate.success", { title: created.title }));
          router.push(`/groups/${classId}/tests/${created.id}`);
          router.refresh();
        },
        onError: (error) =>
          toast.error(
            error instanceof Error ? error.message : t("root.tests.errorGeneric"),
          ),
      },
    );
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleDuplicate}
      disabled={duplicate.isPending}
      aria-busy={duplicate.isPending}
    >
      {duplicate.isPending ? (
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {t("root.tests.list.actions.duplicate")}
    </Button>
  );
}
