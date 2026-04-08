import React from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  CalendarDays,
  BellRing,
  MessageSquareText,
  Clock,
  AlertTriangle,
  Users,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MetricRingCard from "./MetricRingCard";
import { staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

const STATUS_COLORS = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  "in-progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  completed: "bg-gray-100 text-gray-600 dark:bg-gray-800/60 dark:text-gray-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  "no-show": "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
};

const TYPE_COLORS = {
  consultation: "bg-primary/15 text-primary",
  "follow-up": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  emergency: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  "routine-checkup": "bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300",
};

const SEVERITY_STYLES = {
  critical: {
    border: "border-l-4 border-red-500",
    badgeStyle: { background: "color-mix(in srgb, #ef4444 20%, var(--surface))", color: "#ef4444" },
    icon: "text-red-500",
  },
  high: {
    border: "border-l-4 border-orange-500",
    badgeStyle: { background: "color-mix(in srgb, #f97316 20%, var(--surface))", color: "#f97316" },
    icon: "text-orange-500",
  },
  medium: {
    border: "border-l-4 border-yellow-500",
    badgeStyle: { background: "color-mix(in srgb, #eab308 20%, var(--surface))", color: "#ca8a04" },
    icon: "text-yellow-500",
  },
  low: {
    border: "border-l-4 border-blue-500",
    badgeStyle: { background: "color-mix(in srgb, #3b82f6 20%, var(--surface))", color: "#3b82f6" },
    icon: "text-blue-500",
  },
};

const OverviewTab = ({
  todayAppointments,
  patients,
  patientAlerts,
  unreadMessages,
  onSwitchTab,
  onPatientClick,
}) => {
  const activeAlerts = patientAlerts?.filter((a) => !a.isAcknowledged) || [];
  const recentAlerts = activeAlerts.slice(0, 5);
  const sortedAppointments = [...(todayAppointments || [])].sort(
    (a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt),
  );

  const totalToday = todayAppointments?.length || 0;
  const completedToday = (todayAppointments || []).filter(
    (a) => a.status === "completed",
  ).length;
  const criticalAlerts = activeAlerts.filter(
    (a) => a.severity === "critical",
  ).length;

  return (
    <div>
      {/* Metric Rings */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <MetricRingCard
            title="Today's Appointments"
            value={completedToday}
            target={Math.max(totalToday, 1)}
            unit={`${completedToday} of ${totalToday} completed`}
            icon={CalendarDays}
            ringColor="hsl(var(--primary))"
            detailContent={
              <div className="space-y-2">
                {sortedAppointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No appointments today
                  </p>
                ) : (
                  sortedAppointments.slice(0, 4).map((appt) => (
                    <div
                      key={appt._id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-foreground">
                        {format(new Date(appt.scheduledAt), "h:mm a")} -{" "}
                        {appt.patientId?.profile?.firstName}{" "}
                        {appt.patientId?.profile?.lastName}
                      </span>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          STATUS_COLORS[appt.status] || STATUS_COLORS.scheduled,
                        )}
                      >
                        {appt.status}
                      </span>
                    </div>
                  ))
                )}
                {sortedAppointments.length > 4 && (
                  <p className="text-xs text-muted-foreground">
                    +{sortedAppointments.length - 4} more
                  </p>
                )}
              </div>
            }
          />
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <MetricRingCard
            title="Active Alerts"
            value={activeAlerts.length}
            min={0}
            max={Math.max(activeAlerts.length + 2, 10)}
            unit={
              criticalAlerts > 0
                ? `${criticalAlerts} critical`
                : "All patients stable"
            }
            icon={BellRing}
            detailContent={
              <div className="space-y-2">
                {recentAlerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No active alerts
                  </p>
                ) : (
                  recentAlerts.slice(0, 3).map((alert) => {
                    const style =
                      SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.medium;
                    return (
                      <div
                        key={alert._id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span
                          className="text-xs px-1.5 py-0.5 rounded font-medium"
                          style={style.badgeStyle}
                        >
                          {alert.severity}
                        </span>
                        <span className="text-foreground truncate">
                          {alert.title}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            }
          />
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <MetricRingCard
            title="Unread Messages"
            value={unreadMessages || 0}
            target={Math.max((unreadMessages || 0) + 1, 5)}
            unit={unreadMessages ? "Tap to view inbox" : "Inbox is clear"}
            icon={MessageSquareText}
            ringColor="hsl(var(--primary))"
            detailContent={
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onSwitchTab("messages");
                }}
              >
                Open Messages <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            }
          />
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Today's Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Today's Schedule
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSwitchTab("calendar")}
              >
                View Calendar <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {sortedAppointments.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">
                  No appointments scheduled for today
                </p>
              ) : (
                <div className="space-y-3">
                  {sortedAppointments.map((appt) => (
                    <div
                      key={appt._id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium text-primary min-w-[70px]">
                          {format(new Date(appt.scheduledAt), "h:mm a")}
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {appt.patientId?.profile?.firstName}{" "}
                            {appt.patientId?.profile?.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {appt.reason}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-medium",
                            TYPE_COLORS[appt.type] || TYPE_COLORS.consultation,
                          )}
                        >
                          {appt.type}
                        </span>
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-medium",
                            STATUS_COLORS[appt.status] ||
                              STATUS_COLORS.scheduled,
                          )}
                        >
                          {appt.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Recent Alerts
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSwitchTab("alerts")}
              >
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {recentAlerts.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">
                  No active alerts
                </p>
              ) : (
                <div className="space-y-3">
                  {recentAlerts.map((alert) => {
                    const style =
                      SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.medium;
                    return (
                      <div
                        key={alert._id}
                        className={cn(
                          "p-3 rounded-lg bg-secondary/20 cursor-pointer hover:bg-secondary/30 transition-colors",
                          style.border,
                        )}
                        onClick={() => onPatientClick && onPatientClick(alert.userId?._id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0">
                            <AlertTriangle
                              className={cn("h-4 w-4 mt-0.5 shrink-0", style.icon)}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span
                                  className="text-xs px-1.5 py-0.5 rounded font-medium"
                                  style={style.badgeStyle}
                                >
                                  {alert.severity}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {alert.userId?.profile?.firstName}{" "}
                                  {alert.userId?.profile?.lastName}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-foreground truncate">
                                {alert.title}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTimeAgo(alert.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Patient Summary */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              My Patients
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSwitchTab("patients")}
            >
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {!patients || patients.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                No patients yet. Patients will appear here once appointments are
                booked.
              </p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {patients.slice(0, 8).map((patient) => (
                  <div
                    key={patient._id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                    onClick={() => onPatientClick ? onPatientClick(patient._id) : onSwitchTab("patients")}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                      {patient.profile?.firstName?.[0]}
                      {patient.profile?.lastName?.[0]}
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {patient.profile?.firstName} {patient.profile?.lastName}
                    </span>
                  </div>
                ))}
                {patients.length > 8 && (
                  <div className="flex items-center px-3 py-2 text-sm text-muted-foreground">
                    +{patients.length - 8} more
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

function formatTimeAgo(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export default OverviewTab;
