import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  HandWaving,
  Buildings,
  Users,
  BellRinging,
  Flag,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash,
  UploadSimple,
  CheckCircle,
  MapPin,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { PageHeader } from "@/components/keyhold/app-shell";
import { useSetup } from "@/lib/mock-onboarding";
import { PROVINCES } from "@/lib/import-engine";

export const Route = createFileRoute("/app/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your portfolio — Keyhold" },
      { name: "description", content: "A guided ten-minute setup: business basics, your first property and units, tenants, and the reminders you want." },
      { property: "og:title", content: "Set up your portfolio — Keyhold" },
      { property: "og:description", content: "Skippable, resumable, and your progress is saved as you go." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OnboardingPage,
});

const STEPS = [
  { key: "welcome", label: "Welcome", Icon: HandWaving },
  { key: "business", label: "Business basics", Icon: Buildings },
  { key: "property", label: "First property", Icon: MapPin },
  { key: "tenants", label: "Tenants", Icon: Users },
  { key: "notifications", label: "Reminders", Icon: BellRinging },
  { key: "done", label: "You're set", Icon: Flag },
] as const;

/** MOCK Canada Post AddressComplete — a real key would call their API. */
const ADDRESS_SUGGESTIONS = [
  { address: "412 Lansdowne Ave", city: "Toronto", province: "ON", postal: "M6H 3Y2" },
  { address: "88 Ottawa St N", city: "Hamilton", province: "ON", postal: "L8H 3Z1" },
  { address: "1450 W 12th Ave", city: "Vancouver", province: "BC", postal: "V6H 1M4" },
  { address: "2210 Rue Sainte-Catherine E", city: "Montréal", province: "QC", postal: "H2K 2J4" },
  { address: "10420 Whyte Ave", city: "Edmonton", province: "AB", postal: "T6E 1Z9" },
];

const primary =
  "inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90 disabled:opacity-50";
const ghost =
  "inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft";
const input = "mt-1 min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm";

