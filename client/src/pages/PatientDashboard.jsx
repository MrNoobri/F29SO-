import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useSocket } from "../context/SocketContext";
import DraggableGrid from "../components/patient/DraggableGrid";
import AddMetricModal from "../components/health/AddMetricModal";
import RecipesWidget from "../components/dashboard/RecipesWidget";
import WearableDevices from "../components/wearables/WearableDevices";
import GoogleFitConnect from "../components/GoogleFitConnect";
import FitMetricTile from "../components/patient/FitMetricTile";
import ActivityOverview from "../components/patient/ActivityOverview";
import PatientInsights from "../components/patient/PatientInsights";
import PatientHero from "../components/patient/PatientHero";
import DashboardDock from "../components/patient/DashboardDock";
import WellnessScoreRing from "../components/gamification/WellnessScoreRing";
import StreakCounter from "../components/gamification/StreakCounter";
import LevelBadge from "../components/gamification/LevelBadge";
import DailyChallenges from "../components/gamification/DailyChallenges";
import MetricDetailModal from "../components/patient/MetricDetailModal";
import MedicationDashboard from "../components/medication/MedicationDashboard";
import MessagesTab from "../components/patient/MessagesTab";
import AppointmentsCalendar from "../components/appointments/AppointmentsCalendar";
import { BackgroundPaths } from "@/components/ui/background-paths";
import {
  ExpandableChat,
  ExpandableChatHeader,
  ExpandableChatBody,
  ExpandableChatFooter,
} from "@/components/ui/expandable-chat";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat-bubble";
import { ChatInput } from "@/components/ui/chat-input";
import { ChatMessageList } from "@/components/ui/chat-message-list";
import { CornerDownLeft, Sparkles } from "lucide-react";

import { healthMetricsAPI, alertsAPI, chatbotAPI, gamificationAPI } from "../api";
import { useToast } from "../context/ToastContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/* ──── Alerts Banner ──── */
const AlertsSection = ({ alertsData, onViewAllAlerts, theme }) => {
  if (!alertsData || alertsData.length === 0) return null;

  const severityRank = { low: 1, medium: 2, high: 3, critical: 4 };
  const highestSeverityAlert = alertsData.reduce((acc, current) => {
    if (!acc) return current;
    return (severityRank[current?.severity] || 0) >
      (severityRank[acc?.severity] || 0)
      ? current
      : acc;
  }, null);

  const severity = highestSeverityAlert?.severity || "medium";

  const alertStyles = {
    medical: {
      card: "border-l-4 border-danger/80 bg-danger-light/20",
      title: "text-danger-dark",
      badge: "bg-danger text-white",
      button: "bg-danger text-white hover:bg-danger-dark",
    },
    midnight: {
      card: "border-l-4 border-primary/70 bg-primary/15",
      title: "text-foreground",
      badge: "bg-primary text-primary-foreground",
      button: "bg-primary text-primary-foreground hover:opacity-90",
    },
    emerald: {
      card: "border-l-4 border-warning bg-warning-light/35",
      title: "text-warning-dark",
      badge: "bg-warning text-white",
      button: "bg-warning text-white hover:bg-warning-dark",
    },
  };

  const severityStyles = {
    critical: {
      card: "ring-1 ring-danger/40",
      badge: "bg-danger text-white",
      title: "text-danger-dark",
      emphasis: "Critical",
    },
    high: {
      card: "ring-1 ring-warning/40",
      badge: "bg-warning text-white",
      title: "text-warning-dark",
      emphasis: "High",
    },
    medium: {
      card: "ring-1 ring-primary/30",
      badge: "bg-primary text-primary-foreground",
      title: "text-primary",
      emphasis: "Medium",
    },
    low: {
      card: "ring-1 ring-secondary/45",
      badge: "bg-secondary text-secondary-foreground",
      title: "text-foreground",
      emphasis: "Low",
    },
  };

  const styles = alertStyles[theme] || alertStyles.medical;
  const level = severityStyles[severity] || severityStyles.medium;

  return (
    <div className="mb-6 cursor-pointer" onClick={onViewAllAlerts}>
      <Card className={cn(styles.card, level.card)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "rounded-full p-1.5 mt-0.5",
                  styles.badge,
                  level.badge,
                )}
              >
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">
                  {level.emphasis} priority
                </p>
                <p className={cn("font-semibold", styles.title, level.title)}>
                  You have {alertsData.length} active alert(s)
                </p>
                <p className="text-sm text-foreground/80 mt-1">
                  {highestSeverityAlert?.message}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={onViewAllAlerts}
              className={styles.button}
            >
              View All Alerts
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/* ──── Critical Alert Persistent Banner ──── */
const CriticalAlertBanner = ({ criticalAlerts, onNavigateAlerts }) => {
  if (!criticalAlerts || criticalAlerts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-40 cursor-pointer"
      onClick={onNavigateAlerts}
    >
      <div className="bg-destructive text-destructive-foreground px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="animate-pulse">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <span className="font-semibold">
                {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? "s" : ""}
              </span>
              <span className="ml-2 text-sm opacity-90">
                — {criticalAlerts[0]?.message || "Immediate attention required"}
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onNavigateAlerts();
            }}
          >
            View Alerts
          </Button>
        </div>
      </div>
    </motion.div>
  );
};



