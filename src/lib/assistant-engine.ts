/**
 * ASK KEYHOLD — assistant rules engine (prototype, deterministic).
 * ----------------------------------------------------------------
 * Hard rules encoded here, not in the UI:
 *  - It NEVER computes money. Every figure is passed in already calculated by
 *    `rent-engine.ts` / the rent store; this file only formats and reports.
 *  - It NEVER decides eviction, screening, acceptance/rejection or anything
 *    legal. Legal topics return general info + "not legal advice" + the
 *    official source + a route into the notice flow.
 *  - It only ever sees the scope object handed to it (already filtered by
 *    `usePermissions`), so a PM sees assigned properties and a tenant one unit.
 */
import { money } from "@/lib/rent-engine";
import { NOTICE_SOURCES } from "@/lib/notices-engine";

export const MONTHLY_LIMIT = 20;

export type AssistantMode = "data" | "howto" | "legal" | "unknown" | "locked";

export type ConfirmPlan = {
  title: string;
  /** exactly who */
  recipients: { name: string; email: string; detail: string }[];
  /** exactly what */
  channel: string;
  message: string;
  successText: string;
};

export type AssistantAction =
  | { kind: "navigate"; label: string; to: string }
  | { kind: "confirm"; label: string; plan: ConfirmPlan };

export type AssistantAnswer = {
  mode: AssistantMode;
  text: string;
  bullets?: string[];
  steps?: string[];
  note?: string;
  source?: { label: string; url: string };
  actions?: AssistantAction[];
};

/** Everything the assistant is allowed to know, already scoped + calculated. */
export type AssistantScope = {
  signedIn: boolean;
  role: "owner" | "pm" | "tenant" | "guest";
  canSeeFinancials: boolean;
  today: string;
  /** figures the system calculated — the assistant only reports them */
  unpaid: { tenantId: string; name: string; email: string; where: string; balanceCents: number; overdue: boolean }[];
  rentRoll: { billedCents: number; collectedCents: number; outstandingCents: number; units: number; occupied: number };
  leasesEnding: { name: string; where: string; end: string; type: string }[];
  openRepairs: { title: string; where: string; status: string }[];
  vacancies: { where: string; rentCents: number }[];
};

const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" });

const has = (q: string, ...words: string[]) => words.some((w) => q.includes(w));

