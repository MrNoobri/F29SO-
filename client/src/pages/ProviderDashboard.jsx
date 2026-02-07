import React from "react";
import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

const providerStats = [
  { label: "Today's appointments", value: "5", hint: "Calendar integration comes later" },
  { label: "Assigned patients", value: "18", hint: "Patient list and detail panel will follow" },
  { label: "Unread messages", value: "7", hint: "Real-time messaging is still upcoming" },
  { label: "Active alerts", value: "3", hint: "Alert triage flow will be layered in later" },
];

function ProviderDashboard() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
              Provider dashboard
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Early provider workspace
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              This first version introduces a provider-specific dashboard shell with top-level counts,
              a daily focus panel, and placeholders for patients, appointments, messages, and alerts.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/patient">Patient view</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin">Admin view</Link>
            </Button>
          </div>
        </header>

        <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {providerStats.map((card) => (
            <Card key={card.label} className="rounded-3xl">
              <CardHeader>
                <CardDescription>{card.label}</CardDescription>
                <CardTitle className="text-3xl">{card.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-slate-600">{card.hint}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Today's focus board</CardTitle>
              <CardDescription>
                A simple placeholder section for the provider day plan before tabs and deeper workflows land.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-slate-600">
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                Review scheduled consultations and confirm availability.
              </div>
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                Check patients with recent alerts or pending lab updates.
              </div>
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                Respond to priority messages and prepare follow-up notes.
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>What this page unlocks later</CardTitle>
              <CardDescription>
                The layout is intentionally simple so later commits can add real tabs and data without a hard reset.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-4">Overview tab with patient trends and key counts.</div>
              <div className="rounded-2xl bg-slate-50 p-4">Calendar tab with booking and scheduling actions.</div>
              <div className="rounded-2xl bg-slate-50 p-4">Messaging and alerts tabs with live updates.</div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

export default ProviderDashboard;
