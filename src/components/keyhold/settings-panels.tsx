/**
 * SETTINGS PANELS — presentation only. Every control is real state in the
 * mock settings store; anything that would need a backend says so with a
 * "wire later" toast instead of pretending.
 */
import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useUnsavedGuard } from "@/lib/use-unsaved-guard";
import { AuditLogPanel, DigestPreview } from "./audit-panels";
import {
  Trash,
  Plus,
  DownloadSimple,
  ShieldCheck,
  DeviceMobile,
  WarningOctagon,
  CreditCard,
  ArrowsClockwise,
  ChatCircleText,
  Check,
  UploadSimple,
} from "@phosphor-icons/react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceDot } from "recharts";
import {
  CHANNELS,
  NOTIFY_EVENTS,
  fillTags,
  useSettings,
  type Channel,
  type NotifyEvent,
  type Template,
} from "@/lib/mock-settings";
import { money, downloadFile } from "@/lib/rent-engine";
import { longDate } from "@/lib/mock-data";
import { PLANS, daysBetween, monthlyCents, planFor, priceCurve, prorationCents, seatsFor } from "@/lib/plan-engine";

export const field =
  "mt-1 min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground";

export function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="card-soft p-4 sm:p-5">
      <h2 className="font-display text-base font-bold text-navy">{title}</h2>
      {hint ? <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-navy">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 shrink-0 accent-[var(--action)]"
      />
      <span className="min-w-0">
        <span className="block font-medium text-navy">{label}</span>
        {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
      </span>
    </label>
  );
}

function SaveBar({ onSave }: { onSave?: () => void }) {
  return (
    <div className="mt-4 flex justify-end">
      <button
        type="button"
        onClick={() => {
          onSave?.();
          toast.success("Saved.");
        }}
        className="inline-flex min-h-11 items-center rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90"
      >
        Save changes
      </button>
    </div>
  );
}

const PROVINCES = ["AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"];

/* ------------------------------ 1. business ------------------------------ */

export function BusinessPanel() {
  const { profile, setProfile } = useSettings();
  return (
    <Section title="Business profile" hint="What tenants and owners see on receipts, notices and leases.">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Business name">
          <input className={field} value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} />
        </Field>
        <Field label="Business number" hint="CRA number shown on tax receipts.">
          <input className={`${field} tnum`} value={profile.businessNumber} onChange={(e) => setProfile({ businessNumber: e.target.value })} />
        </Field>
        <Field label="Street address">
          <input className={field} value={profile.address} onChange={(e) => setProfile({ address: e.target.value })} />
        </Field>
        <Field label="City">
          <input className={field} value={profile.city} onChange={(e) => setProfile({ city: e.target.value })} />
        </Field>
        <Field label="Default province" hint="Sets which standard lease and notices Keyhold suggests.">
          <select className={field} value={profile.province} onChange={(e) => setProfile({ province: e.target.value })}>
            {PROVINCES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
        <Field label="Postal code">
          <input className={`${field} tnum`} value={profile.postal} onChange={(e) => setProfile({ postal: e.target.value.toUpperCase() })} />
        </Field>
        <Field label="Phone">
          <input className={`${field} tnum`} value={profile.phone} onChange={(e) => setProfile({ phone: e.target.value })} />
        </Field>
        <Field label="Email">
          <input type="email" className={field} value={profile.email} onChange={(e) => setProfile({ email: e.target.value })} />
        </Field>
        <Field label="Time zone">
          <select className={field} value={profile.timeZone} onChange={(e) => setProfile({ timeZone: e.target.value })}>
            {["America/St_Johns", "America/Halifax", "America/Toronto", "America/Winnipeg", "America/Edmonton", "America/Vancouver"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Language" hint="French copy is ready to switch on.">
          <select className={field} value={profile.language} onChange={(e) => setProfile({ language: e.target.value as "en" | "fr" })}>
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </Field>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-border p-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-navy-soft font-display text-lg font-extrabold text-navy">
          {profile.name.slice(0, 1)}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-navy">Logo</p>
          <p className="text-xs text-muted-foreground">{profile.logoName ?? "PNG or SVG, shown on receipts and leases."}</p>
        </div>
        <label className="ml-auto inline-flex min-h-11 cursor-pointer items-center rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft">
          Upload logo
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setProfile({ logoName: f.name });
                toast.success("Logo attached.");
              }
            }}
          />
        </label>
      </div>
      <SaveBar />
    </Section>
  );
}

