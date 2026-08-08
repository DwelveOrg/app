"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Plus, Save, Send, Settings2, Undo2 } from "lucide-react";
import { type SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import type { ApiTestDetail, TestFormatsResponse } from "@/app/(root)/_lib/tests.schemas";
import {
  TEST_LIMITS,
  testBuilderFormSchema,
  type TestBuilderForm,
} from "@/app/(root)/_lib/tests.actions.schemas";
import {
  buildFormDefaults,
  buildStructurePayload,
  createSectionDraft,
  groupStartNumber,
} from "@/app/(root)/_lib/test-form";
import { humanizeToken, translateKey } from "@/app/(root)/_lib/test-labels";
import {
  SECTION_KINDS,
  formatIcon,
  questionAnchorId,
  studioRoutes,
} from "@/app/(root)/_constants/tests";
import {
  useSaveTestStructureMutation,
  useUnpublishTestMutation,
} from "@/app/(root)/_hooks/useTests";
import { useUnsavedChangesWarning } from "@/app/(root)/_hooks/useUnsavedChangesWarning";
import Badge from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import Surface from "@/components/ui/Surface";
import FormatMark from "@/components/tests/FormatMark";
import TestStatusBadge from "@/components/tests/TestStatusBadge";
import type { BuilderCatalog, SectionFieldName } from "../_types";
import { useAutosave } from "../_hooks/useAutosave";
import OutlineRail from "./OutlineRail";
import SaveState from "./SaveState";
import SectionCard from "./SectionCard";
import StudioTopBar from "./StudioTopBar";
import TestSettingsDialog from "./TestSettingsDialog";
import { TestStatsSummary } from "./TestStats";

type TestBuilderProps = {
  test: ApiTestDetail;
  /** The whole catalogue, loaded server-side and passed down. */
  catalog: TestFormatsResponse;
};

/**
 * The authoring surface: one `useForm`, three nested `useFieldArray` levels, and
 * one submit that issues a single `PUT /tests/:testId/structure`.
 *
 * The performance rules matter here — a 40-question IELTS test registers roughly
 * eight hundred fields:
 *
 * - `key={field.id}` from RHF, never the array index.
 * - Children get `control` plus a composed `name`; `QuestionRow` is memoised.
 * - Nothing in this component subscribes to form values. The outline and the
 *   running totals each watch inside their own component, so a keystroke
 *   re-renders one panel rather than the tree.
 * - `mode: "onSubmit"`, so typing in a passage does not revalidate everything.
 * - Saving is one request. There are no per-field mutations.
 */
export default function TestBuilder({ test, catalog }: TestBuilderProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * Publish issues arrive as a query string rather than as builder state.
   *
   * The readiness check lives in the wizard, which is a different route, so a
   * "take me to question 34" link has to survive a navigation. A query string
   * does; component state does not. It also means the link is shareable — a
   * teacher can send a colleague straight to the three rows that need fixing.
   */
  const flaggedIds = useMemo<ReadonlySet<string>>(() => {
    const raw = searchParams.get("issues");
    return new Set(raw ? raw.split(",").filter(Boolean) : []);
  }, [searchParams]);

  const focusId = searchParams.get("focus");

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [outlineCollapsed, setOutlineCollapsed] = useState(false);

  /**
   * Bumped by every add, remove, and move. Question numbering is derived from
   * the live tree rather than watched, so this is what tells the tree to
   * re-derive it — without subscribing anything to keystrokes.
   */
  const [structureVersion, setStructureVersion] = useState(0);

  const saveStructure = useSaveTestStructureMutation();
  const unpublish = useUnpublishTestMutation();

  const blueprint = catalog.formats[test.format];

  const defaultValues = useMemo(
    () => buildFormDefaults(test, catalog.questionTypes),
    [test, catalog.questionTypes],
  );

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    watch,
    trigger,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm<TestBuilderForm>({
    resolver: zodResolver(testBuilderFormSchema),
    mode: "onSubmit",
    defaultValues,
  });

  const {
    fields: sectionFields,
    append: appendSection,
    move: moveSection,
    remove: removeSection,
  } = useFieldArray({ control, name: "sections" });

  const isDraft = test.status === "DRAFT";
  const isBusy = isSubmitting || saveStructure.isPending;

  useUnsavedChangesWarning(isDirty);

  const onStructureChange = useCallback(() => {
    setStructureVersion((version) => version + 1);
  }, []);

  /** The one save path. Both the button and autosave go through it. */
  const persist = useCallback(
    async (values: TestBuilderForm) => {
      const { test: saved } = await saveStructure.mutateAsync({
        testId: test.id,
        sections: buildStructurePayload(values, catalog.questionTypes),
      });
      // Re-seed from the server so newly created rows carry their ids and the
      // next save updates them instead of recreating them.
      reset(buildFormDefaults(saved, catalog.questionTypes));
      setStructureVersion((version) => version + 1);
      router.refresh();
      return saved;
    },
    [saveStructure, test.id, catalog.questionTypes, reset, router],
  );

  /**
   * Autosave validates first and gives up quietly when the form is not
   * publishable-shaped — a half-typed option has no text, and the backend
   * rejects a blank option outright.
   */
  const autosave = useAutosave({
    watch,
    enabled: isDraft && !isBusy,
    save: useCallback(async () => {
      if (!(await trigger())) return false;
      try {
        await persist(getValues());
        return true;
      } catch {
        // Silent: a network blip during an idle autosave is not the teacher's
        // problem to act on, and the explicit save reports properly.
        return false;
      }
    }, [trigger, persist, getValues]),
  });

  const onSubmit: SubmitHandler<TestBuilderForm> = async (values) => {
    autosave.cancel();
    try {
      await persist(values);
      autosave.markSaved();
      toast.success(t("root.tests.builder.saved"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("root.tests.errorGeneric"),
      );
    }
  };

  /**
   * The current submit, for the keyboard shortcut. Held in a ref and written in
   * an effect so the `keydown` listener can be registered once instead of being
   * torn down and rebuilt on every keystroke in the document.
   */
  const submitRef = useRef<() => void>(() => {});

  useEffect(() => {
    submitRef.current = () =>
      void handleSubmit(onSubmit, () =>
        toast.error(t("root.tests.builder.fixErrors")),
      )();
  });

  /** Scrolls a deep link from the publish wizard into view once the tree is up. */
  useEffect(() => {
    if (!focusId) return;
    const element = document.getElementById(questionAnchorId(focusId));
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.focus({ preventScroll: true });
  }, [focusId]);

  /** Cmd/Ctrl+S. A long-form document editor that ignores it feels broken. */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "s") return;
      event.preventDefault();
      submitRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  /**
   * The first question number of a group, counted across the whole test —
   * IELTS numbers 1–40 end to end. Read from the live form values, and
   * recomputed whenever `structureVersion` changes, which is exactly when the
   * count of rows can have changed.
   */
  const startNumberFor = useCallback(
    (sectionIndex: number, groupIndex: number) => {
      void structureVersion;
      return groupStartNumber(getValues("sections"), sectionIndex, groupIndex);
    },
    [getValues, structureVersion],
  );

  const builderCatalog: BuilderCatalog | null = useMemo(
    () => (blueprint ? { questionTypes: catalog.questionTypes, blueprint } : null),
    [blueprint, catalog.questionTypes],
  );

  const handleMoveSection = useCallback(
    (from: number, to: number) => {
      moveSection(from, to);
      onStructureChange();
    },
    [moveSection, onStructureChange],
  );

  const handleRemoveSection = useCallback(
    (index: number) => {
      removeSection(index);
      onStructureChange();
    },
    [removeSection, onStructureChange],
  );

  /**
   * A new section takes the next preset the blueprint declares, so an IELTS
   * test gains "Writing" after "Reading" rather than "Section 2".
   */
  const addSection = () => {
    const preset = blueprint?.sectionPresets[sectionFields.length];
    appendSection(
      createSectionDraft(
        preset?.kind ?? SECTION_KINDS[0],
        preset
          ? translateKey(t, preset.titleKey, humanizeToken(preset.kind))
          : t("root.tests.builder.section.newTitle", { index: sectionFields.length + 1 }),
      ),
    );
    onStructureChange();
  };

  const handleUnpublish = () => {
    unpublish.mutate(
      { testId: test.id },
      {
        onSuccess: () => {
          toast.success(t("root.tests.builder.unpublished"));
          router.refresh();
        },
        onError: (error) =>
          toast.error(
            error instanceof Error ? error.message : t("root.tests.errorGeneric"),
          ),
      },
    );
  };

  const confirmExit = useCallback(() => {
    if (!isDirty) return true;
    return window.confirm(t("root.tests.builder.confirmExit"));
  }, [isDirty, t]);

  const exitHref = studioRoutes.classTests(test.classId);

  return (
    <>
      <StudioTopBar
        exitHref={exitHref}
        exitLabel={t("root.tests.builder.backToTests")}
        onExit={confirmExit}
        identity={
          <>
            <FormatMark icon={formatIcon(test.format)} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {test.title}
              </p>
              <TestStatsSummary control={control} />
            </div>
          </>
        }
        status={
          <>
            <TestStatusBadge status={test.status} />
            <Badge variant="outline">
              {translateKey(t, blueprint?.labelKey, humanizeToken(test.format))}
            </Badge>
            <SaveState
              state={autosave.state}
              savedAt={autosave.savedAt}
              isDirty={isDirty}
            />
          </>
        }
        actions={
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings2 />
              <span className="hidden sm:inline">
                {t("root.tests.builder.settings")}
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={isBusy}
              disabled={!isDraft}
              onClick={() => submitRef.current()}
            >
              <Save />
              <span className="hidden sm:inline">{t("root.tests.actions.save")}</span>
            </Button>

            {isDraft ? (
              <Button asChild size="sm">
                <Link
                  href={studioRoutes.publish(test.id)}
                  onClick={(event) => {
                    // Publish validates saved data, so unsaved edits would be
                    // reviewed against a version the teacher cannot see.
                    if (isDirty && !window.confirm(t("root.tests.builder.saveBeforePublish"))) {
                      event.preventDefault();
                    }
                  }}
                >
                  <Send />
                  {t("root.tests.publish.action")}
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      {builderCatalog ? (
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <OutlineRail
            control={control}
            catalog={catalog.questionTypes}
            flaggedIds={flaggedIds}
            collapsed={outlineCollapsed}
            onToggle={() => setOutlineCollapsed((collapsed) => !collapsed)}
          />

          <form
            className="min-h-0 min-w-0 flex-1 overflow-y-auto"
            onSubmit={handleSubmit(onSubmit, () =>
              toast.error(t("root.tests.builder.fixErrors")),
            )}
            noValidate
          >
            <div className="mx-auto w-full max-w-[900px] space-y-5 px-4 py-6 md:px-8">
              {isDraft ? null : (
                <Surface
                  variant="muted"
                  padding="none"
                  radius="lg"
                  elevation={0}
                  className="flex flex-wrap items-center gap-3 border-[color-mix(in_srgb,var(--warning)_40%,transparent)] bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] px-4 py-3"
                >
                  {/* Icon plus text: the state is never carried by the amber wash alone. */}
                  <Lock className="size-4 shrink-0 text-warning" aria-hidden="true" />
                  <p className="min-w-0 flex-1 text-sm text-foreground">
                    {test.status === "PUBLISHED"
                      ? t("root.tests.builder.publishedLock")
                      : t("root.tests.builder.archivedLock")}
                  </p>
                  {test.status === "PUBLISHED" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleUnpublish}
                      loading={unpublish.isPending}
                    >
                      <Undo2 className="size-3.5" />
                      {t("root.tests.builder.unpublish")}
                    </Button>
                  ) : null}
                </Surface>
              )}

              {sectionFields.map((field, sectionIndex) => (
                <SectionCard
                  key={field.id}
                  control={control}
                  setValue={setValue}
                  getValues={getValues}
                  name={`sections.${sectionIndex}` as SectionFieldName}
                  sectionIndex={sectionIndex}
                  sectionCount={sectionFields.length}
                  sectionId={field.serverId}
                  testId={test.id}
                  catalog={builderCatalog}
                  flaggedIds={flaggedIds}
                  disabled={!isDraft}
                  startNumberFor={(groupIndex) =>
                    startNumberFor(sectionIndex, groupIndex)
                  }
                  onMove={handleMoveSection}
                  onRemove={handleRemoveSection}
                  onStructureChange={onStructureChange}
                />
              ))}

              {isDraft && !builderCatalog.blueprint.hidesStructure ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center border-dashed"
                  disabled={sectionFields.length >= TEST_LIMITS.sectionsPerTest}
                  onClick={addSection}
                >
                  <Plus className="size-4" />
                  {t("root.tests.builder.addSection")}
                </Button>
              ) : null}
            </div>
          </form>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center p-8">
          <Surface className="max-w-md text-center">
            <p className="type-heading text-foreground">
              {t("root.tests.builder.noBlueprintTitle")}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("root.tests.builder.noBlueprintDescription", {
                format: humanizeToken(test.format),
              })}
            </p>
            <Button asChild className="mt-4">
              <Link href={exitHref}>{t("root.tests.builder.backToTests")}</Link>
            </Button>
          </Surface>
        </div>
      )}

      <TestSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        test={test}
      />
    </>
  );
}
