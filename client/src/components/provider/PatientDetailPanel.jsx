import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  Activity,
  AlertTriangle,
  CalendarDays,
  Clock,
  Mail,
  Droplets,
  Pill,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MetricCard from "../health/MetricCard";
import MetricChart from "../health/MetricChart";
import WellnessScoreRing from "../gamification/WellnessScoreRing";
import LevelBadge from "../gamification/LevelBadge";
import StreakCounter from "../gamification/StreakCounter";
import { healthMetricsAPI, alertsAPI, appointmentsAPI, medicationAPI, gamificationAPI } from "../../api";
import { cn } from "@/lib/utils";

const METRIC_LABELS = {
  heartRate: "Heart Rate",
  bloodPressure: "Blood Pressure",
  oxygenSaturation: "Oxygen Level",
  steps: "Steps",
  sleep: "Sleep",
  bloodGlucose: "Blood Glucose",
};

const METRIC_ICONS = {
  heartRate: "❤️",
  bloodPressure: "🩸",
  bloodGlucose: "🍬",
  oxygenSaturation: "💨",
  steps: "👣",
  sleep: "😴",
};


const STATUS_STYLE = {
  scheduled: { background: "color-mix(in srgb, #3b82f6 20%, var(--surface))", color: "#3b82f6" },
  confirmed: { background: "color-mix(in srgb, #22c55e 20%, var(--surface))", color: "#22c55e" },
  "in-progress": { background: "color-mix(in srgb, #eab308 20%, var(--surface))", color: "#ca8a04" },
  completed: { background: "color-mix(in srgb, #94a3b8 20%, var(--surface))", color: "#64748b" },
  cancelled: { background: "color-mix(in srgb, #ef4444 20%, var(--surface))", color: "#ef4444" },
};

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "medications", label: "Medications" },
  { id: "gamification", label: "Wellness" },
];

