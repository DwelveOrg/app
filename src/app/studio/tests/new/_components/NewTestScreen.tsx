"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock3, Layers, ListChecks } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import type { TestFormatsResponse } from "@/app/(root)/_lib/tests.schemas";
import { TEST_LIMITS } from "@/app/(root)/_lib/tests.actions.schemas";
import { formatIcon, studioRoutes } from "@/app/(root)/_constants/tests";
import { humanizeToken, translateKey } from "@/app/(root)/_lib/test-labels";
import { useCreateTestMutation } from "@/app/(root)/_hooks/useTests";
import Badge from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Surface from "@/components/ui/Surface";
import FormatMark from "@/components/tests/FormatMark";
import { cn } from "@/lib/utils";
import StudioTopBar from "../../../_components/StudioTopBar";

/**
 * Creating a test: one screen, not a dialog and not a wizard.
 *
 * The previous flow was a dialog on the class list with a title field and four
 * format cards. Two things were wrong with it. The format decides the section
 * layout the test starts with and the default duration, and the cards said none
 * of that — "IELTS" as a label is only meaningful to someone who already knows
 * what the blueprint will build. And a dialog is a small box for a decision the
 * teacher makes once per test and cannot change afterwards.
 *
 * So the picker shows what each format *produces*: the sections it creates, in
 * order, with their durations. The right-hand panel is a live preview of the
 * paper the teacher is about to get. Everything renders from the backend
 * blueprint registry, so a format added server-side appears here with no
 * frontend change.
 */
