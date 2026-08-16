/**
 * DEMO AID ONLY — "view as" switcher.
 * Delete this file, its import in app-shell.tsx and setCurrentUserId in
 * mock-access.tsx to remove the demo entirely.
 */
import { useState } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { CaretDown, UserSwitch } from "@phosphor-icons/react";
import { usePermissions } from "@/lib/mock-access";

export function DemoSwitcher({ compact = false, position = "relative" }: { compact?: boolean; position?: "relative" | "fixed" | "static" }) {
  const { users, user, setCurrentUserId } = usePermissions();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const router = useRouter();

  const pick = (id: string) => {
    const next = users.find((u) => u.id === id)!;
    setCurrentUserId(id);
    setOpen(false);
    navigate({
      to:
        next.accountType === "tenant" ? "/portal" : next.accountType === "owner-client" ? "/owner" : "/app",
    }).then(() => {
      // Invalidate router after navigation to ensure context is fresh
      router.invalidate();
    });
  };

  const roleLabel =
    user.accountType === "owner"
      ? "Owner"
      : user.accountType === "pm"
        ? "Property manager"
        : user.accountType === "owner-client"
          ? "Property owner"
          : "Tenant";

  return (
    <div className={`${position} px-3`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center gap-2 rounded-2xl border border-dashed border-action/60 bg-action-soft px-3 text-left text-xs font-semibold text-action"
      >
        <UserSwitch weight="duotone" className="h-5 w-5 shrink-0" aria-hidden="true" />
        {!compact && (
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] uppercase tracking-widest opacity-70">Demo: view as…</span>
            <span className="block truncate">{user.name} · {roleLabel}</span>
          </span>
        )}
        {!compact && <CaretDown weight="duotone" className="h-4 w-4 shrink-0" aria-hidden="true" />}
      </button>
      {open && (
        <ul className="absolute bottom-full left-4 right-4 z-[9999] mb-2 max-h-[60vh] overflow-y-auto rounded-2xl border border-border bg-card p-1 shadow-2xl sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:right-auto sm:w-[320px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:fixed">
          {users.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => pick(u.id)}
                className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 text-left text-sm ${
                  u.id === user.id ? "bg-navy-soft font-semibold text-navy" : "hover:bg-navy-soft"
                }`}
              >
                <span className="truncate">{u.name}</span>
                <span className="shrink-0 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {u.accountType}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && <div className="fixed inset-0 z-[9998] bg-navy/20 backdrop-blur-[2px]" onClick={() => setOpen(false)} />}
    </div>
  );
}
