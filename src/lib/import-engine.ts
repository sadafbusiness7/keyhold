/**
 * IMPORT ENGINE — pure, deterministic, no React and no I/O.
 *
 * Mirrors the shape a real backend importer would use:
 *   import_batches(id, entity, file_name, created_at, counts, undone)
 *   import_rows(batch_id, row_number, payload, status, issues[])
 *
 * Everything here is a plain function so the same code can run server-side
 * later. Money is integer cents.
 */

export type EntityKey = "properties" | "units" | "tenants" | "leases" | "rent";

export type FieldType = "text" | "money" | "date" | "int" | "email" | "phone" | "province";

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  hint?: string;
  /** header spellings we auto-detect, lowercase and stripped */
  aliases: string[];
};

export type EntityDef = {
  key: EntityKey;
  label: string;
  singular: string;
  blurb: string;
  fields: FieldDef[];
  /** two example rows used for the downloadable template */
  sample: string[][];
};

export const PROVINCES = ["AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"];

/* ----------------------------- field schemas ---------------------------- */

const f = (
  key: string,
  label: string,
  type: FieldType,
  aliases: string[],
  extra: Partial<FieldDef> = {},
): FieldDef => ({ key, label, type, aliases, ...extra });

export const ENTITIES: Record<EntityKey, EntityDef> = {
  properties: {
    key: "properties",
    label: "Properties",
    singular: "property",
    blurb: "One row per building or house.",
    fields: [
      f("name", "Property name", "text", ["name", "property", "property name", "building", "title"], { required: true }),
      f("address", "Street address", "text", ["address", "street", "street address", "address1", "addr"], { required: true }),
      f("city", "City", "text", ["city", "town", "municipality"], { required: true }),
      f("province", "Province", "province", ["province", "prov", "state", "region"], { required: true, hint: "Two letters, e.g. ON" }),
      f("postalCode", "Postal code", "text", ["postal", "postal code", "postalcode", "zip", "zip code"]),
      f("kind", "Property type", "text", ["kind", "type", "property type", "category"]),
    ],
    sample: [
      ["Lansdowne Duplex", "412 Lansdowne Ave", "Toronto", "ON", "M6H 3Y2", "Duplex"],
      ["Ottawa Street Triplex", "88 Ottawa St N", "Hamilton", "ON", "L8H 3Z1", "Triplex"],
    ],
  },
  units: {
    key: "units",
    label: "Units",
    singular: "unit",
    blurb: "One row per rentable home. Match it to a property by name.",
    fields: [
      f("propertyName", "Property name", "text", ["property", "property name", "building", "name"], { required: true }),
      f("label", "Unit", "text", ["unit", "unit number", "suite", "apt", "label", "unit label"], { required: true }),
      f("kind", "Unit type", "text", ["kind", "type", "unit type"]),
      f("bedrooms", "Bedrooms", "int", ["bedrooms", "beds", "br", "bed"]),
      f("rent", "Monthly rent", "money", ["rent", "monthly rent", "rent amount", "price"], { required: true }),
      f("leaseEnd", "Lease ends", "date", ["lease end", "leaseend", "end date", "lease expiry", "expires"]),
    ],
    sample: [
      ["Lansdowne Duplex", "Unit 1", "2 bed", "2", "2150.00", "2027-05-31"],
      ["Lansdowne Duplex", "Unit 2", "1 bed", "1", "1795.00", ""],
    ],
  },
  tenants: {
    key: "tenants",
    label: "Tenants",
    singular: "tenant",
    blurb: "The people living in your units. Attach their current lease PDF after mapping.",
    fields: [
      f("name", "Full name", "text", ["name", "tenant", "tenant name", "full name", "resident"], { required: true }),
      f("email", "Email", "email", ["email", "e-mail", "email address"], { required: true }),
      f("phone", "Phone", "phone", ["phone", "mobile", "cell", "telephone", "phone number"]),
      f("unitLabel", "Unit", "text", ["unit", "suite", "apt", "unit number"], { required: true }),
      f("propertyName", "Property name", "text", ["property", "property name", "building"]),
      f("movedIn", "Moved in", "date", ["moved in", "movedin", "move in", "start date", "since"]),
    ],
    sample: [
      ["Marie Tremblay", "marie.tremblay@example.ca", "(416) 555-0134", "Unit 1", "Lansdowne Duplex", "2023-06-01"],
      ["Grace Okafor", "grace.okafor@example.ca", "(905) 555-0192", "Unit 2", "Lansdowne Duplex", "2024-09-01"],
    ],
  },
  leases: {
    key: "leases",
    label: "Leases",
    singular: "lease",
    blurb: "Current agreements. Bring the signed PDF along and we'll file it.",
    fields: [
      f("tenantName", "Tenant name", "text", ["tenant", "tenant name", "name", "resident"], { required: true }),
      f("unitLabel", "Unit", "text", ["unit", "suite", "apt", "unit number"], { required: true }),
      f("start", "Start date", "date", ["start", "start date", "lease start", "from"], { required: true }),
      f("end", "End date", "date", ["end", "end date", "lease end", "to", "expiry"]),
      f("rent", "Monthly rent", "money", ["rent", "monthly rent", "amount"], { required: true }),
      f("type", "Lease type", "text", ["type", "lease type", "term"], { hint: "Fixed term or Month-to-month" }),
      f("depositHeld", "Deposit held", "money", ["deposit", "deposit held", "last month", "lmr", "security deposit"]),
    ],
    sample: [
      ["Marie Tremblay", "Unit 1", "2023-06-01", "2027-05-31", "2150.00", "Fixed term", "2150.00"],
      ["Grace Okafor", "Unit 2", "2024-09-01", "", "1795.00", "Month-to-month", "1795.00"],
    ],
  },
  rent: {
    key: "rent",
    label: "Rent history",
    singular: "rent record",
    blurb: "Past charges and payments so your reports start with real history.",
    fields: [
      f("tenantName", "Tenant name", "text", ["tenant", "tenant name", "name", "paid by"], { required: true }),
      f("unitLabel", "Unit", "text", ["unit", "suite", "apt"], { required: true }),
      f("dueDate", "Due date", "date", ["due", "due date", "period", "month", "date"], { required: true }),
      f("amount", "Amount charged", "money", ["amount", "rent", "charged", "total"], { required: true }),
      f("paidOn", "Paid on", "date", ["paid on", "paid", "payment date", "received"]),
      f("method", "Method", "text", ["method", "payment method", "how", "type"]),
    ],
    sample: [
      ["Marie Tremblay", "Unit 1", "2026-07-01", "2150.00", "2026-07-01", "e-Transfer"],
      ["Grace Okafor", "Unit 2", "2026-07-01", "1795.00", "", ""],
    ],
  },
};

