"use client";

import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { ImageIcon, PenLine, Plus, Search, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

import type {
  FormatBlueprint,
  QuestionTypeCatalog,
  QuestionTypeSpec,
} from "@/app/(root)/_lib/tests.schemas";
import Dialog from "@/app/(root)/_components/Dialog";
import Badge from "@/components/ui/badge";
import Input from "@/components/ui/Input";
import TabBar from "@/components/ui/TabBar";
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
 * The tabbed question picker: one tab per catalogue `family`, plus a search box across all of them.
 *
 * Every entry here comes from `GET /tests/formats`. There is deliberately no hand-maintained list
 * of question types in the frontend — that is exactly the drift this design exists to prevent, and
 * a preset added on the backend shows up here with no frontend change at all. Since every format
 * now returns the complete catalogue, all three tabs are available in every test.
 *
 * The catalogue is around twenty-six presets across three families, which is past the size where
 * tabbing to the right one beats typing two letters of its name — hence the filter. It searches
 * the *translated* label, because a teacher working in Russian is looking for the Russian word.
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
  const [query, setQuery] = useState("");
  // Typing filters ~26 rows; deferring keeps the field itself responsive on modest hardware.
  const deferredQuery = useDeferredValue(query);
  const search = deferredQuery.trim().toLocaleLowerCase();

  const activeFamily = families.some((entry) => entry.family === family)
    ? family
    : (families[0]?.family ?? "");

  const label = useCallback(
    (type: string, spec: QuestionTypeSpec) =>
      translateKey(t, spec.labelKey, humanizeToken(type)),
    [t],
  );

  const description = useCallback(
    (spec: QuestionTypeSpec) =>
      translateKey(t, spec.descriptionKey, t("root.tests.builder.picker.noDescription")),
    [t],
  );

  /**
   * Searching spans every family — a teacher who knows they want "True / False / Not Given" should
   * not have to know it lives on the IELTS tab. With no query, the active tab decides.
   */
  const visible = useMemo(() => {
    if (search) {
      return families
        .flatMap((entry) => entry.entries)
        .filter(({ type, spec }) =>
          `${label(type, spec)} ${description(spec)} ${humanizeToken(type)}`
            .toLocaleLowerCase()
            .includes(search),
        );
    }
    return families.find((entry) => entry.family === activeFamily)?.entries ?? [];
  }, [families, search, activeFamily, label, description]);

  const pick = (type: string, spec: QuestionTypeSpec) => {
    onPick(type, spec);
    onOpenChange(false);
    setQuery("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setQuery("");
      }}
      title={t("root.tests.builder.picker.title")}
      description={t("root.tests.builder.picker.description")}
      showClose
      closeLabel={t("root.tests.actions.cancel")}
      contentClassName="max-w-2xl"
    >
      {families.length === 0 ? (
        <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          {t("root.tests.builder.picker.empty")}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("root.tests.builder.picker.searchPlaceholder")}
              aria-label={t("root.tests.builder.picker.searchLabel")}
              className="pl-9"
            />
          </div>

          {/*
            The tabs stay mounted while a search is active but stop deciding what is listed —
            hiding them would make the dialog jump, and disabling them would suggest the tab is
            unavailable rather than simply overridden.
          */}
          <TabBar
            variant="pill"
            layoutId="question-family-tabs"
            ariaLabel={t("root.tests.builder.picker.tabsLabel")}
            value={search ? "" : activeFamily}
            onSelect={(next) => {
              setQuery("");
              setFamily(next);
            }}
            items={families.map(({ family: familyName, entries }) => ({
              value: familyName,
              label: t(`root.tests.builder.families.${familyName}`, {
                defaultValue: humanizeToken(familyName),
              }),
              count: entries.length,
              showZeroCount: true,
            }))}
          />

          {visible.length === 0 ? (
            <p className="px-1 py-8 text-center text-sm text-muted-foreground">
              {t("root.tests.builder.picker.noMatches", { query: query.trim() })}
            </p>
          ) : (
            <ul className="-mx-2 max-h-[min(55vh,24rem)] divide-y divide-border overflow-y-auto">
              {visible.map(({ type, spec }) => (
                <li key={type}>
                  <button
                    type="button"
                    onClick={() => pick(type, spec)}
                    className="group interactive-flat flex w-full cursor-pointer items-start gap-3 rounded-lg px-2 py-3 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {label(type, spec)}
                        </span>

                        {/* Icon + words for every trait, never a bare colour. */}
                        {spec.autoGradable ? (
                          <Badge variant="success" size="xs">
                            <Zap aria-hidden="true" />
                            {t("root.tests.builder.question.autoGraded")}
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="xs">
                            <PenLine aria-hidden="true" />
                            {t("root.tests.builder.question.manualGrading")}
                          </Badge>
                        )}

                        {spec.requiresGroupStimulus ? (
                          <Badge variant="neutral" size="xs">
                            <ImageIcon aria-hidden="true" />
                            {t("root.tests.builder.picker.needsStimulus")}
                          </Badge>
                        ) : null}
                      </span>

                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {description(spec)}
                      </span>
                    </span>

                    {/*
                      The affordance appears on hover and focus, so a 26-row list is not 26
                      competing plus signs — but it is `opacity`, not `hidden`, so it is present
                      for a keyboard user the moment the row takes focus.
                    */}
                    <span
                      aria-hidden="true"
                      className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--primary)_13%,transparent)] text-primary opacity-0 transition-opacity duration-[var(--dur-1)] group-hover:opacity-100 group-focus-visible:opacity-100"
                    >
                      <Plus className="size-3.5" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Dialog>
  );
}