export default function NewTestScreen({
  classId,
  className,
  catalog,
}: {
  classId: string;
  className: string | null;
  catalog: TestFormatsResponse;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const createTest = useCreateTestMutation();

  const formats = useMemo(() => Object.entries(catalog.formats), [catalog.formats]);

  const [format, setFormat] = useState(() => formats[0]?.[0] ?? "SIMPLE_QUIZ");
  const [title, setTitle] = useState("");
  const [touched, setTouched] = useState(false);

  const blueprint = catalog.formats[format];
  const trimmedTitle = title.trim();
  const titleError = touched && !trimmedTitle;

  const submit = () => {
    setTouched(true);
    if (!trimmedTitle) return;

    createTest.mutate(
      { classId, title: trimmedTitle, format },
      {
        onSuccess: ({ id }) => router.replace(studioRoutes.builder(id)),
        onError: (error) =>
          toast.error(
            error instanceof Error ? error.message : t("root.tests.errorGeneric"),
          ),
      },
    );
  };

  return (
    <>
      <StudioTopBar
        exitHref={studioRoutes.classTests(classId)}
        exitLabel={t("root.tests.create.cancel")}
        identity={
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {t("root.tests.create.title")}
            </p>
            {className ? (
              <p className="truncate text-2xs text-muted-foreground">{className}</p>
            ) : null}
          </div>
        }
        actions={
          <Button
            type="button"
            size="sm"
            onClick={submit}
            loading={createTest.isPending}
          >
            {t("root.tests.create.submit")}
            <ArrowRight />
          </Button>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <form
          className="mx-auto grid w-full max-w-[1100px] gap-6 px-4 py-8 md:px-8 lg:grid-cols-[1fr_20rem]"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <div className="min-w-0 space-y-6">
            <div>
              <h1 className="type-title text-foreground">
                {t("root.tests.create.heading")}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("root.tests.create.subheading")}
              </p>
            </div>

            <Field
              label={t("root.tests.create.nameLabel")}
              hint={t("root.tests.create.nameHint")}
              error={titleError ? t("root.tests.create.nameRequired") : undefined}
              required
            >
              {({ id }) => (
                <Input
                  id={id}
                  value={title}
                  autoFocus
                  maxLength={TEST_LIMITS.titleChars}
                  aria-invalid={titleError || undefined}
                  placeholder={t("root.tests.create.namePlaceholder")}
                  onChange={(event) => setTitle(event.target.value)}
                  onBlur={() => setTouched(true)}
                />
              )}
            </Field>

            <fieldset>
              <legend className="type-label mb-2 text-foreground">
                {t("root.tests.create.formatLabel")}
              </legend>

              <div
                role="radiogroup"
                aria-label={t("root.tests.create.formatLabel")}
                className="grid gap-2 sm:grid-cols-2"
              >
                {formats.map(([value, entry]) => {
                  const selected = value === format;

                  return (
                    <label
                      key={value}
                      className={cn(
                        "interactive-flat relative flex cursor-pointer gap-3 rounded-xl border p-3 outline-none",
                        "focus-within:ring-2 focus-within:ring-ring/40",
                        selected
                          ? "border-primary/45 bg-accent"
                          : "border-border bg-card hover:border-primary/25 hover:bg-muted",
                      )}
                    >
                      <input
                        type="radio"
                        name="format"
                        value={value}
                        checked={selected}
                        onChange={() => setFormat(value)}
                        className="sr-only"
                      />

                      <FormatMark icon={formatIcon(value)} size="sm" />

                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "type-label block",
                            selected ? "text-accent-foreground" : "text-foreground",
                          )}
                        >
                          {translateKey(t, entry.labelKey, humanizeToken(value))}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {t(`root.tests.create.formatBlurb.${value}`, {
                            defaultValue: t("root.tests.create.formatBlurb.generic", {
                              count: entry.sectionPresets.length,
                            }),
                          })}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* What you are about to get                                      */}
          {/* ------------------------------------------------------------- */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <Surface padding="md" className="space-y-4">
              <div className="flex items-center gap-3">
                <FormatMark icon={formatIcon(format)} />
                <div className="min-w-0">
                  <p className="type-label truncate text-foreground">
                    {trimmedTitle || t("root.tests.create.untitled")}
                  </p>
                  <p className="text-2xs text-muted-foreground">
                    {translateKey(
                      t,
                      blueprint?.labelKey,
                      humanizeToken(format),
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="type-micro text-muted-foreground">
                  {t("root.tests.create.preview.sections")}
                </p>

                <ol className="space-y-1">
                  {(blueprint?.sectionPresets ?? []).map((preset, index) => (
                    <li
                      key={`${preset.titleKey}-${index}`}
                      className="flex items-center gap-2 rounded-lg bg-muted px-2.5 py-1.5 text-xs text-foreground"
                    >
                      <Layers
                        className="size-3.5 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {translateKey(t, preset.titleKey, humanizeToken(preset.kind))}
                      </span>
                      {preset.defaultDurationMinutes ? (
                        <Badge variant="neutral" size="xs">
                          {t("root.tests.list.meta.minutes", {
                            count: preset.defaultDurationMinutes,
                          })}
                        </Badge>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </div>

              <dl className="space-y-2 border-t border-border pt-3 text-xs">
                <div className="flex items-center gap-2">
                  <Clock3
                    className="size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <dt className="flex-1 text-muted-foreground">
                    {t("root.tests.list.meta.duration")}
                  </dt>
                  <dd className="font-medium text-foreground">
                    {blueprint?.defaultDurationMinutes
                      ? t("root.tests.list.meta.minutes", {
                          count: blueprint.defaultDurationMinutes,
                        })
                      : t("root.tests.create.preview.noDuration")}
                  </dd>
                </div>

                <div className="flex items-center gap-2">
                  <ListChecks
                    className="size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <dt className="flex-1 text-muted-foreground">
                    {t("root.tests.create.preview.questionTypes")}
                  </dt>
                  <dd className="font-medium text-foreground tabular-nums">
                    {blueprint?.allowedQuestionTypes.length ??
                      Object.keys(catalog.questionTypes).length}
                  </dd>
                </div>
              </dl>

              <p className="text-2xs text-muted-foreground">
                {t("root.tests.create.preview.note")}
              </p>
            </Surface>
          </aside>
        </form>
      </div>
    </>
  );
}