export const ENTITY_ORDER: EntityKey[] = ["properties", "units", "tenants", "leases", "rent"];

/* ------------------------------- parsing -------------------------------- */

/** RFC-4180-ish parser that copes with quotes, embedded commas and CRLF. */
export function parseDelimited(text: string, delimiter?: string): string[][] {
  const body = text.replace(/^\uFEFF/, "");
  const d = delimiter ?? sniffDelimiter(body);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i];
    if (quoted) {
      if (ch === '"') {
        if (body[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else quoted = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') {
      quoted = true;
    } else if (ch === d) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== "")).map((r) => r.map((c) => c.trim()));
}

export function sniffDelimiter(text: string): string {
  const line = text.split(/\r?\n/)[0] ?? "";
  const counts = [",", ";", "\t", "|"].map((d) => [d, line.split(d).length] as [string, number]);
  counts.sort((a, b) => b[1] - a[1]);
  const best = counts[0] ?? [",", 1];
  return best[1] > 1 ? best[0] : ",";
}

export type ParsedSheet = { headers: string[]; rows: string[][]; sheetName?: string };

export function toSheet(matrix: string[][]): ParsedSheet {
  const [headers = [], ...rows] = matrix;
  const width = Math.max(headers.length, ...rows.map((r) => r.length), 0);
  const pad = (r: string[]) => Array.from({ length: width }, (_, i) => r[i] ?? "");
  return { headers: pad(headers), rows: rows.map(pad) };
}

/* --------------------------- column detection --------------------------- */

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Score a header against a field: 100 exact alias, 60 contains, 0 no match. */
function score(header: string, field: FieldDef): number {
  const h = norm(header);
  if (!h) return 0;
  const targets = [norm(field.label), norm(field.key), ...field.aliases.map(norm)];
  if (targets.includes(h)) return 100;
  for (const t of targets) {
    if (!t) continue;
    if (h === t.replace(/ /g, "")) return 95;
    if (h.startsWith(t) || t.startsWith(h)) return 75;
    if (h.includes(t) || t.includes(h)) return 60;
  }
  return 0;
}

