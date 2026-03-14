import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  MessageSquareText,
  BellRing,
  MoonStar,
  Palette,
  SunMedium,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import OverviewTab from "../components/provider/OverviewTab";
import CalendarTab from "../components/provider/CalendarTab";
import PatientsTab from "../components/provider/PatientsTab";
import MessagesTab from "../components/provider/MessagesTab";
import AlertsTab from "../components/provider/AlertsTab";
import { appointmentsAPI, alertsAPI, messagesAPI } from "../api";
import DashboardDock from "../components/patient/DashboardDock";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "calendar", label: "Calendar", icon: CalendarDays },
  { key: "patients", label: "Patients", icon: Users },
  { key: "messages", label: "Messages", icon: MessageSquareText },
  { key: "alerts", label: "Alerts", icon: BellRing },
];

/* ──────────── Quick Panel Card ──────────── */
const QuickPanel = ({ icon: Icon, title, count, subtitle, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.4 }}
    onClick={onClick}
    className="relative overflow-hidden rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 cursor-pointer transition-all hover:shadow-lg hover:border-primary/30 hover:scale-[1.02] group"
  >
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div>
        <p className="text-3xl font-bold text-foreground">{count}</p>
        <p className="text-sm text-muted-foreground">
          {title} <span className="text-xs">({subtitle})</span>
        </p>
      </div>
    </div>
  </motion.div>
);