export const HOW_TO: { id: string; match: string[]; title: string; steps: string[]; to: string; cta: string }[] = [
  {
    id: "add-pm",
    match: ["property manager", "add a manager", "invite manager", "team", "delegate", "access"],
    title: "Add a property manager",
    steps: [
      "Open Team & access.",
      "Choose Invite manager and enter their name and email.",
      "Tick the properties they should reach.",
      "Pick Full manager or Limited (no money) for each one.",
      "Send the invite — they only ever see what you ticked.",
    ],
    to: "/app/team",
    cta: "Open Team & access",
  },
  {
    id: "upload-doc",
    match: ["upload", "document", "file", "attach", "lease copy", "receipt copy"],
    title: "Upload a document",
    steps: ["Open Documents.", "Choose Add document.", "Pick the property, unit or tenant it belongs to.", "Drop the file in and save — it stays on that record's history."],
    to: "/app/documents",
    cta: "Open Documents",
  },
  {
    id: "record-payment",
    match: ["record a payment", "mark as paid", "partial payment", "receipt", "nsf", "bounced"],
    title: "Record a rent payment",
    steps: ["Open Rent.", "Find the invoice and choose Record payment.", "Enter the amount (partial is fine) and the method.", "Save — the receipt and history update straight away."],
    to: "/app/rent",
    cta: "Open Rent",
  },
  {
    id: "add-tenant",
    match: ["add a tenant", "new tenant", "move in", "add tenant"],
    title: "Add a tenant",
    steps: ["Open Add tenant.", "Choose the property and unit.", "Enter their details and lease dates.", "Save — the first invoice is scheduled automatically."],
    to: "/app/add-tenant",
    cta: "Open Add tenant",
  },
  {
    id: "notice",
    match: ["notice", "n1", "n4", "rent increase", "form"],
    title: "Create a provincial notice",
    steps: ["Open Notices.", "Pick the notice type for the province on the property record.", "Choose one tenant or several for a batch.", "Review the pre-filled fields, then generate the PDF and record how it was served."],
    to: "/app/notices",
    cta: "Open Notices",
  },
  {
    id: "bulk",
    match: ["bulk", "everyone", "all tenants", "mass email", "portal invite", "invitation"],
    title: "Send something to several tenants",
    steps: ["Open Bulk actions.", "Pick email, portal invitations or a rent update.", "Select the tenants.", "Write the message with tags like {{first_name}}, preview it, then send."],
    to: "/app/bulk",
    cta: "Open Bulk actions",
  },
  {
    id: "maintenance",
    match: ["work order", "vendor", "repair", "bill", "maintenance"],
    title: "Turn a repair request into a work order",
    steps: ["Open Maintenance.", "Open the request and choose Create work order.", "Assign a vendor and confirm the access instructions.", "When it's done, create the bill from the work order for approval."],
    to: "/app/maintenance",
    cta: "Open Maintenance",
  },
  {
    id: "listing",
    match: ["listing", "advertise", "vacancy post", "application", "screening"],
    title: "Advertise a unit and take applications",
    steps: ["Open Listings and publish the unit.", "Share the public link — applications arrive in Prospects.", "Run screening from the prospect's page.", "When you're ready, start the lease wizard; everything carries over."],
    to: "/app/listings",
    cta: "Open Listings",
  },
];

function howTo(q: string): AssistantAnswer | null {
  const hit = HOW_TO.find((g) => g.match.some((m) => q.includes(m)));
  if (!hit) return null;
  return {
    mode: "howto",
    text: hit.title,
    steps: hit.steps,
    actions: [{ kind: "navigate", label: hit.cta, to: hit.to }],
  };
}

function reminderPlan(scope: AssistantScope): ConfirmPlan {
  const people = scope.unpaid;
  return {
    title: `Send a rent reminder to ${people.length} ${people.length === 1 ? "tenant" : "tenants"}`,
    recipients: people.map((p) => ({
      name: p.name,
      email: p.email,
      detail: `${p.where} · ${money(p.balanceCents)} outstanding`,
    })),
    channel: "Email from your Keyhold account",
    message:
      "Hello {{first_name}},\n\nThis is a friendly reminder that {{amount}} of rent for {{unit}} is still outstanding. If you've already sent it, please ignore this note.\n\nThank you,\n{{landlord_name}}",
    successText: "Reminder sent. A copy is on each tenant's history.",
  };
}

