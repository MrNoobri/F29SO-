import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import MetricChart from "@/components/health/MetricChart";
import MetricRing from "@/components/dashboard/MetricRing";
import { METRIC_CONFIG } from "@/components/patient/metricConfig";
import { Button } from "@/components/ui/button";
import { healthMetricsAPI } from "@/api";
import { cn } from "@/lib/utils";

/**
 * Full-screen metric detail modal.
 *
 * Animation flow:
 *  1. Blur overlay fades in
 *  2. Metric card scales up to centre
 *  3. Card slides left; chart panel slides in from the right
 *  4. Click outside / X to close
 */
export default function MetricDetailModal({
  metricType,
  value,
  metricHistory,
  isOpen,
  onClose,
  onMetricAdded,
}) {
  const [quickValue, setQuickValue] = useState("");
  const [saving, setSaving] = useState(false);

  const config = METRIC_CONFIG[metricType] || {
    label: metricType,
    unit: "",
    icon: TrendingUp,
    color: "hsl(var(--primary))",
    format: (v) => v,
  };

  const Icon = config.icon;
  const displayValue = value != null ? config.format(value) : "--";

  // Calculate ring progress for goal-based metrics
  const numericValue =
    typeof value === "object" ? (value?.systolic ?? 0) : Number(value) || 0;
  const ringProgress = config.goal
    ? Math.min(numericValue / config.goal, 1)
    : 0;

  // Determine trend from history
  const trend = (() => {
    if (!metricHistory || metricHistory.length < 2) return null;
    const sorted = [...metricHistory].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
    );
    const latest =
      typeof sorted[0].value === "object"
        ? sorted[0].value.systolic
        : sorted[0].value;
    const prev =
      typeof sorted[1].value === "object"
        ? sorted[1].value.systolic
        : sorted[1].value;
    if (latest > prev) return "up";
    if (latest < prev) return "down";
    return "flat";
  })();

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Quick-add metric
  const handleQuickAdd = async () => {
    if (!quickValue) return;
    setSaving(true);
    try {
      await healthMetricsAPI.create({
        metricType,
        value: Number(quickValue),
        unit: config.unit,
        source: "manual",
      });
      setQuickValue("");
      onMetricAdded?.();
    } catch (err) {
      console.error("Quick-add error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Backdrop blur */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Content container — two panels side by side */}
          <motion.div
            className="relative z-10 flex flex-col lg:flex-row gap-6 w-full max-w-5xl"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 26,
              delay: 0.05,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Left: Metric Summary Card ── */}
            <motion.div
              className="lg:w-[340px] shrink-0 rounded-2xl bg-card text-card-foreground shadow-2xl p-8 flex flex-col items-center justify-center"
              initial={{ x: 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 80, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 28,
                delay: 0.1,
              }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/60 transition-colors text-muted-foreground lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Ring with value centered inside */}
              {config.goal ? (
                <MetricRing
                  progress={ringProgress}
                  size={160}
                  strokeWidth={10}
                  ringColor={config.color}
                  className="mb-4"
                >
                  <p className="text-3xl font-bold text-foreground leading-none">
                    {displayValue}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {config.unit}
                  </p>
                </MetricRing>
              ) : (
                <div
                  className="w-[160px] h-[160px] rounded-full flex flex-col items-center justify-center mb-4 border-[10px]"
                  style={{
                    borderColor: `${config.color}30`,
                    backgroundColor: `${config.color}08`,
                  }}
                >
                  <Icon
                    className="w-7 h-7 mb-1"
                    style={{ color: config.color }}
                  />
                  <p className="text-3xl font-bold text-foreground leading-none">
                    {displayValue}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {config.unit}
                  </p>
                </div>
              )}

              <p className="text-lg font-semibold text-foreground mt-1">
                {config.label}
              </p>

              {/* Trend indicator */}
              {trend && (
                <div
                  className={cn(
                    "mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                    trend === "up" && "bg-emerald-500/10 text-emerald-500",
                    trend === "down" && "bg-red-500/10 text-red-500",
                    trend === "flat" && "bg-muted text-muted-foreground",
                  )}
                >
                  {trend === "up" && <TrendingUp className="w-3.5 h-3.5" />}
                  {trend === "down" && <TrendingDown className="w-3.5 h-3.5" />}
                  {trend === "flat" && <Minus className="w-3.5 h-3.5" />}
                  {trend === "up"
                    ? "Trending up"
                    : trend === "down"
                      ? "Trending down"
                      : "Stable"}
                </div>
              )}

              {/* Quick-add */}
              <div className="w-full mt-8 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Quick Add
                </p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={quickValue}
                    onChange={(e) => setQuickValue(e.target.value)}
                    placeholder={`${config.unit}…`}
                    className="flex-1 h-10 rounded-xl bg-muted/50 border-0 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                    onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
                  />
                  <Button
                    size="sm"
                    onClick={handleQuickAdd}
                    disabled={saving || !quickValue}
                    className="h-10 px-4 rounded-xl"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* ── Right: Chart Panel ── */}
            <motion.div
              className="flex-1 min-w-0 rounded-2xl bg-card text-card-foreground shadow-2xl p-8"
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 60, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 280,
                damping: 26,
                delay: 0.2,
              }}
            >
              {/* Close button (desktop) */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/60 transition-colors text-muted-foreground hidden lg:flex"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-foreground mb-1">
                {config.label} — Last 7 Days
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {metricHistory?.length || 0} readings
              </p>

              {metricHistory && metricHistory.length > 0 ? (
                <MetricChart
                  data={metricHistory}
                  metricType={metricType}
                  color={config.color}
                />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No chart data available for this metric.
                </div>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
