import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";

function MetricDetailModal({ isOpen, onClose, metric }) {
  if (!isOpen || !metric) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <div className="w-full max-w-2xl">
        <Card className="rounded-[2rem] shadow-2xl">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>{metric.title}</CardTitle>
              <CardDescription>
                Early detail modal for reviewing a focused metric before trend charts and clinician notes are added.
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Current reading</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{metric.value}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Target</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{metric.target}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Status</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{metric.status}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-900">Notes placeholder</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This section can later hold trend commentary, clinician observations, and related alerts.
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-900">Recent readings</p>
              <div className="mt-3 space-y-3">
                {metric.readings.map((reading, index) => (
                  <div
                    key={`${reading.date}-${index}`}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
                  >
                    <span className="text-sm text-slate-500">{reading.date}</span>
                    <span className="font-semibold text-slate-900">{reading.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default MetricDetailModal;
