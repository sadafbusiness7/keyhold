/**
 * Announcements UI — compose a broadcast, target an audience, pick channels,
 * schedule or send now, and read the delivery report.
 */
import { useMemo, useState } from "react";
import {
  Megaphone,
  Plus,
  PaperPlaneTilt,
  Trash,
  Paperclip,
  ChartBar,
  MagnifyingGlass,
  CalendarBlank,
  EnvelopeSimple,
  ChatCircleDots,
  DeviceMobile,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/keyhold/empty-state";
import { longDate, properties, units, propertyById } from "@/lib/mock-data";
import { useOperations, type Announcement, type AudienceScope, type Channel, type DeliveryState } from "@/lib/mock-operations";

const btn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors";
const primary = `${btn} bg-action text-primary-foreground hover:bg-action/90`;
const ghost = `${btn} border border-border text-navy hover:bg-navy-soft`;
const field =
  "min-h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action";

const scopeLabels: Record<AudienceScope, string> = {
  "all-tenants": "All tenants",
  property: "By property",
  unit: "By unit",
  owners: "Owners",
};

const channelMeta: Record<Channel, { label: string; Icon: typeof EnvelopeSimple }> = {
  email: { label: "Email", Icon: EnvelopeSimple },
  sms: { label: "SMS", Icon: ChatCircleDots },
  portal: { label: "Portal", Icon: DeviceMobile },
};

const stateTone: Record<DeliveryState, string> = {
  sent: "bg-navy-soft text-navy",
  delivered: "bg-action-soft text-action",
  opened: "bg-success-soft text-success",
  failed: "bg-maple-soft text-maple",
};

const emptyDraft = (): Announcement => ({
  id: `an-${Date.now()}`,
  title: "",
  body: "",
  attachmentName: null,
  scope: "all-tenants",
  targetIds: [],
  channels: ["email", "portal"],
  status: "draft",
  scheduledFor: null,
  sentOn: null,
  createdOn: new Date().toISOString().slice(0, 10),
  deliveries: [],
});

export function AnnouncementsScreen() {
  const { announcements, recipientsFor, saveAnnouncement, sendAnnouncement, deleteAnnouncement } = useOperations();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [composing, setComposing] = useState<Announcement | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Announcement | null>(null);

  const shown = useMemo(
    () =>
      announcements.filter((a) => {
        if (status !== "all" && a.status !== status) return false;
        const hay = `${a.title} ${a.body} ${scopeLabels[a.scope]}`.toLowerCase();
        return hay.includes(query.trim().toLowerCase());
      }),
    [announcements, query, status],
  );

  const open = announcements.find((a) => a.id === openId) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative flex-1 basis-52">
          <span className="sr-only">Search announcements</span>
          <MagnifyingGlass
            weight="duotone"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input className={`${field} pl-9`} placeholder="Search announcements" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <label className="basis-44">
          <span className="sr-only">Filter by status</span>
          <select className={field} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="sent">Sent</option>
          </select>
        </label>
        <button type="button" className={`${primary} px-4 text-xs`} onClick={() => setComposing(emptyDraft())}>
          <Plus weight="bold" className="h-4 w-4" aria-hidden="true" />
          New announcement
        </button>
      </div>

      {shown.length === 0 ? (
        <EmptyState
          Icon={Megaphone}
          title="No announcements yet"
          body="Tell every tenant at a property something once — snow removal, a water shut-off, a rent reminder."
        >
          <button type="button" className={primary} onClick={() => setComposing(emptyDraft())}>
            <Plus weight="bold" className="h-4 w-4" aria-hidden="true" />
            New announcement
          </button>
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {shown.map((a) => {
            const total = a.deliveries.length;
            const opened = a.deliveries.filter((d) => d.state === "opened").length;
            const failed = a.deliveries.filter((d) => d.state === "failed").length;
            return (
              <li key={a.id} className="card-soft p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base font-bold text-navy">{a.title || "Untitled announcement"}</p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{a.body}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-navy">{audienceText(a, recipientsFor)}</span>
                      <span>·</span>
                      {a.channels.map((c) => {
                        const { Icon, label } = channelMeta[c];
                        return (
                          <span key={c} className="inline-flex items-center gap-1">
                            <Icon weight="duotone" className="h-3.5 w-3.5" aria-hidden="true" />
                            {label}
                          </span>
                        );
                      })}
                      {a.attachmentName && (
                        <span className="inline-flex items-center gap-1">
                          <Paperclip weight="duotone" className="h-3.5 w-3.5" aria-hidden="true" />
                          {a.attachmentName}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <span
                      className={`rounded-full px-2 py-1 font-semibold ${
                        a.status === "sent" ? "bg-success-soft text-success" : a.status === "scheduled" ? "bg-warning-soft text-warning" : "bg-navy-soft text-navy"
                      }`}
                    >
                      {a.status === "sent" ? "Sent" : a.status === "scheduled" ? "Scheduled" : "Draft"}
                    </span>
                    <p className="mt-1 text-muted-foreground tnum">
                      {a.sentOn ? longDate(a.sentOn) : a.scheduledFor ? longDate(a.scheduledFor) : longDate(a.createdOn)}
                    </p>
                  </div>
                </div>

                {total > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground tnum">
                    {total} deliveries · {opened} opened · {failed} failed
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {a.status !== "sent" && (
                    <>
                      <button type="button" className={`${ghost} min-h-9 px-3 text-xs`} onClick={() => setComposing(structuredClone(a))}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className={`${primary} min-h-9 px-3 text-xs`}
                        onClick={() => {
                          sendAnnouncement(a.id, new Date().toISOString().slice(0, 10));
                          toast.success("Announcement sent");
                          setOpenId(a.id);
                        }}
                      >
                        <PaperPlaneTilt weight="duotone" className="h-4 w-4" aria-hidden="true" />
                        Send now
                      </button>
                    </>
                  )}
                  {a.status === "sent" && (
                    <button type="button" className={`${ghost} min-h-9 px-3 text-xs`} onClick={() => setOpenId(a.id)}>
                      <ChartBar weight="duotone" className="h-4 w-4" aria-hidden="true" />
                      Delivery report
                    </button>
                  )}
                  <button type="button" className={`${ghost} min-h-9 px-3 text-xs text-maple`} onClick={() => setConfirmDelete(a)}>
                    <Trash weight="duotone" className="h-4 w-4" aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {composing && (
        <Composer
          draft={composing}
          onClose={() => setComposing(null)}
          onSave={(a, send) => {
            saveAnnouncement(a);
            if (send) sendAnnouncement(a.id, new Date().toISOString().slice(0, 10));
            setComposing(null);
            toast.success(send ? "Announcement sent" : a.status === "scheduled" ? "Announcement scheduled" : "Draft saved");
          }}
        />
      )}

      <Sheet open={Boolean(open)} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {open && (
            <>
              <SheetHeader>
                <SheetTitle>{open.title}</SheetTitle>
                <SheetDescription>Delivery report · {open.sentOn ? longDate(open.sentOn) : "Not sent yet"}</SheetDescription>
              </SheetHeader>
              {open.deliveries.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">Nothing has been sent yet.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {open.deliveries.map((d) => (
                    <li key={d.id} className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-navy">{d.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {channelMeta[d.channel].label}
                          {d.reason ? ` · ${d.reason}` : ""}
                        </span>
                      </span>
                      <span className={`rounded-full px-2 py-1 text-[11px] font-semibold capitalize ${stateTone[d.state]}`}>{d.state}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={Boolean(confirmDelete)} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              “{confirmDelete?.title}” and its delivery report are removed. Messages already delivered stay with recipients.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) deleteAnnouncement(confirmDelete.id);
                setConfirmDelete(null);
                toast.success("Announcement deleted");
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function audienceText(a: Announcement, recipientsFor: ReturnType<typeof useOperations>["recipientsFor"]) {
  const count = recipientsFor(a.scope, a.targetIds).length;
  return `${scopeLabels[a.scope]} · ${count} recipient${count === 1 ? "" : "s"}`;
}

function Composer({
  draft,
  onClose,
  onSave,
}: {
  draft: Announcement;
  onClose: () => void;
  onSave: (a: Announcement, send: boolean) => void;
}) {
  const { recipientsFor } = useOperations();
  const [a, setA] = useState<Announcement>(draft);
  const recipients = recipientsFor(a.scope, a.targetIds);

  const toggleTarget = (id: string) =>
    setA((prev) => ({
      ...prev,
      targetIds: prev.targetIds.includes(id) ? prev.targetIds.filter((x) => x !== id) : [...prev.targetIds, id],
    }));

  const toggleChannel = (c: Channel) =>
    setA((prev) => ({
      ...prev,
      channels: prev.channels.includes(c) ? prev.channels.filter((x) => x !== c) : [...prev.channels, c],
    }));

  const validate = () => {
    if (!a.title.trim()) return "Give the announcement a title";
    if (!a.body.trim()) return "Write a message";
    if (!a.channels.length) return "Pick at least one channel";
    if ((a.scope === "property" || a.scope === "unit") && a.targetIds.length === 0) return "Choose at least one target";
    return null;
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New announcement</DialogTitle>
          <DialogDescription>One message, everyone who needs it.</DialogDescription>
        </DialogHeader>

        <label className="text-sm font-semibold text-navy">
          Title
          <input className={`${field} mt-1`} value={a.title} onChange={(e) => setA({ ...a, title: e.target.value })} />
        </label>

        <label className="text-sm font-semibold text-navy">
          Message
          <textarea
            rows={5}
            className="mt-1 w-full rounded-xl border border-border bg-card p-3 text-sm text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
            value={a.body}
            onChange={(e) => setA({ ...a, body: e.target.value })}
          />
        </label>

        <label className="text-sm font-semibold text-navy">
          Attachment
          <input
            type="file"
            className={`${field} mt-1 pt-2 text-xs`}
            onChange={(e) => setA({ ...a, attachmentName: e.target.files?.[0]?.name ?? null })}
          />
        </label>

        <fieldset>
          <legend className="text-sm font-semibold text-navy">Audience</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {(Object.keys(scopeLabels) as AudienceScope[]).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={a.scope === s}
                onClick={() => setA({ ...a, scope: s, targetIds: [] })}
                className={`${btn} min-h-9 px-3 text-xs ${
                  a.scope === s ? "bg-navy text-primary-foreground" : "border border-border text-navy hover:bg-navy-soft"
                }`}
              >
                {scopeLabels[s]}
              </button>
            ))}
          </div>

          {a.scope === "property" && (
            <ul className="mt-2 grid gap-1 sm:grid-cols-2">
              {properties.map((p) => (
                <li key={p.id}>
                  <label className="flex min-h-9 items-center gap-2 text-sm text-navy">
                    <input type="checkbox" checked={a.targetIds.includes(p.id)} onChange={() => toggleTarget(p.id)} />
                    <span className="truncate">{p.address}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}

          {a.scope === "unit" && (
            <ul className="mt-2 grid gap-1 sm:grid-cols-2">
              {units.map((u) => (
                <li key={u.id}>
                  <label className="flex min-h-9 items-center gap-2 text-sm text-navy">
                    <input type="checkbox" checked={a.targetIds.includes(u.id)} onChange={() => toggleTarget(u.id)} />
                    <span className="truncate">
                      {propertyById(u.propertyId).address} · {u.label}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </fieldset>

        <fieldset>
          <legend className="text-sm font-semibold text-navy">Channels</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {(Object.keys(channelMeta) as Channel[]).map((c) => {
              const { Icon, label } = channelMeta[c];
              const on = a.channels.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleChannel(c)}
                  className={`${btn} min-h-9 px-3 text-xs ${
                    on ? "bg-action text-primary-foreground" : "border border-border text-navy hover:bg-navy-soft"
                  }`}
                >
                  <Icon weight="duotone" className="h-4 w-4" aria-hidden="true" />
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="text-sm font-semibold text-navy">
          <span className="flex items-center gap-1.5">
            <CalendarBlank weight="duotone" className="h-4 w-4" aria-hidden="true" />
            Schedule for later (optional)
          </span>
          <input
            type="date"
            className={`${field} mt-1`}
            value={a.scheduledFor ?? ""}
            onChange={(e) =>
              setA({ ...a, scheduledFor: e.target.value || null, status: e.target.value ? "scheduled" : "draft" })
            }
          />
        </label>

        <p className="text-xs text-muted-foreground tnum">
          {recipients.length} recipient{recipients.length === 1 ? "" : "s"} · {a.channels.length * recipients.length} message
          {a.channels.length * recipients.length === 1 ? "" : "s"}
        </p>

        <DialogFooter>
          <button type="button" className={ghost} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={ghost}
            onClick={() => {
              const err = validate();
              if (err) {
                toast.error(err);
                return;
              }
              onSave(a, false);
            }}
          >
            {a.scheduledFor ? "Schedule" : "Save draft"}
          </button>
          <button
            type="button"
            className={primary}
            onClick={() => {
              const err = validate();
              if (err) {
                toast.error(err);
                return;
              }
              onSave({ ...a, scheduledFor: null }, true);
            }}
          >
            <PaperPlaneTilt weight="duotone" className="h-4 w-4" aria-hidden="true" />
            Send now
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
