"use client";

import { useEffect, useMemo, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { GraduationCap, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { updateSchoolProfileAction } from "@/app/(root)/_lib/profile-actions";
import {
  updateSchoolProfileSchema,
  type UpdateSchoolProfileInput,
} from "@/app/(root)/_lib/profile.schemas.forms";
import type { ProfileSelectedSchool } from "@/app/(root)/_lib/profile.schemas";
import { Button } from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/textarea";
import Surface from "@/components/ui/Surface";

type SchoolProfileFormProps = {
  selectedSchool: ProfileSelectedSchool;
};

/**
 * Teacher/student role-profile editor. Admin sessions must not render this
 * component (per contract §UI Rules); `ProfileClient` guards on `roleProfile.type`.
 */
export function SchoolProfileForm({ selectedSchool }: Readonly<SchoolProfileFormProps>) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const role = selectedSchool.roleProfile;
  const isStudent = role.type === "STUDENT";

  const defaults = useMemo<UpdateSchoolProfileInput>(() => {
    if (role.type === "STUDENT") {
      return { phone: role.phone ?? "" };
    }
    if (role.type === "TEACHER") {
      return { phone: role.phone ?? "", bio: role.bio ?? "" };
    }
    return {};
  }, [role]);

  const form = useForm<UpdateSchoolProfileInput>({
    resolver: zodResolver(updateSchoolProfileSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    form.reset(defaults);
  }, [defaults, form]);

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await updateSchoolProfileAction(values);
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      if (result?.validationErrors) {
        toast.error(t("root.profile.form.error"));
        return;
      }
      toast.success(t("root.profile.form.updated"));
      router.refresh();
    });
  });

  const isBusy = isPending || form.formState.isSubmitting;
  const values = useWatch({ control: form.control });
  const isDirty =
    (values.phone ?? "").trim() !== (defaults.phone ?? "").trim() ||
    (values.bio ?? "").trim() !== (defaults.bio ?? "").trim();

  return (
    <Surface as="section">
      <header className="mb-4 flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-primary">
          <GraduationCap className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-foreground">
            {t(isStudent ? "root.profile.roleProfile.student.title" : "root.profile.roleProfile.teacher.title")}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t(
              isStudent
                ? "root.profile.roleProfile.student.description"
                : "root.profile.roleProfile.teacher.description",
              { school: selectedSchool.school.name },
            )}
          </p>
        </div>
      </header>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field htmlFor="profile-phone" label={t("root.profile.roleProfile.phone.label")}>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="profile-phone"
              {...form.register("phone")}
              placeholder={t("root.profile.roleProfile.phone.placeholder")}
              className="pl-10"
              autoComplete="tel"
            />
          </div>
        </Field>

        {!isStudent ? (
          <Field
            htmlFor="profile-bio"
            label={t("root.profile.roleProfile.bio.label")}
            hint={t("root.profile.roleProfile.bio.hint")}
          >
            <Textarea
              id="profile-bio"
              rows={4}
              {...form.register("bio")}
              placeholder={t("root.profile.roleProfile.bio.placeholder")}
            />
          </Field>
        ) : null}

        {role.type !== "ADMIN" && role.classes.length > 0 ? (
          <div className="rounded-xl border border-border bg-muted p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("root.profile.roleProfile.classes.title", { count: role.classCount ?? role.classes.length })}
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {role.classes.map((cls) => (
                <li
                  key={cls.assignmentId}
                  className="inline-flex items-center rounded-full bg-card px-2.5 py-1 text-xs font-medium text-foreground"
                >
                  {cls.name}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex justify-end pt-1">
          <Button type="submit" size="lg" loading={isBusy} disabled={!isDirty}>
            {t("root.profile.form.save")}
          </Button>
        </div>
      </form>
    </Surface>
  );
}
