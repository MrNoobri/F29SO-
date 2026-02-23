import React, { useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Droplets, HeartPulse, Pill, UserRound } from "lucide-react";
import MetricCard from "../health/MetricCard";
import MetricChart from "../health/MetricChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

function PatientDetailPanel({ patient, onBack }) {
  const [selectedMetric, setSelectedMetric] = useState("bloodPressure");

  const metricHistory = useMemo(
    () => ({
      bloodPressure: [
        { label: "Mon", value: 118 },
        { label: "Tue", value: 122 },
        { label: "Wed", value: 120 },
        { label: "Thu", value: 124 },
        { label: "Fri", value: 121 },
      ],
      heartRate: [
        { label: "Mon", value: 76 },
        { label: "Tue", value: 79 },
        { label: "Wed", value: 75 },
        { label: "Thu", value: 77 },
        { label: "Fri", value: 74 },
      ],
      hydration: [
        { label: "Mon", value: 1.4 },
        { label: "Tue", value: 1.7 },
        { label: "Wed", value: 1.9 },
        { label: "Thu", value: 1.6 },
        { label: "Fri", value: 1.8 },
      ],
    }),
    [],
  );

  const chartData = metricHistory[selectedMetric] || metricHistory.bloodPressure;

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to patients
      </Button>

      <Card className="rounded-[28px]">
        <CardHeader className="gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardDescription>Patient overview</CardDescription>
            <CardTitle className="mt-1 text-2xl">{patient.fullName}</CardTitle>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              This detail panel is intentionally lightweight in the first pass. It introduces a place for recent metrics,
              quick notes, and visit context before medications, alerts, and messaging are layered in later.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <p><span className="font-medium text-slate-900">Age:</span> {patient.age}</p>
            <p className="mt-2"><span className="font-medium text-slate-900">Blood type:</span> {patient.bloodType}</p>
            <p className="mt-2"><span className="font-medium text-slate-900">Last visit:</span> {patient.lastVisit}</p>
          </div>
        </CardHeader>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Blood pressure" metricType="bloodPressure" value="122 / 78" unit="mmHg" accent="from-rose-500/20 to-orange-500/20" icon={Droplets} onClick={() => setSelectedMetric("bloodPressure")} />
        <MetricCard title="Heart rate" metricType="heartRate" value="74" unit="bpm" accent="from-rose-500/20 to-pink-500/20" icon={HeartPulse} onClick={() => setSelectedMetric("heartRate")} />
        <MetricCard title="Hydration" metricType="hydration" value="1.8" unit="L" accent="from-sky-500/20 to-cyan-500/20" icon={Droplets} onClick={() => setSelectedMetric("hydration")} />
        <MetricCard title="Plan status" metricType="wellness" value="On track" unit="care" accent="from-emerald-500/20 to-teal-500/20" icon={Pill} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-[24px]">
          <CardHeader>
            <CardDescription>Recent trend</CardDescription>
            <CardTitle>{selectedMetric === "bloodPressure" ? "Blood pressure history" : selectedMetric === "heartRate" ? "Heart rate history" : "Hydration history"}</CardTitle>
          </CardHeader>
          <CardContent>
            <MetricChart data={chartData} valueKey="value" labelKey="label" />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[24px]">
            <CardHeader>
              <CardDescription>Care summary</CardDescription>
              <CardTitle>Visit context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-slate-600">
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                <UserRound className="mt-0.5 h-4 w-4 text-sky-700" />
                <div>
                  <p className="font-medium text-slate-900">Primary focus</p>
                  <p>{patient.condition}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                <CalendarDays className="mt-0.5 h-4 w-4 text-sky-700" />
                <div>
                  <p className="font-medium text-slate-900">Next review area</p>
                  <p>Appointment history and provider notes can be attached here in a later commit.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[24px]">
            <CardHeader>
              <CardDescription>Working note</CardDescription>
              <CardTitle>Provider note</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                {patient.notes}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default PatientDetailPanel;
