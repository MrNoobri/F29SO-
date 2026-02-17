import React, { useMemo, useState } from "react";
import { CalendarDays, HeartPulse, LayoutGrid, MessageSquareMore, MoonStar, ShieldCheck } from "lucide-react";
import ActivityOverview from "../components/patient/ActivityOverview";
import DashboardDock from "../components/patient/DashboardDock";
import DraggableGrid from "../components/patient/DraggableGrid";
import MetricDetailModal from "../components/patient/MetricDetailModal";
import PatientHero from "../components/patient/PatientHero";
import PatientInsights from "../components/patient/PatientInsights";
import WeeklyBarChart from "../components/patient/WeeklyBarChart";
import MetricCard from "../components/health/MetricCard";
import AddMetricModal from "../components/health/AddMetricModal";
import MetricRing from "../components/dashboard/MetricRing";
import StatTile from "../components/dashboard/StatTile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

const summaryCards = [
  {
    title: "Heart rate",
    value: "76 bpm",
    subtext: "Holding steady this morning.",
    icon: HeartPulse,
  },
  {
    title: "Appointments",
    value: "1 upcoming",
    subtext: "Your next review is already blocked out.",
    icon: CalendarDays,
  },
  {
    title: "Messages",
    value: "2 unread",
    subtext: "A placeholder count until messaging is added.",
    icon: MessageSquareMore,
  },
  {
    title: "Night routine",
    value: "6 / 7",
    subtext: "A soft indicator for habit tracking later on.",
    icon: MoonStar,
  },
];

const weeklyActivity = [
  { label: "Mon", value: 4 },
  { label: "Tue", value: 6 },
  { label: "Wed", value: 5 },
  { label: "Thu", value: 8 },
  { label: "Fri", value: 7 },
  { label: "Sat", value: 3 },
  { label: "Sun", value: 6 },
];

const activityFeed = [
  {
    time: "08:30",
    title: "Morning vitals check",
    description: "This timeline becomes more useful once real metric submissions and alerts are wired in.",
  },
  {
    time: "13:15",
    title: "Hydration reminder",
    description: "A soft placeholder event for later notification features.",
  },
  {
    time: "18:45",
    title: "Evening wrap-up",
    description: "A future commit can turn this into a proper symptom or recovery check-in.",
  },
];

const insightCards = [
  {
    title: "Vitals are stable",
    tag: "Overview",
    description: "The dashboard now has a proper coaching surface instead of a simple placeholder page.",
  },
  {
    title: "Room for personalization",
    tag: "Interaction",
    description: "This commit introduces rearrangeable sections so the patient view starts to feel more product-like.",
  },
  {
    title: "More tabs coming next",
    tag: "Roadmap",
    description: "Appointments, messages, and profile areas still use lightweight placeholders at this stage.",
  },
];

const metricCards = [
  {
    title: "Blood pressure",
    metricType: "bloodPressure",
    value: "118 / 76",
    unit: "mmHg",
  },
  {
    title: "Heart rate",
    metricType: "heartRate",
    value: 76,
    unit: "bpm",
  },
  {
    title: "Sleep",
    metricType: "sleep",
    value: 7.2,
    unit: "hours",
  },
];

const metricDetailMap = {
  "Blood pressure": {
    title: "Blood pressure",
    value: "118 / 76 mmHg",
    target: "120 / 80 mmHg",
    status: "On track",
    readings: [
      { date: "Today", value: "118 / 76" },
      { date: "Yesterday", value: "121 / 79" },
      { date: "2 days ago", value: "119 / 78" },
    ],
  },
  "Heart rate": {
    title: "Heart rate",
    value: "76 bpm",
    target: "60 - 90 bpm",
    status: "Stable",
    readings: [
      { date: "Today", value: "76 bpm" },
      { date: "Yesterday", value: "79 bpm" },
      { date: "2 days ago", value: "74 bpm" },
    ],
  },
  Sleep: {
    title: "Sleep",
    value: "7.2 hours",
    target: "8 hours",
    status: "Improving",
    readings: [
      { date: "Last night", value: "7.2 h" },
      { date: "Previous", value: "6.9 h" },
      { date: "Earlier", value: "7.4 h" },
    ],
  },
};

