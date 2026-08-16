/**
 * DUPLICATE DETECTION — deterministic, string-normalised matching used before
 * any record is created. Never blocks: it surfaces the existing record so the
 * user can either use it or knowingly create another.
 */
import { properties, units, tenants, type Property, type Unit, type Tenant } from "./mock-data";

export type DuplicateHit<T> = {
  kind: "property" | "unit" | "tenant";
  /** "exact" is the same value; "near" is the same street with different formatting. */
  confidence: "exact" | "near";
  reason: string;
  record: T;
};

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/** Street-type words and punctuation folded so "12 King St." == "12 king street". */
const STREET_WORDS: Record<string, string> = {
  st: "street", "st.": "street", rd: "road", "rd.": "road", ave: "avenue", "ave.": "avenue",
  dr: "drive", "dr.": "drive", blvd: "boulevard", cres: "crescent", ct: "court", pl: "place",
  hwy: "highway", ter: "terrace", n: "north", s: "south", e: "east", w: "west",
};

export function normalizeAddress(raw: string): string {
  return norm(raw)
    .replace(/[.,#]/g, " ")
    .split(/\s+/)
    .map((w) => STREET_WORDS[w] ?? w)
    .filter(Boolean)
    .join(" ");
}

export function normalizeEmail(raw: string): string {
  const [local = "", domain = ""] = norm(raw).split("@");
  // Gmail ignores dots and +tags; treating them as the same person avoids duplicates.
  const isGmail = domain === "gmail.com" || domain === "googlemail.com";
  const cleanLocal = isGmail ? local.replace(/\./g, "").split("+")[0]! : local.split("+")[0]!;
  return domain ? `${cleanLocal}@${domain}` : cleanLocal;
}

export function normalizeUnitLabel(raw: string): string {
  return norm(raw).replace(/^(unit|suite|apt|apartment|#)\s*/i, "").replace(/\s+/g, "");
}

export function findPropertyDuplicates(
  input: { address: string; name?: string },
  pool: Property[] = properties,
): DuplicateHit<Property>[] {
  const target = normalizeAddress(input.address);
  if (!target) return [];
  const hits: DuplicateHit<Property>[] = [];
  for (const p of pool) {
    const existing = normalizeAddress(p.address);
    if (!existing) continue;
    if (existing === target) {
      hits.push({ kind: "property", confidence: "exact", reason: `Same address as ${p.name}`, record: p });
    } else if (existing.startsWith(target) || target.startsWith(existing)) {
      hits.push({ kind: "property", confidence: "near", reason: `Very close to ${p.name} — ${p.address}`, record: p });
    } else if (input.name && norm(input.name) === norm(p.name)) {
      hits.push({ kind: "property", confidence: "near", reason: `Another property is already called “${p.name}”`, record: p });
    }
  }
  return hits;
}

export function findUnitDuplicates(
  input: { propertyId: string; label: string },
  pool: Unit[] = units,
): DuplicateHit<Unit>[] {
  const target = normalizeUnitLabel(input.label);
  if (!target) return [];
  return pool
    .filter((u) => u.propertyId === input.propertyId && normalizeUnitLabel(u.label) === target)
    .map((u) => ({
      kind: "unit" as const,
      confidence: "exact" as const,
      reason: `Unit ${u.label} already exists at this property`,
      record: u,
    }));
}

export function findTenantDuplicates(
  input: { email?: string; name?: string; phone?: string },
  pool: Tenant[] = tenants,
): DuplicateHit<Tenant>[] {
  const email = input.email ? normalizeEmail(input.email) : "";
  const phone = input.phone ? input.phone.replace(/\D/g, "") : "";
  const name = input.name ? norm(input.name) : "";
  const hits: DuplicateHit<Tenant>[] = [];
  for (const t of pool) {
    if (email && normalizeEmail(t.email ?? "") === email) {
      hits.push({ kind: "tenant", confidence: "exact", reason: `${t.name} already uses ${t.email}`, record: t });
      continue;
    }
    if (phone && (t.phone ?? "").replace(/\D/g, "") === phone && phone.length >= 10) {
      hits.push({ kind: "tenant", confidence: "near", reason: `${t.name} has the same phone number`, record: t });
      continue;
    }
    if (name && norm(t.name) === name) {
      hits.push({ kind: "tenant", confidence: "near", reason: `Another tenant is also called ${t.name}`, record: t });
    }
  }
  return hits;
}