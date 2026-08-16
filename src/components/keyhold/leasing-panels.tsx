/**
 * LEASING PANELS — listing editor, marketplace copy, applicant compare.
 * ---------------------------------------------------------------------
 * All maths comes from `leasing-engine.ts` so the numbers on screen are
 * deterministic. Nothing here decides anything about an applicant: the
 * compare view shows facts side by side and the human makes the call.
 */
import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowUp,
  ArrowDown,
  Copy,
  Trash,
  Plus,
  ImageSquare,
  ShareNetwork,
  ChatCircleDots,
  Scales,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Sheet } from "@/components/keyhold/rent-panels";
import { Tag, ScreeningNotice, prospectLabel, prospectTone, screeningLabel } from "@/components/keyhold/pipeline";
import { useLeasing, type Listing, type Application, type Prospect } from "@/lib/mock-leasing";
import { cad, longDate, propertyById, unitAddress } from "@/lib/mock-data";
import {
  AMENITY_OPTIONS,
  DECLINE_REASONS,
  LISTING_CHANNELS,
  PET_POLICIES,
  SMOKING_POLICIES,
  UTILITY_OPTIONS,
  affordabilityNote,
  listingCopyBlock,
  rentToIncomePct,
} from "@/lib/leasing-engine";

const field = "mt-1 min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm";
const btn = "inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold";
export const btnGhost = `${btn} border border-border text-navy hover:bg-navy-soft`;
export const btnPrimary = `${btn} bg-action text-primary-foreground hover:bg-action/90`;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="font-display text-sm font-bold text-navy">{title}</h3>
      {children}
    </section>
  );
}

