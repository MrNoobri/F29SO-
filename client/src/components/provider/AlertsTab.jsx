import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Filter,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { alertsAPI } from "../../api";
import { cn } from "@/lib/utils";

const SEVERITY_STYLES = {
  critical: {
    border: "border-l-4 border-red-500",
    badge: "bg-red-100 text-red-800",
    icon: "text-red-500",
  },
  high: {
    border: "border-l-4 border-orange-500",
    badge: "bg-orange-100 text-orange-800",
    icon: "text-orange-500",
  },
  medium: {
    border: "border-l-4 border-yellow-500",
    badge: "bg-yellow-100 text-yellow-800",
    icon: "text-yellow-500",
  },
  low: {
    border: "border-l-4 border-blue-500",
    badge: "bg-blue-100 text-blue-800",
    icon: "text-blue-500",
  },
};

const SEVERITY_TABS = ["all", "critical", "high", "medium", "low"];

const AlertsTab = ({ patientAlerts, patients, onPatientClick }) => {
  const queryClient = useQueryClient();
  const [severityFilter, setSeverityFilter] = useState("all");
  const [patientFilter, setPatientFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("unacknowledged");

  const acknowledgeMutation = useMutation({
    mutationFn: (alertId) => alertsAPI.acknowledge(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patientAlerts"] });
    },
  });

  const filteredAlerts = (patientAlerts || []).filter((alert) => {
    if (severityFilter !== "all" && alert.severity !== severityFilter)
      return false;
    if (patientFilter !== "all") {
      const alertPatientId =
        alert.userId?._id || alert.userId?.toString() || alert.userId;
      if (alertPatientId !== patientFilter) return false;
    }
    if (statusFilter === "unacknowledged" && alert.isAcknowledged) return false;
    if (statusFilter === "acknowledged" && !alert.isAcknowledged) return false;
    return true;
  });

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Severity tabs */}
        <div className="flex gap-2 flex-wrap">
          {SEVERITY_TABS.map((sev) => (
            <Button
              key={sev}
              variant="ghost"
              size="sm"
              onClick={() => setSeverityFilter(sev)}
              className={cn(
                "rounded-lg border border-transparent px-3 py-1.5 text-sm font-medium capitalize transition-all",
                severityFilter === sev
                  ? "bg-primary/15 text-primary border-primary/25 shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40",
              )}
            >
              {sev === "all" ? "All Severities" : sev}
            </Button>
          ))}
        </div>

        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={patientFilter} onValueChange={setPatientFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by patient" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Patients</SelectItem>
                {(patients || []).map((p) => (
                  <SelectItem key={p._id} value={p._id}>
                    {p.profile?.firstName} {p.profile?.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="unacknowledged">Unacknowledged</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Alert Cards */}
      {filteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No Alerts
            </h3>
            <p className="text-muted-foreground">
              {statusFilter === "unacknowledged"
                ? "All patient alerts have been acknowledged."
                : "No alerts match your current filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const style =
              SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.medium;
            return (
              <Card
                key={alert._id}
                className={cn("rounded-xl shadow-sm", style.border)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <AlertTriangle
                        className={cn("h-5 w-5 mt-0.5 shrink-0", style.icon)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase",
                              style.badge,
                            )}
                          >
                            {alert.severity}
                          </span>
                          <span
                            className="text-sm font-medium text-primary cursor-pointer hover:underline"
                            onClick={() => onPatientClick && onPatientClick(alert.userId?._id)}
                          >
                            {alert.userId?.profile?.firstName}{" "}
                            {alert.userId?.profile?.lastName}
                          </span>
                          {alert.isAcknowledged && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Acknowledged
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-semibold text-foreground mb-1">
                          {alert.title || "Health Alert"}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTimeAgo(alert.createdAt)}
                          </div>
                          {alert.metricSnapshot?.metricType && (
                            <div className="flex items-center gap-1">
                              <Activity className="w-3.5 h-3.5" />
                              {alert.metricSnapshot.metricType}
                              {alert.metricSnapshot.value != null && (
                                <span className="font-medium">
                                  :{" "}
                                  {typeof alert.metricSnapshot.value === "object"
                                    ? `${alert.metricSnapshot.value.systolic}/${alert.metricSnapshot.value.diastolic}`
                                    : alert.metricSnapshot.value}{" "}
                                  {alert.metricSnapshot.unit}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {!alert.isAcknowledged && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => acknowledgeMutation.mutate(alert._id)}
                        disabled={acknowledgeMutation.isPending}
                        className="ml-4 shrink-0"
                      >
                        {acknowledgeMutation.isPending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Acknowledge
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
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

export default AlertsTab;