export type Mapping = Record<string, number | null>;

/** Greedy best-match auto-detection; each column is used at most once. */
export function autoMap(headers: string[], fields: FieldDef[]): Mapping {
  const pairs: { field: string; col: number; s: number }[] = [];
  fields.forEach((field) => {
    headers.forEach((h, col) => {
      const s = score(h, field);
      if (s > 0) pairs.push({ field: field.key, col, s });
    });
  });
  pairs.sort((a, b) => b.s - a.s);
  const mapping: Mapping = Object.fromEntries(fields.map((x) => [x.key, null]));
  const usedCols = new Set<number>();
  const usedFields = new Set<string>();
  for (const p of pairs) {
    if (usedCols.has(p.col) || usedFields.has(p.field)) continue;
    mapping[p.field] = p.col;
    usedCols.add(p.col);
    usedFields.add(p.field);
  }
  return mapping;
}

/* ------------------------------ coercion -------------------------------- */

export function parseMoneyCents(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s]/g, "").replace(/^\((.*)\)$/, "-$1");
  if (!cleaned || !/^-?\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/** Accepts 2026-07-01, 01/07/2026, July 1 2026, 1 Jul 26. Returns ISO or null. */
export function parseDateISO(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (iso) return build(+(iso[1] ?? 0), +(iso[2] ?? 0), +(iso[3] ?? 0));

  const slash = /^(\d{1,4})[/.-](\d{1,2})[/.-](\d{1,4})$/.exec(s);
  if (slash) {
    const a = slash[1] ?? "";
    const b = slash[2] ?? "";
    const c = slash[3] ?? "";
    if (a.length === 4) return build(+a, +b, +c);
    // Canadian sheets are usually D/M/Y; fall back to M/D/Y when day > 12.
    const first = +a;
    const second = +b;
    const year = c.length === 2 ? 2000 + +c : +c;
    if (first > 12 && second <= 12) return build(year, second, first);
    if (second > 12 && first <= 12) return build(year, first, second);
    return build(year, second, first);
  }

  const words = /^(\d{1,2})?\s*([a-z]{3,})\.?\s*(\d{1,2})?,?\s*(\d{2,4})$/i.exec(s);
  if (words) {
    const m = MONTHS[(words[2] ?? "").slice(0, 3).toLowerCase()];
    const day = words[1] ? +words[1] : words[3] ? +words[3] : NaN;
    const yearRaw = words[4] ?? "";
    const yr = yearRaw.length === 2 ? 2000 + +yearRaw : +yearRaw;
    if (m && !Number.isNaN(day)) return build(yr, m, day);
  }
  return null;

  function build(y: number, m: number, d: number): string | null {
    if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2200) return null;
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCMonth() + 1 !== m || dt.getUTCDate() !== d) return null;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
}

