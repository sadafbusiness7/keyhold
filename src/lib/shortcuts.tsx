/**
 * KEYBOARD SHORTCUTS + COMMAND PALETTE STATE
 *
 * One place owns every global key binding so nothing fights over the keyboard:
 *   ⌘K / Ctrl+K or /   open the command palette
 *   n                  open the palette on "Create new…"
 *   ?                  open the shortcut cheat sheet
 *   g then <key>       jump to a section (g d = dashboard, g r = rent…)
 *   Esc                close the top-most overlay
 *
 * Typing in a field never triggers a shortcut (only ⌘K and Esc survive), so
 * the app stays usable for people who navigate by keyboard alone.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "@tanstack/react-router";

export type Jump = { keys: string; label: string; to: string };

/** g-then-key navigation jumps. Keep in sync with the cheat sheet. */
export const JUMPS: Jump[] = [
  { keys: "d", label: "Dashboard", to: "/app" },
  { keys: "p", label: "Properties & units", to: "/app/properties" },
  { keys: "r", label: "Rent", to: "/app/rent" },
  { keys: "t", label: "Tenants", to: "/app/tenants" },
  { keys: "m", label: "Maintenance", to: "/app/maintenance" },
  { keys: "l", label: "Leases & notices", to: "/app/leases" },
  { keys: "c", label: "Calendar", to: "/app/calendar" },
  { keys: "u", label: "Messages", to: "/app/messages" },
  { keys: "o", label: "Documents", to: "/app/documents" },
  { keys: "i", label: "Insights", to: "/app/insights" },
  { keys: "e", label: "Reports", to: "/app/reports" },
  { keys: "s", label: "Settings", to: "/app/settings" },
];

const RECENT_KEY = "keyhold.recent-searches";
const RECENT_MAX = 6;

type Ctx = {
  paletteOpen: boolean;
  paletteMode: "search" | "new";
  openPalette: (mode?: "search" | "new") => void;
  setPaletteOpen: (v: boolean) => void;
  cheatOpen: boolean;
  setCheatOpen: (v: boolean) => void;
  recent: string[];
  rememberSearch: (term: string) => void;
  clearRecent: () => void;
  /** which g-key is armed, for the on-screen hint */
  pendingJump: boolean;
};

const ShortcutsContext = createContext<Ctx | null>(null);

/** True when the keystroke belongs to whatever the person is typing into. */
function isTypingTarget(el: EventTarget | null) {
  const node = el as HTMLElement | null;
  if (!node || !node.tagName) return false;
  const tag = node.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || node.isContentEditable === true;
}

export function ShortcutsProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteMode, setPaletteMode] = useState<"search" | "new">("search");
  const [cheatOpen, setCheatOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [pendingJump, setPendingJump] = useState(false);
  const jumpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Recent searches are a convenience, not data: localStorage is enough.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw) as string[]);
    } catch {
      /* storage blocked — recents simply stay empty */
    }
  }, []);

  const rememberSearch = useCallback((term: string) => {
    const t = term.trim();
    if (t.length < 2) return;
    setRecent((prev) => {
      const next = [t, ...prev.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, RECENT_MAX);
      try {
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecent([]);
    try {
      window.localStorage.removeItem(RECENT_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const openPalette = useCallback((mode: "search" | "new" = "search") => {
    setPaletteMode(mode);
    setPaletteOpen(true);
  }, []);

  useEffect(() => {
    const armJump = () => {
      setPendingJump(true);
      if (jumpTimer.current) clearTimeout(jumpTimer.current);
      jumpTimer.current = setTimeout(() => setPendingJump(false), 1200);
    };

    const onKey = (e: KeyboardEvent) => {
      const key = e.key;
      const meta = e.metaKey || e.ctrlKey;

      if (meta && key.toLowerCase() === "k") {
        e.preventDefault();
        openPalette("search");
        return;
      }
      if (meta || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      if (pendingJump) {
        const hit = JUMPS.find((j) => j.keys === key.toLowerCase());
        setPendingJump(false);
        if (jumpTimer.current) clearTimeout(jumpTimer.current);
        if (hit) {
          e.preventDefault();
          navigate({ to: hit.to });
        }
        return;
      }

      if (key.toLowerCase() === "g") {
        e.preventDefault();
        armJump();
        return;
      }
      if (key === "/") {
        e.preventDefault();
        openPalette("search");
        return;
      }
      if (key.toLowerCase() === "n") {
        e.preventDefault();
        openPalette("new");
        return;
      }
      if (key === "?") {
        e.preventDefault();
        setCheatOpen(true);
      }
    };

    // Capture phase: the palette must win the keystroke before any nested
    // widget (or the browser's own find bar) can swallow it.
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      if (jumpTimer.current) clearTimeout(jumpTimer.current);
    };
  }, [navigate, openPalette, pendingJump]);

  const value = useMemo<Ctx>(
    () => ({
      paletteOpen,
      paletteMode,
      openPalette,
      setPaletteOpen,
      cheatOpen,
      setCheatOpen,
      recent,
      rememberSearch,
      clearRecent,
      pendingJump,
    }),
    [paletteOpen, paletteMode, openPalette, cheatOpen, recent, rememberSearch, clearRecent, pendingJump],
  );

  return <ShortcutsContext.Provider value={value}>{children}</ShortcutsContext.Provider>;
}

export function useShortcuts() {
  const ctx = useContext(ShortcutsContext);
  if (!ctx) throw new Error("useShortcuts must be used inside ShortcutsProvider");
  return ctx;
}

export function useOptionalShortcuts() {
  return useContext(ShortcutsContext);
}
