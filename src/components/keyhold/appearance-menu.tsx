/**
 * APPEARANCE + LANGUAGE controls.
 * Two small pieces used inside the account menu (and anywhere else a shell
 * needs them): a light/dark/system segmented control, and a language picker.
 */

import { Check, Globe, Moon, Sun, Desktop } from "@phosphor-icons/react";
import { useTheme, type ThemeChoice } from "@/lib/theme";
import { LOCALES, useI18n, type Locale } from "@/lib/i18n";

export function ThemeSegmented() {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  const options: { value: ThemeChoice; label: string; Icon: typeof Sun }[] = [
    { value: "light", label: t("ui.light"), Icon: Sun },
    { value: "dark", label: t("ui.dark"), Icon: Moon },
    { value: "system", label: t("ui.system"), Icon: Desktop },
  ];
  return (
    <div>
      <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {t("ui.appearance")}
      </p>
      <div role="radiogroup" aria-label={t("ui.appearance")} className="mx-2 mb-1 grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1">
        {options.map(({ value, label, Icon }) => {
          const active = theme === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setTheme(value)}
              className={`flex min-h-9 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-semibold transition-colors ${
                active ? "bg-card text-navy shadow-sm" : "text-muted-foreground hover:text-navy"
              }`}
            >
              <Icon weight="duotone" className="h-4 w-4" aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Quick top-bar toggle for people who just want the switch. */
export function ThemeToggleButton() {
  const { resolved, toggle } = useTheme();
  const { t } = useI18n();
  const label = resolved === "dark" ? t("ui.light") : t("ui.dark");
  return (
    <button
      type="button"
      onClick={toggle}
      title={label}
      className="grid h-11 w-11 place-items-center rounded-full border border-border text-navy transition-colors hover:bg-navy-soft"
    >
      {resolved === "dark" ? (
        <Sun weight="duotone" className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Moon weight="duotone" className="h-5 w-5" aria-hidden="true" />
      )}
      <span className="sr-only">{label}</span>
    </button>
  );
}

export function LanguagePicker({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div>
      <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {t("ui.language")}
      </p>
      <div
        role="radiogroup"
        aria-label={t("ui.language")}
        className="mx-2 mb-1 grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1"
      >
        {LOCALES.map((l) => {
          const active = l.code === locale;
          return (
            <button
              key={l.code}
              type="button"
              role="radio"
              aria-checked={active}
              lang={l.code}
              onClick={() => setLocale(l.code as Locale)}
              className={`flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-semibold transition-colors ${
                active ? "bg-card text-navy shadow-sm" : "text-muted-foreground hover:text-navy"
              }`}
            >
              <Globe weight="duotone" className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{compact ? l.code.toUpperCase() : l.native}</span>
              {active && <Check weight="bold" className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