function PlaceholderPanel({ icon: Icon, title, description }) {
  return (
    <Card className="rounded-[1.75rem] border-dashed">
      <CardHeader>
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          This section is intentionally light for now and gives you room to wire in the real feature later.
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardOverview({ onAddMetric, onOpenMetric }) {
  const completion = useMemo(() => 0.72, []);

  return (
    <>
      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <StatTile
            key={card.title}
            title={card.title}
            value={card.value}
            subtext={card.subtext}
            icon={card.icon}
          />
        ))}
      </section>

      <div className="hidden xl:block">
        <DraggableGrid>
          <Card key="progress" className="rounded-[1.9rem]">
            <CardHeader className="drag-handle cursor-move flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Daily health progress</CardTitle>
                <CardDescription>
                  The overview is now rearrangeable so the dashboard starts feeling interactive.
                </CardDescription>
              </div>
              <MetricRing progress={completion} size={108}>
                <span className="text-2xl font-semibold text-slate-900">72%</span>
                <span className="text-xs uppercase tracking-[0.16em] text-slate-500">complete</span>
              </MetricRing>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {metricCards.map((metric) => (
                <div key={metric.title} onClick={() => onOpenMetric(metricDetailMap[metric.title])}>
                  <MetricCard
                    title={metric.title}
                    metricType={metric.metricType}
                    value={metric.value}
                    unit={metric.unit}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card key="activity" className="rounded-[1.9rem]">
            <div className="drag-handle cursor-move">
              <ActivityOverview items={activityFeed} />
            </div>
          </Card>

          <Card key="weekly" className="rounded-[1.9rem]">
            <div className="drag-handle cursor-move">
              <WeeklyBarChart data={weeklyActivity} />
            </div>
          </Card>

          <Card key="insights" className="rounded-[1.9rem]">
            <div className="drag-handle cursor-move">
              <PatientInsights insights={insightCards} />
            </div>
          </Card>
        </DraggableGrid>
      </div>

      <div className="grid gap-4 xl:hidden">
        <Card className="rounded-[1.9rem]">
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Daily health progress</CardTitle>
              <CardDescription>
                The draggable layout falls back to a stacked mobile view for now.
              </CardDescription>
            </div>
            <MetricRing progress={completion} size={92}>
              <span className="text-xl font-semibold text-slate-900">72%</span>
            </MetricRing>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {metricCards.map((metric) => (
              <div key={metric.title} onClick={() => onOpenMetric(metricDetailMap[metric.title])}>
                <MetricCard
                  title={metric.title}
                  metricType={metric.metricType}
                  value={metric.value}
                  unit={metric.unit}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <ActivityOverview items={activityFeed} />
        <WeeklyBarChart data={weeklyActivity} />
        <PatientInsights insights={insightCards} />
      </div>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1fr_0.95fr]">
        <Card className="rounded-[1.75rem]">
          <CardHeader>
            <CardTitle>Quick care blocks</CardTitle>
            <CardDescription>
              A neat place for future appointments, reminders, and clinician nudges.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
              Friday review appointment at 11:00 AM.
            </div>
            <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
              Evening sleep note reminder after 9:00 PM.
            </div>
            <Button variant="outline" className="w-full" onClick={onAddMetric}>
              Log a new reading
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem]">
          <CardHeader>
            <CardTitle>What this interaction step adds</CardTitle>
            <CardDescription>
              The patient area now has a dock and rearrangeable dashboard widgets.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
            <div className="rounded-2xl bg-slate-50 p-4">Overview widgets can be repositioned on desktop.</div>
            <div className="rounded-2xl bg-slate-50 p-4">A dock is in place for switching between dashboard areas.</div>
            <div className="rounded-2xl bg-slate-50 p-4">Later commits can replace these placeholders with real tabs like messages and appointments.</div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

export default function PatientDashboard() {
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [isAddMetricOpen, setIsAddMetricOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PatientHero
          userName="Alex"
          onAddMetric={() => setIsAddMetricOpen(true)}
          onViewDetails={() => setSelectedMetric(metricDetailMap["Blood pressure"])}
        />

        {activeTab === "overview" && (
          <DashboardOverview
            onAddMetric={() => setIsAddMetricOpen(true)}
            onOpenMetric={(metric) => setSelectedMetric(metric)}
          />
        )}

        {activeTab === "activity" && (
          <PlaceholderPanel
            icon={LayoutGrid}
            title="Activity workspace"
            description="A lightweight placeholder until the dashboard feeds, charts, and alerts become fully data-driven."
          />
        )}

        {activeTab === "appointments" && (
          <PlaceholderPanel
            icon={CalendarDays}
            title="Appointments area"
            description="This tab is reserved for the booking calendar and visit cards that arrive in a later commit."
          />
        )}

        {activeTab === "messages" && (
          <PlaceholderPanel
            icon={ShieldCheck}
            title="Messages area"
            description="This space will later connect patient-to-provider messaging and conversation threads."
          />
        )}
      </div>

      <DashboardDock activeTab={activeTab} onTabChange={setActiveTab} userName="Alex Morgan" />

      <MetricDetailModal
        isOpen={Boolean(selectedMetric)}
        metric={selectedMetric}
        onClose={() => setSelectedMetric(null)}
      />

      <AddMetricModal isOpen={isAddMetricOpen} onClose={() => setIsAddMetricOpen(false)} />
    </div>
  );
}
