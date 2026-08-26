"use client";

import React from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import GoogleIcon from "./GoogleIcon";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
              width?: number;
            }
          ) => void;
          disableAutoSelect?: () => void;
        };
      };
    };
  }
}

const GIS_SRC = "https://accounts.google.com/gsi/client";

type Props = {
  onCredential: (idToken: string) => void;
  /** Blocks the button — the parent is busy with *any* attempt, including the password form. */
  disabled?: boolean;
  /**
   * This button's own credential is being exchanged with the backend. Separate from `disabled`
   * on purpose: `disabled` is also true while the password form is submitting, and labelling
   * this button "verifying your account" during someone else's submit would be a lie.
   */
  verifying?: boolean;
  text: string;
  /** Shown from the moment Google's chooser takes over until it hands a credential back. */
  waitingText: string;
  /** Shown while that credential is being exchanged with the Dwelve backend. */
  verifyingText: string;
  unavailableText: string;
};

/**
 * How long after the tab regains focus we keep saying "waiting for Google".
 *
 * The credential callback lands a beat after the popup closes, so clearing on `focus` alone would
 * flash the button back to its resting label and then straight into "verifying". This is the width
 * of that beat; if nothing arrives, the user dismissed the chooser and the button resets.
 */
const GOOGLE_RETURN_GRACE_MS = 700;

/** Backstop so a chooser that is closed in a way we never observe cannot strand the label. */
const GOOGLE_WAIT_CEILING_MS = 90_000;

