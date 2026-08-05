"use client";

import { useEffect } from "react";

/**
 * Warns before the browser discards unsaved form state.
 *
 * There was no `beforeunload` handler anywhere in `src`, which meant a teacher
 * who had authored forty questions and hit reload, closed the tab, or followed
 * an external link lost the lot with no prompt.
 *
 * Scope, stated plainly because it is easy to over-trust this hook: it covers
 * reload, tab close, and navigation *away from the origin*. It does NOT cover
 * in-app `<Link>` navigation — the App Router does not expose a navigation
 * interception API, so clicking a sidebar row still discards the form. Guarding
 * that needs the links themselves to check, which is a larger change; this hook
 * closes the cheap half of the hole rather than pretending to close all of it.
 *
 * @param enabled Pass the form's `isDirty`. The listener is only attached while
 *   this is true, so a clean form has no `beforeunload` cost at all.
 */
export function useUnsavedChangesWarning(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      // Browsers ignore custom strings and show their own copy; calling
      // preventDefault is the supported way to ask for the prompt at all.
      event.preventDefault();
      // Legacy Chrome/Safari still key off a non-empty returnValue.
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [enabled]);
}

export default useUnsavedChangesWarning;
