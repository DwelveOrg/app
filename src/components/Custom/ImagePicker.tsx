"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = "image/png,image/jpeg,image/webp";
const MAX_BYTES = 5 * 1024 * 1024;

type ImagePickerProps = {
  label: string;
  hint?: string;
  /** Backend-provided URL of the currently stored image (logo or picture). */
  currentUrl?: string | null;
  chooseLabel: string;
  replaceLabel: string;
  removeLabel: string;
  /** Fired when the user picks a valid image (null clears the field). */
  onChange: (file: File | null) => void;
  /**
   * Fired when the user explicitly asks to delete the current backend image.
   * Only invoked when `currentUrl` was non-empty at open time.
   */
  onRemove?: () => void;
  errorMessage?: string | null;
  fallback?: React.ReactNode;
  className?: string;
  disabled?: boolean;
};

/**
 * Shared file picker for backend-stored images (school logos, class pictures).
 * Renders a thumbnail preview, enforces client-side type/size checks that
 * match the backend contract, and lets the user replace or remove the image.
 */
export default function ImagePicker({
  label,
  hint,
  currentUrl,
  chooseLabel,
  replaceLabel,
  removeLabel,
  onChange,
  onRemove,
  errorMessage,
  fallback,
  className,
  disabled,
}: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);

  const previewUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const displayedUrl = useMemo(() => {
    if (previewUrl) return previewUrl;
    if (removed) return null;
    return currentUrl ?? null;
  }, [previewUrl, removed, currentUrl]);

  const message = errorMessage ?? localError;

  const openPicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleFile = (nextFile: File | undefined | null) => {
    setLocalError(null);
    if (!nextFile) {
      setFile(null);
      onChange(null);
      return;
    }

    if (!ACCEPTED_TYPES.split(",").includes(nextFile.type)) {
      setLocalError("Only PNG, JPEG, or WebP images are allowed.");
      return;
    }
    if (nextFile.size > MAX_BYTES) {
      setLocalError("Image must be under 5 MB.");
      return;
    }

    setRemoved(false);
    setFile(nextFile);
    onChange(nextFile);
  };

  const handleRemove = () => {
    setFile(null);
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    if (currentUrl) {
      setRemoved(true);
      onRemove?.();
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {hint ? (
          <span className="text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={openPicker}
          disabled={disabled}
          className={cn(
            "relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/40 text-muted-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60",
          )}
          aria-label={displayedUrl ? replaceLabel : chooseLabel}
        >
          {displayedUrl ? (
            // Object URLs (previews) and backend-hosted URLs both go through a
            // plain <img>; next/image would need an image-domain allowlist.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayedUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : fallback ? (
            fallback
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
        </button>

        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={openPicker} disabled={disabled}>
            {displayedUrl ? replaceLabel : chooseLabel}
          </Button>
          {displayedUrl ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={disabled}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              {removeLabel}
            </Button>
          ) : null}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        className="sr-only"
        onChange={(event) => handleFile(event.target.files?.[0])}
        disabled={disabled}
      />

      {message ? (
        <p className="text-xs text-destructive">{message}</p>
      ) : null}
    </div>
  );
}
