"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ListChecks, Plus, Save, Send, Settings2, Target, Undo2 } from "lucide-react";
import { type SubmitErrorHandler, type SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import type { ApiTestDetail, TestFormatsResponse } from "@/app/(root)/_lib/tests.schemas";
import {
  TEST_LIMITS,
  testBuilderFormSchema,
  type TestBuilderForm,
} from "@/app/(root)/_lib/tests.actions.schemas";
import { Button } from "@/components/ui/Button";
import Empty from "@/app/(root)/(pages)/_components/ui/Empty";
import type { BuilderCatalog, SectionFieldName } from "../_types";
import { SECTION_KINDS } from "../_constants";
import {
  buildFormDefaults,
  buildStructurePayload,
  countPoints,
  countQuestions,
  createSectionDraft,
  groupStartNumber,
} from "../_lib/testForm";
import { humanizeToken, translateKey } from "../_lib/labels";
import { useUnsavedChangesWarning } from "@/app/(root)/_hooks/useUnsavedChangesWarning";
import { useSaveTestStructureMutation } from "../_hooks/useSaveTestStructureMutation";
import { useUnpublishTestMutation } from "../_hooks/usePublishTestMutation";
import DeleteTestDialog from "./DeleteTestDialog";
import DuplicateTestButton from "./DuplicateTestButton";
import PublishDialog from "./PublishDialog";
import SectionCard from "./SectionCard";
import TestSettingsDialog from "./TestSettingsDialog";
import TestStatusBadge from "./TestStatusBadge";
import Badge from "@/components/ui/badge";

type TestBuilderProps = {
  test: ApiTestDetail;
  classId: string;
  /** The whole catalogue, loaded server-side and passed down. */
  catalog: TestFormatsResponse;
};

/**
 * The authoring surface: one `useForm`, three nested `useFieldArray` levels, and
 * one submit that issues a single `PUT /tests/:testId/structure`.
 *
 * The performance rules matter here — a 40-question IELTS test registers roughly
 * 800 fields:
 *
 * - `key={field.id}` from RHF, never the array index.
 * - Children get `control` plus a composed `name`; `QuestionCard` is memoised.
 * - `useWatch` is always narrowed to one row. There is no bare `watch()`.
 * - `mode: "onSubmit"`, so typing in a passage does not revalidate 800 fields.
 * - Saving is one request. There are no per-field mutations.
 */
export default function TestBuilder({ test, classId, catalog }: TestBuilderProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const [publishOpen, setPublishOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());

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
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm<TestBuilderForm>({
    resolver: zodResolver(testBuilderFormSchema),
    mode: "onSubmit",
    defaultValues,
  });

  // A forty-question test is a long authoring session; without this, reload or
  // tab-close discarded it silently. See the hook for what this does not cover.
  useUnsavedChangesWarning(isDirty);

  const {
    fields: sectionFields,
    append: appendSection,
    move: moveSection,
    remove: removeSection,
  } = useFieldArray({ control, name: "sections" });

  const onStructureChange = useCallback(() => {
    setStructureVersion((version) => version + 1);
  }, []);

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

  const handleIssuesChange = useCallback((ids: string[]) => {
    setFlaggedIds(new Set(ids));
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

  const isDraft = test.status === "DRAFT";
  const isBusy = isSubmitting || saveStructure.isPending;

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
          : t("root.tests.builder.section.newTitle", {
              index: sectionFields.length + 1,
            }),
      ),
    );
    onStructureChange();
  };

  const onSubmit: SubmitHandler<TestBuilderForm> = (values) => {
    saveStructure.mutate(
      {
        testId: test.id,
        sections: buildStructurePayload(values, catalog.questionTypes),
      },
      {
        onSuccess: ({ test: saved }) => {
          toast.success(t("root.tests.builder.saved"));
          // Re-seed from the server so newly created rows carry their ids and
          // the next save updates them instead of recreating them.
          reset(buildFormDefaults(saved, catalog.questionTypes));
          onStructureChange();
          router.refresh();
        },
        onError: (error) =>
          toast.error(
            error instanceof Error ? error.message : t("root.tests.errorGeneric"),
          ),
      },
    );
  };

  const onInvalid: SubmitErrorHandler<TestBuilderForm> = () => {
    toast.error(t("root.tests.builder.fixErrors"));
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

  if (!builderCatalog) {
    return (
      <section className="flex flex-col gap-6 py-6">
        <BackLink classId={classId} />
        <Empty
          title={t("root.tests.builder.noBlueprintTitle")}
          description={t("root.tests.builder.noBlueprintDescription", {
            format: humanizeToken(test.format),
          })}
          action={
            <Button asChild className="w-full">
              <Link href={`/groups/${classId}/tests`}>
                {t("root.tests.builder.backToTests")}
              </Link>
            </Button>
          }
        />
      </section>
    );
  }

  // Read, not watched. These refresh when the tree gains or loses rows, which
  // is what they are for; subscribing them to every keystroke to keep the
  // points total live would re-render all 800 fields on each one. The backend
  // recomputes `totalPoints` on save and on publish regardless.
  const questionCount = countQuestions(getValues());
  const totalPoints = countPoints(getValues());

  return (
    <form
      className="flex flex-col gap-6 py-6"
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      noValidate
    >
      <BackLink classId={classId} />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="type-section text-foreground">
              {test.title}
            </h1>
            <TestStatusBadge status={test.status} />
            <Badge variant="outline">
              {translateKey(t, blueprint?.labelKey, humanizeToken(test.format))}
            </Badge>
          </div>

          <dl className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <dt className="inline-flex items-center gap-1">
                <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sr-only">{t("root.tests.list.meta.questions")}</span>
              </dt>
              <dd className="font-medium text-foreground">
                {t("root.tests.list.meta.questionCount", { count: questionCount })}
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="inline-flex items-center gap-1">
                <Target className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sr-only">{t("root.tests.list.meta.points")}</span>
              </dt>
              <dd className="font-medium text-foreground">
                {t("root.tests.list.meta.pointCount", { count: totalPoints })}
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={() => setSettingsOpen(true)}>
            <Settings2 className="h-4 w-4" />
            {t("root.tests.builder.settings")}
          </Button>
          <DuplicateTestButton testId={test.id} classId={classId} />
        </div>
      </header>

      {isDraft ? null : (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--warning)_40%,transparent)] bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] px-4 py-3">
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
              <Undo2 className="h-3.5 w-3.5" />
              {t("root.tests.builder.unpublish")}
            </Button>
          ) : null}
        </div>
      )}

      <div className="space-y-4">
        {sectionFields.map((field, sectionIndex) => (
          <SectionCard
            key={field.id}
            control={control}
            setValue={setValue}
            name={`sections.${sectionIndex}` as SectionFieldName}
            sectionIndex={sectionIndex}
            count={sectionFields.length}
            sectionId={field.serverId}
            testId={test.id}
            catalog={builderCatalog}
            flaggedIds={flaggedIds}
            disabled={!isDraft}
            startNumberFor={(groupIndex) => startNumberFor(sectionIndex, groupIndex)}
            onMove={handleMoveSection}
            onRemove={handleRemoveSection}
            onStructureChange={onStructureChange}
          />
        ))}
      </div>

      {isDraft && !builderCatalog.blueprint.hidesStructure ? (
        <Button
          type="button"
          variant="outline"
          className="w-fit"
          disabled={sectionFields.length >= TEST_LIMITS.sectionsPerTest}
          onClick={addSection}
        >
          <Plus className="h-4 w-4" />
          {t("root.tests.builder.addSection")}
        </Button>
      ) : null}

      {/* Sticky action bar: save is one request, publish opens the checklist. */}
      <div className="sticky bottom-4 z-30 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-[color-mix(in_srgb,var(--card)_92%,transparent)] px-4 py-3 shadow-elev-3 backdrop-blur">
        <p className="min-w-0 flex-1 text-xs text-muted-foreground">
          {isDirty
            ? t("root.tests.builder.unsavedChanges")
            : t("root.tests.builder.allSaved")}
        </p>

        <Button type="submit" loading={isBusy} disabled={!isDraft}>
          <Save className="h-4 w-4" />
          {t("root.tests.actions.save")}
        </Button>

        {isDraft ? (
          <Button type="button" variant="outline" onClick={() => setPublishOpen(true)}>
            <Send className="h-4 w-4" />
            {t("root.tests.publish.action")}
          </Button>
        ) : null}

        <Button
          type="button"
          variant="ghost"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => setDeleteOpen(true)}
        >
          {isDraft ? t("root.tests.list.actions.delete") : t("root.tests.list.actions.archive")}
        </Button>
      </div>

      <PublishDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        testId={test.id}
        title={test.title}
        hasUnsavedChanges={isDirty}
        onIssuesChange={handleIssuesChange}
        onPublished={() => router.refresh()}
      />

      <TestSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        test={test}
      />

      <DeleteTestDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        testId={test.id}
        title={test.title}
        status={test.status}
        redirectOnSuccess={`/groups/${classId}/tests`}
      />
    </form>
  );
}

function BackLink({ classId }: { classId: string }) {
  const { t } = useTranslation();

  return (
    <Link
      href={`/groups/${classId}/tests`}
      className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      {t("root.tests.builder.backToTests")}
    </Link>
  );
}
