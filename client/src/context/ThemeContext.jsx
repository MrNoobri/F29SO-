import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation } from "react-router";
import { authAPI } from "../api";
import { useAuth } from "./AuthContext";

const THEMES = ["crimson", "medical", "midnight", "emerald"];
const MODES = ["light", "dark"];
const DEFAULT_THEME = "crimson";
const DEFAULT_MODE = "dark";

const THEME_TOKENS = {
  crimson: {
    light: {
      bg: "#fef2f2",
      surface: "#ffffff",
      surface2: "#fce7e7",
      border: "#fecaca",
      text: "#1c1917",
      textMuted: "#78716c",
      primary: "#be123c",
      secondary: "#e11d48",
      accent: "#f59e0b",
      ringTrack: "rgba(190, 18, 60, 0.16)",
      focus: "rgba(190, 18, 60, 0.35)",
      glass: "rgba(255, 255, 255, 0.62)",
      bgEffect1: "rgba(190, 18, 60, 0.10)",
      bgEffect2: "rgba(225, 29, 72, 0.08)",
      bgEffect3: "rgba(245, 158, 11, 0.07)",
    },
    dark: {
      bg: "#0c0a09",
      surface: "#1c1917",
      surface2: "#0a0806",
      border: "rgba(168, 162, 158, 0.18)",
      text: "#fafaf9",
      textMuted: "#a8a29e",
      primary: "#e11d48",
      secondary: "#f43f5e",
      accent: "#fbbf24",
      ringTrack: "rgba(225, 29, 72, 0.20)",
      focus: "rgba(225, 29, 72, 0.45)",
      glass: "rgba(28, 25, 23, 0.60)",
      bgEffect1: "rgba(225, 29, 72, 0.18)",
      bgEffect2: "rgba(244, 63, 94, 0.12)",
      bgEffect3: "rgba(251, 191, 36, 0.10)",
    },
  },
  medical: {
    light: {
      bg: "#f8fafc",
      surface: "#ffffff",
      surface2: "#f1f5f9",
      border: "#e2e8f0",
      text: "#0f172a",
      textMuted: "#64748b",
      primary: "#2563eb",
      secondary: "#0ea5e9",
      accent: "#22c55e",
      ringTrack: "rgba(148, 163, 184, 0.35)",
      focus: "rgba(37, 99, 235, 0.35)",
      glass: "rgba(255, 255, 255, 0.60)",
      bgEffect1: "rgba(37, 99, 235, 0.10)",
      bgEffect2: "rgba(14, 165, 233, 0.08)",
      bgEffect3: "rgba(34, 197, 94, 0.07)",
    },
    dark: {
      bg: "#0f172a",
      surface: "#1e293b",
      surface2: "#0b1220",
      border: "rgba(148, 163, 184, 0.22)",
      text: "#f1f5f9",
      textMuted: "#94a3b8",
      primary: "#3b82f6",
      secondary: "#38bdf8",
      accent: "#34d399",
      ringTrack: "rgba(148, 163, 184, 0.22)",
      focus: "rgba(59, 130, 246, 0.45)",
      glass: "rgba(30, 41, 59, 0.55)",
      bgEffect1: "rgba(59, 130, 246, 0.20)",
      bgEffect2: "rgba(56, 189, 248, 0.14)",
      bgEffect3: "rgba(52, 211, 153, 0.11)",
    },
  },
  midnight: {
    light: {
      bg: "#f5f3ff",
      surface: "#ffffff",
      surface2: "#ede9fe",
      border: "#ddd6fe",
      text: "#0f172a",
      textMuted: "#6b7280",
      primary: "#7c3aed",
      secondary: "#a78bfa",
      accent: "#06b6d4",
      ringTrack: "rgba(124, 58, 237, 0.16)",
      focus: "rgba(124, 58, 237, 0.35)",
      glass: "rgba(255, 255, 255, 0.62)",
      bgEffect1: "rgba(124, 58, 237, 0.12)",
      bgEffect2: "rgba(167, 139, 250, 0.10)",
      bgEffect3: "rgba(6, 182, 212, 0.08)",
    },
    dark: {
      bg: "#0f0a1f",
      surface: "#1a132e",
      surface2: "#120c24",
      border: "rgba(167, 139, 250, 0.22)",
      text: "#f5f3ff",
      textMuted: "#c4b5fd",
      primary: "#8b5cf6",
      secondary: "#a78bfa",
      accent: "#22d3ee",
      ringTrack: "rgba(167, 139, 250, 0.18)",
      focus: "rgba(139, 92, 246, 0.45)",
      glass: "rgba(26, 19, 46, 0.60)",
      bgEffect1: "rgba(139, 92, 246, 0.20)",
      bgEffect2: "rgba(167, 139, 250, 0.15)",
      bgEffect3: "rgba(34, 211, 238, 0.10)",
    },
  },
  emerald: {
    light: {
      bg: "#ecfdf5",
      surface: "#ffffff",
      surface2: "#d1fae5",
      border: "#a7f3d0",
      text: "#052e16",
      textMuted: "#065f46",
      primary: "#059669",
      secondary: "#10b981",
      accent: "#f59e0b",
      ringTrack: "rgba(5, 150, 105, 0.16)",
      focus: "rgba(5, 150, 105, 0.35)",
      glass: "rgba(255, 255, 255, 0.62)",
      bgEffect1: "rgba(5, 150, 105, 0.12)",
      bgEffect2: "rgba(16, 185, 129, 0.10)",
      bgEffect3: "rgba(245, 158, 11, 0.08)",
    },
    dark: {
      bg: "#052e16",
      surface: "#064e3b",
      surface2: "#03261b",
      border: "rgba(167, 243, 208, 0.18)",
      text: "#ecfdf5",
      textMuted: "#a7f3d0",
      primary: "#34d399",
      secondary: "#10b981",
      accent: "#fbbf24",
      ringTrack: "rgba(167, 243, 208, 0.16)",
      focus: "rgba(52, 211, 153, 0.40)",
      glass: "rgba(6, 78, 59, 0.58)",
      bgEffect1: "rgba(52, 211, 153, 0.16)",
      bgEffect2: "rgba(16, 185, 129, 0.12)",
      bgEffect3: "rgba(251, 191, 36, 0.10)",
    },
  },
};

