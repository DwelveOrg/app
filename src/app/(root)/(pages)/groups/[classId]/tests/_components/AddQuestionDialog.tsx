"use client";

import { useMemo, useState } from "react";
import { ImageIcon, PenLine, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

import type {
  FormatBlueprint,
  QuestionTypeCatalog,
  QuestionTypeSpec,
} from "@/app/(root)/_lib/tests.schemas";
import Dialog from "@/app/(root)/_components/Dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { entriesByFamily } from "../_lib/testForm";
import { humanizeToken, translateKey } from "../_lib/labels";

type AddQuestionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalog: QuestionTypeCatalog;
  blueprint: FormatBlueprint;
  onPick: (type: string, spec: QuestionTypeSpec) => void;
};

/**
 * The tabbed question picker: one tab per catalogue `family`, filtered to what
 * this test's format allows.
 *
 * Every entry here comes from `GET /tests/formats`. There is deliberately no
 * hand-maintained list of question types in the frontend — that is exactly the
 * drift this design exists to prevent, and a preset added on the backend shows
 * up here with no frontend change at all.
 */
export default function AddQuestionDialog({
  open,
  onOpenChange,
  catalog,
  blueprint,
  onPick,
}: AddQuestionDialogProps) {
  const { t } = useTranslation();

  const families = useMemo(
    () => entriesByFamily(catalog, blueprint.allowedQuestionTypes),
    [catalog, blueprint.allowedQuestionTypes],
  );

  const [family, setFamily] = useState(families[0]?.family ?? "");
  const activeFamily = families.some((entry) => entry.family === family)
    ? family
    : (families[0]?.family ?? "");

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("root.tests.builder.picker.title")}
      description={t("root.tests.builder.picker.description")}
      contentClassName="max-w-2xl"
    >
      {families.length === 0 ? (
        <p className="rounded-xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
          {t("root.tests.builder.picker.empty")}
        </p>
      ) : (
        <Tabs value={activeFamily} onValueChange={setFamily}>
          <TabsList aria-label={t("root.tests.builder.picker.tabsLabel")}>
            {families.map(({ family: familyName, entries }) => (
              <TabsTrigger key={familyName} value={familyName}>
                {t(`root.tests.builder.families.${familyName}`, {
                  defaultValue: humanizeToken(familyName),
                })}
                <span className="text-muted-foreground">{entries.length}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {families.map(({ family: familyName, entries }) => (
            <TabsContent key={familyName} value={familyName}>
              <ul className="max-h-[min(60vh,26rem)] space-y-2 overflow-y-auto pr-1">
                {entries.map(({ type, spec }) => (
                  <li key={type}>
                    <button
                      type="button"
                      onClick={() => {
                        onPick(type, spec);
                        onOpenChange(false);
                      }}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-left transition hover:border-[color-mix(in_srgb,var(--primary)_45%,var(--border))] hover:bg-[color-mix(in_srgb,var(--primary)_6%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {translateKey(t, spec.labelKey, humanizeToken(type))}
                        </span>

                        {/* Icon + text, never a bare colour, for each trait. */}
                        <span
                          className={
                            spec.autoGradable
                              ? "inline-flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--success)_12%,transparent)] px-1.5 py-0.5 text-3xs font-medium text-success"
                              : "inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-3xs font-medium text-muted-foreground"
                          }
                        >
                          {spec.autoGradable ? (
                            <Zap className="h-2.5 w-2.5" aria-hidden="true" />
                          ) : (
                            <PenLine className="h-2.5 w-2.5" aria-hidden="true" />
                          )}
                          {spec.autoGradable
                            ? t("root.tests.builder.question.autoGraded")
                            : t("root.tests.builder.question.manualGrading")}
                        </span>

                        {spec.requiresGroupStimulus ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-3xs font-medium text-muted-foreground">
                            <ImageIcon className="h-2.5 w-2.5" aria-hidden="true" />
                            {t("root.tests.builder.picker.needsStimulus")}
                          </span>
                        ) : null}
                      </span>

                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {translateKey(
                          t,
                          spec.descriptionKey,
                          t("root.tests.builder.picker.noDescription"),
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </Dialog>
  );
}