export function normalizeProvince(raw: string): string | null {
  const s = raw.trim().toUpperCase();
  if (PROVINCES.includes(s)) return s;
  const long: Record<string, string> = {
    ALBERTA: "AB", "BRITISH COLUMBIA": "BC", MANITOBA: "MB", "NEW BRUNSWICK": "NB",
    "NEWFOUNDLAND AND LABRADOR": "NL", NEWFOUNDLAND: "NL", "NOVA SCOTIA": "NS",
    "NORTHWEST TERRITORIES": "NT", NUNAVUT: "NU", ONTARIO: "ON",
    "PRINCE EDWARD ISLAND": "PE", QUEBEC: "QC", "QUÉBEC": "QC",
    SASKATCHEWAN: "SK", YUKON: "YT",
  };
  return long[s] ?? null;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ------------------------------ validation ------------------------------ */

export type IssueLevel = "error" | "warning";
export type Issue = { field: string; level: IssueLevel; message: string };

export type PreparedRow = {
  /** 1-based row number in the user's file, header excluded */
  n: number;
  values: Record<string, string>;
  issues: Issue[];
  skipped: boolean;
};

export function cellValue(row: string[], mapping: Mapping, key: string): string {
  const col = mapping[key];
  return col == null ? "" : (row[col] ?? "").trim();
}

export function prepareRows(entity: EntityKey, rows: string[][], mapping: Mapping): PreparedRow[] {
  const def = ENTITIES[entity];
  const prepared: PreparedRow[] = rows.map((row, i) => ({
    n: i + 1,
    values: Object.fromEntries(def.fields.map((fd) => [fd.key, cellValue(row, mapping, fd.key)])),
    issues: [],
    skipped: false,
  }));
  return revalidate(entity, prepared);
}

/** Re-runs every rule over the current (possibly hand-edited) values. */
export function revalidate(entity: EntityKey, rows: PreparedRow[]): PreparedRow[] {
  const def = ENTITIES[entity];
  const seen = new Map<string, number>();

  return rows.map((r) => {
    const issues: Issue[] = [];
    for (const fd of def.fields) {
      const raw = (r.values[fd.key] ?? "").trim();
      if (!raw) {
        if (fd.required) issues.push({ field: fd.key, level: "error", message: `${fd.label} is required` });
        else if (fd.key === "email") issues.push({ field: fd.key, level: "warning", message: "No email — they won't get reminders" });
        continue;
      }
      if (fd.type === "money" && parseMoneyCents(raw) === null) {
        issues.push({ field: fd.key, level: "error", message: `${fd.label} isn't an amount we understand` });
      }
      if (fd.type === "date" && parseDateISO(raw) === null) {
        issues.push({ field: fd.key, level: "error", message: `${fd.label} isn't a date we understand` });
      }
      if (fd.type === "int" && !/^\d+$/.test(raw)) {
        issues.push({ field: fd.key, level: "warning", message: `${fd.label} should be a whole number` });
      }
      if (fd.type === "email" && !EMAIL_RE.test(raw)) {
        issues.push({ field: fd.key, level: "error", message: "That email address looks wrong" });
      }
      if (fd.type === "province" && normalizeProvince(raw) === null) {
        issues.push({ field: fd.key, level: "error", message: "Use a Canadian province code like ON or BC" });
      }
      if (fd.type === "phone" && raw.replace(/\D/g, "").length < 10) {
        issues.push({ field: fd.key, level: "warning", message: "Phone number looks short" });
      }
    }

    const key = duplicateKey(entity, r.values);
    if (key) {
      const first = seen.get(key);
      if (first != null) {
        issues.push({ field: dupField(entity), level: "error", message: `Same as row ${first} — duplicate ${def.singular}` });
      } else {
        seen.set(key, r.n);
      }
    }

    return { ...r, issues };
  });
}

function dupField(entity: EntityKey): string {
  return entity === "properties" ? "name" : entity === "rent" ? "dueDate" : entity === "units" ? "label" : "unitLabel";
}

function duplicateKey(entity: EntityKey, v: Record<string, string>): string | null {
  const g = (key: string) => (v[key] ?? "").trim().toLowerCase();
  const k = (...parts: string[]) => parts.join("|");
  switch (entity) {
    case "properties":
      return g("name") ? k(g("name"), g("address")) : null;
    case "units":
      return g("propertyName") && g("label") ? k(g("propertyName"), g("label")) : null;
    case "tenants":
      return g("unitLabel") && g("name") ? k(g("propertyName"), g("unitLabel")) : null;
    case "leases":
      return g("unitLabel") && g("start") ? k(g("unitLabel"), g("start")) : null;
    case "rent":
      return g("unitLabel") && g("dueDate") ? k(g("unitLabel"), g("dueDate")) : null;
    default:
      return null;
  }
}

export function countIssues(rows: PreparedRow[]) {
  let errors = 0;
  let warnings = 0;
  let skipped = 0;
  for (const r of rows) {
    if (r.skipped) {
      skipped += 1;
      continue;
    }
    if (r.issues.some((i) => i.level === "error")) errors += 1;
    else if (r.issues.length) warnings += 1;
  }
  const ready = rows.length - skipped - errors;
  return { errors, warnings, skipped, ready, total: rows.length };
}

/* ------------------------------ templates ------------------------------- */

export function templateCsv(entity: EntityKey): string {
  const def = ENTITIES[entity];
  const esc = (c: string) => (/[",\n]/.test(c) ? `"${c.replaceAll('"', '""')}"` : c);
  const lines = [def.fields.map((x) => x.label).map(esc).join(","), ...def.sample.map((r) => r.map(esc).join(","))];
  return lines.join("\n");
}

/** Rows that will actually be created. */
export function acceptedRows(rows: PreparedRow[]): PreparedRow[] {
  return rows.filter((r) => !r.skipped && !r.issues.some((i) => i.level === "error"));
}
