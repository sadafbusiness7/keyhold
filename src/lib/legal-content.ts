/**
 * LEGAL CONTENT — pure data, no React.
 * ------------------------------------
 * Every public legal page is generated from this file so a version and an
 * effective date always travel with the words. All copy is PLACEHOLDER and is
 * marked "PENDING LEGAL REVIEW": Canadian counsel must review before launch.
 */

export type LegalDocId = "terms" | "privacy" | "cookies" | "accessibility" | "security";

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  table?: { columns: string[]; rows: string[][]; caption?: string };
};

export type LegalDoc = {
  id: LegalDocId;
  path: string;
  title: string;
  short: string;
  summary: string;
  version: string;
  effectiveDate: string;
  reviewStatus: "pending-legal-review" | "approved";
  authority: { label: string; url: string };
  sections: LegalSection[];
};

export const LEGAL_LAST_REVIEWED = "2026-08-01";

/** Third-party processors — surfaced on the privacy page and in-app. */
export const PROCESSORS: { name: string; purpose: string; data: string; location: string }[] = [
  { name: "Payments provider", purpose: "Rent payment processing and payouts", data: "Name, email, bank/e-transfer references, payment amounts", location: "Canada (with US failover)" },
  { name: "Tenant screening provider", purpose: "Credit and reference checks, with consent", data: "Applicant name, date of birth, address history, consent record", location: "Canada" },
  { name: "Email & SMS provider", purpose: "Receipts, reminders, notices and digests", data: "Name, email, mobile number, message content", location: "United States" },
  { name: "AI assistant provider", purpose: "Plain-language explanations and drafting help", data: "Prompt text you send; no bulk tenant records", location: "United States" },
  { name: "Cloud hosting & backups", purpose: "Running Keyhold and storing your records", data: "All account records, encrypted at rest", location: "Canada" },
  { name: "Error & usage analytics", purpose: "Diagnosing faults and measuring reliability", data: "Device, browser, page and error details", location: "United States / European Union" },
];

/** Cookie categories used by the cookie notice and the banner. */
export const COOKIE_CATEGORIES = [
  { key: "essential", label: "Strictly necessary", required: true, body: "Sign-in, session security and load balancing. Keyhold cannot work without these." },
  { key: "preferences", label: "Preferences", required: false, body: "Remembers your theme, sidebar state and saved report views." },
  { key: "analytics", label: "Analytics", required: false, body: "Counts page views and errors so we can fix what breaks. Aggregated, never sold." },
] as const;
export type CookieCategory = (typeof COOKIE_CATEGORIES)[number]["key"];

const pending = "PENDING LEGAL REVIEW";

