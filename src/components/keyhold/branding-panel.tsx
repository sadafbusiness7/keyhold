/**
 * BRANDING + LANGUAGE settings. Only the logo and accent are configurable —
 * everything else stays on the design system so contrast and dark mode hold.
 */
import { useRef } from "react";
import { toast } from "sonner";
import { UploadSimple, Trash, Palette, Translate, Key, Receipt, EnvelopeSimple } from "@phosphor-icons/react";
import { ACCENT_PRESETS, brandStyle, useBranding } from "@/lib/mock-branding";
import { LOCALES, useI18n } from "@/lib/i18n";

const inputClass = "mt-1 min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm";

export function BrandingPanel() {
  const { branding, update, reset } = useBranding();
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|svg\+xml|webp)$/.test(file.type)) {
      toast.error("Use a PNG, JPG, WebP or SVG logo.");
      return;
    }
    if (file.size > 500_000) {
      toast.error("Keep the logo under 500 KB so emails stay fast.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      update({ logoDataUrl: String(reader.result) });
      toast.success("Logo saved. Your tenants will see it from now on.");
    };
    reader.readAsDataURL(file);
  };

  return (
    <section aria-labelledby="brand-h" className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="card-soft p-5 sm:p-6">
        <h2 id="brand-h" className="flex items-center gap-2 font-display text-lg font-extrabold text-navy">
          <Palette weight="duotone" className="h-5 w-5" aria-hidden="true" />
          Your brand
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your logo and accent colour appear on the tenant portal, generated PDFs (leases, receipts, statements) and
          every email we send on your behalf.
        </p>

        <div className="mt-5">
          <label className="text-sm font-medium text-navy" htmlFor="brand-name">Company name</label>
          <input
            id="brand-name"
            className={inputClass}
            value={branding.companyName}
            onChange={(e) => update({ companyName: e.target.value })}
          />
        </div>

        <div className="mt-5">
          <p className="text-sm font-medium text-navy">Logo</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="grid h-14 w-32 place-items-center overflow-hidden rounded-xl border border-border bg-surface-sunk">
              {branding.logoDataUrl ? (
                <img src={branding.logoDataUrl} alt={`${branding.companyName} logo`} className="max-h-12 max-w-28 object-contain" />
              ) : (
                <span className="text-xs text-muted-foreground">No logo yet</span>
              )}
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="sr-only"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-navy px-4 text-sm font-semibold text-primary-foreground hover:bg-navy/90"
            >
              <UploadSimple weight="duotone" className="h-4 w-4" aria-hidden="true" />
              Upload logo
            </button>
            {branding.logoDataUrl && (
              <button
                type="button"
                onClick={() => update({ logoDataUrl: null })}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
              >
                <Trash weight="duotone" className="h-4 w-4" aria-hidden="true" />
                Remove
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">PNG, JPG, WebP or SVG up to 500 KB. A wide logo reads best.</p>
        </div>

        <div className="mt-6">
          <p className="text-sm font-medium text-navy">Accent colour</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {ACCENT_PRESETS.map((preset) => (
              <button
                key={preset.hex}
                type="button"
                onClick={() => update({ accent: preset.hex })}
                aria-pressed={branding.accent.toLowerCase() === preset.hex.toLowerCase()}
                aria-label={preset.label}
                title={preset.label}
                className={`h-10 w-10 rounded-full border-2 ${
                  branding.accent.toLowerCase() === preset.hex.toLowerCase() ? "border-navy" : "border-border"
                }`}
                style={{ backgroundColor: preset.hex }}
              />
            ))}
            <label className="ml-2 flex items-center gap-2 text-xs text-muted-foreground">
              Custom
              <input
                type="color"
                aria-label="Custom accent colour"
                value={branding.accent}
                onChange={(e) => update({ accent: e.target.value })}
                className="h-10 w-12 rounded-lg border border-border bg-background"
              />
            </label>
          </div>
        </div>

        <label className="mt-6 flex items-start gap-3 text-sm text-navy">
          <input
            type="checkbox"
            className="mt-0.5 h-5 w-5 rounded border-input"
            checked={branding.showPoweredBy}
            onChange={(e) => update({ showPoweredBy: e.target.checked })}
          />
          <span>
            Show “Powered by Keyhold” in the portal footer and emails
            <span className="block text-xs text-muted-foreground">Turn it off for a fully white-label experience.</span>
          </span>
        </label>

        <button
          type="button"
          onClick={() => {
            reset();
            toast.success("Branding reset to Keyhold defaults.");
          }}
          className="mt-6 text-sm font-semibold text-navy hover:underline"
        >
          Reset to Keyhold defaults
        </button>
      </div>

      <BrandPreview />
    </section>
  );
}

function BrandPreview() {
  const { branding } = useBranding();
  const style = brandStyle(branding);
  const accent = branding.accent;
  const onAccent = String(style["--brand-accent-foreground" as keyof typeof style]);

  const Logo = () =>
    branding.logoDataUrl ? (
      <img src={branding.logoDataUrl} alt={`${branding.companyName} logo`} className="max-h-7 max-w-24 object-contain" />
    ) : (
      <span className="flex items-center gap-2 font-display text-sm font-extrabold text-navy">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-navy text-primary-foreground">
          <Key weight="duotone" className="h-4 w-4" aria-hidden="true" />
        </span>
        {branding.companyName}
      </span>
    );

  return (
    <div className="card-soft p-5 sm:p-6" style={style}>
      <h2 className="font-display text-lg font-extrabold text-navy">Live preview</h2>
      <p className="mt-1 text-sm text-muted-foreground">Exactly what your tenants see.</p>

      <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tenant portal</p>
      <div className="mt-2 overflow-hidden rounded-2xl border border-border">
        <div className="flex items-center justify-between border-b border-border bg-sidebar px-3 py-2">
          <Logo />
          <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: accent, color: onAccent }}>
            Pay rent
          </span>
        </div>
        <div className="bg-card p-3">
          <p className="text-xs text-muted-foreground">Due 1 September</p>
          <p className="money font-display text-lg font-extrabold text-navy">CA$1,850.00</p>
        </div>
      </div>

      <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Receipt PDF</p>
      <div className="mt-2 rounded-2xl border border-border bg-card p-3">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <Logo />
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Receipt weight="duotone" className="h-4 w-4" aria-hidden="true" />
            Receipt #2026-08-014
          </span>
        </div>
        <div className="mt-2 h-1 w-16 rounded-full" style={{ backgroundColor: accent }} />
        <p className="mt-2 text-xs text-muted-foreground">Rent for August 2026 · 27 Birchmount Rd, Unit 2</p>
      </div>

      <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</p>
      <div className="mt-2 rounded-2xl border border-border bg-card p-3">
        <div className="flex items-center gap-2">
          <EnvelopeSimple weight="duotone" className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-xs font-semibold text-navy">Your rent receipt is ready</span>
        </div>
        <div className="mt-3 border-t border-border pt-3">
          <Logo />
          <p className="mt-2 text-xs text-muted-foreground">Hi Amara — thanks for your payment.</p>
          <span
            className="mt-3 inline-block rounded-full px-3 py-1.5 text-xs font-bold"
            style={{ backgroundColor: accent, color: onAccent }}
          >
            View receipt
          </span>
          {branding.showPoweredBy && <p className="mt-3 text-[10px] text-muted-foreground">Powered by Keyhold</p>}
        </div>
      </div>
    </div>
  );
}

