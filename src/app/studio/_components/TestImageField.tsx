"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import ImagePicker from "@/components/Custom/ImagePicker";
import { uploadTestMediaAction } from "@/app/(root)/_lib/test-actions";
import { readSafeActionData } from "@/lib/actions/read-safe-action-result";

type TestImageFieldProps = {
  testId: string;
  /** The stored URL, or `""` when the row has no image. */
  value: string;
  onChange: (url: string) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
};

/**
 * Picks an image for a passage or a question and uploads it immediately through
 * `POST /tests/:testId/media`, storing only the returned URL in the form.
 *
 * Images cannot ride along with the structure save: that endpoint is JSON, and
 * a multipart tree would blow past the body-parser limit. Uploading on pick
 * also means the teacher sees the real image, not a local preview that might
 * fail to store.
 *
 * The 5 MB / PNG-JPEG-WebP rules are enforced by `ImagePicker` and again by
 * `imageFileSchema` in the action, mirroring the backend contract.
 */
export default function TestImageField({
  testId,
  value,
  onChange,
  label,
  hint,
  disabled,
}: TestImageFieldProps) {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  const upload = useMutation({
    mutationFn: async (image: File) =>
      readSafeActionData(
        await uploadTestMediaAction({ testId, image }),
        t("root.tests.builder.image.error"),
      ),
  });

  const handleChange = (file: File | null) => {
    setError(null);

    if (!file) {
      onChange("");
      return;
    }

    upload.mutate(file, {
      onSuccess: ({ url }) => onChange(url),
      onError: (uploadError) =>
        setError(
          uploadError instanceof Error
            ? uploadError.message
            : t("root.tests.builder.image.error"),
        ),
    });
  };

  return (
    <ImagePicker
      label={label}
      hint={upload.isPending ? t("root.tests.builder.image.uploading") : hint}
      currentUrl={value || null}
      chooseLabel={t("root.tests.builder.image.choose")}
      replaceLabel={t("root.tests.builder.image.replace")}
      removeLabel={t("root.tests.builder.image.remove")}
      onChange={handleChange}
      onRemove={() => onChange("")}
      errorMessage={error}
      disabled={disabled || upload.isPending}
    />
  );
}