export default function GoogleAuthButton({
  onCredential,
  disabled,
  verifying,
  text,
  waitingText,
  verifyingText,
  unavailableText,
}: Props) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const unavailableId = React.useId();

  const [gisLoading, setGisLoading] = React.useState(!!clientId);
  const [awaitingGoogle, setAwaitingGoogle] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const gisRef = React.useRef<HTMLDivElement>(null);
  const initialized = React.useRef(false);
  const onCredentialRef = React.useRef(onCredential);

  React.useLayoutEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  // Renders (or re-renders) the GIS button into the overlay. Safe to call
  // repeatedly — `replaceChildren` clears the previous button first.
  const renderGisButton = React.useCallback(() => {
    if (!window.google?.accounts?.id || !gisRef.current || !wrapperRef.current) {
      return;
    }

    const width = wrapperRef.current.clientWidth;
    gisRef.current.replaceChildren();
    window.google.accounts.id.renderButton(gisRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      logo_alignment: "left",
      width: Math.max(width, 200),
    });
  }, []);

  const initGIS = React.useCallback(() => {
    if (
      initialized.current ||
      !window.google?.accounts?.id ||
      !clientId ||
      !gisRef.current ||
      !wrapperRef.current
    ) {
      return;
    }

    initialized.current = true;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response.credential) {
          onCredentialRef.current(response.credential);
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    renderGisButton();
    setGisLoading(false);
  }, [clientId, renderGisButton]);

  React.useEffect(() => {
    if (!clientId) return;

    if (window.google?.accounts?.id) {
      initGIS();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GIS_SRC}"]`
    );

    if (existing) {
      existing.addEventListener("load", initGIS);
      return () => existing.removeEventListener("load", initGIS);
    }

    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = initGIS;
    document.head.appendChild(script);
  }, [clientId, initGIS]);

  /**
   * Covers the gap between "I clicked Continue with Google" and Google handing a credential back.
   *
   * Nothing in the GIS API reports that its chooser opened, and the button itself is rendered by
   * Google — into an iframe on some versions, into plain DOM on others — so a click handler of our
   * own is not something we can rely on. What *is* reliable in both shapes is focus: activating
   * that button puts `document.activeElement` inside this wrapper, and opening the chooser blurs
   * the window. Together they identify our own click and exclude an unrelated alt-tab.
   *
   * Without this, dismissing the Google chooser or waiting on a slow one leaves the user looking at
   * a login form that has no idea anything happened.
   */
  React.useEffect(() => {
    if (!clientId) return;

    let returnTimer = 0;
    let ceilingTimer = 0;

    // Our own activation, not an unrelated alt-tab: activating that button — iframe or plain DOM —
    // leaves `document.activeElement` inside this wrapper.
    const onBlur = () => {
      const wrapper = wrapperRef.current;
      if (!wrapper || !document.activeElement || !wrapper.contains(document.activeElement)) {
        return;
      }

      window.clearTimeout(returnTimer);
      setAwaitingGoogle(true);
      ceilingTimer = window.setTimeout(() => setAwaitingGoogle(false), GOOGLE_WAIT_CEILING_MS);
    };

    // The chooser closed. Either a credential lands within the grace period — `verifying` takes
    // over the label, and this reset is invisible — or the user backed out and the button resets.
    const onFocus = () => {
      window.clearTimeout(ceilingTimer);
      returnTimer = window.setTimeout(() => setAwaitingGoogle(false), GOOGLE_RETURN_GRACE_MS);
    };

    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      window.clearTimeout(returnTimer);
      window.clearTimeout(ceilingTimer);
    };
  }, [clientId]);

  // The GIS button is one-shot: after it hands back a credential it won't
  // re-prompt on later clicks, so a failed attempt (e.g. the backend rejects the
  // token) would leave an enabled-looking button that does nothing. `disabled`
  // is driven true while an attempt is in flight; when it falls back to false we
  // re-render a fresh button so retries keep working.
  const wasBusy = React.useRef(disabled);
  React.useEffect(() => {
    if (wasBusy.current && !disabled && initialized.current) {
      window.google?.accounts?.id?.disableAutoSelect?.();
      renderGisButton();
    }
    wasBusy.current = disabled;
  }, [disabled, renderGisButton]);

  const isDisabled = disabled || gisLoading;

  // Precedence is the order the user meets these: the script has to land before the button works,
  // an exchange in flight outranks a chooser we may not have seen close, and only then the wait.
  const busyLabel = gisLoading
    ? text
    : verifying
      ? verifyingText
      : awaitingGoogle
        ? waitingText
        : null;
  const showSpinner = gisLoading || verifying || awaitingGoogle;

  const baseClasses = cn(
    "flex w-full items-center justify-center gap-2.5 rounded-xl",
    "border border-border bg-card px-4 py-3",
    "text-sm font-medium text-foreground"
  );

  if (!clientId) {
    return (
      <div>
        <button
          type="button"
          disabled
          aria-describedby={unavailableId}
          className={cn(baseClasses, "opacity-60")}
        >
          <GoogleIcon />
          <span>{text}</span>
        </button>
        <p id={unavailableId} className="mt-2 text-center text-xs text-muted-foreground">
          {unavailableText}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "group relative cursor-pointer",
        isDisabled && "pointer-events-none opacity-60"
      )}
      aria-label={text}
    >
      {/* Visible custom button — pointer-events disabled so clicks pass through to GIS overlay */}
      <div
        aria-busy={showSpinner || undefined}
        className={cn(
          baseClasses,
          "pointer-events-none transition-colors",
          "group-hover:bg-muted"
        )}
      >
        {showSpinner ? (
          <LoaderCircle
            aria-hidden
            className="h-4 w-4 shrink-0 animate-spin text-muted-foreground motion-reduce:animate-none"
          />
        ) : (
          <GoogleIcon />
        )}
        {/* `aria-live` rather than a fresh node per state: the label is the only thing that tells
            a screen-reader user the chooser is up, and swapping the whole button would re-announce
            it as a new control each time. */}
        <span aria-live="polite">{busyLabel ?? text}</span>
      </div>

      {/* Invisible GIS-rendered button overlay that captures the actual click */}
      <div
        ref={gisRef}
        className={cn(
          "absolute inset-0 overflow-hidden rounded-xl opacity-0",
          gisLoading && "pointer-events-none"
        )}
      />
    </div>
  );
}