export function LanguagePanel() {
  const { locale, setLocale, fmtMoney, fmtDate, fmtNumber } = useI18n();

  return (
    <section aria-labelledby="lang-h" className="card-soft max-w-2xl p-5 sm:p-6">
      <h2 id="lang-h" className="flex items-center gap-2 font-display text-lg font-extrabold text-navy">
        <Translate weight="duotone" className="h-5 w-5" aria-hidden="true" />
        Language & region
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Interface language for you. Dates, numbers and Canadian dollars follow the same choice.
      </p>

      <fieldset className="mt-5">
        <legend className="text-sm font-medium text-navy">Language</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {LOCALES.map((l) => (
            <label
              key={l.code}
              className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 text-sm font-semibold ${
                locale === l.code ? "border-action bg-action/10 text-navy" : "border-border text-navy hover:bg-navy-soft"
              }`}
            >
              <input
                type="radio"
                name="locale"
                className="h-4 w-4"
                checked={locale === l.code}
                onChange={() => setLocale(l.code)}
              />
              {l.native}
              <span className="text-xs font-normal text-muted-foreground">{l.english}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <dl className="mt-6 grid gap-3 rounded-2xl bg-surface-sunk p-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">Money</dt>
          <dd className="money font-extrabold text-navy">{fmtMoney(185000)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Date</dt>
          <dd className="tnum font-semibold text-navy">{fmtDate("2026-09-01")}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Number</dt>
          <dd className="tnum font-semibold text-navy">{fmtNumber(12480.5, { maximumFractionDigits: 1 })}</dd>
        </div>
      </dl>

      <p className="mt-4 text-xs text-muted-foreground">
        French interface strings are in place for navigation and page headers; the remaining copy falls back to English
        until it is translated, so nothing ever appears blank.
      </p>
    </section>
  );
}