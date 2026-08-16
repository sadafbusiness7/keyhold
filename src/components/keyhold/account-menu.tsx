/**
 * ACCOUNT MENU — the signed-in identity affordance.
 * Shows who you are and, most importantly, how to sign out. Works in every
 * shell: manager app, owner portal and tenant portal (where there may be no
 * AccessProvider, so the context read is optional).
 */
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { CaretDown, Gear, SignOut, UserCircle } from "@phosphor-icons/react";
import { useOptionalAccess } from "@/lib/mock-access";
import { useI18n } from "@/lib/i18n";
import { LanguagePicker, ThemeSegmented } from "./appearance-menu";

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  pm: "Property manager",
  "owner-client": "Property owner",
  tenant: "Tenant",
};

export function AccountMenu({ align = "right" }: { align?: "right" | "left" }) {
  const access = useOptionalAccess();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const user = access?.currentUser;
  const name = user?.name ?? t("ui.yourAccount");
  const role = user ? ROLE_LABEL[user.accountType] ?? "Member" : t("ui.signedIn");
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  const signOut = () => {
    setOpen(false);
    // Demo build: there is no server session to clear, so return the demo to
    // its default identity and land on the sign-in screen.
    access?.setCurrentUserId("u_owner");
    navigate({ to: "/signin", replace: true });
  };

  return (
    <div className="relative" ref={wrap}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex min-h-11 items-center gap-2 rounded-full border border-border pl-1 pr-2 text-navy transition-colors hover:bg-navy-soft"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy text-xs font-bold text-primary-foreground">
          {initials || <UserCircle weight="duotone" className="h-5 w-5" aria-hidden="true" />}
        </span>
        <span className="hidden max-w-32 truncate text-sm font-semibold sm:block">{name}</span>
        <CaretDown weight="duotone" className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="sr-only">{t("ui.account")}</span>
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute top-full z-50 mt-2 w-72 rounded-2xl border border-border bg-card p-1 shadow-xl ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-bold text-navy">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email ?? role}</p>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">{role}</p>
          </div>
          {user?.accountType === "owner" && (
            <Link
              to="/app/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-navy hover:bg-navy-soft"
            >
              <Gear weight="duotone" className="h-5 w-5" aria-hidden="true" />
              {t("ui.settings")}
            </Link>
          )}
          <div className="my-1 border-t border-border pt-1">
            <ThemeSegmented />
            <LanguagePicker />
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-semibold text-maple hover:bg-maple-soft"
          >
            <SignOut weight="duotone" className="h-5 w-5" aria-hidden="true" />
            {t("ui.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
