"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize, Minimize, TriangleAlert } from "lucide-react";
import screenfull from "screenfull";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * Lets the teacher feel the fullscreen requirement before imposing it.
 *
 * "Require fullscreen" is the setting most likely to be turned on without
 * understanding it, and the one with the worst failure mode — on a locked-down
 * school device, or a browser where the Fullscreen API is blocked by policy,
 * students cannot start at all. Pressing this button answers both questions at
 * once: what it looks like, and whether it works on this machine.
 *
 * ## Why `screenfull` rather than the raw API
 *
 * Safari still exposes only the `webkit`-prefixed methods and fires
 * `webkitfullscreenchange`; iOS Safari does not support element fullscreen at
 * all. `screenfull` normalises the four vendor spellings and, critically,
 * exposes `isEnabled` — which is how this component can say "your browser will
 * not allow this" instead of silently doing nothing when the teacher presses
 * the button.
 */
export default function FullscreenDemo() {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  const supported = screenfull.isEnabled;

  useEffect(() => {
    if (!screenfull.isEnabled) return;

    const onChange = () => setActive(screenfull.isFullscreen);
    screenfull.on("change", onChange);
    return () => screenfull.off("change", onChange);
  }, []);

  const toggle = async () => {
    if (!screenfull.isEnabled || !containerRef.current) return;
    try {
      if (screenfull.isFullscreen) {
        await screenfull.exit();
      } else {
        await screenfull.request(containerRef.current);
      }
    } catch {
      // A rejected request means the gesture was not trusted or policy blocked
      // it. Either way the state below already reads "not available", and there
      // is nothing for the teacher to act on.
      setActive(false);
    }
  };

  if (!supported) {
    return (
      <p className="inline-flex items-start gap-1.5 rounded-lg bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] px-2.5 py-2 text-2xs text-warning">
        <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
        {t("root.tests.publish.integrity.fullscreenUnsupported")}
      </p>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "rounded-lg",
        // In fullscreen the element is the whole screen, so it has to paint its
        // own background — otherwise it inherits a transparent one and renders
        // over the operating system's black.
        active && "grid h-full w-full place-items-center bg-background p-8",
      )}
    >
      {active ? (
        <div className="max-w-sm text-center">
          <p className="type-heading text-foreground">
            {t("root.tests.publish.integrity.demoTitle")}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("root.tests.publish.integrity.demoBody")}
          </p>
          <Button type="button" variant="outline" className="mt-4" onClick={toggle}>
            <Minimize />
            {t("root.tests.publish.integrity.demoExit")}
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={toggle}>
          <Maximize />
          {t("root.tests.publish.integrity.demoStart")}
        </Button>
      )}
    </div>
  );
}
