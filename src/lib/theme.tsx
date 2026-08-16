/**
 * THEME — light / dark / follow-system, persisted per browser.
 *
 * The design tokens for dark mode already live in src/styles.css under `.dark`;
 * this provider is the thing that actually puts that class on <html>, keeps it
 * in sync with the OS preference, and remembers the choice.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ThemeChoice = "light" | "dark" | "system";

const STORAGE_KEY = "keyhold.theme";

function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function readStoredTheme(): ThemeChoice {
  if (typeof window === "undefined") return "system";
  const raw = window.localStorage.getItem(STORAGE_KEY);
  // No stored choice → light. We deliberately do NOT follow the OS by default:
  // the marketing site should always open in its normal, light presentation.
  return raw === "light" || raw === "dark" || raw === "system" ? raw : "light";
}

export function resolveTheme(choice: ThemeChoice): "light" | "dark" {
  return choice === "system" ? (systemPrefersDark() ? "dark" : "light") : choice;
}

function applyClass(resolved: "light" | "dark") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

/**
 * Used by the marketing page's scroll-driven dark zone. When the zone turns
 * off we restore the user's real preference instead of forcing light.
 */
export function applyZoneDark(on: boolean) {
  applyClass(on ? "dark" : resolveTheme(readStoredTheme()));
}

/** Inline script: applies the saved theme before first paint (no flash). */
export const themeBootScript = `(function(){try{var c=localStorage.getItem('${STORAGE_KEY}')||'light';var d=c==='dark'||(c!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

type Ctx = {
  theme: ThemeChoice;
  resolved: "light" | "dark";
  setTheme: (t: ThemeChoice) => void;
  toggle: () => void;
};

const ThemeContext = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeChoice>("light");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  // Read the stored choice after hydration so server and client markup match.
  useEffect(() => {
    const stored = readStoredTheme();
    setThemeState(stored);
    const next = resolveTheme(stored);
    setResolved(next);
    applyClass(next);
  }, []);

  // Follow the OS when the user hasn't pinned a theme.
  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = mq.matches ? "dark" : "light";
      setResolved(next);
      applyClass(next);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: ThemeChoice) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode — the choice just won't persist */
    }
    const r = resolveTheme(next);
    setResolved(r);
    applyClass(r);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      theme,
      resolved,
      setTheme,
      toggle: () => setTheme(resolved === "dark" ? "light" : "dark"),
    }),
    [theme, resolved, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Ctx {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
