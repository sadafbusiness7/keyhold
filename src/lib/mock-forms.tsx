import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { FormDefinition } from "@/lib/form-schemas";

/** MOCK store for form drafts, signatures and history. Backend will replace this. */

export type SignerStatus = "not-sent" | "sent" | "viewed" | "signed";

export type DraftSigner = {
  id: string;
  role: string;
  label: string;
  name: string;
  status: SignerStatus;
  signedAt: string | null;
  /** Typed name or a drawn-signature data URL. */
  signature: string | null;
  mode: "typed" | "drawn" | null;
};

export type HistoryEntry = {
  id: string;
  at: string;
  who: string;
  what: string;
};

export type CertificateOfService = { method: string; date: string } | null;

export type FormDraft = {
  id: string;
  formCode: string;
  province: string;
  version: string;
  title: string;
  /** Which record the fill started from. */
  subjectLabel: string;
  values: Record<string, string>;
  prefilled: string[];
  signers: DraftSigner[];
  status: "draft" | "completed";
  updatedAt: string;
  certificate: CertificateOfService;
  history: HistoryEntry[];
};

let seq = 0;
const nextId = (p: string) => `${p}_${Date.now().toString(36)}_${++seq}`;
const nowIso = () => new Date().toISOString();

const seedDrafts: FormDraft[] = [
  {
    id: "fd_seed_1",
    formCode: "N4",
    province: "ON",
    version: "2024-02",
    title: "Notice to End a Tenancy Early for Non-payment of Rent",
    subjectLabel: "Priya Raman — 412 Lansdowne Ave, Unit 2",
    values: {},
    prefilled: [],
    signers: [
      { id: "landlord", role: "Landlord", label: "Landlord signature", name: "Keyhold Property Co.", status: "signed", signedAt: "2026-08-02T14:10:00.000Z", signature: "Keyhold Property Co.", mode: "typed" },
    ],
    status: "completed",
    updatedAt: "2026-08-02T14:12:00.000Z",
    certificate: { method: "Placed in mailbox", date: "2026-08-02" },
    history: [
      { id: "h1", at: "2026-08-02T13:40:00.000Z", who: "Dana Whitfield", what: "Started N4 (version 2024-02)" },
      { id: "h2", at: "2026-08-02T14:10:00.000Z", who: "Keyhold Property Co.", what: "Signed as Landlord" },
      { id: "h3", at: "2026-08-02T14:12:00.000Z", who: "Dana Whitfield", what: "Generated PDF and recorded service (Placed in mailbox)" },
    ],
  },
];

type Ctx = {
  drafts: FormDraft[];
  createDraft: (input: {
    def: FormDefinition;
    subjectLabel: string;
    values: Record<string, string>;
    prefilled: string[];
    who: string;
  }) => FormDraft;
  saveDraft: (id: string, values: Record<string, string>, who: string) => void;
  updateSigner: (draftId: string, signerId: string, patch: Partial<DraftSigner>, who: string) => void;
  recordCertificate: (draftId: string, cert: NonNullable<CertificateOfService>, who: string) => void;
  completeDraft: (draftId: string, who: string) => void;
  log: (draftId: string, who: string, what: string) => void;
};

const FormsContext = createContext<Ctx | null>(null);

export function FormsProvider({ children }: { children: ReactNode }) {
  const [drafts, setDrafts] = useState<FormDraft[]>(seedDrafts);

  const value = useMemo<Ctx>(() => {
    const entry = (who: string, what: string): HistoryEntry => ({ id: nextId("h"), at: nowIso(), who, what });

    const patchDraft = (id: string, fn: (d: FormDraft) => FormDraft) =>
      setDrafts((prev) => prev.map((d) => (d.id === id ? fn(d) : d)));

    return {
      drafts,
      createDraft: ({ def, subjectLabel, values, prefilled, who }) => {
        const draft: FormDraft = {
          id: nextId("fd"),
          formCode: def.formCode,
          province: def.province,
          version: def.version,
          title: def.title,
          subjectLabel,
          values,
          prefilled,
          signers: def.signers.map((s) => ({
            id: s.id,
            role: s.role,
            label: s.label,
            name: "",
            status: "not-sent",
            signedAt: null,
            signature: null,
            mode: null,
          })),
          status: "draft",
          updatedAt: nowIso(),
          certificate: null,
          history: [entry(who, `Started ${def.formCode} (version ${def.version})`)],
        };
        setDrafts((prev) => [draft, ...prev]);
        return draft;
      },
      saveDraft: (id, values, who) =>
        patchDraft(id, (d) => ({
          ...d,
          values,
          updatedAt: nowIso(),
          history: [...d.history, entry(who, "Saved draft")],
        })),
      updateSigner: (draftId, signerId, patch, who) =>
        patchDraft(draftId, (d) => ({
          ...d,
          updatedAt: nowIso(),
          signers: d.signers.map((s) => (s.id === signerId ? { ...s, ...patch } : s)),
          history: [
            ...d.history,
            entry(
              who,
              patch.status === "signed"
                ? `Signed as ${d.signers.find((s) => s.id === signerId)?.role ?? "signer"}`
                : `Signing status set to ${patch.status ?? "updated"}`,
            ),
          ],
        })),
      recordCertificate: (draftId, cert, who) =>
        patchDraft(draftId, (d) => ({
          ...d,
          certificate: cert,
          updatedAt: nowIso(),
          history: [...d.history, entry(who, `Recorded certificate of service (${cert.method}, ${cert.date})`)],
        })),
      completeDraft: (draftId, who) =>
        patchDraft(draftId, (d) => ({
          ...d,
          status: "completed",
          updatedAt: nowIso(),
          history: [...d.history, entry(who, "Generated PDF and saved a copy to the tenant and property record")],
        })),
      log: (draftId, who, what) =>
        patchDraft(draftId, (d) => ({ ...d, history: [...d.history, entry(who, what)] })),
    };
  }, [drafts]);

  return <FormsContext.Provider value={value}>{children}</FormsContext.Provider>;
}

export function useForms() {
  const ctx = useContext(FormsContext);
  if (!ctx) throw new Error("useForms must be used inside FormsProvider");
  return ctx;
}

export const signerStatusLabel: Record<SignerStatus, string> = {
  "not-sent": "Not sent",
  sent: "Sent",
  viewed: "Viewed",
  signed: "Signed",
};
