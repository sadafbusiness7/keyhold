/**
 * BRANDING (lite white-label) — mirrors a `brand_settings` row:
 *   brand_settings(account_id, company_name, logo_data_url, accent_hex, show_powered_by)
 *
 * Only the logo and the accent colour vary. Every other token in the design
 * system stays exactly as designed, so nothing a landlord picks can break
 * contrast, spacing or dark mode.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Branding = {
  companyName: string;
  logoDataUrl: string | null;
  accent: string;
  showPoweredBy: boolean;
};

export const ACCENT_PRESETS: { hex: string; label: string }[] = [
  { hex: "#0066FF", label: "Keyhold blue" },
  { hex: "#0F766E", label: "Cedar teal" },
  { hex: "#B4451F", label: "Maple rust" },
  { hex: "#4C1D95", label: "Plum" },
  { hex: "#1D4ED8", label: "Deep indigo" },
  { hex: "#166534", label: "Pine" },
];

const DEFAULT_BRANDING: Branding = {
  companyName: "Keyhold",
  logoDataUrl: null,
  accent: "#0066FF",
  showPoweredBy: true,
};

const STORAGE_KEY = "keyhold.branding";

/** #rrggbb → "r g b" so it can feed an oklch-free CSS variable safely. */
export function hexToRgbTriplet(hex: string): string {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const n = Number.parseInt(full.slice(0, 6) || "0066FF", 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** Relative luminance decides whether text on the accent should be white or navy. */
export function accentForeground(hex: string): string {
  const [r, g, b] = hexToRgbTriplet(hex).split(" ").map(Number) as [number, number, number];
  const chan = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const lum = 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
  return lum > 0.45 ? "#121C2D" : "#FFFFFF";
}

type Ctx = {
  branding: Branding;
  update: (patch: Partial<Branding>) => void;
  reset: () => void;
};

const BrandingContext = createContext<Ctx | null>(null);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setBranding({ ...DEFAULT_BRANDING, ...(JSON.parse(raw) as Partial<Branding>) });
    } catch {
      /* ignore — defaults are fine */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(branding));
    } catch {
      /* private mode */
    }
  }, [branding]);

  const value = useMemo<Ctx>(
    () => ({
      branding,
      update: (patch) => setBranding((b) => ({ ...b, ...patch })),
      reset: () => setBranding(DEFAULT_BRANDING),
    }),
    [branding],
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding(): Ctx {
  const ctx = useContext(BrandingContext);
  if (!ctx) return { branding: DEFAULT_BRANDING, update: () => {}, reset: () => {} };
  return ctx;
}

/** Inline style that scopes the accent to a subtree (portal header, previews). */
export function brandStyle(branding: Branding): React.CSSProperties {
  return {
    // consumed by `bg-[--brand-accent]` style utilities in branded surfaces
    ["--brand-accent" as string]: branding.accent,
    ["--brand-accent-rgb" as string]: hexToRgbTriplet(branding.accent),
    ["--brand-accent-foreground" as string]: accentForeground(branding.accent),
  };
}