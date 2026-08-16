import { createFileRoute, Link } from "@tanstack/react-router";
import { legalDocList, LEGAL_LAST_REVIEWED } from "@/lib/legal-content";
import { CookiePreferences } from "@/components/keyhold/legal-ui";
import { dayOnly } from "@/lib/mock-consent";

export const Route = createFileRoute("/legal/")({
  head: () => ({
    meta: [
      { title: "Legal, privacy & trust — Keyhold" },
      { name: "description", content: "Keyhold's terms, PIPEDA privacy policy, cookie notice, accessibility statement and security page, in one place." },
      { property: "og:title", content: "Legal, privacy & trust — Keyhold" },
      { property: "og:description", content: "Everything a Canadian landlord's tenants might ask about how Keyhold handles their information." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LegalIndex,
});

function LegalIndex() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link to="/" className="inline-flex min-h-11 items-center text-sm font-semibold text-action hover:underline">
        ← Keyhold
      </Link>
      <h1 className="mt-3 font-display text-2xl font-extrabold text-navy sm:text-3xl">Legal, privacy & trust</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Plain-language documents about how Keyhold works and how information is handled. Every page below is draft
        wording pending review by Canadian counsel. Last internal review {dayOnly(LEGAL_LAST_REVIEWED)}.
      </p>

      <ul className="mt-6 space-y-2">
        {legalDocList().map((d) => (
          <li key={d.id}>
            <Link
              to={d.path as "/legal/terms"}
              className="card-soft block p-4 hover:border-action"
            >
              <span className="font-display text-base font-bold text-navy">{d.title}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{d.summary}</span>
              <span className="tnum mt-1 block text-xs text-muted-foreground">
                {d.version} · Effective {dayOnly(d.effectiveDate)} · Pending legal review
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <CookiePreferences />
    </main>
  );
}
