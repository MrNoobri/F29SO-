import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  ArrowLeft,
  CalendarPlus,
  MessageSquare,
  Eye,
} from "lucide-react";
import { alertsAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import DashboardDock from "../components/patient/DashboardDock";
import BookAppointmentModal from "../components/appointments/BookAppointmentModal";
import { useTheme } from "../context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const Alerts = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all"); // all, active, resolved
  const [bookingAlert, setBookingAlert] = useState(null); // alert to pre-fill booking modal

  // Fetch alerts
  const { data: alertsResponse, isLoading } = useQuery({
    queryKey: ["alerts", filter],
    queryFn: async () => {
      const params = {};
      if (filter === "active") params.isAcknowledged = false;
      if (filter === "resolved") params.isAcknowledged = true;
      const response = await alertsAPI.getAll(params);
      return response.data;
    },
  });

  const alerts = alertsResponse?.data || [];

  // Mark alert as resolved
  const resolveAlertMutation = useMutation({
    mutationFn: (alertId) => alertsAPI.acknowledge(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["criticalAlerts"] });
      toast.success("Alert resolved successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to resolve alert");
    },
  });

  const getAlertIcon = (severity) => {
    if (severity === "critical")
      return <AlertTriangle className="w-6 h-6 text-destructive" />;
    if (severity === "warning")
      return <AlertTriangle className="w-6 h-6 text-warning" />;
    return <Activity className="w-6 h-6 text-primary" />;
  };

  const getAlertStyle = (severity) => {
    if (severity === "critical")
      return "border-l-4 border-destructive bg-destructive/5";
    if (severity === "warning") return "border-l-4 border-warning bg-warning/5";
    return "border-l-4 border-primary bg-primary/5";
  };

  const getSeverityBadge = (severity) => {
    if (severity === "critical")
      return "bg-destructive/10 text-destructive border border-destructive/20";
    if (severity === "warning")
      return "bg-warning/10 text-warning border border-warning/20";
    return "bg-primary/10 text-primary border border-primary/20";
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

    return d.toLocaleDateString();
  };

  const handleSidebarNav = (tabId) => {
    navigate("/dashboard", { state: { tab: tabId } });
  };

  const cycleTheme = () => {
    const themes = ["crimson", "medical", "midnight", "emerald"];
    const idx = themes.indexOf(theme);
    setTheme(themes[(idx + 1) % themes.length]);
  };

  const formatMetricValue = (snapshot) => {
    if (!snapshot) return null;
    const val = snapshot.value;
    if (typeof val === "object" && val.systolic != null) {
      return `${val.systolic}/${val.diastolic}`;
    }
    return String(val);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardDock
        activeTab="alerts"
        onTabChange={handleSidebarNav}
        role={user?.role || "patient"}
      />

      <div className="flex justify-center">
        <div className="w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-8 pb-28">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Health Alerts
                </h1>
                <p className="text-muted-foreground mt-2">
                  Monitor and manage your health notifications
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mb-6 flex space-x-2 border-b border-border">
            {[
              { key: "all", label: "All Alerts" },
              { key: "active", label: "Active" },
              { key: "resolved", label: "Resolved" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={cn(
                  "px-4 py-2 font-medium text-sm transition-colors",
                  filter === tab.key
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Alerts List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : alerts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No Alerts
                </h3>
                <p className="text-muted-foreground">
                  {filter === "all"
                    ? "You don't have any health alerts at the moment."
                    : filter === "active"
                      ? "No active alerts. You're all good!"
                      : "No resolved alerts in your history."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <Card
                  key={alert._id}
                  className={`${getAlertStyle(alert.severity)} rounded-2xl shadow-sm`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="mt-1">
                          {getAlertIcon(alert.severity)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getSeverityBadge(alert.severity)}`}
                            >
                              {alert.severity.toUpperCase()}
                            </span>
                            {alert.isAcknowledged && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Resolved
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-foreground mb-1">
                            {alert.title || "Health Alert"}
                          </h3>
                          <p className="text-foreground/80 mb-3">
                            {alert.message}
                          </p>

                          {/* Metric Snapshot */}
                          {alert.metricSnapshot?.value != null && (
                            <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-background/60 border border-border px-3 py-2">
                              <Activity className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium text-foreground">
                                {alert.metricSnapshot.metricType}:
                              </span>
                              <span className="text-lg font-bold text-primary">
                                {formatMetricValue(alert.metricSnapshot)}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {alert.metricSnapshot.unit}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {formatDate(alert.createdAt)}
                            </div>
                            {(alert.metricType ||
                              alert.metricSnapshot?.metricType) && (
                              <div className="flex items-center">
                                <Activity className="w-4 h-4 mr-1" />
                                {alert.metricType ||
                                  alert.metricSnapshot?.metricType}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          {user?.role === "patient" && (
                            <div className="flex flex-wrap gap-2">
                              {alert.metricSnapshot?.metricType && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    navigate("/dashboard");
                                  }}
                                  className="gap-1.5"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  View Reading
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setBookingAlert(alert)}
                                className="gap-1.5"
                              >
                                <CalendarPlus className="w-3.5 h-3.5" />
                                Book Appointment
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate("/messages")}
                                className="gap-1.5"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                Message Doctor
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      {!alert.isAcknowledged && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resolveAlertMutation.mutate(alert._id)}
                          disabled={resolveAlertMutation.isPending}
                          className="ml-4"
                        >
                          {resolveAlertMutation.isPending ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground"></div>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Mark Resolved
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Book Appointment Modal (pre-filled from alert) */}
      <BookAppointmentModal
        isOpen={!!bookingAlert}
        onClose={() => setBookingAlert(null)}
        prefillReason={bookingAlert?.title || ""}
      />
    </div>
  );
};

export default Alerts;
