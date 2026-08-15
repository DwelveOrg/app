"use client";

import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/Button";
import { useDuplicateTestMutation } from "@/app/(root)/_hooks/useTests";
import { studioRoutes } from "@/app/(root)/_constants/tests";

export default function DuplicateTestButton({ testId }: { testId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const duplicate = useDuplicateTestMutation();

  const handleDuplicate = () => {
    duplicate.mutate(
      { testId },
      {
        onSuccess: (created) => {
          toast.success(t("root.tests.list.duplicate.success", { title: created.title }));
          router.push(studioRoutes.builder(created.id));
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
      loading={duplicate.isPending}
    >
      <Copy className="h-3.5 w-3.5" />
      {t("root.tests.list.actions.duplicate")}
    </Button>
  );
}