/* ──────────── Provider Dashboard ──────────── */
const ProviderDashboard = () => {
  const { user, logout } = useAuth();
  const { theme, mode, setTheme, setMode } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [showSplash, setShowSplash] = useState(true);
  const [pastHero, setPastHero] = useState(false);
  const heroRef = useRef(null);

  // ── 2-second splash timer ──
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // ── Track when user scrolls past the hero ──
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const threshold = window.innerHeight * 0.55;
      setPastHero(scrollY > threshold);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Scroll-driven transitions for hero → dashboard ──
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // Hero 70% section: parallax up + fade out
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 0.6, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);

  // Quick panels: slide down slightly + fade
  const panelsY = useTransform(scrollYProgress, [0, 1], [0, 30]);
  const panelsOpacity = useTransform(scrollYProgress, [0, 0.7, 1], [1, 0.8, 0]);

  // Dashboard section: fade in + slide up
  const dashboardOpacity = useTransform(scrollYProgress, [0.5, 1], [0, 1]);
  const dashboardY = useTransform(scrollYProgress, [0.5, 1], [40, 0]);

  // ── React Query: patients, appointments, messages, alerts ──
  const { data: patients } = useQuery({
    queryKey: ["providerPatients"],
    queryFn: async () => {
      const response = await appointmentsAPI.getProviderPatients();
      return response.data.data;
    },
  });

  const { data: todayAppointments } = useQuery({
    queryKey: ["appointments", "today"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const response = await appointmentsAPI.getAll({
        startDate: today.toISOString(),
        endDate: tomorrow.toISOString(),
      });
      return response.data.data;
    },
  });

  const { data: unreadMessagesData } = useQuery({
    queryKey: ["unreadMessages"],
    queryFn: async () => {
      const response = await messagesAPI.getUnreadCount();
      return response.data.data?.count || 0;
    },
  });

  const { data: patientAlerts } = useQuery({
    queryKey: ["patientAlerts", patients?.map((p) => p._id)],
    queryFn: async () => {
      if (!patients || patients.length === 0) return [];
      const ids = patients.map((p) => p._id).join(",");
      const response = await alertsAPI.getAll({
        patientIds: ids,
        limit: 100,
      });
      return response.data.data;
    },
    enabled: !!patients && patients.length > 0,
  });

  const activeAlertsCount = (patientAlerts || []).filter(
    (a) => !a.isAcknowledged,
  ).length;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // ── Cycle theme for dock ──
  const cycleTheme = () => {
    const themes = ["medical", "midnight", "emerald"];
    const idx = themes.indexOf(theme);
    setTheme(themes[(idx + 1) % themes.length]);
  };

  // ── Dock tab mapping ──
  const handleDockTab = (tab) => {
    // Map dock tabs to provider tabs
    const map = {
      overview: "overview",
      patients: "patients",
      appointments: "calendar",
      messages: "messages",
      ai: "overview",
    };
    setActiveTab(map[tab] || "overview");
    setTimeout(() => {
      document
        .getElementById("dashboard-tabs")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Splash: Full-screen MEDXI (2s then fades into 70/30 split) ── */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background overflow-hidden"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            {/* Background blobs */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/4 left-1/4 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-60 bg-[var(--bg-effect-1)]" />
              <div className="absolute bottom-1/3 right-1/4 w-[22rem] h-[22rem] rounded-full blur-3xl opacity-50 bg-[var(--bg-effect-2)]" />
              <div className="absolute top-2/3 left-1/2 w-[18rem] h-[18rem] rounded-full blur-3xl opacity-40 bg-[var(--bg-effect-3)]" />
            </div>

            {/* Logo halves stacked — MED slides up, XI slides down, welcome rises between */}
            <div className="relative flex flex-col items-center">
              {/* Top half: "MED" — slides up */}
              <motion.span
                className="text-[clamp(5rem,18vw,14rem)] font-black tracking-tighter leading-none select-none text-primary"
                initial={{ opacity: 0, scale: 0.85, y: 0 }}
                animate={{ opacity: 1, scale: 1, y: "-15vh" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                MED
              </motion.span>
              {/* Bottom half: "XI" — slides down */}
              <motion.span
                className="text-[clamp(5rem,18vw,14rem)] font-black tracking-tighter leading-none select-none text-foreground -mt-[0.15em]"
                initial={{ opacity: 0, scale: 0.85, y: 0 }}
                animate={{ opacity: 1, scale: 1, y: "15vh" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                XI
              </motion.span>
            </div>

            {/* Welcome text — rises into the gap between halves */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0, y: 30, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.6,
                delay: 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <p className="text-xl md:text-2xl text-foreground/70 font-medium tracking-wide whitespace-nowrap">
                Welcome back, Dr. {user?.profile?.lastName}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 70/30 Split: MEDXI hero (70vh) + Quick Panels (30vh) ── */}
      <div ref={heroRef} className="h-screen flex flex-col relative">
        {/* Background blobs for entire hero section */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-60 bg-[var(--bg-effect-1)]" />
          <div className="absolute bottom-1/3 right-1/4 w-[22rem] h-[22rem] rounded-full blur-3xl opacity-50 bg-[var(--bg-effect-2)]" />
          <div className="absolute top-2/3 left-1/2 w-[18rem] h-[18rem] rounded-full blur-3xl opacity-40 bg-[var(--bg-effect-3)]" />
        </div>
        {/* Top 70% — MEDXI + Welcome */}
        <motion.div
          className="flex-[7] relative flex flex-col items-center justify-center overflow-hidden"
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
        >
          {/* Gradient blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-60 bg-[var(--bg-effect-1)]" />
            <div className="absolute bottom-1/3 right-1/4 w-[22rem] h-[22rem] rounded-full blur-3xl opacity-50 bg-[var(--bg-effect-2)]" />
            <div className="absolute top-2/3 left-1/2 w-[18rem] h-[18rem] rounded-full blur-3xl opacity-40 bg-[var(--bg-effect-3)]" />
          </div>

          <h1 className="relative text-[clamp(3rem,10vw,7rem)] font-black tracking-tighter leading-none select-none">
            <span className="text-primary">MED</span>
            <span className="text-foreground">XI</span>
          </h1>
          <p className="relative text-lg md:text-xl text-foreground/60 mt-3 font-medium tracking-wide">
            Welcome back, Dr. {user?.profile?.lastName}
          </p>
        </motion.div>

        {/* Bottom 30% — Quick Panels */}
        <motion.div
          className="flex-[3] border-t border-border bg-card/40 px-4 sm:px-6 lg:px-8 flex items-center"
          style={{ y: panelsY, opacity: panelsOpacity }}
        >
          <div className="max-w-5xl mx-auto w-full py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <QuickPanel
                icon={CalendarDays}
                title="Appointments"
                count={todayAppointments?.length || 0}
                subtitle="today"
                onClick={() => {
                  setActiveTab("calendar");
                  setTimeout(() => {
                    document
                      .getElementById("dashboard-tabs")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
              />
              <QuickPanel
                icon={BellRing}
                title="Active Alerts"
                count={activeAlertsCount}
                subtitle="unacknowledged"
                onClick={() => {
                  setActiveTab("alerts");
                  setTimeout(() => {
                    document
                      .getElementById("dashboard-tabs")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
              />
              <QuickPanel
                icon={MessageSquareText}
                title="Messages"
                count={unreadMessagesData || 0}
                subtitle="unread"
                onClick={() => {
                  setActiveTab("messages");
                  setTimeout(() => {
                    document
                      .getElementById("dashboard-tabs")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Main Content Area ── */}
      <motion.div
        className="relative z-10 w-full min-h-screen pb-28 transition-[margin] duration-300"
        style={{ opacity: dashboardOpacity, y: dashboardY }}
      >
        {/* Animated path lines behind dashboard */}
        <BackgroundPaths className="opacity-30 fixed inset-0 z-0 pointer-events-none" />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-[1]">
          <div id="dashboard-tabs">
            {/* Tab Content */}
            {activeTab === "overview" && (
              <OverviewTab
                todayAppointments={todayAppointments}
                patients={patients}
                patientAlerts={patientAlerts}
                unreadMessages={unreadMessagesData}
                onSwitchTab={setActiveTab}
              />
            )}

            {activeTab === "calendar" && <CalendarTab />}

            {activeTab === "patients" && <PatientsTab patients={patients} />}

            {activeTab === "messages" && <MessagesTab />}

            {activeTab === "alerts" && (
              <AlertsTab
                patientAlerts={patientAlerts}
                patients={patients}
                onPatientClick={() => setActiveTab("patients")}
              />
            )}
          </div>
        </main>
      </motion.div>

      {/* ── Bottom Dock Navigation (appears after scroll) ── */}
      <AnimatePresence>
        {pastHero && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <DashboardDock
              activeTab={activeTab === "calendar" ? "appointments" : activeTab}
              onTabChange={handleDockTab}
              role="provider"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProviderDashboard;
