import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import MetricRing from "@/components/dashboard/MetricRing";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import { METRIC_CONFIG } from "./metricConfig";

/**
 * A single Google-Fit-style metric tile with a ring + big number.
 */
export default function FitMetricTile({
  metricType,
  value,
  className,
  onClick,
  showDashboardToggle = false,
  isDashboardVisible = true,
  onToggleDashboardVisible,
  isActivityHidden = false,
  isVisibilityControlTile = false,
}) {
  const config = METRIC_CONFIG[metricType] || {
    label: metricType,
    unit: "",
    icon: Heart,
    color: "hsl(var(--primary))",
    goal: null,
    format: (v) => v,
  };

  const Icon = config.icon;
  const displayValue = value != null ? config.format(value) : "--";

  // Calculate progress towards goal for the ring
  const numericValue =
    typeof value === "object" ? (value?.systolic ?? 0) : Number(value) || 0;
  const progress = config.goal ? Math.min(numericValue / config.goal, 1) : 0;
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      onClick={onClick}
      className={cn("cursor-pointer", className)}
      data-metric-visibility-tile={isVisibilityControlTile ? "true" : undefined}
    >
      <Card className="relative h-full overflow-hidden hover:shadow-lg transition-shadow">
        {showDashboardToggle && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <span className="rounded-full bg-background/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground shadow-sm">
                Dashboard
              </span>
              <button
                type="button"
                aria-pressed={isDashboardVisible}
                aria-label={`${isDashboardVisible ? "Hide" : "Show"} ${config.label} on dashboard`}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleDashboardVisible?.();
                }}
                className={cn(
                  "relative flex h-10 w-20 items-center rounded-full border px-1 shadow-lg backdrop-blur-md transition-colors",
                  isDashboardVisible
                    ? "border-primary/40 bg-primary/95"
                    : "border-border/70 bg-background/95",
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none absolute left-3 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors",
                    isDashboardVisible ? "text-white/80" : "text-foreground/45",
                  )}
                >
                  On
                </span>
                <span
                  className={cn(
                    "pointer-events-none absolute right-3 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors",
                    isDashboardVisible ? "text-white/45" : "text-foreground/70",
                  )}
                >
                  Off
                </span>
                <span
                  className={cn(
                    "absolute top-1 h-8 w-8 rounded-full bg-white shadow-sm transition-transform duration-300",
                    isDashboardVisible ? "translate-x-10" : "translate-x-0",
                  )}
                />
              </button>
            </div>
          </div>
        )}

        <CardContent
          className={cn(
            "min-h-[112px] p-4 sm:p-5 flex items-center gap-3 sm:gap-4 transition-all",
            isActivityHidden && "blur-[1.5px] grayscale opacity-45",
            showDashboardToggle && "blur-[1.5px] opacity-60",
          )}
        >
          {/* Ring (only show if goal exists) */}
          {config.goal ? (
            <MetricRing
              progress={progress}
              size={56}
              strokeWidth={7}
              ringColor={config.color}
              className="shrink-0"
            />
          ) : (
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${config.color}20` }}
            >
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: config.color }} />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-muted-foreground truncate">
              {config.label}
            </p>
            <p className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5 text-2xl font-bold text-foreground leading-tight">
              <span className="min-w-0 break-words">{displayValue}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {config.unit}
              </span>
            </p>
            {config.goal && value != null && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {Math.round((numericValue / config.goal) * 100)}% of{" "}
                {config.goal.toLocaleString()} goal
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
