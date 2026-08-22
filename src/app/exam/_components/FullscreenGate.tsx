"use client";

import { useState } from "react";
import { Maximize, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/Button";

/**
 * Recovery boundary for a required-fullscreen attempt.
 *
 * Starting from the cover enters fullscreen before navigation. A refresh,
 * restored tab, or browser-initiated exit cannot preserve it, so this modal
 * pauses access to the paper until a fresh user gesture requests fullscreen.
 * If that trusted request is still rejected, the browser capability fallback
 * becomes explicit rather than trapping the student behind an impossible rule.
 */
export default function FullscreenGate({
  open,
  unavailable,
  onEnter,
  onContinue,
}: {
  open: boolean;
  unavailable: boolean;
  onEnter: () => Promise<boolean>;
  onContinue: () => void;
}) {
  const { t } = useTranslation();
  const [pending, setPending] = useState(false);

  const enter = async () => {
    setPending(true);
    await onEnter();
    setPending(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={() => undefined}>
      <AlertDialogContent
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <AlertDialogHeader>
          <AlertDialogMedia
            className={
              unavailable
                ? "bg-[color-mix(in_srgb,var(--warning)_16%,transparent)] text-warning"
                : undefined
            }
          >
            {unavailable ? <TriangleAlert /> : <Maximize />}
          </AlertDialogMedia>
          <AlertDialogTitle>{t("exam.integrity.fullscreenRequired.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              unavailable
                ? "exam.integrity.fullscreenRequired.unavailable"
                : "exam.integrity.fullscreenRequired.description",
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {unavailable ? (
            <Button type="button" variant="outline" onClick={onContinue}>
              {t("exam.integrity.fullscreenRequired.continue")}
            </Button>
          ) : null}
          <Button type="button" loading={pending} onClick={() => void enter()} autoFocus>
            <Maximize />
            {t("exam.integrity.fullscreenRequired.action")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
