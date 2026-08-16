/**
 * OPTIMISTIC ACTIONS
 *
 * Quick actions (send a reminder, mark read, toggle a flag) update the screen
 * straight away and only tell you if something actually went wrong — at which
 * point the change is rolled back and the failure is explained in plain
 * language. One helper so every quick action behaves identically.
 */
import { toast } from "sonner";

export type OptimisticOptions<T> = {
  /** Apply the change to local state immediately. */
  apply?: (() => void) | undefined;
  /** Put local state back exactly as it was if the change fails. */
  rollback?: (() => void) | undefined;
  /** The real work. Throwing means "failed". */
  commit: () => Promise<T> | T;
  /** Shown as soon as the change lands on screen. */
  success: string;
  /** Shown if it failed, after rolling back. */
  failure?: string | undefined;
};

export async function optimistic<T>({
  apply,
  rollback,
  commit,
  success,
  failure = "That didn't go through — nothing was changed.",
}: OptimisticOptions<T>): Promise<T | undefined> {
  apply?.();
  const id = toast.success(success);
  try {
    return await commit();
  } catch (error) {
    rollback?.();
    toast.dismiss(id);
    toast.error(failure, {
      description: error instanceof Error ? error.message : undefined,
      action: { label: "Try again", onClick: () => void optimistic({ apply, rollback, commit, success, failure }) },
    });
    return undefined;
  }
}

/** Stand-in for a network round trip in this prototype. */
export const settle = (ms = 350) => new Promise<void>((resolve) => setTimeout(resolve, ms));
