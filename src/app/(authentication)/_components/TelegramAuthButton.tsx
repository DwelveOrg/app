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
};

export default function TelegramAuthButton({
  href,
  text,
  openingText,
  disabled,
}: Readonly<TelegramAuthButtonProps>) {
  const [opening, setOpening] = React.useState(false);
  const isDisabled = Boolean(disabled || opening);

  const openTelegram = () => {
    if (isDisabled) return;
    setOpening(true);
    window.location.assign(href);
  };

  return (
    <button
      type="button"
      disabled={isDisabled}
      aria-busy={opening || undefined}
      onClick={openTelegram}
      className={cn(
        "flex w-full items-center justify-center gap-2.5 rounded-xl",
        "border border-border bg-card px-4 py-3",
        "text-sm font-medium text-foreground transition-colors",
        "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-60",
      )}
    >
      {opening ? (
        <LoaderCircle
          aria-hidden
          className="h-4 w-4 shrink-0 animate-spin text-muted-foreground motion-reduce:animate-none"
        />
      ) : (
        <TelegramIcon />
      )}
      <span aria-live="polite">{opening ? openingText : text}</span>
    </button>
  );
}
