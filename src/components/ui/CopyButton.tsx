"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, type LucideIcon } from "lucide-react";

import Button, { type ButtonProps } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * Copy-to-clipboard with a confirmation state.
 *
 * The join-code chip and the teacher-invite dialog each implemented this — the same `copied` flag,
 * the same 2s reset, the same icon swap — so the two disagreed about how long the tick stayed up.
 *
 * The timer is cleared on unmount: copying and then closing the dialog used to set state on an
 * unmounted component.
 */
export type CopyButtonProps = Omit<ButtonProps, "onClick" | "children"> & {
  value: string;
  /** Accessible label at rest, e.g. "Copy join code". */
  label: string;
  /** Accessible label once copied, e.g. "Copied". */
  copiedLabel: string;
  /** Show the label next to the icon instead of icon-only. */
  showLabel?: boolean;
  /** Rest-state icon. Defaults to `Copy`; the setup checklist shares a code, so it uses `Share2`. */
  icon?: LucideIcon;
  onCopied?: () => void;
  /** Clipboard access was denied or unavailable. All four call sites toast here. */
  onError?: () => void;
};

export default function CopyButton({
  value,
  label,
  copiedLabel,
  showLabel = false,
  icon: Icon = Copy,
  onCopied,
  onError,
  className,
  variant = "ghost",
  size,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard access can be denied (insecure origin, permission). Leave the button at rest so
      // the user can select the text manually, and let the caller surface the failure.
      onError?.();
      return;
    }
    setCopied(true);
    onCopied?.();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size ?? (showLabel ? "sm" : "icon-sm")}
      onClick={handleCopy}
      aria-label={showLabel ? undefined : copied ? copiedLabel : label}
      className={cn(copied && "text-success", className)}
      {...props}
    >
      {copied ? <Check aria-hidden /> : <Icon aria-hidden />}
      {showLabel ? <span>{copied ? copiedLabel : label}</span> : null}
    </Button>
  );
}

export { CopyButton };
