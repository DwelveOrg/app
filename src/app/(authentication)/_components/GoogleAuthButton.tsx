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
  disabled?: boolean;
  text: string;
  unavailableText: string;
};

export default function GoogleAuthButton({
  onCredential,
  disabled,
  text,
  unavailableText,
}: Props) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const unavailableId = React.useId();

  const [gisLoading, setGisLoading] = React.useState(!!clientId);
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
        className={cn(
          baseClasses,
          "pointer-events-none transition-colors",
          "group-hover:bg-muted"
        )}
      >
        {gisLoading ? (
          <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <GoogleIcon />
        )}
        <span>{text}</span>
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
