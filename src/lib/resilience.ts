import { useEffect } from "react";
import { toast } from "sonner";

/**
 * A hook that warns the user when they try to leave a page with unsaved changes.
 * In this mock environment, we track "dirty" state via a simple boolean.
 */
export function useUnsavedChanges(isDirty: boolean, message = "You have unsaved changes. Are you sure you want to leave?") {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        return (e.returnValue = message);
      }
    };


    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };

  }, [isDirty, message]);
}

/**
 * Session expiry simulation.
 */
export function useSessionExpiry() {
  useEffect(() => {
    // Randomly simulate a session expiry once in a blue moon for demo purposes
    // Or just provide a manual trigger for the resilience audit.
  }, []);

  const simulateExpiry = () => {
    toast.error("Session expired", {
      description: "Your session has timed out. We've preserved your work locally — please sign in again.",
      action: {
        label: "Sign in",
        onClick: () => window.location.href = "/signin"
      },
      duration: Infinity,
    });
  };

  return { simulateExpiry };
}
