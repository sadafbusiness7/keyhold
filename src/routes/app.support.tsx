import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone, EnvelopeSimple, BookOpen } from "@phosphor-icons/react";
import { PageHeader } from "@/components/keyhold/app-shell";

export const Route = createFileRoute("/app/support")({
  head: () => ({
    meta: [
      { title: "Support centre — Keyhold" },
      { name: "description", content: "Short answers to common questions, plus a real person you can phone." },
      { property: "og:title", content: "Support centre — Keyhold" },
      { property: "og:description", content: "Help written in plain language, with a phone number that works." },
    ],
  }),
  component: SupportPage,
});

const faqs = [
  {
    q: "How do I record a payment?",
    a: "Open Rent and press 'Record a payment' at the top right. Choose the tenant, type the amount, and save. The rent ledger updates right away.",
  },
  {
    q: "What does 'Overdue' mean?",
    a: "The rent due date has passed and money is still owed. Overdue rows show a red edge, a red icon and the word Overdue, so it's never colour alone.",
  },
  {
    q: "Can my tenant report a repair themselves?",
    a: "Yes. Tenants use the tenant portal to send a repair request with photos, urgency and permission to enter. It lands in your Maintenance list.",
  },
  {
    q: "Do you handle Ontario LTB notices?",
    a: "Keyhold prepares drafts of common notices such as N1, N4 and N12. You review and sign before anything is sent.",
  },
];

function SupportPage() {
  return (
    <>
      <PageHeader title="Support centre" subtitle="Plain answers, and a person to call if you'd rather talk." />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <a href="tel:18005550142" className="card-soft flex min-h-11 items-center gap-3 p-4 text-sm font-semibold text-navy hover:bg-navy-soft">
          <Phone weight="duotone" className="h-5 w-5 text-action" aria-hidden="true" /> 1-800-555-0142
        </a>
        <a href="mailto:help@keyhold.ca" className="card-soft flex min-h-11 items-center gap-3 p-4 text-sm font-semibold text-navy hover:bg-navy-soft">
          <EnvelopeSimple weight="duotone" className="h-5 w-5 text-action" aria-hidden="true" /> help@keyhold.ca
        </a>
        <Link to="/app" className="card-soft flex min-h-11 items-center gap-3 p-4 text-sm font-semibold text-navy hover:bg-navy-soft">
          <BookOpen weight="duotone" className="h-5 w-5 text-action" aria-hidden="true" /> Back to your dashboard
        </Link>
      </div>

      <ul className="space-y-3">
        {faqs.map((f) => (
          <li key={f.q} className="card-soft p-5">
            <h2 className="font-display text-base font-bold">{f.q}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