/* --------------------------- 2. notifications ---------------------------- */

const channelLabel: Record<Channel, string> = { email: "Email", sms: "SMS", "in-app": "In-app" };

export function NotificationsPanel() {
  const { notifications, toggleNotify, setDigest } = useSettings();
  return (
    <Section title="Notifications" hint="Choose what you hear about, and how it reaches you.">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[30rem] text-sm">
          <thead className="bg-surface-sunk text-left">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold text-navy">Event</th>
              {CHANNELS.map((c) => (
                <th key={c} scope="col" className="px-3 py-2 text-center font-semibold text-navy">
                  {channelLabel[c]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {NOTIFY_EVENTS.map((e) => (
              <tr key={e.key} className="border-t border-border">
                <th scope="row" className="px-3 py-2 text-left font-medium text-navy">{e.label}</th>
                {CHANNELS.map((c) => (
                  <td key={c} className="px-3 py-2 text-center">
                    <label className="inline-flex min-h-11 min-w-11 items-center justify-center">
                      <span className="sr-only">{`${e.label} by ${channelLabel[c]}`}</span>
                      <input
                        type="checkbox"
                        checked={notifications.matrix[e.key as NotifyEvent][c]}
                        onChange={() => toggleNotify(e.key as NotifyEvent, c)}
                        className="h-4 w-4 accent-[var(--action)]"
                      />
                    </label>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-navy">Summary digest</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["off", "daily", "weekly"] as const).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={notifications.digest === d}
              onClick={() => setDigest(d)}
              className={`min-h-11 rounded-full px-4 text-sm font-semibold capitalize ${
                notifications.digest === d ? "bg-navy text-primary-foreground" : "border border-border text-navy hover:bg-navy-soft"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        {notifications.digest !== "off" && (
          <div className="mt-3">
            <DigestPreview frequency={notifications.digest} />
          </div>
        )}
        {notifications.digest === "off" && (
          <p className="mt-2 text-xs text-muted-foreground">
            Summary emails are off. Turn on daily or weekly to get one email with what needs attention.
          </p>
        )}
      </fieldset>
      <SaveBar />
    </Section>
  );
}

/* ----------------------------- 3. rent rules ----------------------------- */

function CentsInput({ value, onChange }: { value: number; onChange: (cents: number) => void }) {
  return (
    <input
      type="number"
      min={0}
      step="0.01"
      value={(value / 100).toFixed(2)}
      onChange={(e) => onChange(Math.round(Number(e.target.value || 0) * 100))}
      className={`${field} tnum`}
    />
  );
}

export function RentPanel() {
  const { rent, setRent, toggleMethod } = useSettings();
  return (
    <>
      <Section title="Rent & payments" hint="The defaults Keyhold uses when it creates invoices.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Default due day" hint="Day of the month rent is due.">
            <input
              type="number"
              min={1}
              max={28}
              value={rent.dueDay}
              onChange={(e) => setRent({ dueDay: Number(e.target.value) })}
              className={`${field} tnum`}
            />
          </Field>
          <Field label="Grace period (days)" hint="Before rent counts as overdue.">
            <input
              type="number"
              min={0}
              max={30}
              value={rent.graceDays}
              onChange={(e) => setRent({ graceDays: Number(e.target.value) })}
              className={`${field} tnum`}
            />
          </Field>
        </div>
      </Section>

      <Section title="Late fee rules" hint="Provincial rules still apply — Keyhold never charges more than the cap you set.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Fee type">
            <select
              className={field}
              value={rent.lateFeeKind}
              onChange={(e) => setRent({ lateFeeKind: e.target.value as "flat" | "percent" })}
            >
              <option value="flat">Flat amount</option>
              <option value="percent">Percent of rent</option>
            </select>
          </Field>
          {rent.lateFeeKind === "flat" ? (
            <Field label="Flat fee">
              <CentsInput value={rent.lateFeeFlatCents} onChange={(c) => setRent({ lateFeeFlatCents: c })} />
            </Field>
          ) : (
            <Field label="Percent of rent">
              <input
                type="number"
                min={0}
                max={20}
                step="0.5"
                value={rent.lateFeePercent}
                onChange={(e) => setRent({ lateFeePercent: Number(e.target.value) })}
                className={`${field} tnum`}
              />
            </Field>
          )}
          <Field label="Charge after (days late)">
            <input
              type="number"
              min={0}
              max={60}
              value={rent.lateFeeAfterDays}
              onChange={(e) => setRent({ lateFeeAfterDays: Number(e.target.value) })}
              className={`${field} tnum`}
            />
          </Field>
          <Field label="Maximum cap">
            <CentsInput value={rent.lateFeeCapCents} onChange={(c) => setRent({ lateFeeCapCents: c })} />
          </Field>
          <Field label="NSF charge" hint="Added when a payment bounces.">
            <CentsInput value={rent.nsfCents} onChange={(c) => setRent({ nsfCents: c })} />
          </Field>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Toggle
            label="Auto-apply credits"
            hint="Use a tenant's credit balance on the next invoice."
            checked={rent.autoApplyCredits}
            onChange={(v) => setRent({ autoApplyCredits: v })}
          />
          <Toggle
            label="Auto-apply last month's rent"
            hint="Put the deposit against the final invoice."
            checked={rent.autoApplyLastMonth}
            onChange={(v) => setRent({ autoApplyLastMonth: v })}
          />
        </div>
      </Section>

      <Section title="Accepted payment methods" hint="What tenants can choose in their portal.">
        <div className="grid gap-2 sm:grid-cols-2">
          {rent.methods.map((m) => (
            <Toggle key={m.key} label={m.label} checked={m.on} onChange={() => toggleMethod(m.key)} />
          ))}
        </div>
        <SaveBar />
      </Section>
    </>
  );
}

/* ---------------------------- 4. lease settings -------------------------- */

export function LeasePanel() {
  const { lease, setLease, addClause, removeClause } = useSettings();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  return (
    <>
      <Section title="Lease defaults" hint="Pre-filled into the lease wizard — you can always change them per lease.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Default term (months)">
            <input
              type="number"
              min={1}
              max={60}
              value={lease.defaultTermMonths}
              onChange={(e) => setLease({ defaultTermMonths: Number(e.target.value) })}
              className={`${field} tnum`}
            />
          </Field>
          <Field label="Renewal reminder lead time (days)" hint="How early you're nudged about an ending lease.">
            <input
              type="number"
              min={7}
              max={180}
              value={lease.renewalLeadDays}
              onChange={(e) => setLease({ renewalLeadDays: Number(e.target.value) })}
              className={`${field} tnum`}
            />
          </Field>
          <Field label="Deposit rule">
            <select
              className={field}
              value={lease.depositRule}
              onChange={(e) => setLease({ depositRule: e.target.value as "last-month" | "none" | "custom" })}
            >
              <option value="last-month">Last month's rent</option>
              <option value="none">No deposit</option>
              <option value="custom">Custom amount</option>
            </select>
          </Field>
          {lease.depositRule === "custom" && (
            <Field label="Custom deposit">
              <CentsInput value={lease.depositCustomCents} onChange={(c) => setLease({ depositCustomCents: c })} />
            </Field>
          )}
          <Field label="Key deposit">
            <CentsInput value={lease.keyDepositCents} onChange={(c) => setLease({ keyDepositCents: c })} />
          </Field>
          <Field label="Default province form" hint="Comes from the property's province.">
            <input className={field} value={lease.provinceForm} onChange={(e) => setLease({ provinceForm: e.target.value })} />
          </Field>
        </div>
      </Section>

      <Section title="Standard clauses library" hint="Offered on step 6 of the lease wizard.">
        <ul className="space-y-2">
          {lease.clauses.map((c) => (
            <li key={c.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-navy">{c.title}</p>
                <p className="text-sm text-muted-foreground">{c.body}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  removeClause(c.id);
                  toast.success("Clause removed.");
                }}
                className="ml-auto grid h-11 w-11 shrink-0 place-items-center rounded-full text-maple hover:bg-maple-soft"
                aria-label={`Remove ${c.title}`}
              >
                <Trash weight="duotone" className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
          <input className={field} placeholder="Clause title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className={field} placeholder="Wording" value={body} onChange={(e) => setBody(e.target.value)} />
          <button
            type="button"
            disabled={!title.trim() || !body.trim()}
            onClick={() => {
              addClause({ title: title.trim(), body: body.trim() });
              setTitle("");
              setBody("");
              toast.success("Clause added.");
            }}
            className="mt-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-action px-4 text-sm font-semibold text-primary-foreground hover:bg-action/90 disabled:opacity-50"
          >
            <Plus weight="bold" className="h-4 w-4" aria-hidden="true" /> Add
          </button>
        </div>
      </Section>
    </>
  );
}

/* ------------------------------- 5. tax ---------------------------------- */

export function TaxPanel() {
  const { tax, setTax, setRate, toggleAppliesTo } = useSettings();
  return (
    <>
      <Section title="Tax registration" hint="Residential rent is usually exempt; management fees usually are not.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle
            label="Registered for GST/HST"
            checked={tax.registered}
            onChange={(v) => setTax({ registered: v })}
          />
          <Field label="GST/HST number">
            <input
              className={`${field} tnum`}
              value={tax.gstHstNumber}
              onChange={(e) => setTax({ gstHstNumber: e.target.value })}
              disabled={!tax.registered}
            />
          </Field>
        </div>
      </Section>

      <Section title="Rates by province">
        <ul className="grid gap-2 sm:grid-cols-2">
          {tax.rates.map((r) => (
            <li key={r.province} className="flex items-center gap-3 rounded-xl border border-border p-3">
              <span className="font-display text-sm font-bold text-navy">{r.province}</span>
              <span className="text-xs text-muted-foreground">{r.label}</span>
              <label className="ml-auto flex items-center gap-2 text-sm">
                <span className="sr-only">{`${r.province} rate`}</span>
                <input
                  type="number"
                  step="0.025"
                  min={0}
                  max={30}
                  value={r.ratePct}
                  onChange={(e) => setRate(r.province, Number(e.target.value))}
                  className="tnum min-h-11 w-24 rounded-xl border border-input bg-background px-3 text-right text-sm"
                />
                <span className="text-muted-foreground">%</span>
              </label>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Applied to">
        <div className="grid gap-2 sm:grid-cols-2">
          {tax.appliesTo.map((a) => (
            <Toggle key={a.key} label={a.label} checked={a.on} onChange={() => toggleAppliesTo(a.key)} />
          ))}
        </div>
        <SaveBar />
      </Section>
    </>
  );
}

/* ---------------------------- 6. templates ------------------------------- */

export function TemplatesPanel() {
  const { templates, saveTemplate } = useSettings();
  const [openId, setOpenId] = useState(templates[0]?.id ?? "");
  const current = templates.find((t) => t.id === openId) ?? templates[0];
  const [draft, setDraft] = useState<Template | null>(current ?? null);
  const editing = draft && draft.id === current?.id ? draft : current;
  // Guard the editor: an edited-but-unsaved template shouldn't vanish silently.
  useUnsavedGuard(
    !!draft && !!current && draft.id === current.id && JSON.stringify(draft) !== JSON.stringify(current),
    "This template has unsaved edits. Leave and lose them?",
  );

  if (!editing) return null;

  return (
    <Section title="Templates" hint="Use {{first_name}} style tags — they're filled in when the message sends.">
      <div className="flex flex-wrap gap-2">
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={t.id === editing.id}
            onClick={() => {
              setOpenId(t.id);
              setDraft(t);
            }}
            className={`min-h-11 rounded-full px-4 text-sm font-semibold ${
              t.id === editing.id ? "bg-navy text-primary-foreground" : "border border-border text-navy hover:bg-navy-soft"
            }`}
          >
            {NOTIFY_EVENTS.find((e) => e.key === t.event)?.label} · {t.channel === "sms" ? "SMS" : "Email"}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className="space-y-3">
          {editing.channel === "email" && (
            <Field label="Subject">
              <input
                className={field}
                value={editing.subject}
                onChange={(e) => setDraft({ ...editing, subject: e.target.value })}
              />
            </Field>
          )}
          <Field label="Message">
            <textarea
              rows={8}
              className="mt-1 w-full rounded-xl border border-input bg-background p-3 text-sm text-foreground"
              value={editing.body}
              onChange={(e) => setDraft({ ...editing, body: e.target.value })}
            />
          </Field>
          <div className="flex flex-wrap gap-1.5">
            {["first_name", "unit", "amount", "due_date", "lease_end", "business_name"].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setDraft({ ...editing, body: `${editing.body}{{${tag}}}` })}
                className="min-h-11 rounded-full bg-navy-soft px-3 text-xs font-semibold text-navy"
              >
                {`{{${tag}}}`}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              saveTemplate(editing);
              toast.success("Template saved.");
            }}
            className="inline-flex min-h-11 items-center rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90"
          >
            Save template
          </button>
        </div>
        <div className="rounded-xl border border-border bg-surface-sunk p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preview</p>
          {editing.channel === "email" && (
            <p className="mt-1 text-sm font-semibold text-navy">{fillTags(editing.subject)}</p>
          )}
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{fillTags(editing.body)}</p>
        </div>
      </div>
    </Section>
  );
}

/* ----------------------------- 7. security ------------------------------- */

export function SecurityPanel() {
  const { sessions, revokeSession, subscription, setSubscription } = useSettings();
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });

  return (
    <>
      <Section title="Multi-factor authentication" hint="A second step when you sign in from a new device.">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${subscription.mfaEnabled ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>
            <ShieldCheck weight="duotone" className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-navy">{subscription.mfaEnabled ? "MFA is on" : "MFA is off"}</p>
            <p className="text-xs text-muted-foreground">Authenticator app (TOTP) or SMS to your mobile.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSubscription({ mfaEnabled: !subscription.mfaEnabled });
              toast.success(subscription.mfaEnabled ? "MFA turned off." : "MFA enrolled — keep your recovery codes safe.");
            }}
            className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-4 text-sm font-semibold text-primary-foreground hover:bg-action/90"
          >
            <DeviceMobile weight="duotone" className="h-4 w-4" aria-hidden="true" />
            {subscription.mfaEnabled ? "Turn off" : "Enrol now"}
          </button>
        </div>
      </Section>

      <Section title="Active sessions" hint="Signed in right now. Revoke anything you don't recognise.">
        <ul className="space-y-2">
          {sessions.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-navy">
                  {s.device} {s.current && <span className="ml-1 rounded-full bg-success-soft px-2 py-0.5 text-xs text-success">This device</span>}
                </p>
                <p className="text-xs text-muted-foreground">{s.location} · {s.lastSeen}</p>
              </div>
              {!s.current && (
                <button
                  type="button"
                  onClick={() => {
                    revokeSession(s.id);
                    toast.success("Session revoked.");
                  }}
                  className="ml-auto min-h-11 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
                >
                  Revoke
                </button>
              )}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Change password">
        <form
          className="grid gap-3 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (pw.next.length < 10) {
              toast.error("Use at least 10 characters.");
              return;
            }
            if (pw.next !== pw.confirm) {
              toast.error("New passwords don't match.");
              return;
            }
            setPw({ current: "", next: "", confirm: "" });
            toast.success("Password changed.");
          }}
        >
          <Field label="Current password">
            <input type="password" className={field} value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          </Field>
          <Field label="New password">
            <input type="password" className={field} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          </Field>
          <Field label="Confirm new password">
            <input type="password" className={field} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
          </Field>
          <div className="sm:col-span-3 flex justify-end">
            <button type="submit" className="inline-flex min-h-11 items-center rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90">
              Change password
            </button>
          </div>
        </form>
      </Section>
    </>
  );
}

/* --------------------------- 8. data & privacy --------------------------- */

export function DataPanel() {
  const settings = useSettings();
  const [confirmText, setConfirmText] = useState("");
  const [asking, setAsking] = useState(false);

  const exportAll = (kind: "csv" | "json") => {
    const payload = {
      profile: settings.profile,
      notifications: settings.notifications,
      rent: settings.rent,
      lease: settings.lease,
      tax: settings.tax,
      templates: settings.templates,
      consents: settings.consents,
      invoices: settings.invoices,
    };
    if (kind === "json") {
      downloadFile("keyhold-export.json", JSON.stringify(payload, null, 2));
    } else {
      const rows = [["section", "field", "value"]];
      for (const [section, obj] of Object.entries(payload)) {
        for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
          rows.push([section, k, JSON.stringify(v).replaceAll('"', "'")]);
        }
      }
      downloadFile("keyhold-export.csv", rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n"));
    }
    toast.success("Export downloaded.");
  };

  return (
    <>
      <Section title="Bring your data in" hint="Moving from a spreadsheet or another tool? Import it here — every row is checked first.">
        <Link
          to="/app/import"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90"
        >
          <UploadSimple weight="duotone" className="h-4 w-4" aria-hidden="true" /> Import data
        </Link>
      </Section>

      <Section title="Export all my data" hint="Everything Keyhold holds for your account, in a file you keep.">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => exportAll("csv")}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
          >
            <DownloadSimple weight="duotone" className="h-4 w-4" aria-hidden="true" /> CSV
          </button>
          <button
            type="button"
            onClick={() => exportAll("json")}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
          >
            <DownloadSimple weight="duotone" className="h-4 w-4" aria-hidden="true" /> JSON
          </button>
        </div>
      </Section>

      <Section title="Consent records" hint="Who agreed to what, and where it came from.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <thead className="bg-surface-sunk text-left">
              <tr>
                {["Consent", "Person", "Granted", "Source"].map((h) => (
                  <th key={h} scope="col" className="px-3 py-2 font-semibold text-navy">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {settings.consents.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium text-navy">{c.kind}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.subject}</td>
                  <td className="tnum px-3 py-2 text-muted-foreground">{longDate(c.grantedOn)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Delete my account" hint="This removes your properties, leases, rent history and tenant portals.">
        {!asking ? (
          <button
            type="button"
            onClick={() => setAsking(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-maple px-4 text-sm font-semibold text-maple hover:bg-maple-soft"
          >
            <WarningOctagon weight="duotone" className="h-4 w-4" aria-hidden="true" /> Start deletion
          </button>
        ) : (
          <div className="rounded-xl border border-maple bg-maple-soft/40 p-3">
            <p className="text-sm text-foreground">
              Deleting removes <strong>every property, lease, invoice, receipt and tenant portal</strong> on this
              account. Tenants lose access immediately. This cannot be undone. Type <strong>DELETE</strong> to confirm.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                aria-label="Type DELETE to confirm"
                className="min-h-11 w-40 rounded-xl border border-input bg-background px-3 text-sm"
                placeholder="DELETE"
              />
              <button
                type="button"
                disabled={confirmText !== "DELETE"}
                onClick={() => {
                  setAsking(false);
                  setConfirmText("");
                  toast.success("Deletion scheduled for 30 days' time — sign in to cancel it.");
                }}
                className="min-h-11 rounded-full bg-maple px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                Delete my account
              </button>
              <button
                type="button"
                onClick={() => setAsking(false)}
                className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
              >
                Keep my account
              </button>
            </div>
          </div>
        )}
      </Section>
    </>
  );
}

/* ------------------------- subscription & billing ------------------------ */

export function BillingPanel({ unitCount }: { unitCount: number }) {
  const { subscription, setSubscription, paymentMethod, setPaymentMethod, invoices } = useSettings();
  const [cancelStep, setCancelStep] = useState<0 | 1 | 2>(0);
  const [editingCard, setEditingCard] = useState(false);

  const plan = planFor(unitCount);
  const priceNow = monthlyCents(unitCount);
  const overLimit = unitCount > subscription.includedUnits;
  const currentPlan = PLANS.find((p) => p.id === subscription.planId) ?? plan;
  const curve = priceCurve(50);
  const daysLeft = daysBetween("2026-08-14", subscription.renewsOn);
  const proration = prorationCents({
    oldCents: monthlyCents(subscription.includedUnits),
    newCents: priceNow,
    daysLeft,
  });

  return (
    <>
      <Section title="Your plan" hint="Priced per home, on a curve — never a cliff.">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative overflow-hidden rounded-xl border border-border p-4 pl-5 sm:col-span-2">
            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-action" />
            <p className="text-sm text-muted-foreground">Current plan</p>
            <p className="font-display text-2xl font-extrabold text-navy">{currentPlan.name}</p>
            <p className="tnum mt-1 text-sm text-muted-foreground">
              {unitCount} of {subscription.includedUnits} homes included · {seatsFor(unitCount)} manager seats
            </p>
            <p className="money mt-2 text-xl font-extrabold text-navy">{money(priceNow)}<span className="text-sm font-semibold text-muted-foreground">/month</span></p>
            <p className="tnum mt-1 text-sm text-muted-foreground">Next bill {longDate(subscription.renewsOn)}</p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-display text-lg font-bold text-navy capitalize">{subscription.status}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Change plans any time. Mid-cycle changes are prorated: you'd pay{" "}
              <span className="tnum font-semibold text-navy">{money(Math.abs(proration))}</span>{" "}
              {proration >= 0 ? "extra" : "less"} for the {daysLeft} days left in this cycle.
            </p>
          </div>
        </div>

        {overLimit && (
          <div className="mt-3 flex flex-wrap items-start gap-3 rounded-xl border border-warning bg-warning-soft/50 p-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-warning-soft text-warning">
              <ChatCircleText weight="duotone" className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy">
                {unitCount} of {subscription.includedUnits} homes — you've outgrown {currentPlan.name}
              </p>
              <p className="text-sm text-muted-foreground">
                Nothing is blocked and nothing is hidden. Moving to <strong>{plan.name}</strong> covers all{" "}
                {unitCount} homes for <span className="tnum font-semibold">{money(priceNow)}</span> a month — {plan.blurb}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSubscription({ planId: plan.id, includedUnits: plan.max });
                toast.success(`Moved to ${plan.name}. Prorated today, full price from ${longDate(subscription.renewsOn)}.`);
              }}
              className="ml-auto inline-flex min-h-11 items-center rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90"
            >
              Move to {plan.name}
            </button>
          </div>
        )}
      </Section>

      <Section title="Change plan" hint="Pick the band you want. You can move up or down at any time.">
        <ul className="grid gap-2 sm:grid-cols-2">
          {PLANS.map((p) => {
            const active = p.id === subscription.planId;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSubscription({ planId: p.id, includedUnits: p.max });
                    toast.success(`Plan changed to ${p.name}. The difference is prorated to ${longDate(subscription.renewsOn)}.`);
                  }}
                  aria-pressed={active}
                  className={`w-full rounded-xl border p-3 text-left ${active ? "border-action bg-action-soft/40" : "border-border hover:bg-navy-soft"}`}
                >
                  <span className="flex items-center gap-2">
                    <span className="font-display text-sm font-bold text-navy">{p.name}</span>
                    {active && <Check weight="bold" className="h-4 w-4 text-action" aria-hidden="true" />}
                  </span>
                  <span className="tnum block text-xs text-muted-foreground">{p.min}–{p.max} homes · from {money(monthlyCents(p.min))}/mo</span>
                  <span className="block text-xs text-muted-foreground">{p.blurb}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="What you'd pay next" hint="The full curve, with your portfolio marked.">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={curve} margin={{ top: 6, right: 10, left: 8, bottom: 4 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="units" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={{ stroke: "var(--border)" }} interval={4} label={{ value: "Homes", position: "insideBottom", offset: -2, fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={78} tickFormatter={(v: number) => money(v)} />
              <Tooltip
                formatter={(v: number) => [money(v), "Per month"]}
                labelFormatter={(l: number) => `${l} homes`}
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontVariantNumeric: "tabular-nums", fontSize: 12 }}
              />
              <Line type="monotone" dataKey="cents" stroke="var(--action)" strokeWidth={2} dot={false} />
              <ReferenceDot x={Math.min(50, unitCount)} y={priceNow} r={5} fill="var(--success)" stroke="var(--card)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="tnum mt-1 text-xs text-muted-foreground">
          You're at {unitCount} homes · {money(priceNow)}/month · next home adds {money(monthlyCents(unitCount + 1) - priceNow)}.
        </p>
      </Section>

      <Section title="Payment method">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-navy-soft text-navy">
            <CreditCard weight="duotone" className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="tnum text-sm font-semibold text-navy">{paymentMethod.brand} •••• {paymentMethod.last4}</p>
            <p className="tnum text-xs text-muted-foreground">Expires {paymentMethod.expiry} · {paymentMethod.name}</p>
          </div>
          <button
            type="button"
            onClick={() => setEditingCard((v) => !v)}
            className="ml-auto min-h-11 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
          >
            {editingCard ? "Cancel" : "Update card"}
          </button>
        </div>
        {editingCard && (
          <form
            className="mt-3 grid gap-3 sm:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              setEditingCard(false);
              toast.success("Card updated.");
            }}
          >
            <Field label="Name on card">
              <input className={field} value={paymentMethod.name} onChange={(e) => setPaymentMethod({ name: e.target.value })} />
            </Field>
            <Field label="Last 4 digits">
              <input className={`${field} tnum`} maxLength={4} value={paymentMethod.last4} onChange={(e) => setPaymentMethod({ last4: e.target.value.replace(/\D/g, "") })} />
            </Field>
            <Field label="Expiry">
              <input className={`${field} tnum`} value={paymentMethod.expiry} onChange={(e) => setPaymentMethod({ expiry: e.target.value })} />
            </Field>
            <div className="sm:col-span-3 flex justify-end">
              <button type="submit" className="min-h-11 rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90">
                Save card
              </button>
            </div>
          </form>
        )}
      </Section>

      <Section title="Billing history">
        <ul className="space-y-2">
          {invoices.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-navy">{i.description}</p>
                <p className="tnum text-xs text-muted-foreground">{longDate(i.date)} · {i.id} · {i.status}</p>
              </div>
              <p className="money tnum ml-auto text-sm font-bold text-navy">{money(i.amountCents)}</p>
              <button
                type="button"
                onClick={() => {
                  downloadFile(
                    `${i.id}.txt`,
                    `Keyhold invoice ${i.id}\n${i.date}\n${i.description}\nTotal: ${money(i.amountCents)}\nStatus: ${i.status}\n`,
                  );
                  toast.success("Invoice downloaded.");
                }}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
              >
                <DownloadSimple weight="duotone" className="h-4 w-4" aria-hidden="true" /> Invoice
              </button>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Cancel subscription" hint="Your data stays for 30 days if you change your mind.">
        {subscription.status === "cancelled" ? (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3">
            <p className="text-sm text-muted-foreground">
              Cancelled — Keyhold stays available until {longDate(subscription.renewsOn)}.
            </p>
            <button
              type="button"
              onClick={() => {
                setSubscription({ status: "active" });
                toast.success("Welcome back — your plan is active again.");
              }}
              className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-4 text-sm font-semibold text-primary-foreground hover:bg-action/90"
            >
              <ArrowsClockwise weight="duotone" className="h-4 w-4" aria-hidden="true" /> Reactivate
            </button>
          </div>
        ) : cancelStep === 0 ? (
          <button
            type="button"
            onClick={() => setCancelStep(1)}
            className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
          >
            Cancel subscription
          </button>
        ) : cancelStep === 1 ? (
          <div className="rounded-xl border border-border p-3">
            <p className="text-sm font-semibold text-navy">Before you go</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Most people who cancel say it's cost. At {unitCount} homes you're on the curve at{" "}
              <span className="tnum font-semibold">{money(priceNow)}</span> a month. We can pause your account for
              three months at no charge instead, and everything stays exactly as you left it.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setCancelStep(0);
                  toast.success("Account paused for three months. Nothing will be billed.");
                }}
                className="min-h-11 rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90"
              >
                Pause for 3 months
              </button>
              <button
                type="button"
                onClick={() => setCancelStep(2)}
                className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
              >
                Continue cancelling
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-maple bg-maple-soft/40 p-3">
            <p className="text-sm text-foreground">
              Cancelling stops billing on {longDate(subscription.renewsOn)}. Tenant portals close that day and your
              exports stay available for 30 days.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setSubscription({ status: "cancelled" });
                  setCancelStep(0);
                  toast.success("Subscription cancelled.");
                }}
                className="min-h-11 rounded-full bg-maple px-5 text-sm font-semibold text-primary-foreground"
              >
                Confirm cancellation
              </button>
              <button
                type="button"
                onClick={() => setCancelStep(0)}
                className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
              >
                Keep my plan
              </button>
            </div>
          </div>
        )}
      </Section>
    </>
  );
}
