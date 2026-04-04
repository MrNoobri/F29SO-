import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Activity,
  CalendarCheck,
  MessageSquare,
  Watch,
  Bell,
  Trophy,
  Pill,
  Palette,
  LogOut,
  User,
  Sun,
  Moon,
  Check,
  BookOpen,
  HelpCircle,
  Menu,
  X,
} from "lucide-react";
import { Dock, DockItem, DockIcon, DockLabel } from "@/components/ui/dock";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { cn } from "@/lib/utils";

const PATIENT_NAV = [
  { id: "overview", label: "Home", icon: Home },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "appointments", label: "Appointments", icon: CalendarCheck },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "medications", label: "Meds", icon: Pill },
  { id: "wearables", label: "Wearables", icon: Watch },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "progress", label: "Progress", icon: Trophy },
  { id: "resources", label: "Learn", icon: BookOpen },
  { id: "help", label: "Help", icon: HelpCircle },
];

const PROVIDER_NAV = [
  { id: "overview", label: "Home", icon: Home },
  { id: "patients", label: "Patients", icon: Activity },
  { id: "appointments", label: "Appointments", icon: CalendarCheck },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "help", label: "Help", icon: HelpCircle },
];

const THEME_META = {
  crimson: { label: "Crimson", color: "#be123c", darkColor: "#e11d48" },
  medical: { label: "Medical", color: "#2563eb", darkColor: "#3b82f6" },
  midnight: { label: "Midnight", color: "#7c3aed", darkColor: "#8b5cf6" },
  emerald: { label: "Emerald", color: "#059669", darkColor: "#34d399" },
};

