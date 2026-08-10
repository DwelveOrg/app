"use client";

import type { Transition } from "motion/react";
import { AnimatePresence, motion } from "motion/react";
import { ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import type { IntegrityNotice } from "../_hooks/useIntegrityGuard";

/**
 * What the student is told when an integrity rule fires.
 *
 * ## Why it is a panel and not a toast
 *
 * A toast is dismissible by ignoring it, and the student has to acknowledge
 * this: the next occurrence may end their exam. It also has to survive the
 * student's attention being elsewhere — the event that triggered it is, by
 * definition, them looking at something else.
 *
 * ## Why it always says the count
 *
 * "You left the exam screen" on its own is an accusation with no stated
 * consequence, and a student who does not know whether it matters will assume
 * the worst and stop concentrating. "2 of 3" is a fact they can act on. When
 * the rule is a warning with no count, it says that too, because "nothing was
 * recorded" is the most reassuring true thing available.
 *
 * The one case with no dismiss button is the attempt actually ending: there is
 * nothing to go back to, and offering a button that returns to a closed exam
 * would be worse than saying so plainly.
 */
export default function IntegrityOverlay({
  notice,
  onDismiss,
  transition,
  reduced,
}: {
  notice: IntegrityNotice | null;
  onDismiss: () => void;
  transition: Transition;
  reduced: boolean | null;
}) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {notice ? (
        <motion.div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="integrity-title"
          className="fixed inset-0 z-50 grid place-items-center bg-[color-mix(in_srgb,var(--foreground)_45%,transparent)] p-4 backdrop-blur-sm"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
        >
          <motion.div
            className="w-full max-w-sm rounded-2xl border border-border bg-popover p-6 text-center shadow-elev-4"
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            transition={transition}
          >
            <span
              aria-hidden="true"
              className="mx-auto grid size-12 place-items-center rounded-full bg-[color-mix(in_srgb,var(--warning)_16%,transparent)] text-warning"
            >
              <ShieldAlert className="size-6" />
            </span>

            <h2 id="integrity-title" className="type-heading mt-4 text-foreground">
              {t(`exam.integrity.${notice.type}.title`)}
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              {notice.ended
                ? t("exam.integrity.ended")
                : notice.action === "COUNT" && notice.limit != null
                  ? t("exam.integrity.counted", {
                      count: notice.count,
                      limit: notice.limit,
                    })
                  : notice.action === "SUBMIT"
                    ? t("exam.integrity.willEnd")
                    : t("exam.integrity.warned")}
            </p>

            {notice.ended ? null : (
              <Button type="button" className="mt-5 w-full" onClick={onDismiss} autoFocus>
                {t("exam.integrity.resume")}
              </Button>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
