/**
 * LEGAL UI — the reusable trust surface.
 *
 * <LegalDisclaimer /> is the single component used on every notice, lease, tax
 * and legal screen: "General information, not legal advice", a source link and
 * an effective date. Everything else here renders the public legal pages.
 */
import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Scales, ArrowSquareOut, SealWarning, Cookie, Check } from "@phosphor-icons/react";
import { LEGAL_DOCS, COOKIE_CATEGORIES, legalDocList, type LegalDoc, type LegalSection } from "@/lib/legal-content";
import { useOptionalConsent } from "@/lib/mock-consent";
import { dayOnly } from "@/lib/mock-consent";

export type DisclaimerSource = { label: string; url: string; version?: string; effectiveDate: string };

/**
 * "General information, not legal advice" + source + effective date.
 * Use on every notice, lease, tax and legal surface.
 */
export function LegalDisclaimer({
  source,
  children,
  className = "",
}: {
  source: DisclaimerSource;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="note"
      className={`rounded-xl border border-border bg-navy-soft p-3 text-xs leading-relaxed text-navy ${className}`}
    >
      <p className="flex gap-2">
        <Scales weight="duotone" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          <strong>General information, not legal advice.</strong>{" "}
          {children ?? "Keyhold fills this in from your records and keeps a copy. Confirm the current rules for your situation, or get legal advice."}
        </span>
      </p>
      <p className="mt-2 flex flex-wrap items-center gap-2 pl-6">
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-background px-3 font-medium text-navy hover:bg-navy-soft"
        >
          <ArrowSquareOut weight="duotone" className="h-3.5 w-3.5" aria-hidden="true" />
          {source.label}
        </a>
        <span className="tnum text-muted-foreground">
          {source.version ? `${source.version} · ` : ""}Effective {dayOnly(source.effectiveDate)}
        </span>
      </p>
    </div>
  );
}

/** Shorthand: the disclaimer for one of our own legal documents. */
export function DocDisclaimer({ docId, children }: { docId: keyof typeof LEGAL_DOCS; children?: ReactNode }) {
  const doc = LEGAL_DOCS[docId];
  return (
    <LegalDisclaimer
      source={{ label: doc.authority.label, url: doc.authority.url, version: doc.version, effectiveDate: doc.effectiveDate }}
    >
      {children}
    </LegalDisclaimer>
  );
}

export function PendingReviewBanner({ doc }: { doc: LegalDoc }) {
  if (doc.reviewStatus !== "pending-legal-review") return null;
  return (
    <p className="flex gap-2 rounded-xl border border-warning/40 bg-warning-soft p-3 text-xs leading-relaxed text-navy">
      <SealWarning weight="duotone" className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
      <span>
        <strong>Pending legal review.</strong> This is placeholder wording written by the Keyhold team. Canadian counsel
        must review and approve it before launch. Do not rely on it as a final agreement.
      </span>
    </p>
  );
}

function SectionBlock({ section }: { section: LegalSection }) {
  return (
    <section className="mt-6">
      <h2 className="font-display text-base font-bold text-navy">{section.heading}</h2>
      {section.paragraphs?.map((p) => (
        <p key={p.slice(0, 24)} className="mt-2 text-sm leading-relaxed text-foreground">
          {p}
        </p>
      ))}
      {section.bullets ? (
        <ul className="mt-2 space-y-1.5">
          {section.bullets.map((b) => (
            <li key={b.slice(0, 24)} className="flex gap-2 text-sm leading-relaxed text-foreground">
              <Check weight="bold" className="mt-1 h-3.5 w-3.5 shrink-0 text-action" aria-hidden="true" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {section.table ? (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm">
            {section.table.caption ? (
              <caption className="pb-2 text-left text-xs text-muted-foreground">{section.table.caption}</caption>
            ) : null}
            <thead className="bg-surface-sunk text-left">
              <tr>
                {section.table.columns.map((c) => (
                  <th key={c} scope="col" className="px-3 py-2 font-semibold text-navy">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.table.rows.map((r) => (
                <tr key={r.join("|")} className="border-t border-border align-top">
                  {r.map((cell, i) => (
                    <td key={i} className={`px-3 py-2 ${i === 0 ? "font-medium text-navy" : "text-muted-foreground"}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

/** Full document body — used by public pages and the in-app legal hub. */
export function LegalDocBody({ doc }: { doc: LegalDoc }) {
  return (
    <article>
      <PendingReviewBanner doc={doc} />
      <p className="mt-3 text-sm text-muted-foreground">{doc.summary}</p>
      <p className="tnum mt-1 text-xs text-muted-foreground">
        {doc.version} · Effective {dayOnly(doc.effectiveDate)}
      </p>
      {doc.sections.map((s) => (
        <SectionBlock key={s.heading} section={s} />
      ))}
    </article>
  );
}

export function LegalNav({ activeId }: { activeId?: string }) {
  return (
    <nav aria-label="Legal documents">
      <ul className="flex flex-wrap gap-1.5">
        {legalDocList().map((d) => (
          <li key={d.id}>
            <Link
              to={d.path as "/legal/terms"}
              aria-current={activeId === d.id ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold ${
                activeId === d.id ? "bg-navy text-primary-foreground" : "border border-border text-navy hover:bg-navy-soft"
              }`}
            >
              {d.short}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Cookie preference control shown at the foot of every public legal page. */
export function CookiePreferences() {
  const consent = useOptionalConsent();
  const [saved, setSaved] = useState(false);
  if (!consent) return null;
  return (
    <section className="card-soft mt-8 p-4">
      <h2 className="flex items-center gap-2 font-display text-base font-bold text-navy">
        <Cookie weight="duotone" className="h-5 w-5 text-action" aria-hidden="true" /> Cookie preferences
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Change these at any time. Nothing here is used for advertising.</p>
      <ul className="mt-3 space-y-2">
        {COOKIE_CATEGORIES.map((c) => (
          <li key={c.key}>
            <label className="flex min-h-11 items-center gap-3 rounded-xl border border-border px-3 py-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 accent-[var(--action)]"
                checked={c.required ? true : Boolean(consent.cookiePrefs[c.key])}
                disabled={c.required}
                onChange={(e) => {
                  consent.setCookiePref(c.key, e.target.checked);
                  setSaved(true);
                }}
              />
              <span className="min-w-0">
                <span className="block font-medium text-navy">
                  {c.label} {c.required ? <span className="text-xs text-muted-foreground">(always on)</span> : null}
                </span>
                <span className="block text-xs text-muted-foreground">{c.body}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      <p aria-live="polite" className="mt-2 text-xs text-muted-foreground">
        {saved ? "Saved on this device." : "\u00a0"}
      </p>
    </section>
  );
}

/** Public page chrome for a legal document. */
export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link to="/" className="inline-flex min-h-11 items-center text-sm font-semibold text-action hover:underline">
        ← Keyhold
      </Link>
      <h1 className="mt-3 font-display text-2xl font-extrabold text-navy sm:text-3xl">{doc.title}</h1>
      <div className="mt-4">
        <LegalNav activeId={doc.id} />
      </div>
      <div className="mt-6">
        <LegalDocBody doc={doc} />
      </div>
      <CookiePreferences />
      <p className="mt-8 text-xs text-muted-foreground">
        Questions? privacy@keyhold.ca · security@keyhold.ca · accessibility@keyhold.ca
      </p>
    </main>
  );
}