export function answer(question: string, scope: AssistantScope): AssistantAnswer {
  const q = question.toLowerCase().trim();
  if (!q) return { mode: "unknown", text: "Ask me anything about your rentals — in plain words." };

  // 1) Legal / decision questions — always refused the same way.
  if (has(q, "evict", "eviction", "kick out", "court", "sue", "legal advice", "lawyer", "should i reject", "should i accept", "should i approve", "decline the applicant")) {
    const src = NOTICE_SOURCES.N4;
    return {
      mode: "legal",
      text: "I can't decide that one, and I won't try. Ending a tenancy, screening outcomes and anything legal are your call.",
      bullets: [
        "In Ontario, non-payment starts with an N4 notice and its own waiting period.",
        "Keyhold pre-fills the form from your records — you review and confirm before anything is generated or served.",
      ],
      note: "General information, not legal advice. Confirm the current form and the rules for your situation with the Landlord and Tenant Board, or get legal advice.",
      source: { label: `${src.authority} · ${src.formName} · ${src.version}`, url: src.url },
      actions: [{ kind: "navigate", label: "Open Notices", to: "/app/notices" }],
    };
  }

  // 2) How-to / support.
  if (has(q, "how do i", "how can i", "where do i", "how to", "guide", "help me")) {
    const guide = howTo(q);
    if (guide) return guide;
  }

  // 2b) Public product questions — the only thing the assistant answers when signed out.
  if (!scope.signedIn) {
    if (has(q, "what does keyhold", "what is keyhold", "what can you do", "about keyhold")) {
      return {
        mode: "howto",
        text: "Keyhold is Canadian rental management for small landlords and property managers.",
        bullets: [
          "Rent, invoices and receipts in one ledger",
          "Guided leases, renewals and provincial notices",
          "Maintenance, inspections, documents and vendors",
          "Owner statements, reports and a T776 tax package",
        ],
        actions: [{ kind: "navigate", label: "See features", to: "/#features" }],
      };
    }
    if (has(q, "cost", "price", "pricing", "how much", "plan", "free")) {
      return {
        mode: "howto",
        text: "Pricing is per unit, billed monthly, with no setup fee.",
        bullets: ["Try the full product before you pay", "Change or cancel your plan yourself", "Every plan includes the Canadian legal templates"],
        actions: [{ kind: "navigate", label: "See pricing", to: "/#pricing" }],
      };
    }
    if (has(q, "ontario", "rent increase", "guideline", "province", "quebec", "bc", "alberta")) {
      return {
        mode: "howto",
        text: "Yes — Keyhold tracks provincial rules, including the Ontario rent-increase guideline.",
        bullets: [
          "It works out the earliest legal increase date and the notice period",
          "Forms such as the N1 and N4 are pre-filled from your records for you to review",
        ],
        note: "General information, not legal advice.",
        actions: [{ kind: "navigate", label: "See features", to: "/#features" }],
      };
    }
    if (has(q, "import", "spreadsheet", "csv", "excel", "migrate", "switch")) {
      return {
        mode: "howto",
        text: "You can bring your spreadsheet across in the import wizard.",
        steps: ["Upload your CSV or Excel file.", "Map your columns to Keyhold's fields.", "Review the flagged rows before anything is created.", "Import — and undo it in one click if it isn't right."],
        actions: [{ kind: "navigate", label: "Create an account", to: "/signup" }],
      };
    }
  }

  // 3) Data questions — only for signed-in, scoped users.
  const wantsData = has(q, "paid", "owe", "overdue", "rent roll", "lease", "expire", "renew", "repair", "vacant", "empty", "collected", "outstanding", "balance", "who");
  if (wantsData && !scope.signedIn) {
    return {
      mode: "locked",
      text: "I answer questions about your own portfolio once you're signed in — your numbers never leave your account.",
      actions: [{ kind: "navigate", label: "Sign in", to: "/signin" }],
    };
  }

  if (wantsData && has(q, "paid", "owe", "overdue", "outstanding", "chase", "behind")) {
    if (!scope.canSeeFinancials)
      return { mode: "locked", text: "Rent figures aren't part of your access. Ask the owner if you need them." };
    if (scope.unpaid.length === 0)
      return { mode: "data", text: "Everyone is paid up this month. Nothing outstanding." };
    return {
      mode: "data",
      text: `${scope.unpaid.length} ${scope.unpaid.length === 1 ? "tenant hasn't" : "tenants haven't"} fully paid this month.`,
      bullets: scope.unpaid.map(
        (p) => `${p.name} — ${p.where} — ${money(p.balanceCents)} ${p.overdue ? "overdue" : "still due"}`,
      ),
      actions: [
        { kind: "confirm", label: `Send ${scope.unpaid.length === 1 ? "a" : "all"} rent reminder${scope.unpaid.length === 1 ? "" : "s"}`, plan: reminderPlan(scope) },
        { kind: "navigate", label: "Open Rent", to: "/app/rent" },
      ],
    };
  }

  if (wantsData && has(q, "rent roll", "collected", "how much rent", "total rent")) {
    if (!scope.canSeeFinancials)
      return { mode: "locked", text: "Rent figures aren't part of your access. Ask the owner if you need them." };
    const r = scope.rentRoll;
    return {
      mode: "data",
      text: `${money(r.collectedCents)} of ${money(r.billedCents)} is in this month.`,
      bullets: [
        `${money(r.outstandingCents)} still outstanding`,
        `${r.occupied} of ${r.units} units lived in`,
      ],
      note: "Figures come straight from your invoices and payments — I report them, I don't calculate them.",
      actions: [{ kind: "navigate", label: "Open Reports", to: "/app/reports" }],
    };
  }

  if (wantsData && has(q, "lease", "expire", "expiry", "end", "renew")) {
    if (scope.leasesEnding.length === 0)
      return { mode: "data", text: "No leases end in the next 90 days." };
    return {
      mode: "data",
      text: `${scope.leasesEnding.length} lease${scope.leasesEnding.length === 1 ? "" : "s"} end${scope.leasesEnding.length === 1 ? "s" : ""} in the next 90 days.`,
      bullets: scope.leasesEnding.map((l) => `${l.name} — ${l.where} — ends ${fmtDate(l.end)} (${l.type})`),
      actions: [{ kind: "navigate", label: "Open Leases", to: "/app/leases" }],
    };
  }

  if (wantsData && has(q, "repair", "broken", "fix", "maintenance", "urgent", "emergency")) {
    if (scope.openRepairs.length === 0) return { mode: "data", text: "Nothing is waiting on repair right now." };
    return {
      mode: "data",
      text: `${scope.openRepairs.length} repair${scope.openRepairs.length === 1 ? "" : "s"} still open.`,
      bullets: scope.openRepairs.map((t) => `${t.title} — ${t.where} — ${t.status}`),
      actions: [{ kind: "navigate", label: "Open Maintenance", to: "/app/maintenance" }],
    };
  }

  if (wantsData && has(q, "vacant", "empty", "available")) {
    if (scope.vacancies.length === 0) return { mode: "data", text: "Every unit you look after is lived in." };
    return {
      mode: "data",
      text: `${scope.vacancies.length} unit${scope.vacancies.length === 1 ? " is" : "s are"} empty.`,
      bullets: scope.vacancies.map((v) => `${v.where} — asking ${money(v.rentCents)}`),
      actions: [{ kind: "navigate", label: "Open Listings", to: "/app/listings" }],
    };
  }

  // 4) Last chance: a how-to phrased without "how do I".
  const guide = howTo(q);
  if (guide) return guide;

  return {
    mode: "unknown",
    text: scope.signedIn
      ? "I don't know that one. I can answer questions about your own rent, leases, repairs and vacancies, or walk you through a screen in Keyhold."
      : "I don't know that one. Before you sign in I can explain what Keyhold does, what it costs and how moving your records across works.",
    bullets: scope.signedIn
      ? ["Try: \"Who hasn't paid this month?\"", 'Try: "Which leases end in 90 days?"', 'Try: "How do I add a property manager?"']
      : GUEST_SUGGESTIONS.map((x) => `Try: "${x}"`),
  };
}

/** Public/marketing prompts — never reference a signed-in person's records. */
export const GUEST_SUGGESTIONS = [
  "What does Keyhold do?",
  "How much does it cost?",
  "Does it handle Ontario rent increases?",
  "Can I import my spreadsheet?",
];

export const SUGGESTIONS = [
  "Who hasn't paid this month?",
  "Which leases end in 90 days?",
  "What's my rent roll?",
  "How do I add a property manager?",
];

/** Rate limit bookkeeping — 20 questions per account per calendar month. */
export const limitKey = (userId: string, today: string) => `keyhold.assistant.${userId}.${today.slice(0, 7)}`;