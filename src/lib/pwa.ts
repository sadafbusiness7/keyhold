/**
 * Service-worker registration wrapper — the ONLY place that registers /sw.js.
 *
 * Registration is refused (and any stale registration removed) in dev, inside
 * an iframe, on Lovable preview hosts, and when `?sw=off` is present. Offline
 * support therefore only ever runs on the published app.
 */
const SW_URL = "/sw.js";

function isPreviewHost(hostname: string): boolean {
  return (
    hostname.startsWith("id-preview--") ||
    hostname.startsWith("preview--") ||
    hostname === "lovableproject.com" ||
    hostname.endsWith(".lovableproject.com") ||
    hostname === "lovableproject-dev.com" ||
    hostname.endsWith(".lovableproject-dev.com") ||
    hostname === "beta.lovable.dev" ||
    hostname.endsWith(".beta.lovable.dev")
  );
}

function shouldRefuse(): boolean {
  if (!import.meta.env.PROD) return true;
  if (window.self !== window.top) return true;
  if (isPreviewHost(window.location.hostname)) return true;
  return new URL(window.location.href).searchParams.get("sw") === "off";
}

async function unregisterMatching(): Promise<void> {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    registrations
      .filter((r) => (r.active ?? r.waiting ?? r.installing)?.scriptURL.endsWith(SW_URL))
      .map((r) => r.unregister()),
  );
}

export function registerServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  void (async () => {
    try {
      if (shouldRefuse()) {
        await unregisterMatching();
        return;
      }
      await navigator.serviceWorker.register(SW_URL, { scope: "/" });
    } catch {
      /* offline support is a bonus — never break the app for it */
    }
  })();
}