export const LEGAL_DOCS: Record<LegalDocId, LegalDoc> = {
  terms: {
    id: "terms",
    path: "/legal/terms",
    title: "Terms of Service",
    short: "Terms",
    summary: "The agreement between you and Keyhold: what we provide, what you agree to, and the limits of both.",
    version: "v0.9 draft",
    effectiveDate: "2026-08-01",
    reviewStatus: "pending-legal-review",
    authority: { label: "Consumer protection guidance (Government of Canada)", url: "https://ised-isde.canada.ca/site/office-consumer-affairs/en" },
    sections: [
      {
        heading: "1. Who we are",
        paragraphs: [
          `${pending}. Keyhold is rental management software for Canadian landlords. These terms form the agreement between you and Keyhold for use of the website, the manager application, the owner portal and the tenant portal.`,
        ],
      },
      {
        heading: "2. Your account",
        bullets: [
          "You must be 18 or older and legally able to enter a contract.",
          "You are responsible for what happens under your sign-in, including anything your team members do.",
          "Keep your password and recovery codes private, and tell us straight away if you think someone else has access.",
        ],
      },
      {
        heading: "3. What Keyhold is not",
        paragraphs: [
          "Keyhold is general information and record-keeping software. It is not a law firm, not a property manager and not a tax adviser. Forms, notices, calculations and explanations are provided for convenience and must be reviewed by you before they are used or served.",
        ],
      },
      {
        heading: "4. Your content and your tenants' information",
        paragraphs: [
          "You keep ownership of the records you enter. You give Keyhold permission to store and process them so we can run the service for you. You are responsible for having the legal basis and consent needed to collect and share tenant information with us.",
        ],
      },
      { heading: "5. Fees and cancellation", bullets: ["Subscriptions are billed monthly in Canadian dollars, per unit, in advance.", "You may cancel at any time; access continues to the end of the paid period.", "Taxes are added where applicable."] },
      { heading: "6. Availability, liability and changes", paragraphs: [`${pending}. Placeholder wording for service levels, limitation of liability, indemnity, governing law (proposed: Province of Ontario) and how we notify you of changes to these terms.`] },
      { heading: "7. Contact", paragraphs: ["Questions about these terms: legal@keyhold.ca"] },
    ],
  },

  privacy: {
    id: "privacy",
    path: "/legal/privacy",
    title: "Privacy Policy",
    short: "Privacy",
    summary: "What personal information Keyhold collects, why, how long we keep it, who processes it, and the rights you have under PIPEDA.",
    version: "v0.9 draft",
    effectiveDate: "2026-08-01",
    reviewStatus: "pending-legal-review",
    authority: { label: "Office of the Privacy Commissioner of Canada — PIPEDA", url: "https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/" },
    sections: [
      {
        heading: "Our commitment",
        paragraphs: [
          `${pending}. Keyhold handles personal information under the Personal Information Protection and Electronic Documents Act (PIPEDA) and, where they apply, provincial privacy laws in Alberta, British Columbia and Quebec. We collect the least we can, use it only for the purposes described here, and tell you plainly when that changes.`,
        ],
      },
      {
        heading: "What we collect and why",
        table: {
          columns: ["Information", "Why we need it", "Kept for"],
          rows: [
            ["Landlord account details (name, email, phone, business number)", "Running your account, billing, support", "Life of the account + 7 years for tax records"],
            ["Property, unit and lease records", "The core service", "Life of the account + 7 years"],
            ["Tenant contact details and lease terms", "Rent tracking, receipts, notices, maintenance", "Configurable; default 24 months after move-out"],
            ["Rent payments and receipts", "Financial records and CRA reporting", "7 years (Income Tax Act)"],
            ["Screening and reference results", "Assessing an application, with consent", "Configurable; default 12 months"],
            ["Consent records", "Proving what was agreed, when and how", "7 years after withdrawal"],
            ["Sign-in and security logs", "Detecting and investigating misuse", "12 months"],
            ["Support messages", "Answering your question", "24 months"],
          ],
          caption: "Retention defaults minimise data. Owners can shorten them in Settings → Data retention.",
        },
      },
      {
        heading: "Third-party processors",
        paragraphs: ["We use a small number of service providers to run Keyhold. Each is bound by contract to use your information only for the purpose we set."],
        table: {
          columns: ["Provider role", "Purpose", "Information shared", "Where it is processed"],
          rows: PROCESSORS.map((p) => [p.name, p.purpose, p.data, p.location]),
        },
      },
      {
        heading: "Cross-border transfer",
        paragraphs: [
          "Some processors store or process information outside Canada, mainly in the United States and the European Union, as shown above. While information is in another country it is subject to that country's laws, and courts or authorities there may be able to compel access to it. We use contractual protections comparable to those required in Canada. If you would rather not have information handled this way, contact us before entering tenant records — some features cannot run without these providers.",
        ],
      },
      {
        heading: "Artificial intelligence",
        paragraphs: [
          "The Keyhold assistant explains records in plain language and drafts wording. It never decides to serve a notice, never calculates money and never scores a tenant. Prompts are sent to our AI provider; we do not send bulk tenant records and we do not allow your data to be used to train third-party models.",
        ],
      },
      { heading: "Your rights under PIPEDA", bullets: ["Access — download everything we hold about you, in JSON and CSV.", "Correction — ask us to fix anything inaccurate.", "Withdrawal of consent — subject to legal and contractual limits.", "Deletion — close your account, with a grace period and clear notes on what must be kept.", "Complaint — to us first, and then to the Office of the Privacy Commissioner of Canada."] },
      { heading: "Contact our privacy officer", paragraphs: ["Privacy Officer, Keyhold — privacy@keyhold.ca. We respond within 30 days as PIPEDA requires."] },
    ],
  },

  cookies: {
    id: "cookies",
    path: "/legal/cookies",
    title: "Cookie Notice",
    short: "Cookies",
    summary: "The small files Keyhold stores in your browser, what each one is for, and how to turn the optional ones off.",
    version: "v0.9 draft",
    effectiveDate: "2026-08-01",
    reviewStatus: "pending-legal-review",
    authority: { label: "OPC guidance on online tracking", url: "https://www.priv.gc.ca/en/privacy-topics/technology/online-privacy-tracking-cookies/" },
    sections: [
      { heading: "What we use", paragraphs: [`${pending}. Keyhold uses a short list of cookies and similar browser storage. We do not use advertising cookies and we do not sell information to advertisers.`] },
      {
        heading: "Categories",
        table: {
          columns: ["Category", "Required", "What it does"],
          rows: COOKIE_CATEGORIES.map((c) => [c.label, c.required ? "Yes" : "No — you choose", c.body]),
        },
      },
      { heading: "Your choices", paragraphs: ["Use the cookie preferences control at the bottom of any public page, or clear cookies in your browser settings. Turning off preferences cookies means Keyhold forgets your theme and saved views."] },
    ],
  },

  accessibility: {
    id: "accessibility",
    path: "/legal/accessibility",
    title: "Accessibility Statement",
    short: "Accessibility",
    summary: "Our commitment to WCAG 2.1 Level AA, what we have done, what we know is imperfect, and how to tell us.",
    version: "v0.9 draft",
    effectiveDate: "2026-08-01",
    reviewStatus: "pending-legal-review",
    authority: { label: "WCAG 2.1 (W3C)", url: "https://www.w3.org/TR/WCAG21/" },
    sections: [
      { heading: "Our commitment", paragraphs: [`${pending}. Keyhold aims to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA, and to meet the requirements of the Accessibility for Ontarians with Disabilities Act (AODA) and the Accessible Canada Act as they apply to us.`] },
      { heading: "What we build in", bullets: ["Every control reachable and operable by keyboard, with a visible focus ring.", "Touch targets at least 44 by 44 pixels, body text at least 14 pixels.", "Colour is never the only way information is conveyed — status always carries a label.", "Text contrast meets 4.5:1, and large text 3:1, in both light and dark themes.", "Motion respects prefers-reduced-motion: charts and transitions render instantly.", "Forms use real labels, described errors and logical heading order."] },
      { heading: "Known gaps", bullets: ["Some PDF exports are not yet fully tagged for screen readers.", "Complex charts provide a data table alternative; a few older screens are still being converted.", "Third-party embedded content is outside our direct control."] },
      { heading: "Tell us", paragraphs: ["If something blocks you, email accessibility@keyhold.ca with the page and what happened. We aim to reply within 5 business days and will offer the information another way in the meantime."] },
    ],
  },

  security: {
    id: "security",
    path: "/legal/security",
    title: "Security",
    short: "Security",
    summary: "How Keyhold protects records, what we ask of you, and how to report a security concern.",
    version: "v0.9 draft",
    effectiveDate: "2026-08-01",
    reviewStatus: "pending-legal-review",
    authority: { label: "Canadian Centre for Cyber Security", url: "https://www.cyber.gc.ca/en" },
    sections: [
      { heading: "How records are protected", bullets: ["Encrypted in transit (TLS 1.2+) and at rest.", "Row-level access rules: a property manager only ever loads the properties assigned to them.", "Least-privilege internal access, reviewed quarterly, with an audit log of money- and security-relevant events.", "Daily encrypted backups with restore testing.", `${pending} — placeholder for third-party penetration testing and certification claims. Do not publish until evidence exists.`] },
      { heading: "What we ask of you", bullets: ["Turn on multi-factor authentication and store your recovery codes offline.", "Give each team member their own sign-in — never share one.", "Review active sessions and login history if anything looks unfamiliar.", "Remove access the day someone leaves your team."] },
      { heading: "Report a security concern", paragraphs: ["Email security@keyhold.ca with steps to reproduce. We acknowledge within one business day and will keep you updated until it is closed. Please give us a reasonable window to fix an issue before disclosing it publicly; we will not pursue good-faith research."] },
      { heading: "If a breach happens", paragraphs: ["If a breach creates a real risk of significant harm, we notify affected people and the Office of the Privacy Commissioner of Canada as PIPEDA requires, and we keep a breach record for 24 months."] },
    ],
  },
};

export const LEGAL_ORDER: LegalDocId[] = ["terms", "privacy", "cookies", "accessibility", "security"];
export const legalDocList = () => LEGAL_ORDER.map((id) => LEGAL_DOCS[id]);
