"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Lock,
  LogOut,
  Plus,
  Save,
  Send,
  Settings2,
  SlidersHorizontal,
  Undo2,
} from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
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
  sectionStartNumber,
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
  useTestValidationQuery,
  useUnpublishTestMutation,
} from "@/app/(root)/_hooks/useTests";
import { useUnsavedChangesWarning } from "@/app/(root)/_hooks/useUnsavedChangesWarning";
import ConfirmDialog from "@/app/(root)/_components/ConfirmDialog";
import Badge from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import Surface from "@/components/ui/Surface";
import FormatMark from "@/components/tests/FormatMark";
import TestStatusBadge from "@/components/tests/TestStatusBadge";
import type { BuilderCatalog, SectionFieldName } from "../_types";
import { useAutosave } from "../_hooks/useAutosave";
import OutlineRail from "./OutlineRail";
import PartCard from "./PartCard";
import SaveState from "./SaveState";
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
  const hasFlags = flaggedIds.size > 0;

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [outlineCollapsed, setOutlineCollapsed] = useState(false);
  const [exitPromptOpen, setExitPromptOpen] = useState(false);

  /**
   * Bumped by every add, remove, and move. Question numbering is derived from
   * the live tree rather than watched, so this is what tells the tree to
   * re-derive it — without subscribing anything to keystrokes.
   */
  const [structureVersion, setStructureVersion] = useState(0);

  const saveStructure = useSaveTestStructureMutation();
  const unpublish = useUnpublishTestMutation();

  /**
   * Only subscribed while the builder is showing publish flags. It is what lets
   * a fixed row stop being ringed: the flags live in the query string, and
   * without re-asking the server after a save they stayed red until the teacher
   * navigated away by hand — which made the whole marker untrustworthy.
   */
  const validation = useTestValidationQuery({ testId: test.id, enabled: hasFlags });
  const refetchValidation = validation.refetch;

  const blueprint = catalog.formats[test.format];

  const defaultValues = useMemo(
    () => buildFormDefaults(test, catalog.questionTypes),
    [test, catalog.questionTypes],
  );

  const {
    control,
    setValue,
    getValues,
    register,
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

      /*
       * Re-derive the flags from a fresh check rather than clearing them.
       * Clearing would lose the problems the teacher has not reached yet;
       * keeping them would leave a fixed row ringed red. Asking again is the
       * only answer that stays true, and it is one request per save and only
       * while flags are actually on screen.
       */
      if (hasFlags) {
        const { data } = await refetchValidation();
        const ids = (data?.issues ?? [])
          .flatMap((issue) => [issue.questionId, issue.groupId, issue.sectionId])
          .filter((id): id is string => Boolean(id));
        // `focus` is a one-shot scroll target and is always dropped here.
        router.replace(
          ids.length > 0
            ? `${studioRoutes.builder(test.id)}?issues=${ids.join(",")}`
            : studioRoutes.builder(test.id),
          { scroll: false },
        );
      }

      return saved;
    },
    [saveStructure, test.id, catalog.questionTypes, reset, router, hasFlags, refetchValidation],
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

  /**
   * The one explicit save. The Save button, Cmd/Ctrl+S, the form's own submit,
   * and the hand-off to publishing all go through it, and it reports whether
   * the work reached the server — which is what lets "publish" mean "save, then
   * publish" instead of a confirm dialog asking the teacher to decide something
   * they have no reason to have an opinion about.
   */
  const saveNow = useCallback(async (): Promise<boolean> => {
    autosave.cancel();

    if (!(await trigger())) {
      toast.error(t("root.tests.builder.fixErrors"));
      return false;
    }

    try {
      await persist(getValues());
      autosave.markSaved();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("root.tests.errorGeneric"));
      return false;
    }
  }, [autosave, trigger, persist, getValues, t]);

  const save = useCallback(async () => {
    if (await saveNow()) toast.success(t("root.tests.builder.saved"));
  }, [saveNow, t]);

  /**
   * Held in a ref and written in an effect so the `keydown` listener can be
   * registered once instead of being torn down and rebuilt on every keystroke
   * in the document.
   */
  const saveRef = useRef<() => void>(() => {});

  useEffect(() => {
    saveRef.current = () => void save();
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
      saveRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  /**
   * The first question number of a part, counted across the whole test — IELTS
   * numbers 1–40 end to end. Read from the live form values, and recomputed
   * whenever `structureVersion` changes, which is exactly when the count of
   * rows can have changed.
   */
  const startNumberFor = useCallback(
    (sectionIndex: number) => {
      void structureVersion;
      return sectionStartNumber(getValues("sections"), sectionIndex);
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
   * A new part takes the next preset the blueprint declares, so an IELTS test
   * gains "Writing" after "Reading" rather than "Part 2".
   */
  const addSection = () => {
    const preset = blueprint?.sectionPresets[sectionFields.length];
    appendSection(
      createSectionDraft(
        preset?.kind ?? SECTION_KINDS[0],
        preset
          ? translateKey(t, preset.titleKey, humanizeToken(preset.kind))
          : t("root.tests.builder.part.newTitle", { index: sectionFields.length + 1 }),
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

  const exitHref = studioRoutes.classTests(test.classId);

  /**
   * Leaving with unsaved work opens the product's confirmation dialog rather
   * than `window.confirm`. The native prompt cannot be translated, ignores the
   * theme, and reads as a browser malfunction in the middle of an otherwise
   * finished surface.
   */
  const confirmExit = useCallback(() => {
    if (!isDirty) return true;
    setExitPromptOpen(true);
    return false;
  }, [isDirty]);

  /**
   * Publishing validates *saved* data, so unsaved edits would be reviewed
   * against a version the teacher cannot see. Rather than asking them about it,
   * the button saves and then goes — which is what "publish" meant every time.
   */
  const goToPublish = async () => {
    if (isDirty && !(await saveNow())) return;
    router.push(studioRoutes.publish(test.id));
  };

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
              onClick={() => saveRef.current()}
            >
              <Save />
              <span className="hidden sm:inline">{t("root.tests.actions.save")}</span>
            </Button>

            {isDraft ? (
              <Button type="button" size="sm" disabled={isBusy} onClick={() => void goToPublish()}>
                <Send />
                {t("root.tests.publish.action")}
              </Button>
            ) : test.status === "PUBLISHED" ? (
              <Button
                type="button"
                size="sm"
                onClick={() => router.push(studioRoutes.publish(test.id))}
              >
                <SlidersHorizontal />
                {t("root.tests.builder.deliveryRules")}
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
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
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
                <PartCard
                  key={field.uid || field.id}
                  control={control}
                  setValue={setValue}
                  getValues={getValues}
                  register={register}
                  name={`sections.${sectionIndex}` as SectionFieldName}
                  sectionIndex={sectionIndex}
                  sectionCount={sectionFields.length}
                  sectionId={field.serverId}
                  testId={test.id}
                  catalog={builderCatalog}
                  flaggedIds={flaggedIds}
                  disabled={!isDraft}
                  startNumber={startNumberFor(sectionIndex)}
                  /*
                    A one-part test has nothing to name and nowhere else to go,
                    so it renders as a bare list of questions. "General" as a
                    heading over the only list on the page is a label for a
                    distinction that does not exist yet; it appears the moment a
                    second part does, for both of them.
                  */
                  showHeader={sectionFields.length > 1}
                  onMove={handleMoveSection}
                  onRemove={handleRemoveSection}
                  onStructureChange={onStructureChange}
                />
              ))}

              {isDraft ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-center text-muted-foreground"
                  disabled={sectionFields.length >= TEST_LIMITS.sectionsPerTest}
                  onClick={addSection}
                >
                  <Plus className="size-4" />
                  {t("root.tests.builder.addPart")}
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

      {/*
        Three ways out, in the order a teacher wants them: keep the work, leave
        it behind, or stay. `tone="default"` because leaving is reversible in
        the sense that matters — the draft on the server is untouched.
      */}
      <ConfirmDialog
        open={exitPromptOpen}
        onOpenChange={setExitPromptOpen}
        icon={<LogOut />}
        tone="default"
        title={t("root.tests.builder.exit.title")}
        description={t("root.tests.builder.exit.description")}
        confirmLabel={t("root.tests.builder.exit.saveAndLeave")}
        cancelLabel={t("root.tests.actions.cancel")}
        isPending={isBusy}
        onConfirm={() => {
          void (async () => {
            if (await saveNow()) router.push(exitHref);
          })();
        }}
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={() => {
            setExitPromptOpen(false);
            router.push(exitHref);
          }}
        >
          {t("root.tests.builder.exit.discard")}
        </Button>
      </ConfirmDialog>
    </>
  );
}
