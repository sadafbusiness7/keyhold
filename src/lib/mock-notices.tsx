/**
 * MOCK NOTICES + BULK ACTIONS STORE — prototype state only, NOT a backend.
 * ------------------------------------------------------------------------
 * Holds generated notices, their certificates of service, scheduled rent
 * increases and the log of bulk emails / portal invitations. Every number and
 * date on a notice comes from `notices-engine.ts`; this file only stores rows.
 * Shapes mirror future Supabase tables (notices, notice_service, rent_schedule,
 * bulk_messages) so a backend can drop in behind the same API.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { NoticeType, ServiceMethod } from "@/lib/notices-engine";

export type NoticeStatus = "generated" | "served" | "applied" | "cancelled";

export type NoticeRecord = {
  id: string;
  type: NoticeType;
  tenantId: string;
  unitId: string;
  propertyId: string;
  province: string;
  createdOn: string;
  createdBy: string;
  status: NoticeStatus;
  /** N1 */
  currentRent?: number;
  newRent?: number;
  percent?: number;
  effectiveDate?: string;
  rentApplied?: boolean;
  /** N4 */
  owing?: number;
  terminationDate?: string;
  fileName: string;
  batchId?: string;
  service?: {
    servedOn: string;
    time: string;
    method: ServiceMethod;
    servedBy: string;
    deemedReceivedOn: string;
    certificateFileName: string;
  };
};

export type BulkMessage = {
  id: string;
  kind: "email" | "invite" | "rent-update";
  subject: string;
  body: string;
  recipients: { tenantId: string; name: string; email: string }[];
  sentOn: string;
};

type Ctx = {
  notices: NoticeRecord[];
  bulkLog: BulkMessage[];
  /** unitId -> rent that replaced the lease rent after an N1 took effect */
  rentOverrides: Record<string, number>;
  addNotices: (rows: Omit<NoticeRecord, "id" | "status">[]) => NoticeRecord[];
  recordService: (noticeId: string, service: NonNullable<NoticeRecord["service"]>) => void;
  applyRentIncrease: (noticeId: string) => void;
  setRentOverride: (unitId: string, rent: number) => void;
  logBulk: (row: Omit<BulkMessage, "id" | "sentOn">, sentOn: string) => void;
  noticesForTenant: (tenantId: string) => NoticeRecord[];
};

const NoticesContext = createContext<Ctx | null>(null);

// MOCK seed so tenant history is not empty on first load.
const seedNotices: NoticeRecord[] = [
  {
    id: "ntc-seed-1",
    type: "N4",
    tenantId: "t3",
    unitId: "u3",
    propertyId: "p2",
    province: "ON",
    createdOn: "2026-08-06",
    createdBy: "Mr. J (you)",
    status: "served",
    owing: 1895,
    terminationDate: "2026-08-20",
    fileName: "N4 — Grace Okafor — 2026-08-06.pdf",
    service: {
      servedOn: "2026-08-06",
      time: "5:40 pm",
      method: "Slid under the door",
      servedBy: "Mr. J (you)",
      deemedReceivedOn: "2026-08-06",
      certificateFileName: "Certificate of service — N4 — Grace Okafor.pdf",
    },
  },
];

export function NoticesProvider({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState<NoticeRecord[]>(seedNotices);
  const [bulkLog, setBulkLog] = useState<BulkMessage[]>([]);
  const [rentOverrides, setRentOverrides] = useState<Record<string, number>>({});

  const value = useMemo<Ctx>(
    () => ({
      notices,
      bulkLog,
      rentOverrides,
      addNotices: (rows) => {
        const created = rows.map((r, i) => ({
          ...r,
          id: `ntc-${Date.now()}-${i}`,
          status: "generated" as NoticeStatus,
        }));
        setNotices((prev) => [...created, ...prev]);
        return created;
      },
      recordService: (noticeId, service) =>
        setNotices((prev) =>
          prev.map((n) => (n.id === noticeId ? { ...n, service, status: "served" } : n)),
        ),
      applyRentIncrease: (noticeId) =>
        setNotices((prev) => {
          const target = prev.find((n) => n.id === noticeId);
          if (target?.newRent) {
            setRentOverrides((o) => ({ ...o, [target.unitId]: target.newRent! }));
          }
          return prev.map((n) => (n.id === noticeId ? { ...n, rentApplied: true, status: "applied" } : n));
        }),
      setRentOverride: (unitId, rent) => setRentOverrides((o) => ({ ...o, [unitId]: rent })),
      logBulk: (row, sentOn) =>
        setBulkLog((prev) => [{ ...row, id: `bulk-${Date.now()}`, sentOn }, ...prev]),
      noticesForTenant: (tenantId) => notices.filter((n) => n.tenantId === tenantId),
    }),
    [notices, bulkLog, rentOverrides],
  );

  return <NoticesContext.Provider value={value}>{children}</NoticesContext.Provider>;
}

export function useNotices() {
  const ctx = useContext(NoticesContext);
  if (!ctx) throw new Error("useNotices must be used inside <NoticesProvider>");
  return ctx;
}

/** Merge tags like {{first_name}} — the same helper the bulk screens share. */
export const MERGE_TAGS = ["{{first_name}}", "{{full_name}}", "{{unit}}", "{{property}}", "{{rent}}", "{{balance}}"] as const;

export function renderTemplate(text: string, vars: Record<string, string>) {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key: string) => vars[key] ?? `{{${key}}}`);
}