const hexToHslChannels = (hexValue) => {
  const hex = hexValue.replace("#", "").trim();
  if (hex.length !== 6) return "0 0% 0%";

  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return `${h} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

const textOnColor = (hex) => {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#0f172a" : "#f8fafc";
};

const getSafeTheme = (value, fallback = DEFAULT_THEME) =>
  THEMES.includes(value) ? value : fallback;

const getSafeMode = (value, fallback = DEFAULT_MODE) =>
  MODES.includes(value) ? value : fallback;

const isLandingRoute = (pathname) => pathname === "/";

const isPublicCrimsonRoute = (pathname) =>
  isLandingRoute(pathname) ||
  pathname === "/login" ||
  pathname === "/register" ||
  pathname === "/forgot-password" ||
  pathname.startsWith("/reset-password/") ||
  pathname.startsWith("/verify-email/");

const readCachedUserPreferences = () => {
  if (typeof window === "undefined") {
    return { theme: null, mode: null };
  }

  try {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) {
      return { theme: null, mode: null };
    }

    const parsedUser = JSON.parse(rawUser);
    return {
      theme: parsedUser?.uiPreferences?.theme ?? null,
      mode: parsedUser?.uiPreferences?.mode ?? null,
    };
  } catch {
    return { theme: null, mode: null };
  }
};

const getStoredMode = () => {
  if (typeof window === "undefined") {
    return DEFAULT_MODE;
  }

  return getSafeMode(localStorage.getItem("themeMode"), DEFAULT_MODE);
};

const getInitialThemeState = () => {
  if (typeof window === "undefined") {
    return { theme: DEFAULT_THEME, mode: DEFAULT_MODE };
  }

  const pathname = window.location.pathname;
  const cachedUserPreferences = readCachedUserPreferences();

  if (isLandingRoute(pathname)) {
    return { theme: DEFAULT_THEME, mode: DEFAULT_MODE };
  }

  if (isPublicCrimsonRoute(pathname)) {
    return {
      theme: DEFAULT_THEME,
      mode: getSafeMode(
        cachedUserPreferences.mode || localStorage.getItem("themeMode"),
        DEFAULT_MODE,
      ),
    };
  }

  return {
    theme: getSafeTheme(
      cachedUserPreferences.theme || localStorage.getItem("theme"),
      DEFAULT_THEME,
    ),
    mode: getSafeMode(
      cachedUserPreferences.mode || localStorage.getItem("themeMode"),
      DEFAULT_MODE,
    ),
  };
};

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const initialThemeState = useMemo(() => getInitialThemeState(), []);

  const [theme, setThemeState] = useState(initialThemeState.theme);
  const [mode, setModeState] = useState(initialThemeState.mode);

  const applyThemeToDocument = useCallback((nextTheme, nextMode) => {
    const safeTheme = getSafeTheme(nextTheme);
    const safeMode = getSafeMode(nextMode);
    const palette = THEME_TOKENS[safeTheme][safeMode];

    const root = document.documentElement;
    root.setAttribute("data-theme", safeTheme);
    root.setAttribute("data-mode", safeMode);
    root.classList.toggle("dark", safeMode === "dark");

    root.style.setProperty("--bg", palette.bg);
    root.style.setProperty("--surface", palette.surface);
    root.style.setProperty("--surface-2", palette.surface2);
    root.style.setProperty("--border-color", palette.border);
    root.style.setProperty("--text", palette.text);
    root.style.setProperty("--text-muted", palette.textMuted);
    root.style.setProperty("--focus", palette.focus);
    root.style.setProperty("--glass", palette.glass);
    root.style.setProperty("--ring-track", palette.ringTrack);
    root.style.setProperty("--bg-effect-1", palette.bgEffect1);
    root.style.setProperty("--bg-effect-2", palette.bgEffect2);
    root.style.setProperty("--bg-effect-3", palette.bgEffect3);

    root.style.setProperty("--background", hexToHslChannels(palette.bg));
    root.style.setProperty("--foreground", hexToHslChannels(palette.text));
    root.style.setProperty("--card", hexToHslChannels(palette.surface));
    root.style.setProperty("--card-foreground", hexToHslChannels(palette.text));
    root.style.setProperty("--muted", hexToHslChannels(palette.surface2));
    root.style.setProperty(
      "--muted-foreground",
      hexToHslChannels(palette.textMuted),
    );
    root.style.setProperty("--accent", hexToHslChannels(palette.accent));
    root.style.setProperty(
      "--accent-foreground",
      hexToHslChannels(textOnColor(palette.accent)),
    );
    root.style.setProperty("--primary", hexToHslChannels(palette.primary));
    root.style.setProperty(
      "--primary-foreground",
      hexToHslChannels(textOnColor(palette.primary)),
    );
    root.style.setProperty("--secondary", hexToHslChannels(palette.secondary));
    root.style.setProperty(
      "--secondary-foreground",
      hexToHslChannels(textOnColor(palette.secondary)),
    );
    root.style.setProperty("--destructive", hexToHslChannels("#ef4444"));
    root.style.setProperty(
      "--destructive-foreground",
      hexToHslChannels("#ffffff"),
    );
    root.style.setProperty(
      "--border",
      hexToHslChannels(
        palette.border.startsWith("#") ? palette.border : "#94a3b8",
      ),
    );
    root.style.setProperty(
      "--input",
      hexToHslChannels(
        palette.border.startsWith("#") ? palette.border : "#94a3b8",
      ),
    );
    root.style.setProperty("--ring", hexToHslChannels(palette.primary));
  }, []);

  useEffect(() => {
    applyThemeToDocument(theme, mode);

    if (typeof window === "undefined") return;
    if (isPublicCrimsonRoute(location.pathname)) return;

    localStorage.setItem("theme", getSafeTheme(theme));
    localStorage.setItem("themeMode", getSafeMode(mode));
  }, [theme, mode, applyThemeToDocument, location.pathname]);

  useEffect(() => {
    if (isLandingRoute(location.pathname)) {
      setThemeState((prev) => (prev !== DEFAULT_THEME ? DEFAULT_THEME : prev));
      setModeState((prev) => (prev !== DEFAULT_MODE ? DEFAULT_MODE : prev));
      return;
    }

    if (isPublicCrimsonRoute(location.pathname)) {
      const nextTheme = DEFAULT_THEME;
      const nextMode = getSafeMode(
        user?.uiPreferences?.mode || getStoredMode(),
        DEFAULT_MODE,
      );

      setThemeState((prev) => (prev !== nextTheme ? nextTheme : prev));
      setModeState((prev) => (prev !== nextMode ? nextMode : prev));
      return;
    }

    if (!user) return;

    const nextTheme = getSafeTheme(user?.uiPreferences?.theme, DEFAULT_THEME);
    const nextMode = getSafeMode(
      user?.uiPreferences?.mode,
      getStoredMode(),
    );

    setThemeState((prev) => (prev !== nextTheme ? nextTheme : prev));
    setModeState((prev) => (prev !== nextMode ? nextMode : prev));
  }, [
    location.pathname,
    user?._id,
    user?.uiPreferences?.theme,
    user?.uiPreferences?.mode,
  ]);

  const setTheme = async (nextTheme, persist = true) => {
    const safeTheme = getSafeTheme(nextTheme);
    applyThemeToDocument(safeTheme, mode);
    if (!isPublicCrimsonRoute(location.pathname)) {
      localStorage.setItem("theme", safeTheme);
      localStorage.setItem("themeMode", getSafeMode(mode));
    }
    setThemeState(safeTheme);

    if (persist && user) {
      try {
        const response = await authAPI.updatePreferences({
          theme: safeTheme,
          mode,
        });
        updateUser(response.data.data.user);
      } catch (error) {
        console.error("Failed to persist theme:", error);
      }
    }
  };

  const setMode = async (nextMode, persist = true) => {
    const safeMode = getSafeMode(nextMode);
    applyThemeToDocument(theme, safeMode);
    if (!isPublicCrimsonRoute(location.pathname)) {
      localStorage.setItem("theme", getSafeTheme(theme));
      localStorage.setItem("themeMode", safeMode);
    }
    setModeState(safeMode);

    if (persist && user) {
      try {
        const response = await authAPI.updatePreferences({
          theme,
          mode: safeMode,
        });
        updateUser(response.data.data.user);
      } catch (error) {
        console.error("Failed to persist mode:", error);
      }
    }
  };

  const setThemeMode = async ({ nextTheme, nextMode, persist = true }) => {
    const safeTheme = getSafeTheme(nextTheme, theme);
    const safeMode = getSafeMode(nextMode, mode);

    applyThemeToDocument(safeTheme, safeMode);
    if (!isPublicCrimsonRoute(location.pathname)) {
      localStorage.setItem("theme", safeTheme);
      localStorage.setItem("themeMode", safeMode);
    }
    setThemeState(safeTheme);
    setModeState(safeMode);

    if (persist && user) {
      try {
        const response = await authAPI.updatePreferences({
          theme: safeTheme,
          mode: safeMode,
        });
        updateUser(response.data.data.user);
      } catch (error) {
        console.error("Failed to persist preferences:", error);
      }
    }
  };

  const value = useMemo(
    () => ({
      theme,
      mode,
      themes: THEMES,
      modes: MODES,
      setTheme,
      setMode,
      setThemeMode,
    }),
    [theme, mode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
