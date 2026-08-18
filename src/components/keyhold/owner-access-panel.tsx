/**
 * OWNER-PORTAL ACCESS (manager side) — presentation only.
 * The manager decides which properties an owner sees, and which sections of the
 * portal are open on each property. Backed by owner_property_access rows.
 */
import { useState } from "react";
import { Plus, Buildings, LinkSimple, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  OWNER_SECTIONS,
  ALL_OWNER_SECTIONS,
  inviteExpiryLabel,
  usePermissions,
  type AppUser,
  type OwnerSection,
} from "@/lib/mock-access";
import { propertyById } from "@/lib/mock-data";
import { StatusBadge } from "@/components/keyhold/team-panels";

const btn =
  "inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft";
const btnPrimary =
  "inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90 disabled:opacity-50";
const inputCls = "min-h-11 w-full rounded-xl border border-input bg-card px-3 text-sm";

export function OwnerAccessSection() {
  const perms = usePermissions();
  const owners = perms.users.filter((u) => u.accountType === "owner-client");

  const [inviting, setInviting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [openId, setOpenId] = useState<string | null>(owners[0]?.id ?? null);

  const invite = () => {
    if (!name.trim() || !email.trim()) return;
    const created = perms.inviteOwner(name.trim(), email.trim());
    toast.success(`Secure invite link sent to ${created.email} — they set their own password.`);
    setName("");
    setEmail("");
    setInviting(false);
    setOpenId(created.id);
  };

  return (
    <section aria-labelledby="owners" className="mb-10">
      <h2 id="owners" className="mb-1 font-display text-lg font-bold">
        Property owners
      </h2>
      <p className="mb-3 text-sm text-muted-foreground">
        Owners get a read-only portal. You choose their properties and which sections they can open.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button type="button" className={btnPrimary} onClick={() => setInviting((v) => !v)}>
          <Plus weight="duotone" className="h-5 w-5" aria-hidden="true" /> Invite an owner
        </button>
        <p className="tnum text-sm text-muted-foreground">{owners.length} owner{owners.length === 1 ? "" : "s"} with portal access</p>
      </div>

      {inviting && (
        <div className="card-soft mb-4 grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="text-xs font-semibold text-navy">
            Full name
            <input className={`mt-1 ${inputCls}`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Joseph Nkemelu" />
          </label>
          <label className="text-xs font-semibold text-navy">
            Email
            <input type="email" className={`mt-1 ${inputCls}`} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="owner@example.ca" />
          </label>
          <button type="button" className={btnPrimary} onClick={invite} disabled={!name.trim() || !email.trim()}>
            <LinkSimple weight="duotone" className="h-5 w-5" aria-hidden="true" /> Send magic link
          </button>
          <p className="text-xs text-muted-foreground sm:col-span-3">
            Keyhold emails a single-use link that expires in 7 days. You never set an owner's password.
          </p>
        </div>
      )}

      <ul className="space-y-3">
        {owners.map((owner) => (
          <OwnerRow
            key={owner.id}
            owner={owner}
            open={openId === owner.id}
            onToggle={() => setOpenId((v) => (v === owner.id ? null : owner.id))}
          />
        ))}
      </ul>
    </section>
  );
}

function OwnerRow({ owner, open, onToggle }: { owner: AppUser; open: boolean; onToggle: () => void }) {
  const perms = usePermissions();
  const rows = perms.ownerAccessFor(owner.id);

  const toggleSection = (propertyId: string, section: OwnerSection) => {
    const current = rows.find((r: any) => r.propertyId === propertyId)?.sections ?? [];
    const next = current.includes(section) ? current.filter((s: any) => s !== section) : [...current, section];
    perms.setOwnerAccess(owner.id, propertyId, next);
  };

  const grantAll = (propertyId: string) => perms.setOwnerAccess(owner.id, propertyId, ALL_OWNER_SECTIONS);

  return (
    <li className="card-soft p-4">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full flex-wrap items-center gap-2 text-left">
        <span className="font-display text-base font-bold text-navy">{owner.name}</span>
        <StatusBadge status={owner.status} />
        <span className="truncate text-sm text-muted-foreground">{owner.email}</span>
        <span className="tnum ml-auto text-xs text-muted-foreground">
          {rows.length} propert{rows.length === 1 ? "y" : "ies"} ·{" "}
          {owner.status === "invited" ? inviteExpiryLabel(owner) : "active"}
        </span>
      </button>

      {open && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <caption className="sr-only">Owner portal access for {owner.name}</caption>
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2">Property</th>
                {OWNER_SECTIONS.map((s) => (
                  <th key={s.id} className="py-2 text-center" title={s.help}>
                    {s.label}
                  </th>
                ))}
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {perms.visiblePropertyIds.map((pid) => {
                const property = propertyById(pid);
                const granted = rows.find((r: any) => r.propertyId === pid)?.sections ?? [];
                return (
                  <tr key={pid} className="border-t border-border">
                    <td className="py-2 font-semibold text-navy">
                      <span className="flex items-center gap-2">
                        <Buildings weight="duotone" className="h-4 w-4" aria-hidden="true" />
                        {property.name}
                      </span>
                    </td>
                    {OWNER_SECTIONS.map((s) => (
                      <td key={s.id} className="py-2 text-center">
                        <label className="inline-flex min-h-11 min-w-11 items-center justify-center">
                          <span className="sr-only">{`${s.label} on ${property.name}`}</span>
                          <input
                            type="checkbox"
                            className="h-5 w-5"
                            checked={granted.includes(s.id)}
                            onChange={() => toggleSection(pid, s.id)}
                          />
                        </label>
                      </td>
                    ))}
                    <td className="py-2 text-right">
                      {granted.length ? (
                        <button
                          type="button"
                          className={btn}
                          onClick={() => {
                            perms.removeOwnerAccess(owner.id, pid);
                            toast.success(`${owner.name} can no longer see ${property.name}.`);
                          }}
                        >
                          <Trash weight="duotone" className="h-4 w-4" aria-hidden="true" /> Revoke
                        </button>
                      ) : (
                        <button type="button" className={btn} onClick={() => grantAll(pid)}>
                          Grant all
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-muted-foreground">
            Owners can never edit anything, and never see tenant contact details or payment history.
          </p>
        </div>
      )}
    </li>
  );
}
