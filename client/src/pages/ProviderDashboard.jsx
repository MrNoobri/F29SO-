import React, { useMemo, useState } from "react";
import { CalendarDays, LayoutDashboard, Users } from "lucide-react";
import OverviewTab from "../components/provider/OverviewTab";
import PatientsTab from "../components/provider/PatientsTab";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

const samplePatients = [
  {
    id: "pt-1",
    fullName: "Ayesha Khan",
    age: 29,
    condition: "Hypertension follow-up",
    email: "ayesha@example.com",
    bloodType: "A+",
    recentMetric: { label: "Blood pressure", value: "122 / 78 mmHg" },
    lastVisit: "Today, 9:00 AM",
    notes: "Symptoms improving. Continue weekly logging for now.",
  },
  {
    id: "pt-2",
    fullName: "Hassan Ali",
    age: 41,
    condition: "Recovery monitoring",
    email: "hassan@example.com",
    bloodType: "O+",
    recentMetric: { label: "Heart rate", value: "74 bpm" },
    lastVisit: "Yesterday",
    notes: "Review hydration reminders and daily activity trends next visit.",
  },
  {
    id: "pt-3",
    fullName: "Mariam Raza",
    age: 35,
    condition: "Diabetes check-in",
    email: "mariam@example.com",
    bloodType: "B+",
    recentMetric: { label: "Blood glucose", value: "108 mg/dL" },
    lastVisit: "2 days ago",
    notes: "Patient is tracking meals consistently. Medication module comes later.",
  },
  {
    id: "pt-4",
    fullName: "Usman Tariq",
    age: 52,
    condition: "Cardiac wellness",
    email: "usman@example.com",
    bloodType: "AB-",
    recentMetric: { label: "Steps", value: "6.1k today" },
    lastVisit: "This week",
    notes: "Needs stronger adherence prompts after wearables are fully connected.",
  },
];

const todayAppointments = [
  { id: "apt-1", time: "09:00 AM", patient: "Ayesha Khan", type: "Follow-up", status: "Confirmed" },
  { id: "apt-2", time: "11:30 AM", patient: "Hassan Ali", type: "Consultation", status: "Waiting" },
  { id: "apt-3", time: "02:15 PM", patient: "Mariam Raza", type: "Review", status: "Scheduled" },
];

const priorityAlerts = [
  { id: "alert-1", title: "High evening blood pressure", severity: "high", detail: "Ayesha logged two elevated readings in the last 24 hours." },
  { id: "alert-2", title: "Missed recovery check-in", severity: "medium", detail: "Hassan skipped the morning symptom note placeholder flow." },
  { id: "alert-3", title: "Glucose trend needs review", severity: "low", detail: "Mariam shows slight variance compared with the prior week." },
];

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "patients", label: "Patients", icon: Users },
];

function ProviderDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const providerSnapshot = useMemo(
    () => ({
      appointmentsToday: todayAppointments.length,
      patientsCount: samplePatients.length,
      unreadMessages: 6,
      activeAlerts: priorityAlerts.length,
    }),
    [],
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                Provider workspace
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Early provider overview and patient management
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                This first provider slice turns the dashboard shell into a practical workspace with a quick overview,
                patient browsing, and a simple detail panel. Scheduling, messages, and alerts deepen in later commits.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <Button
                      key={tab.id}
                      variant={isActive ? "default" : "outline"}
                      className={isActive ? "shadow-sm" : ""}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {tab.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            <Card className="rounded-[24px] border-slate-200 bg-slate-50/70 shadow-none">
              <CardHeader>
                <CardDescription>Shift snapshot</CardDescription>
                <CardTitle>Today at a glance</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-sm text-slate-500">Appointments</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{providerSnapshot.appointmentsToday}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-sm text-slate-500">Patients</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{providerSnapshot.patientsCount}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-sm text-slate-500">Unread messages</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{providerSnapshot.unreadMessages}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-sm text-slate-500">Active alerts</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{providerSnapshot.activeAlerts}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </header>

        {activeTab === "overview" ? (
          <OverviewTab
            appointments={todayAppointments}
            alerts={priorityAlerts}
            patients={samplePatients}
            unreadMessages={providerSnapshot.unreadMessages}
            onOpenPatients={() => setActiveTab("patients")}
          />
        ) : (
          <PatientsTab patients={samplePatients} />
        )}
      </div>
    </div>
  );
}

export default ProviderDashboard;
