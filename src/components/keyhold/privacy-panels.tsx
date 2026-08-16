/**
 * PRIVACY, CONSENT, RETENTION + SECURITY PANELS — presentation only.
 * All state lives in src/lib/mock-consent.tsx; nothing here talks to a backend.
 */
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  DownloadSimple,
  PencilSimple,
  WarningOctagon,
  ShieldCheck,
  Key,
  Clock,
  SignIn,
  Megaphone,
  ArrowCounterClockwise,
  Check,
  X,
} from "@phosphor-icons/react";
import { Section, Field, field } from "./settings-panels";
import { DocDisclaimer } from "./legal-ui";
import {
  CONSENT_KINDS,
  DELETION_GRACE_DAYS,
  DELETION_MATRIX,
  METHOD_LABEL,
  consentLabel,
  dayOnly,
  monthsLabel,
  stamp,
  useConsent,
  type ConsentKind,
  type ConsentMethod,
  type ConsentRecordFull,
} from "@/lib/mock-consent";
import { downloadFile } from "@/lib/rent-engine";
import { useSettings } from "@/lib/mock-settings";

/* --------------------------------- consent -------------------------------- */

function StatusPill({ record }: { record: ConsentRecordFull }) {
  const granted = record.status === "granted";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
        granted ? "bg-success-soft text-success" : "bg-maple-soft text-maple"
      }`}
    >
      {granted ? <Check weight="bold" className="h-3 w-3" aria-hidden="true" /> : <X weight="bold" className="h-3 w-3" aria-hidden="true" />}
      {granted ? "Granted" : "Withdrawn"}
    </span>
  );
}

export function ConsentPanel() {
  const { consents, people, consentsFor, grantConsent, withdrawConsent } = useConsent();
  const [personId, setPersonId] = useState(people[0]?.id ?? "");
  const [draft, setDraft] = useState<{ kind: ConsentKind; method: ConsentMethod; note: string }>({
    kind: "electronic-communication",
    method: "admin-recorded",
    note: "",
  });

  const person = people.find((p) => p.id === personId) ?? people[0];
  const history = person ? consentsFor(person.id) : [];

  const exportLog = () => {
    const rows = [["person", "consent", "status", "version", "method", "recorded_at", "recorded_by", "withdrawn_at", "note"]];
    for (const c of consents) {
      rows.push([c.personName, consentLabel(c.kind), c.status, c.version, METHOD_LABEL[c.method], c.recordedAt, c.recordedBy, c.withdrawnAt ?? "", c.note ?? ""]);
    }
    downloadFile("keyhold-consent-log.csv", rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', "'")}"`).join(",")).join("\n"));
    toast.success("Consent log downloaded.");
  };

  return (
    <>
      <Section title="Consent records" hint="Every consent carries a timestamp, the wording version and how it was given.">
        <DocDisclaimer docId="privacy">
          Consent must be meaningful, specific and easy to take back. Keyhold records what was agreed and when — it does
          not judge whether you had a lawful basis.
        </DocDisclaimer>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Person">
            <select className={field} value={personId} onChange={(e) => setPersonId(e.target.value)}>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex items-end">
            <button
              type="button"
              onClick={exportLog}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
            >
              <DownloadSimple weight="duotone" className="h-4 w-4" aria-hidden="true" /> Export full consent log
            </button>
          </div>
        </div>

        <h3 className="mt-4 text-sm font-semibold text-navy">
          History for {person?.name ?? "—"} <span className="font-normal text-muted-foreground">({history.length} records)</span>
        </h3>
        {history.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            No consent recorded for this person yet.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {history.map((c) => (
              <li key={c.id} className="rounded-xl border border-border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-navy">{consentLabel(c.kind)}</span>
                  <StatusPill record={c} />
                  <span className="tnum text-xs text-muted-foreground">version {c.version}</span>
                </div>
                <p className="tnum mt-1 text-xs text-muted-foreground">
                  {METHOD_LABEL[c.method]} · recorded {stamp(c.recordedAt)} by {c.recordedBy}
                  {c.withdrawnAt ? ` · withdrawn ${stamp(c.withdrawnAt)}` : ""}
                </p>
                {c.note ? <p className="mt-1 text-xs text-muted-foreground">Note: {c.note}</p> : null}
                {c.status === "granted" ? (
                  <button
                    type="button"
                    onClick={() => {
                      withdrawConsent(c.id, "Withdrawn on request.");
                      toast.success("Consent withdrawn — the record stays for the audit trail.");
                    }}
                    className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-full border border-maple px-4 text-sm font-semibold text-maple hover:bg-maple-soft"
                  >
                    <ArrowCounterClockwise weight="duotone" className="h-4 w-4" aria-hidden="true" /> Withdraw consent
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Record a new consent" hint="Use this when someone agrees in person, by phone or on paper.">
        <form
          className="grid gap-3 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!person) return;
            grantConsent({ personId: person.id, personName: person.name, kind: draft.kind, method: draft.method, note: draft.note || undefined });
            setDraft({ ...draft, note: "" });
            toast.success(`${consentLabel(draft.kind)} consent recorded for ${person.name}.`);
          }}
        >
          <Field label="Consent">
            <select className={field} value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as ConsentKind })}>
              {CONSENT_KINDS.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="How it was given">
            <select className={field} value={draft.method} onChange={(e) => setDraft({ ...draft, method: e.target.value as ConsentMethod })}>
              {Object.entries(METHOD_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Note (optional)">
            <input className={field} value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="Signed paper form kept on file" />
          </Field>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            {CONSENT_KINDS.find((c) => c.key === draft.kind)?.body}
          </p>
          <div className="flex justify-end sm:col-span-1">
            <button type="submit" className="inline-flex min-h-11 items-center rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90">
              Record consent
            </button>
          </div>
        </form>
      </Section>
    </>
  );
}

/* ------------------------------ privacy rights ---------------------------- */

export function PrivacyRightsPanel() {
  const settings = useSettings();
  const { consents, retention, requests, openRequest, cancelRequest } = useConsent();
  const [correction, setCorrection] = useState({ field: "", value: "", reason: "" });
  const [confirmText, setConfirmText] = useState("");
  const deletion = requests.find((r) => r.kind === "deletion" && r.status === "open");

  const bundle = useMemo(
    () => ({
      exportedAt: new Date().toISOString(),
      account: settings.profile,
      subscription: settings.subscription,
      notifications: settings.notifications,
      rentSettings: settings.rent,
      leaseSettings: settings.lease,
      taxSettings: settings.tax,
      templates: settings.templates,
      billingInvoices: settings.invoices,
      consentRecords: consents,
      retentionSettings: retention,
      privacyRequests: requests,
    }),
    [settings, consents, retention, requests],
  );

  const downloadJson = () => {
    downloadFile("keyhold-my-data.json", JSON.stringify(bundle, null, 2), "application/json;charset=utf-8");
    toast.success("JSON export downloaded.");
  };

  const downloadCsv = () => {
    const rows = [["section", "field", "value"]];
    for (const [section, obj] of Object.entries(bundle)) {
      if (typeof obj !== "object" || obj === null) {
        rows.push([section, "", String(obj)]);
        continue;
      }
      if (Array.isArray(obj)) {
        obj.forEach((item, i) => {
          for (const [k, v] of Object.entries(item as Record<string, unknown>)) rows.push([section, `${i}.${k}`, JSON.stringify(v)]);
        });
      } else {
        for (const [k, v] of Object.entries(obj as Record<string, unknown>)) rows.push([section, k, JSON.stringify(v)]);
      }
    }
    downloadFile("keyhold-my-data.csv", rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', "'")}"`).join(",")).join("\n"));
    toast.success("CSV export downloaded.");
  };

  return (
    <>
      <Section title="Your privacy rights" hint="Under PIPEDA you can see what we hold, correct it, and ask us to delete it.">
        <DocDisclaimer docId="privacy">
          We answer access and correction requests within 30 days, as PIPEDA requires. If you are not satisfied you can
          complain to the Office of the Privacy Commissioner of Canada.
        </DocDisclaimer>
      </Section>

      <Section title="Download my data" hint="Everything on this account — profile, settings, consents, billing — in one file.">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={downloadJson} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90">
            <DownloadSimple weight="duotone" className="h-4 w-4" aria-hidden="true" /> JSON (complete)
          </button>
          <button type="button" onClick={downloadCsv} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft">
            <DownloadSimple weight="duotone" className="h-4 w-4" aria-hidden="true" /> CSV (spreadsheet)
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Rent ledgers, documents and inspection photos are packaged separately and emailed as a link within 24 hours.
        </p>
      </Section>

      <Section title="Correct my information" hint="Tell us what is wrong and we'll fix it, or explain why we can't.">
        <form
          className="grid gap-3 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!correction.field.trim()) {
              toast.error("Say which detail is wrong.");
              return;
            }
            const req = openRequest({ kind: "correction", subject: correction.field, detail: `Should be "${correction.value}". ${correction.reason}` });
            setCorrection({ field: "", value: "", reason: "" });
            toast.success(`Correction request opened — due ${dayOnly(req.dueAt)}.`);
          }}
        >
          <Field label="What's wrong">
            <input className={field} value={correction.field} onChange={(e) => setCorrection({ ...correction, field: e.target.value })} placeholder="Business phone number" />
          </Field>
          <Field label="What it should say">
            <input className={field} value={correction.value} onChange={(e) => setCorrection({ ...correction, value: e.target.value })} />
          </Field>
          <Field label="Anything else (optional)">
            <input className={field} value={correction.reason} onChange={(e) => setCorrection({ ...correction, reason: e.target.value })} />
          </Field>
          <div className="flex justify-end sm:col-span-3">
            <button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90">
              <PencilSimple weight="duotone" className="h-4 w-4" aria-hidden="true" /> Send correction request
            </button>
          </div>
        </form>
      </Section>

      <Section title="Delete my account" hint={`Nothing is removed for ${DELETION_GRACE_DAYS} days — you can cancel any time in that window.`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <caption className="pb-2 text-left text-xs text-muted-foreground">Exactly what happens, and what the law makes us keep.</caption>
            <thead className="bg-surface-sunk text-left">
              <tr>
                {["Record", "Outcome", "When"].map((h) => (
                  <th key={h} scope="col" className="px-3 py-2 font-semibold text-navy">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DELETION_MATRIX.map((row) => (
                <tr key={row.item} className="border-t border-border align-top">
                  <td className="px-3 py-2 font-medium text-navy">{row.item}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${row.action === "deleted" ? "bg-maple-soft text-maple" : "bg-navy-soft text-navy"}`}>
                      {row.action === "deleted" ? "Deleted" : "Retained"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{row.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {deletion ? (
          <div className="mt-3 rounded-xl border border-maple bg-maple-soft/40 p-3">
            <p className="text-sm text-foreground">
              Deletion is scheduled. Permanent removal happens on{" "}
              <strong className="tnum">{deletion.graceUntil ? dayOnly(deletion.graceUntil) : "—"}</strong>. Sign in before then and cancel to keep everything.
            </p>
            <button
              type="button"
              onClick={() => {
                cancelRequest(deletion.id);
                toast.success("Deletion cancelled — your account stays as it is.");
              }}
              className="mt-2 inline-flex min-h-11 items-center rounded-full bg-navy px-5 text-sm font-semibold text-primary-foreground hover:bg-navy/90"
            >
              Cancel deletion
            </button>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <label className="text-sm">
              <span className="font-medium text-navy">Type DELETE to confirm</span>
              <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className={`${field} w-44`} placeholder="DELETE" />
            </label>
            <button
              type="button"
              disabled={confirmText !== "DELETE"}
              onClick={() => {
                const req = openRequest({ kind: "deletion", subject: "Account deletion", detail: "Requested by the account owner." });
                setConfirmText("");
                toast.success(`Deletion scheduled for ${req.graceUntil ? dayOnly(req.graceUntil) : ""}.`);
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-maple px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              <WarningOctagon weight="duotone" className="h-4 w-4" aria-hidden="true" /> Schedule deletion
            </button>
          </div>
        )}
      </Section>

      {requests.length > 0 ? (
        <Section title="Your requests" hint="Every privacy request, with the 30-day statutory clock.">
          <ul className="space-y-2">
            {requests.map((r) => (
              <li key={r.id} className="rounded-xl border border-border p-3">
                <p className="text-sm font-semibold capitalize text-navy">
                  {r.kind} — {r.subject}{" "}
                  <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${r.status === "open" ? "bg-warning-soft text-warning" : r.status === "completed" ? "bg-success-soft text-success" : "bg-navy-soft text-navy"}`}>
                    {r.status}
                  </span>
                </p>
                <p className="tnum mt-1 text-xs text-muted-foreground">
                  Opened {stamp(r.openedAt)} · due {dayOnly(r.dueAt)}
                  {r.graceUntil ? ` · grace ends ${dayOnly(r.graceUntil)}` : ""}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{r.detail}</p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </>
  );
}

/* -------------------------------- retention ------------------------------- */

export function RetentionPanel() {
  const { retention, setRetention, resetRetention } = useConsent();
  return (
    <Section title="Data retention" hint="Keep the least you can. These defaults are already the shortest we think is safe.">
      <DocDisclaimer docId="privacy">
        Shorter is safer, but some records must be kept: rent and tax records stay 7 years no matter what you choose here.
      </DocDisclaimer>
      <ul className="mt-3 space-y-2">
        {retention.map((r) => (
          <li key={r.key} className="rounded-xl border border-border p-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-navy">{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.hint}</p>
              </div>
              <label className="text-sm">
                <span className="sr-only">Keep {r.label} for</span>
                <select
                  className="min-h-11 rounded-xl border border-input bg-background px-3 text-sm text-foreground"
                  value={r.months}
                  onChange={(e) => {
                    setRetention(r.key, Number(e.target.value));
                    toast.success(`${r.label}: kept ${monthsLabel(Number(e.target.value))}.`);
                  }}
                >
                  {r.options.map((m) => (
                    <option key={m} value={m}>
                      Keep {monthsLabel(m)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="mt-2 flex gap-2 text-xs text-muted-foreground">
              <Clock weight="duotone" className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {r.legalNote}
            </p>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() => {
            resetRetention();
            toast.success("Back to the data-minimising defaults.");
          }}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
        >
          <ArrowCounterClockwise weight="duotone" className="h-4 w-4" aria-hidden="true" /> Restore defaults
        </button>
      </div>
    </Section>
  );
}

/* --------------------------- security extras ------------------------------ */

export function SecurityExtrasPanel() {
  const { logins, recoveryCodes, generateRecoveryCodes } = useConsent();
  const [concern, setConcern] = useState("");

  return (
    <>
      <Section title="Recovery codes" hint="Ten one-time codes to get back in if you lose your phone. Store them offline.">
        {recoveryCodes ? (
          <>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {recoveryCodes.map((c) => (
                <li key={c} className="tnum rounded-xl border border-border bg-surface-sunk px-2 py-2 text-center text-sm font-semibold text-navy">
                  {c}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  downloadFile("keyhold-recovery-codes.txt", recoveryCodes.join("\n"), "text/plain;charset=utf-8");
                  toast.success("Recovery codes downloaded.");
                }}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
              >
                <DownloadSimple weight="duotone" className="h-4 w-4" aria-hidden="true" /> Download codes
              </button>
              <button
                type="button"
                onClick={() => {
                  generateRecoveryCodes();
                  toast.success("New codes generated — the old ones no longer work.");
                }}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
              >
                <ArrowCounterClockwise weight="duotone" className="h-4 w-4" aria-hidden="true" /> Regenerate
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              generateRecoveryCodes();
              toast.success("Recovery codes generated — save them somewhere safe.");
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90"
          >
            <Key weight="duotone" className="h-4 w-4" aria-hidden="true" /> Generate recovery codes
          </button>
        )}
      </Section>

      <Section title="Login history" hint="The last sign-ins on this account. Anything unfamiliar is worth a password change.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <thead className="bg-surface-sunk text-left">
              <tr>
                {["When", "Device", "Where", "IP", "Result"].map((h) => (
                  <th key={h} scope="col" className="px-3 py-2 font-semibold text-navy">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logins.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="tnum px-3 py-2 text-muted-foreground">{stamp(l.at)}</td>
                  <td className="px-3 py-2 font-medium text-navy">{l.device}</td>
                  <td className="px-3 py-2 text-muted-foreground">{l.location}</td>
                  <td className="tnum px-3 py-2 text-muted-foreground">{l.ip}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        l.result === "success" ? "bg-success-soft text-success" : l.result === "failed" ? "bg-maple-soft text-maple" : "bg-warning-soft text-warning"
                      }`}
                    >
                      <SignIn weight="bold" className="h-3 w-3" aria-hidden="true" />
                      {l.result === "success" ? "Signed in" : l.result === "failed" ? "Failed" : "MFA challenge"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Report a security concern" hint="Saw something odd? Tell us. We reply within one business day.">
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (concern.trim().length < 10) {
              toast.error("A sentence or two helps us act fast.");
              return;
            }
            setConcern("");
            toast.success("Sent to security@keyhold.ca — we'll acknowledge within one business day.");
          }}
        >
          <label className="text-sm">
            <span className="font-medium text-navy">What did you notice?</span>
            <textarea
              value={concern}
              onChange={(e) => setConcern(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-xl border border-input bg-background p-3 text-sm text-foreground"
              placeholder="A sign-in from a city I've never visited, on August 9."
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90">
              <Megaphone weight="duotone" className="h-4 w-4" aria-hidden="true" /> Report concern
            </button>
            <a href="mailto:security@keyhold.ca" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-action hover:underline">
              <ShieldCheck weight="duotone" className="h-4 w-4" aria-hidden="true" /> security@keyhold.ca
            </a>
          </div>
        </form>
      </Section>
    </>
  );
}
