/**
 * "Add to home screen" affordance. Uses the browser's own install event where
 * it exists (Chrome/Edge/Android) and falls back to plain instructions on iOS
 * Safari, which has no programmatic prompt.
 */
import { useEffect, useState } from "react";
import { DeviceMobile, X, Share } from "@phosphor-icons/react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const DISMISS_KEY = "keyhold.install.dismissed";

export function InstallPrompt({ audience = "app" }: { audience?: "app" | "portal" }) {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* private mode */
    }
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
      setHidden(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const ua = window.navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua)) {
      setIosHint(true);
      setHidden(false);
    }
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => {
    setHidden(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  if (hidden) return null;

  return (
    <div
      role="region"
      aria-label="Install Keyhold"
      className="card-soft mb-4 flex items-start gap-3 p-4"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy-soft text-navy">
        <DeviceMobile weight="duotone" className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-extrabold text-navy">
          {audience === "portal" ? "Install your tenant portal" : "Install Keyhold"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {iosHint ? (
            <>
              Tap <Share className="inline h-3.5 w-3.5 align-text-bottom" aria-label="Share" /> Share, then
              “Add to Home Screen” — it opens full screen and works offline.
            </>
          ) : (
            <>Add it to your home screen for one-tap access, full screen, and offline pages.</>
          )}
        </p>
        {!iosHint && (
          <button
            type="button"
            onClick={async () => {
              if (!event) return;
              await event.prompt();
              await event.userChoice.catch(() => undefined);
              dismiss();
            }}
            className="mt-3 inline-flex min-h-10 items-center rounded-full bg-action px-4 text-xs font-semibold text-primary-foreground hover:bg-action/90"
          >
            Add to home screen
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-navy-soft"
      >
        <X weight="bold" className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}