/**
 * UNSAVED CHANGES GUARD
 *
 * One hook every form uses so the warning reads and behaves the same
 * everywhere: it blocks in-app navigation through the router and also catches
 * a browser tab close / reload.
 */
import { useEffect } from "react";
import { useBlocker } from "@tanstack/react-router";

const DEFAULT_MESSAGE = "You have unsaved changes. Leave this page and lose them?";

export function useUnsavedGuard(dirty: boolean, message: string = DEFAULT_MESSAGE) {
  useBlocker({
    shouldBlockFn: () => (dirty ? !window.confirm(message) : false),
    enableBeforeUnload: dirty,
    withResolver: false,
  });

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);
}
