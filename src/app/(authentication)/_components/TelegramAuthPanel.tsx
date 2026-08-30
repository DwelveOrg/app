"use client";

import React from "react";
import { useTranslation } from "react-i18next";

import TelegramAuthButton from "./TelegramAuthButton";
import TelegramAuthNotice from "./TelegramAuthNotice";
import type { TelegramAuthStatus } from "../_utils/telegram-start";

type TelegramAuthPanelProps = {
  source: "login" | "signup";
  href: string;
  disabled?: boolean;
  status?: TelegramAuthStatus;
  /** The user wants out of the Telegram flow; the caller decides where to. */
  onSwitchMethod: () => void;
};

/**
 * The Telegram method, explained before it is started.
 *
 * Unlike a password or a Google chooser, this sign-in finishes somewhere else:
 * in a bot conversation that asks for a phone number and then sends a link.
 * A user who is not told that presses the button, lands in Telegram, and
 * wonders what the page they left is waiting for — so the steps come first,
 * and once the bot is open the panel switches to saying where to look.
 */
export default function TelegramAuthPanel({
  source,
  href,
  disabled,
  status,
  onSwitchMethod,
}: Readonly<TelegramAuthPanelProps>) {
  const { t } = useTranslation();
  const [sent, setSent] = React.useState(false);
  const steps = [t("auth.telegram.step1"), t("auth.telegram.step2"), t("auth.telegram.step3")];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">
          {t(source === "signup" ? "auth.telegram.signupTitle" : "auth.telegram.loginTitle")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("auth.telegram.description")}</p>
      </div>

      {sent ? (
        <div role="status" className="rounded-xl border border-border bg-muted px-4 py-3">
          <p className="text-sm font-medium text-foreground">{t("auth.telegram.sentTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("auth.telegram.sentBody")}</p>
        </div>
      ) : (
        <ol className="space-y-2.5">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm text-foreground">
              <span
                aria-hidden
                className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xs font-semibold text-primary"
              >
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      )}

      <TelegramAuthNotice
        status={status}
        message={status ? t(`auth.telegram.${status}`) : undefined}
      />

      <TelegramAuthButton
        href={href}
        disabled={disabled}
        text={t(sent ? "auth.telegram.reopen" : "auth.telegram.continue")}
        openingText={t("auth.telegram.opening")}
        onOpened={() => setSent(true)}
        variant={sent ? "outline" : "primary"}
      />

      {sent && (
        <button
          type="button"
          onClick={onSwitchMethod}
          className="w-full text-center text-xs font-medium text-muted-foreground transition hover:text-foreground"
        >
          {t("auth.telegram.otherMethod")}
        </button>
      )}
    </div>
  );
}
