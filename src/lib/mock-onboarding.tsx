/**
 * ONBOARDING + IMPORT STORE — isolated mock, shaped like the real schema.
 *
 * Tables this mirrors:
 *   onboarding_progress(user_id, step, completed_steps[], skipped, finished_at, draft jsonb)
 *   import_batches(id, entity, file_name, created_at, created_count, skipped_count,
 *                  failed_count, attachment_names[], undone_at)
 *   import_rows(batch_id, row_number, payload jsonb)
 *
 * State lives in React and is mirrored to localStorage so the guided setup is
 * resumable. Nothing here talks to a backend.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { EntityKey, PreparedRow } from "@/lib/import-engine";

export type ImportBatch = {
  id: string;
  entity: EntityKey;
  fileName: string;
  at: string;
  created: number;
  skipped: number;
  failed: number;
  attachments: string[];
  undone: boolean;
  /** the accepted payloads, kept so an undo can describe what it removed */
  payloads: Record<string, string>[];
};

export type OnboardingDraft = {
  businessName: string;
  province: string;
  propertyName: string;
  address: string;
  city: string;
  postal: string;
  units: { label: string; bedrooms: string; rent: string }[];
  tenants: { name: string; email: string; unitLabel: string }[];
  notify: { rentDue: boolean; rentReceived: boolean; maintenance: boolean; leaseExpiring: boolean; digest: boolean };
};

export const emptyDraft: OnboardingDraft = {
  businessName: "",
  province: "ON",
  propertyName: "",
  address: "",
  city: "",
  postal: "",
  units: [{ label: "Unit 1", bedrooms: "2", rent: "" }],
  tenants: [],
  notify: { rentDue: true, rentReceived: true, maintenance: true, leaseExpiring: true, digest: false },
};

export type SetupState = {
  step: number;
  done: string[];
  skipped: boolean;
  finishedAt: string | null;
  draft: OnboardingDraft;
  dismissedChecklist: boolean;
};

const initial: SetupState = {
  step: 0,
  done: [],
  skipped: false,
  finishedAt: null,
  draft: emptyDraft,
  dismissedChecklist: false,
};

const KEY = "keyhold.setup.v1";

export type ChecklistItem = {
  key: string;
  label: string;
  hint: string;
  to: string;
  done: boolean;
};

type Ctx = {
  hydrated: boolean;
  setup: SetupState;
  setStep: (n: number) => void;
  markDone: (key: string) => void;
  saveDraft: (patch: Partial<OnboardingDraft>) => void;
  finishSetup: () => void;
  skipSetup: () => void;
  restartSetup: () => void;
  dismissChecklist: () => void;
  batches: ImportBatch[];
  lastUndoable: ImportBatch | null;
  recordImport: (input: {
    entity: EntityKey;
    fileName: string;
    rows: PreparedRow[];
    accepted: PreparedRow[];
    attachments: string[];
  }) => ImportBatch;
  undoImport: (id: string) => void;
};

const SetupContext = createContext<Ctx | null>(null);

export function SetupProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [setup, setSetup] = useState<SetupState>(initial);
  const [batches, setBatches] = useState<ImportBatch[]>([]);

  // Read persisted progress AFTER hydration so SSR and client markup match.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SetupState>;
        setSetup((s) => ({ ...s, ...parsed, draft: { ...emptyDraft, ...(parsed.draft ?? {}) } }));
      }
    } catch {
      /* corrupt or unavailable storage: start fresh */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(setup));
    } catch {
      /* storage full or blocked — progress just won't survive a reload */
    }
  }, [setup, hydrated]);

  const setStep = useCallback((n: number) => setSetup((s) => ({ ...s, step: n })), []);
  const markDone = useCallback(
    (key: string) => setSetup((s) => (s.done.includes(key) ? s : { ...s, done: [...s.done, key] })),
    [],
  );
  const saveDraft = useCallback(
    (patch: Partial<OnboardingDraft>) => setSetup((s) => ({ ...s, draft: { ...s.draft, ...patch } })),
    [],
  );
  const finishSetup = useCallback(
    () => setSetup((s) => ({ ...s, finishedAt: new Date().toISOString(), skipped: false })),
    [],
  );
  const skipSetup = useCallback(() => setSetup((s) => ({ ...s, skipped: true })), []);
  const restartSetup = useCallback(
    () => setSetup({ ...initial, draft: emptyDraft }),
    [],
  );
  const dismissChecklist = useCallback(() => setSetup((s) => ({ ...s, dismissedChecklist: true })), []);

  const recordImport = useCallback<Ctx["recordImport"]>(({ entity, fileName, rows, accepted, attachments }) => {
    const batch: ImportBatch = {
      id: `imp_${Date.now().toString(36)}`,
      entity,
      fileName,
      at: new Date().toISOString(),
      created: accepted.length,
      skipped: rows.filter((r) => r.skipped).length,
      failed: rows.filter((r) => !r.skipped && r.issues.some((i) => i.level === "error")).length,
      attachments,
      undone: false,
      payloads: accepted.map((r) => r.values),
    };
    setBatches((b) => [batch, ...b]);
    return batch;
  }, []);

  const undoImport = useCallback((id: string) => {
    setBatches((b) => b.map((x) => (x.id === id ? { ...x, undone: true } : x)));
  }, []);

  const lastUndoable = batches.find((b) => !b.undone) ?? null;

  const value = useMemo<Ctx>(
    () => ({
      hydrated,
      setup,
      setStep,
      markDone,
      saveDraft,
      finishSetup,
      skipSetup,
      restartSetup,
      dismissChecklist,
      batches,
      lastUndoable,
      recordImport,
      undoImport,
    }),
    [
      hydrated, setup, setStep, markDone, saveDraft, finishSetup, skipSetup, restartSetup,
      dismissChecklist, batches, lastUndoable, recordImport, undoImport,
    ],
  );

  return <SetupContext.Provider value={value}>{children}</SetupContext.Provider>;
}

export function useSetup(): Ctx {
  const ctx = useContext(SetupContext);
  if (!ctx) throw new Error("useSetup must be used inside <SetupProvider>");
  return ctx;
}

export function useOptionalSetup(): Ctx | null {
  return useContext(SetupContext);
}

export const CHECKLIST: { key: string; label: string; hint: string; to: string }[] = [
  { key: "business", label: "Business basics", hint: "Name and province", to: "/app/onboarding" },
  { key: "property", label: "Add your first property", hint: "Address, units and rent", to: "/app/onboarding" },
  { key: "tenants", label: "Add or import tenants", hint: "Invite them or upload a sheet", to: "/app/import" },
  { key: "notifications", label: "Notification preferences", hint: "What you want to hear about", to: "/app/settings" },
  { key: "payments", label: "Turn on rent reminders", hint: "Due day, grace period, late fees", to: "/app/settings" },
];

export function checklistItems(setup: SetupState): ChecklistItem[] {
  return CHECKLIST.map((c) => ({ ...c, done: setup.done.includes(c.key) }));
}
