import React from "react";
import { AlertTriangle, CalendarDays, MessageSquareMore, Users } from "lucide-react";
import MetricRingCard from "./MetricRingCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

const severityStyles = {
  high: "border-rose-200 bg-rose-50 text-rose-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-sky-200 bg-sky-50 text-sky-700",
};

function OverviewTab({ appointments = [], alerts = [], patients = [], unreadMessages = 0, onOpenPatients }) {
  const completed = 1;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <MetricRingCard
            title="Appointments"
            value={completed}
            target={appointments.length || 1}
            unit={`${completed} of ${appointments.length} completed`}
            icon={CalendarDays}
            detailContent={
              <div className="space-y-2 text-sm text-slate-600">
                {appointments.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <span>{item.time} · {item.patient}</span>
                    <span className="text-xs font-medium text-slate-500">{item.status}</span>
                  </div>
                ))}
              </div>
            }
          />

          <MetricRingCard
            title="Patient panel"
            value={patients.length}
            target={12}
            unit="Active patients in this early view"
            icon={Users}
            detailContent={
              <div className="space-y-2 text-sm text-slate-600">
                {patients.slice(0, 3).map((patient) => (
                  <div key={patient.id} className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="font-medium text-slate-900">{patient.fullName}</p>
                    <p className="text-xs text-slate-500">{patient.condition}</p>
                  </div>
                ))}
              </div>
            }
          />

          <MetricRingCard
            title="Unread messages"
            value={unreadMessages}
            target={10}
            unit="Messaging gets a dedicated flow later"
            icon={MessageSquareMore}
            detailContent={
              <div className="space-y-2 text-sm text-slate-600">
                <p>Provider inbox is still simplified at this stage.</p>
                <p>This card reserves space for message urgency, conversation previews, and reply actions.</p>
              </div>
            }
          />
        </section>

        <Card className="rounded-[24px]">
          <CardHeader>
            <CardDescription>Today&apos;s schedule</CardDescription>
            <CardTitle>Upcoming appointments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {appointments.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.patient}</p>
                  <p className="text-sm text-slate-500">{item.type} · {item.time}</p>
                </div>
                <span className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                  {item.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="rounded-[24px]">
          <CardHeader>
            <CardDescription>Priority review</CardDescription>
            <CardTitle>Patient alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className={`rounded-2xl border p-4 ${severityStyles[alert.severity] || severityStyles.low}`}>
                <div className="mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <p className="text-sm font-semibold">{alert.title}</p>
                </div>
                <p className="text-sm leading-6">{alert.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[24px]">
          <CardHeader>
            <CardDescription>Next step</CardDescription>
            <CardTitle>Patient management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-slate-600">
            <p>
              This commit introduces the patient browser and a detail panel. Later commits can add appointment history,
              messaging shortcuts, and live metric pulls.
            </p>
            <Button onClick={onOpenPatients}>Open patient panel</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default OverviewTab;
