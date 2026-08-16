/**
 * MOCK OWNER-MANAGEMENT STORE — prototype state only, NOT a backend.
 * -------------------------------------------------------------------
 * Holds, per property, whether it is managed on behalf of an owner, who that
 * owner is, the management fee arrangement, and whether the statement has been
 * shared to that owner's portal view. Every dollar figure is computed by the
 * pure functions in `finance-engine.ts`; this file only stores the settings.
 * Mirrors a future `property_owner_settings` table.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { properties } from "@/lib/mock-data";
import type { FeeModel, OwnerConfig } from "@/lib/finance-engine";

const seed: Record<string, Partial<OwnerConfig>> = {
  p2: { managed: true, ownerName: "Joseph Nkemelu", ownerEmail: "mr.j@example.ca", feeModel: "pct-collected", feeValue: 8, sharedToPortal: true },
  p3: { managed: true, ownerName: "Dana Whitecloud", ownerEmail: "dana.w@example.ca", feeModel: "flat", feeValue: 220, sharedToPortal: false },
};

const base = (propertyId: string): OwnerConfig => ({
  propertyId,
  managed: false,
  ownerName: "",
  ownerEmail: "",
  feeModel: "pct-collected",
  feeValue: 8,
  feeTaxPct: 13,
  sharedToPortal: false,
  ...seed[propertyId],
});

type Ctx = {
  configs: OwnerConfig[];
  configFor: (propertyId: string) => OwnerConfig;
  setManaged: (propertyId: string, managed: boolean) => void;
  updateConfig: (propertyId: string, patch: Partial<Omit<OwnerConfig, "propertyId">>) => void;
  setFee: (propertyId: string, feeModel: FeeModel, feeValue: number, feeTaxPct: number) => void;
  shareToPortal: (propertyId: string, shared: boolean) => void;
};

const OwnersContext = createContext<Ctx | null>(null);

export function OwnersProvider({ children }: { children: ReactNode }) {
  const [configs, setConfigs] = useState<OwnerConfig[]>(() => properties.map((p) => base(p.id)));

  const value = useMemo<Ctx>(() => {
    const patch = (propertyId: string, p: Partial<OwnerConfig>) =>
      setConfigs((prev) => prev.map((c) => (c.propertyId === propertyId ? { ...c, ...p } : c)));
    return {
      configs,
      configFor: (propertyId) => configs.find((c) => c.propertyId === propertyId) ?? base(propertyId),
      setManaged: (propertyId, managed) => patch(propertyId, { managed }),
      updateConfig: patch,
      setFee: (propertyId, feeModel, feeValue, feeTaxPct) => patch(propertyId, { feeModel, feeValue, feeTaxPct }),
      shareToPortal: (propertyId, sharedToPortal) => patch(propertyId, { sharedToPortal }),
    };
  }, [configs]);

  return <OwnersContext.Provider value={value}>{children}</OwnersContext.Provider>;
}

export function useOwners() {
  const ctx = useContext(OwnersContext);
  if (!ctx) throw new Error("useOwners must be used inside <OwnersProvider>");
  return ctx;
}