/* ════════════════════════════════════════════════════
   ██  EXPANDABLE AI CHAT WIDGET  ██
   ════════════════════════════════════════════════════ */
const SAMPLE_QUESTIONS = [
  "What should my blood pressure be?",
  "Tips for better sleep",
  "How to manage diabetes",
  "Healthy meal ideas",
  "What does my heart rate mean?",
  "How much water should I drink?",
];

const ExpandableChatWidget = () => {
  const { user } = useAuth();
  const messageIdRef = useRef(2);
  const userInitials = user?.profile
    ? `${user.profile.firstName?.[0] ?? ""}${user.profile.lastName?.[0] ?? ""}`.toUpperCase() ||
      "ME"
    : "ME";
  const [messages, setMessages] = useState([
    {
      id: 1,
      content:
        "Hello! I'm your MEDXI AI health assistant. How can I help you today?",
      sender: "ai",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (text) => {
    if (!text.trim() || isLoading) return;
    const userMsgId = messageIdRef.current++;
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, content: text, sender: "user" },
    ]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chatbotAPI.sendMessage(text);
      const reply =
        response.data?.data?.reply ||
        response.data?.data?.response ||
        response.data?.reply ||
        "I'm not sure how to respond to that.";
      const aiMsgId = messageIdRef.current++;
      setMessages((prev) => [
        ...prev,
        { id: aiMsgId, content: reply, sender: "ai" },
      ]);
    } catch (err) {
      const errMsgId = messageIdRef.current++;
      setMessages((prev) => [
        ...prev,
        {
          id: errMsgId,
          content:
            "Sorry, I'm having trouble connecting right now. Please try again.",
          sender: "ai",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend(input);
  };

  const showSamples = messages.length <= 1 && !isLoading;

  return (
    <ExpandableChat size="lg" position="bottom-right">
      <ExpandableChatHeader className="flex-col text-center justify-center bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-t-2xl">
        <h1 className="text-xl font-semibold">MEDXI AI Assistant</h1>
        <p className="text-sm opacity-80">Ask me anything about your health</p>
      </ExpandableChatHeader>

      <ExpandableChatBody>
        <ChatMessageList>
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              variant={message.sender === "user" ? "sent" : "received"}
            >
              <ChatBubbleAvatar
                className="h-8 w-8 shrink-0"
                fallback={message.sender === "user" ? userInitials : "XI"}
                variant={message.sender === "user" ? undefined : "ai"}
              />
              <ChatBubbleMessage
                variant={message.sender === "user" ? "sent" : "received"}
              >
                {message.content}
              </ChatBubbleMessage>
            </ChatBubble>
          ))}

          {isLoading && (
            <ChatBubble variant="received">
              <ChatBubbleAvatar
                className="h-8 w-8 shrink-0"
                fallback="XI"
                variant="ai"
              />
              <ChatBubbleMessage isLoading />
            </ChatBubble>
          )}

          {/* Predefined sample questions — inside message list so no extra scroll */}
          {showSamples && (
            <div className="px-1 pt-2">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Try asking
              </p>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </ChatMessageList>
      </ExpandableChatBody>

      <ExpandableChatFooter>
        <form
          onSubmit={handleSubmit}
          className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring p-1"
        >
          <ChatInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your health..."
            className="min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center p-3 pt-0 justify-end">
            <Button
              type="submit"
              size="sm"
              className="gap-1.5"
              disabled={isLoading}
              aria-busy={isLoading}
            >
              Send
              <CornerDownLeft className="size-3.5" />
            </Button>
          </div>
        </form>
      </ExpandableChatFooter>
    </ExpandableChat>
  );
};

/* ════════════════════════════════════════════════════
   ██  PATIENT DASHBOARD  ██
   ════════════════════════════════════════════════════ */
const PatientDashboard = () => {
  const { user } = useAuth();
  const { theme, mode, setTheme, setMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const heroRef = useRef(null);

  // Show splash only once per browser session (resets on sign-out / new login)
  const [showSplash, setShowSplash] = useState(() => {
    const shown = sessionStorage.getItem("medxi_splash_shown");
    if (shown) return false;
    sessionStorage.setItem("medxi_splash_shown", "1");
    return true;
  });
  const [splashPhase, setSplashPhase] = useState("logo"); // "logo" -> "line" -> "done"
  const [activeTab, setActiveTab] = useState(location.state?.tab || "overview");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(null);
  // If arriving from a nav link with a tab, skip the hero entirely from the start
  const [pastHero, setPastHero] = useState(() => !!location.state?.tab);
  const isDragging = useRef(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatorData, setSimulatorData] = useState({
    heartRate: null,
    steps: 0,
    spo2: null,
    bloodPressure: null,
    lastUpdate: null,
  });

  const firstName = user?.profile?.firstName || "there";

  // ── Splash animation phases ──
  useEffect(() => {
    if (!showSplash) return;
    // Phase 1: Logo visible for 1.2s, then snap apart
    const t1 = setTimeout(() => setSplashPhase("line"), 1200);
    // Phase 2: Welcome text appears, hold for 1.8s then exit
    const t2 = setTimeout(() => setSplashPhase("done"), 3200);
    const t3 = setTimeout(() => setShowSplash(false), 3800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [showSplash]);

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

  // ── If arriving with a tab in state (from nav links on other pages), skip hero ──
  useEffect(() => {
    if (!location.state?.tab) return;
    // Skip the splash and jump straight to dashboard content
    setShowSplash(false);
    // Scroll past hero after a tick so the DOM has rendered
    const t = setTimeout(() => {
      const el = document.getElementById("patient-content");
      if (el) {
        el.scrollIntoView({ behavior: "instant" });
      } else {
        window.scrollTo({ top: window.innerHeight, behavior: "instant" });
      }
    }, 50);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Scroll-driven hero → dashboard transitions ──
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const dashboardOpacity = useTransform(scrollYProgress, [0.5, 1], [0, 1]);

  // ── Data queries ──
  const { data: dailyTotals } = useQuery({
    queryKey: ["dailyTotals"],
    queryFn: async () => {
      const response = await healthMetricsAPI.getDailyTotals();
      return response.data.data;
    },
    refetchInterval: 60000,
  });

  // Fallback to latest-ever values so tiles never show "--" when historical data exists
  const { data: latestFallback } = useQuery({
    queryKey: ["latestMetrics"],
    queryFn: async () => {
      const response = await healthMetricsAPI.getLatest();
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Merge: today's totals take priority, fall back to latest reading
  const latestMetrics = useMemo(() => {
    const merged = {};
    const allKeys = new Set([
      ...Object.keys(dailyTotals || {}),
      ...Object.keys(latestFallback || {}),
    ]);
    for (const key of allKeys) {
      if (dailyTotals?.[key]) {
        merged[key] = dailyTotals[key];
      } else if (latestFallback?.[key]) {
        merged[key] = {
          value: latestFallback[key].value,
          unit: latestFallback[key].unit,
          timestamp: latestFallback[key].timestamp,
        };
      }
    }
    return merged;
  }, [dailyTotals, latestFallback]);

  const refetchMetrics = () => {
    queryClient.invalidateQueries({ queryKey: ["dailyTotals"] });
    queryClient.invalidateQueries({ queryKey: ["latestMetrics"] });
    queryClient.invalidateQueries({ queryKey: ["activityData"] });
  };

  const { data: alertsData } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const response = await alertsAPI.getAll({ isAcknowledged: false, limit: 5 });
      return response.data.data;
    },
  });

  const { data: gamificationStats } = useQuery({
    queryKey: ["gamification-stats"],
    queryFn: () => gamificationAPI.getStats().then((r) => r.data.data),
    staleTime: 30000,
  });

  // ── Milestone toasts (challenges + metrics) ──
  // Use sessionStorage so the shown-state survives re-mounts (navigating away and back)
  const isMilestoneShown = (key) => !!sessionStorage.getItem(`toast_${key}`);
  const markMilestoneShown = (key) => sessionStorage.setItem(`toast_${key}`, "1");

  useEffect(() => {
    if (!gamificationStats?.dailyChallenges?.length) return;
    const challenges = gamificationStats.dailyChallenges;
    const total = challenges.length;
    const completed = challenges.filter((c) => c.completed).length;
    const pct = Math.round((completed / total) * 100);
    const today = new Date().toDateString();

    const key = (milestone) => `${today}_${milestone}`;

    if (pct >= 100 && !isMilestoneShown(key(100))) {
      markMilestoneShown(key(100));
      toast.success("All daily challenges complete! Amazing work today!", 5000);
    } else if (pct >= 75 && !isMilestoneShown(key(75))) {
      markMilestoneShown(key(75));
      toast.info("75% of today's challenges done — keep it up!", 4000);
    } else if (pct >= 50 && !isMilestoneShown(key(50))) {
      markMilestoneShown(key(50));
      toast.info("Halfway there! 50% of daily challenges complete.", 4000);
    }
  }, [gamificationStats]);

  // ── Metric milestone toasts ──
  const METRIC_GOALS = { steps: 10000, calories: 2000, sleep: 8, distance: 5 };
  const METRIC_LABELS = { steps: "Steps", calories: "Calories", sleep: "Sleep", distance: "Distance" };
  useEffect(() => {
    if (!dailyTotals) return;
    const today = new Date().toDateString();
    const key = (metric, milestone) => `metric_${today}_${metric}_${milestone}`;

    for (const [metric, goal] of Object.entries(METRIC_GOALS)) {
      const val = dailyTotals[metric]?.value;
      if (!val || !goal) continue;
      const pct = (val / goal) * 100;
      const label = METRIC_LABELS[metric];

      if (pct >= 100 && !isMilestoneShown(key(metric, 100))) {
        markMilestoneShown(key(metric, 100));
        toast.success(`${label} goal reached! You hit your daily target.`, 5000);
      } else if (pct >= 75 && !isMilestoneShown(key(metric, 75))) {
        markMilestoneShown(key(metric, 75));
        toast.info(`${label} at 75% — almost there!`, 4000);
      } else if (pct >= 50 && !isMilestoneShown(key(metric, 50))) {
        markMilestoneShown(key(metric, 50));
        toast.info(`${label} halfway to your daily goal.`, 4000);
      }
    }
  }, [dailyTotals]);

  // Critical unacknowledged alerts — persistent banner
  const { data: criticalAlerts } = useQuery({
    queryKey: ["criticalAlerts"],
    queryFn: async () => {
      const response = await alertsAPI.getAll({
        severity: "critical",
        isAcknowledged: false,
        limit: 10,
      });
      return response.data.data;
    },
    refetchInterval: 10000,
    staleTime: 0,
  });

  // Real-time: refetch alerts when a critical alert socket event arrives
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket) return;
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ["criticalAlerts"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    };
    socket.on("critical-alert", handler);
    return () => socket.off("critical-alert", handler);
  }, [socket, queryClient]);

  const { data: metricHistory } = useQuery({
    queryKey: ["metricHistory", selectedMetric],
    queryFn: async () => {
      if (!selectedMetric) return null;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const response = await healthMetricsAPI.getAll({
        metricType: selectedMetric,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      return response.data.data;
    },
    enabled: !!selectedMetric,
  });

  // ── Simulator ──
  const generateHeartRate = () => 65 + Math.floor(Math.random() * 25);
  const generateSpO2 = () => 96 + Math.floor(Math.random() * 4);
  const generateBP = () => ({
    systolic: 115 + Math.floor(Math.random() * 15),
    diastolic: 70 + Math.floor(Math.random() * 15),
  });

  useEffect(() => {
    let interval = null;
    const updateMetrics = async () => {
      const heartRate = generateHeartRate();
      const spo2 = generateSpO2();
      const bp = generateBP();
      const newSteps = Math.floor(Math.random() * 100) + 20;

      setSimulatorData((prev) => ({
        heartRate,
        steps: prev.steps + newSteps,
        spo2,
        bloodPressure: bp,
        lastUpdate: new Date(),
      }));

      try {
        const metrics = [
          {
            metricType: "heartRate",
            value: heartRate,
            unit: "bpm",
            source: "simulator",
          },
          {
            metricType: "oxygenSaturation",
            value: spo2,
            unit: "%",
            source: "simulator",
          },
          {
            metricType: "bloodPressure",
            value: bp,
            unit: "mmHg",
            source: "simulator",
          },
          {
            metricType: "steps",
            value: simulatorData.steps + newSteps,
            unit: "steps",
            source: "simulator",
          },
        ];
        for (const m of metrics) await healthMetricsAPI.create(m);
        refetchMetrics();
      } catch (error) {
        console.error("Error sending simulator data:", error);
      }
    };

    if (isSimulating) {
      updateMetrics();
      interval = setInterval(updateMetrics, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSimulating]);

  const startSimulator = () => setIsSimulating(true);
  const stopSimulator = () => {
    setIsSimulating(false);
    setSimulatorData({
      heartRate: null,
      steps: 0,
      spo2: null,
      bloodPressure: null,
      lastUpdate: null,
    });
  };

  // ── Dock tab handler ──
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setTimeout(() => {
      document
        .getElementById("patient-content")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // ── Metric tiles config ──
  const defaultMetricKeys = [
    "heartRate",
    "steps",
    "calories",
    "sleep",
    "oxygenSaturation",
    "distance",
    "bloodGlucose",
    "weight",
    "bloodPressure",
  ];
  const METRIC_ORDER_KEY = "medxi_metric_order";
  const METRIC_VISIBILITY_KEY = "medxi_metric_visibility";
  const [metricOrder, setMetricOrder] = useState(() => {
    try {
      const saved = localStorage.getItem(METRIC_ORDER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate: must contain exactly the same keys
        if (
          Array.isArray(parsed) &&
          parsed.length === defaultMetricKeys.length &&
          defaultMetricKeys.every((k) => parsed.includes(k))
        ) {
          return parsed;
        }
      }
    } catch {}
    return defaultMetricKeys;
  });
  const [metricVisibility, setMetricVisibility] = useState(() => {
    const fallback = Object.fromEntries(defaultMetricKeys.map((key) => [key, true]));
    try {
      const saved = localStorage.getItem(METRIC_VISIBILITY_KEY);
      if (!saved) return fallback;
      const parsed = JSON.parse(saved);
      if (!parsed || typeof parsed !== "object") return fallback;

      return defaultMetricKeys.reduce((acc, key) => {
        acc[key] = typeof parsed[key] === "boolean" ? parsed[key] : true;
        return acc;
      }, {});
    } catch {
      return fallback;
    }
  });

  const visibleMetricOrder = useMemo(
    () => metricOrder.filter((key) => metricVisibility[key] !== false),
    [metricOrder, metricVisibility],
  );
  const [dashboardToggleMetric, setDashboardToggleMetric] = useState(null);
  const isSelectedToggleMetricHidden =
    dashboardToggleMetric != null &&
    metricVisibility[dashboardToggleMetric] === false;

  // After every drag, re-sort items by their grid position (y then x)
  // and re-assign sequential 3-col positions so there are never gaps.
  const handleMetricLayoutChange = useCallback((layout) => {
    if (!layout || layout.length === 0) return;
    const sorted = [...layout].sort((a, b) => a.y - b.y || a.x - b.x);
    const visibleOrder = sorted.map((item) => item.i);
    setMetricOrder((prev) => {
      const hiddenOrder = prev.filter((item) => !visibleOrder.includes(item));
      const newOrder = [...visibleOrder, ...hiddenOrder];
      if (prev.join() === newOrder.join()) return prev;
      try {
        localStorage.setItem(METRIC_ORDER_KEY, JSON.stringify(newOrder));
      } catch {}
      return newOrder;
    });
  }, []);

  const toggleMetricVisibility = useCallback((metricKey) => {
    setMetricVisibility((prev) => {
      const next = {
        ...prev,
        [metricKey]: !prev[metricKey],
      };
      try {
        localStorage.setItem(METRIC_VISIBILITY_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const handleMetricTileSelect = useCallback((metricKey) => {
    setDashboardToggleMetric((prev) => (prev === metricKey ? null : metricKey));
  }, []);

  useEffect(() => {
    if (!dashboardToggleMetric) return;
    if (isSelectedToggleMetricHidden) return;

    const handlePointerDown = (event) => {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest('[data-metric-visibility-tile="true"]')
      ) {
        return;
      }
      setDashboardToggleMetric(null);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [dashboardToggleMetric, isSelectedToggleMetricHidden]);

  return (
    <div className="min-h-screen bg-background text-foreground">
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
              activeTab={activeTab}
              onTabChange={handleTabChange}
              role="patient"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Critical Alert Persistent Banner ── */}
      <CriticalAlertBanner
        criticalAlerts={criticalAlerts}
        onNavigateAlerts={() => navigate("/alerts")}
      />

      {/* ── Splash Screen ── */}
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

            {/* MEDXI Logo — snaps in half: MED goes up, XI goes down */}
            <div className="relative flex flex-col items-center">
              {/* Logo halves stacked */}
              <div className="relative flex flex-col items-center">
                {/* Top half: "MED" — slides up */}
                <motion.span
                  className="text-[clamp(5rem,18vw,14rem)] font-black tracking-tighter leading-none select-none text-primary"
                  initial={{ opacity: 0, scale: 0.85, y: 0 }}
                  animate={
                    splashPhase === "logo"
                      ? { opacity: 1, scale: 1, y: 0 }
                      : { opacity: 1, scale: 1, y: "-15vh" }
                  }
                  transition={
                    splashPhase === "logo"
                      ? { duration: 0.7, ease: "easeOut" }
                      : { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
                  }
                >
                  MED
                </motion.span>
                {/* Bottom half: "XI" — slides down */}
                <motion.span
                  className="text-[clamp(5rem,18vw,14rem)] font-black tracking-tighter leading-none select-none text-foreground -mt-[0.15em]"
                  initial={{ opacity: 0, scale: 0.85, y: 0 }}
                  animate={
                    splashPhase === "logo"
                      ? { opacity: 1, scale: 1, y: 0 }
                      : { opacity: 1, scale: 1, y: "15vh" }
                  }
                  transition={
                    splashPhase === "logo"
                      ? { duration: 0.7, ease: "easeOut" }
                      : { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
                  }
                >
                  XI
                </motion.span>
              </div>

              {/* Welcome text — rises into the gap between halves */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ opacity: 0, y: 30, scale: 0.8 }}
                animate={
                  splashPhase === "line" || splashPhase === "done"
                    ? { opacity: 1, y: 0, scale: 1 }
                    : { opacity: 0, y: 30, scale: 0.8 }
                }
                transition={{
                  duration: 0.6,
                  delay: 0.3,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    className="h-[2px] bg-gradient-to-r from-transparent to-foreground/40"
                    initial={{ width: 0 }}
                    animate={
                      splashPhase === "line" || splashPhase === "done"
                        ? { width: "6rem" }
                        : { width: 0 }
                    }
                    transition={{ duration: 0.5, delay: 0.5 }}
                  />
                  <p className="text-xl md:text-2xl text-foreground/70 font-medium tracking-wide whitespace-nowrap">
                    Welcome back, {firstName}
                  </p>
                  <motion.div
                    className="h-[2px] bg-gradient-to-l from-transparent to-foreground/40"
                    initial={{ width: 0 }}
                    animate={
                      splashPhase === "line" || splashPhase === "done"
                        ? { width: "6rem" }
                        : { width: 0 }
                    }
                    transition={{ duration: 0.5, delay: 0.5 }}
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Full Hero ── */}
      <div
        ref={heroRef}
        className="h-screen"
      >
        <PatientHero userName={firstName} heroRef={heroRef} />
      </div>

      {/* ── Main Dashboard Content ── */}
      <motion.div
        id="patient-content"
        className={cn(
          "relative z-10 min-h-screen pb-28 transition-[margin] duration-300",
        )}
        style={{
          // If we landed here with pastHero already true (tab navigation), skip the fade
          opacity: pastHero ? 1 : dashboardOpacity,
        }}
      >
        {/* Animated path lines behind dashboard */}
        <BackgroundPaths className="opacity-30 fixed inset-0 z-0 pointer-events-none" />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-[1]">
          {/* Header actions */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {activeTab === "overview" && "Health Overview"}
                {activeTab === "activity" && "Activity"}
                {activeTab === "appointments" && "Appointments"}
                {activeTab === "messages" && "Messages"}
                {activeTab === "medications" && "Medications"}
                {activeTab === "wearables" && "Wearable Devices"}
              </h2>
            </div>
            <Button
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Track Data
            </Button>
          </div>

          {/* ── Overview Tab ── */}
          {activeTab === "overview" && (
            <div>
              <AlertsSection
                alertsData={alertsData}
                onViewAllAlerts={() => navigate("/alerts")}
                theme={theme}
              />

              {/* Gamification Quick Stats */}
              {gamificationStats && (
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Level & XP tile */}
                  <Card className="hover:shadow-lg transition-shadow overflow-hidden">
                    <CardContent className="p-0 h-full">
                      <div className="h-full flex flex-col items-center justify-center gap-3 py-5 px-5">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Level &amp; XP</p>
                        <LevelBadge
                          level={gamificationStats.level || 1}
                          xpProgress={gamificationStats.xpProgress || {}}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Activity Streak tile */}
                  <Card className="hover:shadow-lg transition-shadow overflow-hidden">
                    <CardContent className="p-0 h-full">
                      <div className="h-full flex flex-col items-center justify-center gap-3 py-5 px-5">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Activity Streak</p>
                        <StreakCounter
                          currentStreak={gamificationStats.currentStreak || 0}
                          longestStreak={gamificationStats.longestStreak || 0}
                          frozen={gamificationStats.streakFrozen || false}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <DailyChallenges
                    challenges={gamificationStats.dailyChallenges || []}
                    compact
                  />
                </div>
              )}

              {/* Draggable Metric Tiles — react-grid-layout */}
              <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Your Metrics</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {visibleMetricOrder.length} of {defaultMetricKeys.length} metrics visible on your dashboard
                  </p>
                </CardHeader>
                <CardContent className="overflow-hidden">
                  {visibleMetricOrder.length > 0 ? (
                    <DraggableGrid
                      cols={{ lg: 3, md: 3, sm: 2, xs: 1 }}
                      rowHeight={120}
                      compactType="vertical"
                      isResizable={false}
                      isDraggable={false}
                      persistLayout={false}
                      onLayoutChange={handleMetricLayoutChange}
                    >
                      {visibleMetricOrder.map((key, i) => (
                        <div
                          key={key}
                          data-grid={{
                            x: i % 3,
                            y: Math.floor(i / 3),
                            w: 1,
                            h: 1,
                            minW: 1,
                            maxW: 1,
                            minH: 1,
                            maxH: 1,
                          }}
                        >
                          <div className="h-full">
                            <FitMetricTile
                              metricType={key}
                              value={latestMetrics?.[key]?.value}
                              onClick={() => setSelectedMetric(key)}
                            />
                          </div>
                        </div>
                      ))}
                    </DraggableGrid>
                  ) : (
                    <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                      Turn at least one metric on in the Activity tab to show it here.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Weekly Activity Overview */}
              <div className="mt-6">
                <ActivityOverview serverDailyTotals={dailyTotals} />
              </div>

              {/* Insights + Recipes side by side */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PatientInsights className="overflow-hidden max-h-[600px]" />
                <RecipesWidget className="overflow-hidden max-h-[600px]" />
              </div>
            </div>
          )}

          {/* ── Activity Tab ── */}
          {activeTab === "activity" && (
            <div className="space-y-8">
              <section>
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Metric Tiles
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Toggle which metrics appear in the dashboard overview.
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {visibleMetricOrder.length} visible
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {metricOrder.map((key) => (
                    <FitMetricTile
                      key={key}
                      metricType={key}
                      value={latestMetrics?.[key]?.value}
                      showDashboardToggle={dashboardToggleMetric === key}
                      isDashboardVisible={metricVisibility[key] !== false}
                      isActivityHidden={metricVisibility[key] === false}
                      isVisibilityControlTile
                      onToggleDashboardVisible={() => toggleMetricVisibility(key)}
                      onClick={() => handleMetricTileSelect(key)}
                    />
                  ))}
                </div>
              </section>

              <ActivityOverview serverDailyTotals={dailyTotals} />
              <PatientInsights />
            </div>
          )}

          {/* ── Appointments Tab (full calendar inline) ── */}
          {activeTab === "appointments" && <AppointmentsCalendar />}

          {/* ── Messages Tab ── */}
          {activeTab === "messages" && <MessagesTab />}

          {/* ── Medications Tab ── */}
          {activeTab === "medications" && <MedicationDashboard />}

          {/* ── Wearables Tab ── */}
          {activeTab === "wearables" && (
            <div className="space-y-6">
              <GoogleFitConnect />
              <WearableDevices
                isSimulating={isSimulating}
                simulatorData={simulatorData}
                onStartSimulator={startSimulator}
                onStopSimulator={stopSimulator}
              />
            </div>
          )}
        </main>
      </motion.div>

      {/* ── Metric Detail Modal ── */}
      <MetricDetailModal
        metricType={selectedMetric}
        value={latestMetrics?.[selectedMetric]?.value}
        metricHistory={metricHistory}
        isOpen={!!selectedMetric}
        onClose={() => setSelectedMetric(null)}
        onMetricAdded={refetchMetrics}
      />

      {/* ── Expandable AI Chat (appears after scroll) ── */}
      {pastHero && <ExpandableChatWidget />}

      {/* ── Modals ── */}
      <AddMetricModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={refetchMetrics}
      />
    </div>
  );
};

export default PatientDashboard;