const PatientDetailPanel = ({ patient, onBack }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMetric, setSelectedMetric] = useState(null);

  const { data: latestMetrics } = useQuery({
    queryKey: ["patientLatestMetrics", patient._id],
    queryFn: async () => {
      const response = await healthMetricsAPI.getLatest(patient._id);
      return response.data.data;
    },
    enabled: !!patient._id,
  });

  const { data: patientAlerts } = useQuery({
    queryKey: ["singlePatientAlerts", patient._id],
    queryFn: async () => {
      const response = await alertsAPI.getAll({
        userId: patient._id,
        limit: 10,
      });
      return response.data.data;
    },
    enabled: !!patient._id,
  });

  const { data: appointmentHistory } = useQuery({
    queryKey: ["patientAppointments", patient._id],
    queryFn: async () => {
      const response = await appointmentsAPI.getAll({ patientId: patient._id });
      return response.data.data || [];
    },
    enabled: !!patient._id,
  });

  const { data: metricHistory } = useQuery({
    queryKey: ["patientMetricHistory", patient._id, selectedMetric],
    queryFn: async () => {
      if (!selectedMetric) return null;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const response = await healthMetricsAPI.getByUser(patient._id, {
        metricType: selectedMetric,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      return response.data.data;
    },
    enabled: !!selectedMetric && !!patient._id,
  });

  const { data: patientMedications } = useQuery({
    queryKey: ["patientMedications", patient._id],
    queryFn: async () => {
      const response = await medicationAPI.getByUser(patient._id);
      return response.data.data;
    },
    enabled: !!patient._id && activeTab === "medications",
  });

  const { data: patientMedStats } = useQuery({
    queryKey: ["patientMedStats", patient._id],
    queryFn: async () => {
      const response = await medicationAPI.getStatsByUser(patient._id);
      return response.data.data;
    },
    enabled: !!patient._id && activeTab === "medications",
  });

  const { data: patientWellness } = useQuery({
    queryKey: ["patientWellness", patient._id],
    queryFn: async () => {
      const response = await gamificationAPI.getPatientStats(patient._id);
      return response.data.data;
    },
    enabled: !!patient._id && activeTab === "gamification",
  });

  const formatValue = (metricType, value) => {
    if (metricType === "bloodPressure" && typeof value === "object") {
      return `${value.systolic}/${value.diastolic}`;
    }
    return value?.toFixed?.(1) || value;
  };

  const getMetricStatus = (metricType, value) => {
    const thresholds = {
      heartRate: { min: 60, max: 100 },
      bloodGlucose: { min: 70, max: 140 },
      oxygenSaturation: { min: 95, max: 100 },
    };
    if (!thresholds[metricType]) return "normal";
    const numValue = typeof value === "object" ? value.systolic : value;
    const { min, max } = thresholds[metricType];
    if (numValue < min * 0.8 || numValue > max * 1.2) return "critical";
    if (numValue < min || numValue > max) return "warning";
    return "normal";
  };

  const activeAlerts = (patientAlerts || []).filter((a) => !a.isAcknowledged);

  return (
    <div className="space-y-6">
      {/* Patient Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="mt-1">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-semibold">
              {patient.profile?.firstName?.[0]}
              {patient.profile?.lastName?.[0]}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {patient.profile?.firstName} {patient.profile?.lastName}
              </h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {patient.email}
                </span>
              </div>
            </div>
          </div>
          {/* Patient info tags */}
          <div className="flex flex-wrap gap-2 ml-[4.5rem]">
            {patient.patientInfo?.bloodType && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: "color-mix(in srgb, #ef4444 20%, var(--surface))", color: "#ef4444" }}>
                <Droplets className="h-3 w-3" />
                {patient.patientInfo.bloodType}
              </span>
            )}
            {patient.patientInfo?.allergies?.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: "color-mix(in srgb, #f97316 20%, var(--surface))", color: "#f97316" }}>
                <AlertTriangle className="h-3 w-3" />
                Allergies: {patient.patientInfo.allergies.join(", ")}
              </span>
            )}
            {patient.patientInfo?.medications?.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: "color-mix(in srgb, #3b82f6 20%, var(--surface))", color: "#3b82f6" }}>
                <Pill className="h-3 w-3" />
                {patient.patientInfo.medications.length} medication(s)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === "overview" && (
        <>
          {activeAlerts.length > 0 && (
            <Card className="border-l-4 border-red-500" style={{ background: "color-mix(in srgb, #ef4444 12%, var(--surface))" }}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 font-semibold mb-2" style={{ color: "#ef4444" }}>
                  <AlertTriangle className="h-4 w-4" />
                  {activeAlerts.length} Active Alert(s)
                </div>
                <div className="space-y-2">
                  {activeAlerts.slice(0, 3).map((alert) => (
                    <div key={alert._id} className="text-sm" style={{ color: "var(--text)" }}>
                      <span className="font-semibold" style={{ color: "#ef4444" }}>[{alert.severity}]</span>{" "}
                      {alert.title} - {alert.message}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Health Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(METRIC_LABELS).map(([key, label]) => {
                  const metric = latestMetrics?.[key];
                  return (
                    <MetricCard
                      key={key}
                      title={label}
                      value={metric ? formatValue(key, metric.value) : null}
                      unit={metric?.unit}
                      status={metric ? getMetricStatus(key, metric.value) : undefined}
                      icon={METRIC_ICONS[key]}
                      onClick={() => setSelectedMetric(selectedMetric === key ? null : key)}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {selectedMetric && metricHistory && metricHistory.length > 0 && (
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle>{METRIC_LABELS[selectedMetric]} - Last 7 Days</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setSelectedMetric(null)}>
                  Close
                </Button>
              </CardHeader>
              <CardContent>
                <MetricChart data={metricHistory} metricType={selectedMetric} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Appointment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!appointmentHistory || appointmentHistory.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No appointment history</p>
              ) : (
                <div className="space-y-3">
                  {appointmentHistory
                    .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))
                    .slice(0, 10)
                    .map((appt) => (
                      <div
                        key={appt._id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/20"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground min-w-[100px]">
                            <Clock className="h-3.5 w-3.5" />
                            {format(new Date(appt.scheduledAt), "MMM dd, yyyy")}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{appt.reason}</p>
                            <p className="text-xs text-muted-foreground">
                              {appt.type} - {appt.duration}min
                            </p>
                          </div>
                        </div>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={STATUS_STYLE[appt.status] || STATUS_STYLE.scheduled}
                        >
                          {appt.status}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ── Medications Tab ── */}
      {activeTab === "medications" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-primary" />
                Medications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!patientMedications || patientMedications.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No medications on record
                </p>
              ) : (
                <div className="space-y-3">
                  {patientMedications.map((med) => (
                    <div
                      key={med._id}
                      className={cn(
                        "rounded-xl border border-border/50 bg-card/80 p-4 flex items-center gap-3",
                        !med.isActive && "opacity-50",
                      )}
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Pill className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-foreground">{med.name}</h4>
                          {!med.isActive && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {med.dosage} · {med.frequency.replace(/_/g, " ")}
                          {med.times?.length > 0 && ` · ${med.times.join(", ")}`}
                        </p>
                        {med.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5">{med.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {patientMedStats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Adherence Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {patientMedStats.adherenceRate ?? 0}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Overall Adherence</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {patientMedStats.totalTaken ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Doses Taken</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {patientMedStats.totalExpected ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Doses Expected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Wellness / Gamification Tab ── */}
      {activeTab === "gamification" && (
        <div className="space-y-4">
          {patientWellness ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6 flex flex-col items-center justify-center gap-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                      Wellness Score
                    </p>
                    <WellnessScoreRing score={patientWellness.wellnessScore} size="md" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 flex flex-col items-center justify-center gap-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                      Level &amp; XP
                    </p>
                    <LevelBadge
                      level={patientWellness.level}
                      xpProgress={patientWellness.xpProgress}
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 flex flex-col items-center justify-center gap-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                      Streak
                    </p>
                    <StreakCounter
                      currentStreak={patientWellness.currentStreak}
                      longestStreak={patientWellness.longestStreak}
                      frozen={patientWellness.streakFrozen}
                    />
                  </CardContent>
                </Card>
              </div>

              {patientWellness.achievements?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Trophy className="h-4 w-4 text-primary" />
                      Achievements ({patientWellness.achievements.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {patientWellness.achievements.map((ach, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-sm"
                          title={ach.description}
                        >
                          <span className="text-base">{ach.icon}</span>
                          <div>
                            <p className="font-medium text-foreground leading-none">{ach.title}</p>
                            <p className="text-xs text-muted-foreground capitalize">{ach.tier}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {patientWellness.stats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Activity Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      {[
                        { label: "Metrics Logged", value: patientWellness.stats.totalMetricsLogged },
                        { label: "Meals Logged", value: patientWellness.stats.totalMealsLogged },
                        { label: "Meds Taken", value: patientWellness.stats.totalMedsTaken },
                        { label: "Days Active", value: patientWellness.stats.daysActive },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-2xl font-bold text-foreground">{value ?? 0}</p>
                          <p className="text-xs text-muted-foreground mt-1">{label}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No wellness data available for this patient</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientDetailPanel;