function CheckGrid({
  legend,
  options,
  selected,
  onToggle,
}: {
  legend: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <label key={o} className="flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--action)]"
              checked={selected.includes(o)}
              onChange={() => onToggle(o)}
            />
            <span>{o}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

async function copyText(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${what} copied.`);
  } catch {
    toast.error("Your browser blocked the clipboard — select the text and copy it.");
  }
}

/* ------------------------------------------------------------------ */
/* Listing editor                                                      */
/* ------------------------------------------------------------------ */

export function ListingEditor({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const { listings, updateListing, movePhoto, togglePosted, addInquiry } = useLeasing();
  const live = listings.find((l) => l.id === listing.id) ?? listing;
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [newPhoto, setNewPhoto] = useState("");
  const property = propertyById(live.propertyId);

  const publicUrl = typeof window === "undefined" ? `/listing/${live.slug}` : `${window.location.origin}/listing/${live.slug}`;
  const copyBlock = listingCopyBlock({
    headline: live.headline,
    description: live.description,
    address: property.address,
    city: property.city,
    province: property.province,
    bedrooms: live.bedrooms,
    bathrooms: live.bathrooms,
    rent: live.rent,
    deposit: live.deposit,
    availableFrom: longDate(live.availableFrom),
    amenities: live.amenities,
    utilitiesIncluded: live.utilitiesIncluded,
    parking: live.parkingDetail || (live.parking ? "One spot included" : "No parking"),
    petPolicy: live.petPolicy,
    smokingPolicy: live.smokingPolicy,
    publicUrl,
    contactEmail: "hello@keyhold.ca",
  });

  const toggleIn = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  return (
    <Sheet title="Edit listing" onClose={onClose}>
      <p className="text-sm text-muted-foreground">
        {property.name} · {unitAddress(live.unitId)}
      </p>

      <Section title="Photos">
        <p className="text-xs text-muted-foreground">Drag a photo, or use the arrows. The first photo is the cover.</p>
        {live.photos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            No photos yet. Add an image link below.
          </p>
        ) : (
          <ul className="space-y-2">
            {live.photos.map((src, i) => (
              <li
                key={`${src}-${i}`}
                draggable
                onDragStart={() => setDragFrom(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragFrom !== null && dragFrom !== i) movePhoto(live.id, dragFrom, i);
                  setDragFrom(null);
                }}
                className="flex items-center gap-3 rounded-xl border border-border p-2"
              >
                <img src={src} alt={`Listing photo ${i + 1}`} loading="lazy" className="h-14 w-20 rounded-lg object-cover" />
                <span className="flex-1 text-xs text-muted-foreground">{i === 0 ? "Cover photo" : `Photo ${i + 1}`}</span>
                <button
                  type="button"
                  aria-label={`Move photo ${i + 1} up`}
                  disabled={i === 0}
                  onClick={() => movePhoto(live.id, i, i - 1)}
                  className="grid h-11 w-11 place-items-center rounded-full text-navy hover:bg-navy-soft disabled:opacity-40"
                >
                  <ArrowUp weight="duotone" className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Move photo ${i + 1} down`}
                  disabled={i === live.photos.length - 1}
                  onClick={() => movePhoto(live.id, i, i + 1)}
                  className="grid h-11 w-11 place-items-center rounded-full text-navy hover:bg-navy-soft disabled:opacity-40"
                >
                  <ArrowDown weight="duotone" className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Remove photo ${i + 1}`}
                  onClick={() => updateListing(live.id, { photos: live.photos.filter((_, n) => n !== i) })}
                  className="grid h-11 w-11 place-items-center rounded-full text-maple hover:bg-maple-soft"
                >
                  <Trash weight="duotone" className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[12rem] flex-1">
            <label htmlFor="lst-photo" className="text-sm font-medium">Photo link</label>
            <input id="lst-photo" value={newPhoto} onChange={(e) => setNewPhoto(e.target.value)} className={field} placeholder="https://…" />
          </div>
          <button
            type="button"
            className={btnGhost}
            onClick={() => {
              if (!newPhoto.trim()) { toast.error("Paste an image link first."); return; }
              updateListing(live.id, { photos: [...live.photos, newPhoto.trim()] });
              setNewPhoto("");
            }}
          >
            <ImageSquare weight="duotone" className="h-4 w-4" aria-hidden="true" /> Add photo
          </button>
        </div>
      </Section>

      <Section title="The basics">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="lst-headline" className="text-sm font-medium">Headline</label>
            <input id="lst-headline" value={live.headline} onChange={(e) => updateListing(live.id, { headline: e.target.value })} className={field} />
          </div>
          <div>
            <label htmlFor="lst-rent" className="text-sm font-medium">Monthly rent (CAD)</label>
            <input id="lst-rent" inputMode="decimal" value={live.rent} onChange={(e) => updateListing(live.id, { rent: Number(e.target.value) || 0 })} className={`${field} tnum`} />
          </div>
          <div>
            <label htmlFor="lst-dep" className="text-sm font-medium">Deposit (CAD)</label>
            <input id="lst-dep" inputMode="decimal" value={live.deposit} onChange={(e) => updateListing(live.id, { deposit: Number(e.target.value) || 0 })} className={`${field} tnum`} />
          </div>
          <div>
            <label htmlFor="lst-avail" className="text-sm font-medium">Available from</label>
            <input id="lst-avail" type="date" value={live.availableFrom} onChange={(e) => updateListing(live.id, { availableFrom: e.target.value })} className={field} />
          </div>
          <div>
            <label htmlFor="lst-status" className="text-sm font-medium">Status</label>
            <select id="lst-status" value={live.status} onChange={(e) => updateListing(live.id, { status: e.target.value as Listing["status"] })} className={field}>
              <option value="draft">Draft</option>
              <option value="published">Listed</option>
              <option value="leased">Leased</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="lst-desc" className="text-sm font-medium">Description</label>
            <textarea id="lst-desc" rows={4} value={live.description} onChange={(e) => updateListing(live.id, { description: e.target.value })} className="mt-1 w-full rounded-xl border border-input bg-background p-3 text-sm" />
          </div>
        </div>
      </Section>

      <Section title="What's included">
        <CheckGrid
          legend="Amenities"
          options={AMENITY_OPTIONS}
          selected={live.amenities}
          onToggle={(v) => updateListing(live.id, { amenities: toggleIn(live.amenities, v) })}
        />
        <CheckGrid
          legend="Utilities included in rent"
          options={UTILITY_OPTIONS}
          selected={live.utilitiesIncluded}
          onToggle={(v) => updateListing(live.id, { utilitiesIncluded: toggleIn(live.utilitiesIncluded, v) })}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="lst-park" className="text-sm font-medium">Parking</label>
            <input id="lst-park" value={live.parkingDetail} onChange={(e) => updateListing(live.id, { parkingDetail: e.target.value, parking: e.target.value.trim().length > 0 })} className={field} placeholder="One surface spot included" />
          </div>
          <div>
            <label htmlFor="lst-pets" className="text-sm font-medium">Pet policy</label>
            <select id="lst-pets" value={live.petPolicy} onChange={(e) => updateListing(live.id, { petPolicy: e.target.value })} className={field}>
              {PET_POLICIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="lst-smoke" className="text-sm font-medium">Smoking policy</label>
            <select id="lst-smoke" value={live.smokingPolicy} onChange={(e) => updateListing(live.id, { smokingPolicy: e.target.value })} className={field}>
              {SMOKING_POLICIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </Section>

      <Section title="Post it everywhere">
        <p className="rounded-xl border border-border bg-navy-soft p-3 text-xs leading-relaxed text-navy">
          Keyhold doesn't post to the marketplaces for you yet — automatic syndication is on the roadmap. Copy the block
          below, paste it where you list, then tick the channels you used so you know where enquiries came from.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btnGhost} onClick={() => void copyText(publicUrl, "Public link")}>
            <ShareNetwork weight="duotone" className="h-4 w-4" aria-hidden="true" /> Copy public link
          </button>
          <button type="button" className={btnPrimary} onClick={() => void copyText(copyBlock, "Listing description")}>
            <Copy weight="duotone" className="h-4 w-4" aria-hidden="true" /> Copy description block
          </button>
        </div>
        <label htmlFor="lst-copy" className="sr-only">Copy-ready listing text</label>
        <textarea id="lst-copy" readOnly rows={10} value={copyBlock} className="w-full rounded-xl border border-border bg-surface-sunk p-3 font-mono text-xs leading-relaxed" />
        <fieldset>
          <legend className="text-sm font-medium">Posted to</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {LISTING_CHANNELS.map((c) => {
              const posted = live.postedTo.find((p) => p.channel === c);
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={!!posted}
                  onClick={() => togglePosted(live.id, c)}
                  className={`min-h-11 rounded-full border px-4 text-xs font-semibold ${
                    posted ? "border-success bg-success-soft text-success" : "border-border text-navy hover:bg-navy-soft"
                  }`}
                >
                  {c}{posted ? ` · ${longDate(posted.postedOn)}` : ""}
                </button>
              );
            })}
          </div>
        </fieldset>
      </Section>

      <Section title={`Enquiries (${live.inquiries.length})`}>
        {live.inquiries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No enquiries yet.</p>
        ) : (
          <ul className="space-y-2">
            {live.inquiries.map((iq) => (
              <li key={iq.id} className="rounded-xl border border-border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-navy">{iq.name}</span>
                  <Tag tone="action">{iq.channel}</Tag>
                </div>
                <p className="mt-1 text-muted-foreground">{iq.message}</p>
                <p className="tnum mt-1 text-xs text-muted-foreground">{longDate(iq.at)} · {iq.email}</p>
              </li>
            ))}
          </ul>
        )}
        <form
          className="grid gap-2 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const data = new FormData(form);
            const name = String(data.get("name") ?? "").trim();
            if (!name) { toast.error("Add the person's name."); return; }
            addInquiry(live.id, {
              name,
              email: String(data.get("email") ?? ""),
              channel: String(data.get("channel") ?? "Kijiji"),
              at: new Date().toISOString().slice(0, 10),
              message: String(data.get("message") ?? ""),
            });
            toast.success("Enquiry logged.");
            form.reset();
          }}
        >
          <div>
            <label htmlFor="iq-name" className="text-sm font-medium">Name</label>
            <input id="iq-name" name="name" className={field} />
          </div>
          <div>
            <label htmlFor="iq-email" className="text-sm font-medium">Email</label>
            <input id="iq-email" name="email" type="email" className={field} />
          </div>
          <div>
            <label htmlFor="iq-channel" className="text-sm font-medium">Came from</label>
            <select id="iq-channel" name="channel" className={field}>
              {LISTING_CHANNELS.map((c) => <option key={c}>{c}</option>)}
              <option>Public link</option>
              <option>Word of mouth</option>
            </select>
          </div>
          <div>
            <label htmlFor="iq-msg" className="text-sm font-medium">What they asked</label>
            <input id="iq-msg" name="message" className={field} />
          </div>
          <button type="submit" className={`${btnGhost} sm:col-span-2`}>
            <ChatCircleDots weight="duotone" className="h-4 w-4" aria-hidden="true" /> Log enquiry
          </button>
        </form>
      </Section>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Applicant compare                                                   */
/* ------------------------------------------------------------------ */

export type CompareRow = { prospect: Prospect; app: Application; home: string; rent: number };

export function CompareApplicants({ rows, onClose }: { rows: CompareRow[]; onClose: () => void }) {
  const facts = useMemo(
    () =>
      rows.map((r) => {
        const pct = rentToIncomePct(r.rent, r.app.monthlyIncome);
        return { ...r, pct, note: affordabilityNote(pct) };
      }),
    [rows],
  );

  return (
    <Sheet title={`Compare ${rows.length} applicants`} onClose={onClose}>
      <div className="rounded-xl border border-maple/40 bg-maple-soft p-3 text-xs leading-relaxed text-navy">
        <p className="inline-flex items-center gap-2 font-semibold">
          <Scales weight="duotone" className="h-4 w-4 text-maple" aria-hidden="true" /> Fairness notice
        </p>
        <p className="mt-1">
          Every decision must comply with human-rights and tenancy law in your province. These figures are facts about
          each application, not a score and not a recommendation — <strong>the human decides</strong>. Record your reason
          either way.
        </p>
      </div>

      <div className="-mx-5 overflow-x-auto px-5">
        <table className="w-full min-w-[34rem] text-sm">
          <caption className="sr-only">Applicants side by side</caption>
          <thead>
            <tr>
              <th scope="col" className="p-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fact</th>
              {facts.map((f) => (
                <th key={f.prospect.id} scope="col" className="p-2 text-left font-display text-sm font-bold text-navy">{f.app.fullName}</th>
              ))}
            </tr>
          </thead>
          <tbody className="[&_td]:border-t [&_td]:border-border [&_td]:p-2 [&_th]:border-t [&_th]:border-border [&_th]:p-2">
            <tr>
              <th scope="row" className="text-left text-xs font-semibold text-muted-foreground">Home applied for</th>
              {facts.map((f) => <td key={f.prospect.id}>{f.home}</td>)}
            </tr>
            <tr>
              <th scope="row" className="text-left text-xs font-semibold text-muted-foreground">Move-in</th>
              {facts.map((f) => <td key={f.prospect.id} className="tnum">{longDate(f.app.moveIn)}</td>)}
            </tr>
            <tr>
              <th scope="row" className="text-left text-xs font-semibold text-muted-foreground">Monthly income</th>
              {facts.map((f) => <td key={f.prospect.id} className="money">{cad(f.app.monthlyIncome)}</td>)}
            </tr>
            <tr>
              <th scope="row" className="text-left text-xs font-semibold text-muted-foreground">Rent as share of income</th>
              {facts.map((f) => <td key={f.prospect.id}><Tag tone={f.note.tone}>{f.note.label}</Tag></td>)}
            </tr>
            <tr>
              <th scope="row" className="text-left text-xs font-semibold text-muted-foreground">Who's moving in</th>
              {facts.map((f) => <td key={f.prospect.id}>{f.app.occupants}</td>)}
            </tr>
            <tr>
              <th scope="row" className="text-left text-xs font-semibold text-muted-foreground">Employment</th>
              {facts.map((f) => <td key={f.prospect.id}>{f.app.jobTitle} · {f.app.employer}</td>)}
            </tr>
            <tr>
              <th scope="row" className="text-left text-xs font-semibold text-muted-foreground">Guarantor</th>
              {facts.map((f) => <td key={f.prospect.id}>{f.app.guarantorName || "None offered"}</td>)}
            </tr>
            <tr>
              <th scope="row" className="text-left text-xs font-semibold text-muted-foreground">Documents supplied</th>
              {facts.map((f) => <td key={f.prospect.id} className="tnum">{f.app.documents.length}</td>)}
            </tr>
            <tr>
              <th scope="row" className="text-left text-xs font-semibold text-muted-foreground">References checked</th>
              {facts.map((f) => (
                <td key={f.prospect.id}>{f.prospect.referencesChecked?.length ? `${f.prospect.referencesChecked.length} checked` : "Not yet"}</td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="text-left text-xs font-semibold text-muted-foreground">Screening</th>
              {facts.map((f) => <td key={f.prospect.id}>{screeningLabel[f.prospect.screening.status]}</td>)}
            </tr>
            <tr>
              <th scope="row" className="text-left text-xs font-semibold text-muted-foreground">Stage</th>
              {facts.map((f) => (
                <td key={f.prospect.id}><Tag tone={prospectTone[f.prospect.status]}>{prospectLabel[f.prospect.status]}</Tag></td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <ScreeningNotice />
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Decision (approve / decline) — always written down                  */
/* ------------------------------------------------------------------ */

export function DecisionDialog({
  prospect,
  applicantName,
  outcome,
  onClose,
}: {
  prospect: Prospect;
  applicantName: string;
  outcome: "approved" | "declined";
  onClose: () => void;
}) {
  const { decideProspect } = useLeasing();
  const [reason, setReason] = useState(outcome === "declined" ? DECLINE_REASONS[0]! : "Complete application, references verified");
  const [detail, setDetail] = useState("");

  return (
    <Sheet title={outcome === "declined" ? `Decline ${applicantName}` : `Approve ${applicantName}`} onClose={onClose}>
      <p className="text-sm text-muted-foreground">
        The reason is saved to the audit trail with your name and today's date. It is not sent to the applicant
        automatically — you choose what to write to them.
      </p>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          decideProspect(prospect.id, { outcome, reason, detail, by: "Mr. J (you)" });
          toast.success(outcome === "declined" ? "Decline recorded." : "Applicant approved.");
          onClose();
        }}
      >
        <div>
          <label htmlFor="dec-reason" className="text-sm font-medium">Reason</label>
          {outcome === "declined" ? (
            <select id="dec-reason" value={reason} onChange={(e) => setReason(e.target.value)} className={field}>
              {DECLINE_REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          ) : (
            <input id="dec-reason" value={reason} onChange={(e) => setReason(e.target.value)} className={field} />
          )}
        </div>
        <div>
          <label htmlFor="dec-detail" className="text-sm font-medium">Notes for the record</label>
          <textarea id="dec-detail" rows={3} value={detail} onChange={(e) => setDetail(e.target.value)} className="mt-1 w-full rounded-xl border border-input bg-background p-3 text-sm" />
        </div>
        {outcome === "declined" && <ScreeningNotice />}
        <div className="flex flex-wrap gap-2">
          <button type="submit" className={btnPrimary}>
            <Plus weight="duotone" className="h-4 w-4" aria-hidden="true" /> Record decision
          </button>
          <button type="button" className={btnGhost} onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Sheet>
  );
}
