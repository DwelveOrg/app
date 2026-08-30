"use client";

import React from "react";
import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import TelegramIcon from "./TelegramIcon";

type TelegramAuthButtonProps = {
  href: string;
  text: string;
  openingText: string;
  disabled?: boolean;
  /** The bot was opened somewhere else and this page is still here to explain what happens next. */
  onOpened?: () => void;
  variant?: "outline" | "primary";
};

/** How long the button reads "Opening Telegram…" after a new tab took the link. */
const OPENING_SETTLE_MS = 800;

export default function TelegramAuthButton({
  href,
  text,
  openingText,
  disabled,
  onOpened,
  variant = "outline",
}: Readonly<TelegramAuthButtonProps>) {
  const [opening, setOpening] = React.useState(false);
  const isDisabled = Boolean(disabled || opening);

  const openTelegram = () => {
    if (isDisabled) return;
    setOpening(true);

    // A pointer device means Telegram is another window on this machine, so the
    // link goes to a new tab and this page stays to say what to do there. A
    // touch device hands the link to the Telegram app, and this tab is the one
    // the user comes back to anyway — so it navigates itself. A blocked popup
    // falls back to the same.
    const separateTab = window.matchMedia("(pointer: fine)").matches
      ? window.open(href, "_blank")
      : null;

    if (!separateTab) {
      window.location.assign(href);
      return;
    }

    onOpened?.();
    window.setTimeout(() => setOpening(false), OPENING_SETTLE_MS);
  };

  return (
    <button
      type="button"
      disabled={isDisabled}
      aria-busy={opening || undefined}
      onClick={openTelegram}
      className={cn(
        "flex w-full items-center justify-center gap-2.5 rounded-xl px-4 py-3",
        "text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-60",
        variant === "primary"
          ? "bg-primary text-primary-foreground hover:bg-primary-hover"
          : "border border-border bg-card text-foreground hover:bg-muted",
      )}
    >
      {opening ? (
        <LoaderCircle
          aria-hidden
          className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none"
        />
      ) : (
        <TelegramIcon />
      )}
      <span aria-live="polite">{opening ? openingText : text}</span>
    </button>
  );
}
