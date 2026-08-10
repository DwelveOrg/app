"use client";

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Surface from "@/components/ui/Surface";

export type AdvancedGroupId = "during" | "integrity" | "results";

/**
 * The eighteen settings a mode already answered, available but not in the way.
 *
 * They used to be three of five wizard steps, which meant every teacher
 * publishing a ten-question quiz clicked through all of them to reach a Publish
 * button. Behind a disclosure they cost nothing to skip and one press to open,
 * and — this is the part a wizard could not do — the teacher can open exactly
 * the one they came for instead of walking past the other two.
 *
 * `type="multiple"` because these are independent groups, not steps: someone
 * tuning a proctored final wants integrity and results open at the same time,
 * and an accordion that closes one to open another would hide the thing they
 * were comparing against.
 */
export default function AdvancedSettings({
  groups,
  value,
  onValueChange,
}: {
  groups: { id: AdvancedGroupId; summary: string; children: ReactNode }[];
  /** Controlled so a failed publish can open the group that holds the problem. */
  value: AdvancedGroupId[];
  onValueChange: (value: AdvancedGroupId[]) => void;
}) {
  const { t } = useTranslation();

  return (
    // `elevation={0}` to match the panels above it: two adjacent surfaces at
    // different levels means one of them is wrong (design-system §4).
    <Surface padding="none" elevation={0} className="px-4 sm:px-5">
      <Accordion
        type="multiple"
        value={value}
        onValueChange={(next) => onValueChange(next as AdvancedGroupId[])}
      >
        {groups.map(({ id, summary, children }) => (
          <AccordionItem key={id} value={id} className="last:border-b-0">
            <AccordionTrigger className="py-4 text-sm">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">
                  {t(`root.tests.publish.advanced.${id}`)}
                </span>
                {/*
                  The summary is the current setting read back, not a static
                  blurb: a closed group has to say whether anything inside it is
                  switched on, or the disclosure hides state rather than detail.
                */}
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                  {summary}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-5 text-foreground">{children}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Surface>
  );
}