const THEME_PICKER_WIDTH = 224;
const THEME_PICKER_GAP = 14;
const THEME_PICKER_VIEWPORT_GUTTER = 12;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function DashboardDock({
  activeTab,
  onTabChange,
  role = "patient",
  className,
}) {
  const navItems = role === "provider" ? PROVIDER_NAV : PATIENT_NAV;
  const mobilePrimaryItems = navItems.slice(0, 5);
  const mobileOverflowItems = navItems.slice(5);
  const { user, logout } = useAuth();
  const { theme, mode, themes, setTheme, setMode } = useTheme();
  const navigate = useNavigate();
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [themePickerPosition, setThemePickerPosition] = useState({
    left: THEME_PICKER_VIEWPORT_GUTTER,
    bottom: 80,
    arrowLeft: THEME_PICKER_WIDTH / 2,
  });
  const pickerRef = useRef(null);
  const toggleRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const initials =
    `${(user?.profile?.firstName || "U")[0]}${(user?.profile?.lastName || "")[0] || ""}`.toUpperCase();

  const handleNavClick = (id) => {
    if (id === "alerts") {
      navigate("/alerts");
    } else if (id === "progress") {
      navigate("/progress");
    } else if (id === "resources") {
      navigate("/resources");
    } else if (id === "help") {
      navigate("/help");
    } else {
      onTabChange(id);
    }
  };

  const updateThemePickerPosition = (buttonEl = toggleRef.current) => {
    if (!buttonEl || typeof window === "undefined") return;

    const rect = buttonEl.getBoundingClientRect();
    const left = clamp(
      rect.left + rect.width / 2 - THEME_PICKER_WIDTH / 2,
      THEME_PICKER_VIEWPORT_GUTTER,
      window.innerWidth - THEME_PICKER_WIDTH - THEME_PICKER_VIEWPORT_GUTTER,
    );
    const bottom = window.innerHeight - rect.top + THEME_PICKER_GAP;
    const arrowLeft = clamp(
      rect.left + rect.width / 2 - left,
      24,
      THEME_PICKER_WIDTH - 24,
    );

    setThemePickerPosition({ left, bottom, arrowLeft });
  };

  const handleThemeToggle = (e) => {
    e.stopPropagation();
    toggleRef.current = e.currentTarget;
    if (!showThemePicker) {
      updateThemePickerPosition(e.currentTarget);
    }
    setShowThemePicker((v) => !v);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setShowMobileMenu(false);
      }

      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target) &&
        toggleRef.current &&
        !toggleRef.current.contains(e.target)
      ) {
        setShowThemePicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setShowMobileMenu(false);
        setShowThemePicker(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    if (!showThemePicker) return;

    const syncThemePickerPosition = () => updateThemePickerPosition();

    window.addEventListener("resize", syncThemePickerPosition);
    window.addEventListener("scroll", syncThemePickerPosition, true);

    return () => {
      window.removeEventListener("resize", syncThemePickerPosition);
      window.removeEventListener("scroll", syncThemePickerPosition, true);
    };
  }, [showThemePicker]);

  const renderDockItem = (item) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <DockItem
        key={item.id}
        className={cn(
          "relative cursor-pointer rounded-full transition-colors",
          isActive
            ? "bg-primary/20 text-primary"
            : "text-muted-foreground hover:text-foreground",
        )}
        onClick={() => handleNavClick(item.id)}
      >
        <DockIcon>
          <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
        </DockIcon>
        <DockLabel>{item.label}</DockLabel>
        {isActive && (
          <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
        )}
      </DockItem>
    );
  };

  const themePicker =
    typeof document !== "undefined"
      ? createPortal(
          <AnimatePresence>
            {showThemePicker && (
              <motion.div
                key="theme-picker"
                ref={pickerRef}
                initial={{ opacity: 0, y: 12, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.92 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                className="fixed z-[80] w-56"
                style={{
                  left: themePickerPosition.left,
                  bottom: themePickerPosition.bottom,
                }}
              >
                <div className="relative rounded-xl border border-border/50 bg-background/90 p-3 shadow-2xl backdrop-blur-xl">
                  <div
                    className="absolute top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-border/50 bg-background/90"
                    style={{ left: themePickerPosition.arrowLeft }}
                    aria-hidden="true"
                  />

                  <div className="mb-3 flex flex-col items-center gap-2 px-1">
                    <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Mode
                    </span>
                    <button
                      onClick={() => setMode(mode === "dark" ? "light" : "dark")}
                      className={cn(
                        "relative flex h-8 w-16 items-center rounded-full p-0.5 transition-colors duration-300",
                        mode === "dark" ? "bg-primary/30" : "bg-muted",
                      )}
                    >
                      <motion.div
                        layout
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm",
                          mode === "dark" ? "ml-auto" : "ml-0",
                        )}
                      >
                        {mode === "dark" ? (
                          <Moon className="h-3.5 w-3.5" />
                        ) : (
                          <Sun className="h-3.5 w-3.5" />
                        )}
                      </motion.div>
                    </button>
                  </div>

                  <div className="mb-3 h-px bg-border/50" />

                  <div className="space-y-1">
                    {themes.map((t) => {
                      const meta = THEME_META[t] || {
                        label: t,
                        color: "#888",
                        darkColor: "#aaa",
                      };
                      const isActive = theme === t;

                      return (
                        <button
                          key={t}
                          onClick={() => {
                            setTheme(t);
                            setShowThemePicker(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-all",
                            isActive
                              ? "bg-primary/15 text-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
                              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                          )}
                        >
                          <span
                            className="h-5 w-5 shrink-0 rounded-full border-2 border-background shadow-sm"
                            style={{
                              background: `linear-gradient(135deg, ${meta.color}, ${meta.darkColor})`,
                            }}
                          />
                          <span className="flex-1 text-left font-medium">
                            {meta.label}
                          </span>
                          {isActive && <Check className="h-4 w-4 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )
      : null;

  return (
    <div
      className={`fixed bottom-4 left-1/2 z-50 max-w-[100vw] -translate-x-1/2 ${className || ""}`}
    >
      {themePicker}

      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm md:hidden"
              onClick={() => setShowMobileMenu(false)}
            />
            <motion.div
              ref={mobileMenuRef}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              className="absolute bottom-full left-1/2 mb-3 w-[min(22rem,calc(100vw-1.5rem))] -translate-x-1/2 rounded-3xl border border-border/60 bg-background/95 p-4 shadow-2xl backdrop-blur-xl md:hidden"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Menu</p>
                  <p className="text-xs text-muted-foreground">
                    Quick access to the rest of the dashboard
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-muted/40 text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigate("/profile");
                    setShowMobileMenu(false);
                  }}
                  className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-border/60 bg-muted/30 px-3 py-3 text-center text-sm text-foreground"
                >
                  <User className="h-5 w-5" />
                  <span>Profile</span>
                </button>

                {mobileOverflowItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        handleNavClick(item.id);
                        setShowMobileMenu(false);
                      }}
                      className={cn(
                        "flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-center text-sm transition-colors",
                        isActive
                          ? "border-primary/40 bg-primary/15 text-primary"
                          : "border-border/60 bg-muted/30 text-foreground",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "dark" ? "light" : "dark");
                    setShowMobileMenu(false);
                  }}
                  className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-border/60 bg-muted/30 px-3 py-3 text-center text-sm text-foreground"
                >
                  {mode === "dark" ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                  <span>{mode === "dark" ? "Light" : "Dark"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate("/login");
                    setShowMobileMenu(false);
                  }}
                  className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-border/60 bg-muted/30 px-3 py-3 text-center text-sm text-foreground"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Dock
        magnification={60}
        distance={100}
        panelHeight={56}
        className="border border-border/50 bg-background/80 shadow-2xl backdrop-blur-xl"
      >
        <div className="hidden md:contents">
          <DockItem
            className="cursor-pointer rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground"
            onClick={() => navigate("/profile")}
          >
            <DockIcon>
              <span className="text-xs font-bold">{initials}</span>
            </DockIcon>
            <DockLabel>Profile</DockLabel>
          </DockItem>

          {navItems.map((item) => renderDockItem(item))}
        </div>

        <div className="contents md:hidden">
          <DockItem
            className="cursor-pointer rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground"
            onClick={() => setShowMobileMenu((prev) => !prev)}
          >
            <DockIcon>
              <span className="text-xs font-bold">AI</span>
            </DockIcon>
            <DockLabel>Assistant</DockLabel>
          </DockItem>

          {mobilePrimaryItems.map((item) => renderDockItem(item))}

          <DockItem
            className={cn(
              "cursor-pointer rounded-full transition-colors",
              showMobileMenu
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setShowMobileMenu((prev) => !prev)}
          >
            <DockIcon>
              <Menu className="h-5 w-5" strokeWidth={2} />
            </DockIcon>
            <DockLabel>More</DockLabel>
          </DockItem>
        </div>

        <div className="hidden md:contents">
          <DockItem
            className={cn(
              "cursor-pointer rounded-full transition-colors",
              showThemePicker
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={handleThemeToggle}
          >
            <DockIcon>
              <Palette className="h-5 w-5" strokeWidth={2} />
            </DockIcon>
            <DockLabel>Theme</DockLabel>
          </DockItem>

          <DockItem
            className="cursor-pointer rounded-full text-muted-foreground hover:text-red-500"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            <DockIcon>
              <LogOut className="h-5 w-5" strokeWidth={2} />
            </DockIcon>
            <DockLabel>Sign Out</DockLabel>
          </DockItem>
        </div>
      </Dock>
    </div>
  );
}