function OnboardingPage() {
  const { setup, hydrated, setStep, saveDraft, markDone, finishSetup, skipSetup } = useSetup();
  const navigate = useNavigate();
  const draft = setup.draft;
  const step = Math.min(setup.step, STEPS.length - 1);
  const current = STEPS[step]!;

  if (!hydrated) {
    return (
      <>
        <PageHeader title="Set up your portfolio" />
        <div className="card-soft h-64 animate-pulse rounded-2xl border border-border" aria-label="Loading your progress" />
      </>
    );
  }

  const go = (n: number) => setStep(Math.max(0, Math.min(STEPS.length - 1, n)));

  return (
    <>
      <PageHeader
        title="Set up your portfolio"
        subtitle="About 10 minutes. You can stop any time — we save where you got to."
        action={
          <button
            type="button"
            onClick={() => {
              skipSetup();
              toast("Setup paused. The checklist in the sidebar will bring you back.");
              void navigate({ to: "/app" });
            }}
            className={ghost}
          >
            Skip for now
          </button>
        }
      />

      <ol className="mb-4 flex flex-wrap gap-2" aria-label="Setup steps">
        {STEPS.map((s, i) => (
          <li
            key={s.key}
            aria-current={i === step ? "step" : undefined}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              i === step
                ? "border-action bg-action text-primary-foreground"
                : i < step
                  ? "border-success bg-success-soft/40 text-navy"
                  : "border-border text-muted-foreground"
            }`}
          >
            {i + 1}. {s.label}
          </li>
        ))}
      </ol>

      <div
        className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={STEPS.length - 1}
        aria-valuenow={step}
        aria-label="Setup progress"
      >
        <div
          className="h-full rounded-full bg-action transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
        />
      </div>

      <section className="card-soft rounded-2xl border border-border p-4 sm:p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy">
          <current.Icon weight="duotone" className="h-5 w-5" aria-hidden="true" />
          {current.label}
        </h2>

        {step === 0 && (
          <div className="mt-2">
            <p className="text-sm text-muted-foreground">
              Let's set up your portfolio. About 10 minutes — your business details, one property with its units, the
              people living in them, and the reminders you want. Already have a spreadsheet? Import it instead and
              you're done in two.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className={primary} onClick={() => go(1)}>
                Let's go <ArrowRight weight="duotone" className="h-4 w-4" aria-hidden="true" />
              </button>
              <Link to="/app/import" className={ghost}>
                <UploadSimple weight="duotone" className="h-4 w-4" aria-hidden="true" /> I have a spreadsheet
              </Link>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="font-medium text-navy">Business or personal name</span>
              <input
                className={input}
                value={draft.businessName}
                onChange={(e) => saveDraft({ businessName: e.target.value })}
                placeholder="e.g. Reid Property Co."
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-navy">Province</span>
              <select className={input} value={draft.province} onChange={(e) => saveDraft({ province: e.target.value })}>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <p className="self-end rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              Your province decides which lease form, notices and rules Keyhold uses — in Ontario that's the standard
              lease and N-series notices. You can add properties in other provinces later.
            </p>
            <div className="sm:col-span-2 mt-2 flex flex-wrap justify-between gap-2">
              <button type="button" className={ghost} onClick={() => go(0)}>
                <ArrowLeft weight="duotone" className="h-4 w-4" aria-hidden="true" /> Back
              </button>
              <button
                type="button"
                className={primary}
                disabled={!draft.businessName.trim()}
                onClick={() => {
                  markDone("business");
                  go(2);
                }}
              >
                Save and continue <ArrowRight weight="duotone" className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && <PropertyStep onBack={() => go(1)} onNext={() => { markDone("property"); go(3); }} />}

        {step === 3 && (
          <div className="mt-2">
            <p className="text-sm text-muted-foreground">
              Add the people living in your units, or invite them so they set up their own portal. Got a spreadsheet
              of tenants? Import it — you can attach their current lease PDFs at the same time.
            </p>

            <ul className="mt-3 space-y-2">
              {draft.tenants.map((t, i) => (
                <li key={i} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_1fr_8rem_auto]">
                  <label className="block text-xs">
                    <span className="text-muted-foreground">Full name</span>
                    <input
                      className={input}
                      value={t.name}
                      onChange={(e) =>
                        saveDraft({ tenants: draft.tenants.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })
                      }
                    />
                  </label>
                  <label className="block text-xs">
                    <span className="text-muted-foreground">Email</span>
                    <input
                      type="email"
                      className={input}
                      value={t.email}
                      onChange={(e) =>
                        saveDraft({ tenants: draft.tenants.map((x, j) => (j === i ? { ...x, email: e.target.value } : x)) })
                      }
                    />
                  </label>
                  <label className="block text-xs">
                    <span className="text-muted-foreground">Unit</span>
                    <input
                      className={input}
                      value={t.unitLabel}
                      onChange={(e) =>
                        saveDraft({ tenants: draft.tenants.map((x, j) => (j === i ? { ...x, unitLabel: e.target.value } : x)) })
                      }
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => saveDraft({ tenants: draft.tenants.filter((_, j) => j !== i) })}
                    className="mt-4 grid h-11 w-11 place-items-center rounded-full border border-border text-navy hover:bg-navy-soft"
                    aria-label={`Remove tenant ${i + 1}`}
                  >
                    <Trash weight="duotone" className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className={ghost}
                onClick={() =>
                  saveDraft({
                    tenants: [...draft.tenants, { name: "", email: "", unitLabel: draft.units[0]?.label ?? "Unit 1" }],
                  })
                }
              >
                <Plus weight="duotone" className="h-4 w-4" aria-hidden="true" /> Add a tenant
              </button>
              <Link to="/app/import" search={{ entity: "tenants" }} className={ghost}>
                <UploadSimple weight="duotone" className="h-4 w-4" aria-hidden="true" /> Import from a spreadsheet
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap justify-between gap-2">
              <button type="button" className={ghost} onClick={() => go(2)}>
                <ArrowLeft weight="duotone" className="h-4 w-4" aria-hidden="true" /> Back
              </button>
              <button
                type="button"
                className={primary}
                onClick={() => {
                  if (draft.tenants.length) markDone("tenants");
                  go(4);
                }}
              >
                {draft.tenants.length ? "Save and continue" : "I'll do this later"}
                <ArrowRight weight="duotone" className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="mt-2">
            <p className="text-sm text-muted-foreground">
              We've pre-selected what most landlords keep on. Change any of it later in Settings.
            </p>
            <ul className="mt-3 space-y-2">
              {(
                [
                  ["rentDue", "Tell me when rent is due"],
                  ["rentReceived", "Tell me when rent lands"],
                  ["maintenance", "Tell me about new repair requests"],
                  ["leaseExpiring", "Warn me 90 days before a lease ends"],
                  ["digest", "Send me a weekly summary instead of every alert"],
                ] as const
              ).map(([key, label]) => (
                <li key={key}>
                  <label className="flex min-h-11 items-center gap-3 rounded-xl border border-border px-3 text-sm">
                    <input
                      type="checkbox"
                      checked={draft.notify[key]}
                      onChange={(e) => saveDraft({ notify: { ...draft.notify, [key]: e.target.checked } })}
                      className="h-5 w-5 rounded border-input"
                    />
                    <span className="text-navy">{label}</span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap justify-between gap-2">
              <button type="button" className={ghost} onClick={() => go(3)}>
                <ArrowLeft weight="duotone" className="h-4 w-4" aria-hidden="true" /> Back
              </button>
              <button
                type="button"
                className={primary}
                onClick={() => {
                  markDone("notifications");
                  markDone("payments");
                  finishSetup();
                  go(5);
                }}
              >
                Finish setup <ArrowRight weight="duotone" className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {step === 5 && <DoneStep />}
      </section>
    </>
  );
}

function PropertyStep({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const { setup, saveDraft } = useSetup();
  const draft = setup.draft;
  const [query, setQuery] = useState(draft.address);
  const [open, setOpen] = useState(false);

  useEffect(() => setQuery(draft.address), [draft.address]);

  const matches = ADDRESS_SUGGESTIONS.filter((s) =>
    `${s.address} ${s.city}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const setUnit = (i: number, patch: Partial<{ label: string; bedrooms: string; rent: string }>) =>
    saveDraft({ units: draft.units.map((u, j) => (j === i ? { ...u, ...patch } : u)) });

  const ready = draft.propertyName.trim() && draft.address.trim() && draft.units.some((u) => u.label.trim() && u.rent.trim());

  return (
    <div className="mt-2 grid gap-3">
      <label className="block text-sm">
        <span className="font-medium text-navy">What do you call this property?</span>
        <input
          className={input}
          value={draft.propertyName}
          onChange={(e) => saveDraft({ propertyName: e.target.value })}
          placeholder="e.g. Lansdowne Duplex"
        />
      </label>

      <div className="relative">
        <label className="block text-sm">
          <span className="font-medium text-navy">Street address</span>
          <input
            className={input}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              saveDraft({ address: e.target.value });
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            aria-controls="kh-address-list"
            placeholder="Start typing — we'll finish it"
          />
        </label>
        {open && query.trim() && matches.length > 0 && (
          <ul
            id="kh-address-list"
            className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg"
          >
            {matches.map((s) => (
              <li key={s.postal}>
                <button
                  type="button"
                  className="block min-h-11 w-full px-3 py-2 text-left text-sm hover:bg-navy-soft"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    saveDraft({ address: s.address, city: s.city, postal: s.postal, province: s.province });
                    setQuery(s.address);
                    setOpen(false);
                  }}
                >
                  <span className="font-medium text-navy">{s.address}</span>
                  <span className="block text-xs text-muted-foreground">
                    {s.city}, {s.province} {s.postal}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-1 text-xs text-muted-foreground">Address lookup covers every Canadian civic address.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-navy">City</span>
          <input className={input} value={draft.city} onChange={(e) => saveDraft({ city: e.target.value })} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-navy">Postal code</span>
          <input className={input} value={draft.postal} onChange={(e) => saveDraft({ postal: e.target.value })} />
        </label>
      </div>

      <fieldset className="rounded-xl border border-border p-3">
        <legend className="px-1 text-sm font-semibold text-navy">Units and rent</legend>
        <ul className="space-y-2">
          {draft.units.map((u, i) => (
            <li key={i} className="grid gap-2 sm:grid-cols-[1fr_7rem_9rem_auto]">
              <label className="block text-xs">
                <span className="text-muted-foreground">Unit</span>
                <input className={input} value={u.label} onChange={(e) => setUnit(i, { label: e.target.value })} />
              </label>
              <label className="block text-xs">
                <span className="text-muted-foreground">Bedrooms</span>
                <input
                  className={input}
                  inputMode="numeric"
                  value={u.bedrooms}
                  onChange={(e) => setUnit(i, { bedrooms: e.target.value })}
                />
              </label>
              <label className="block text-xs">
                <span className="text-muted-foreground">Monthly rent</span>
                <input
                  className={`${input} money`}
                  inputMode="decimal"
                  value={u.rent}
                  onChange={(e) => setUnit(i, { rent: e.target.value })}
                  placeholder="1,850.00"
                />
              </label>
              <button
                type="button"
                disabled={draft.units.length === 1}
                onClick={() => saveDraft({ units: draft.units.filter((_, j) => j !== i) })}
                className="mt-4 grid h-11 w-11 place-items-center rounded-full border border-border text-navy hover:bg-navy-soft disabled:opacity-40"
                aria-label={`Remove unit ${i + 1}`}
              >
                <Trash weight="duotone" className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className={`${ghost} mt-2`}
          onClick={() =>
            saveDraft({ units: [...draft.units, { label: `Unit ${draft.units.length + 1}`, bedrooms: "1", rent: "" }] })
          }
        >
          <Plus weight="duotone" className="h-4 w-4" aria-hidden="true" /> Add another unit
        </button>
      </fieldset>

      <div className="flex flex-wrap justify-between gap-2">
        <button type="button" className={ghost} onClick={onBack}>
          <ArrowLeft weight="duotone" className="h-4 w-4" aria-hidden="true" /> Back
        </button>
        <button type="button" className={primary} disabled={!ready} onClick={onNext}>
          Save and continue <ArrowRight weight="duotone" className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function DoneStep() {
  const { setup } = useSetup();
  const name = setup.draft.businessName || "your portfolio";
  return (
    <div className="mt-2">
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <CheckCircle weight="duotone" className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
        {name} is set up. Your dashboard is live — rent collected, what's due, and anything that needs you.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/app" className={primary}>
          Open my dashboard <ArrowRight weight="duotone" className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link to="/app/import" className={ghost}>
          <UploadSimple weight="duotone" className="h-4 w-4" aria-hidden="true" /> Import my history too
        </Link>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Suggested next: send this month's rent reminders from the Rent page.
      </p>
    </div>
  );
}
