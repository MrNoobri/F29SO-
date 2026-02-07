import React from "react";
import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

const summaryCards = [
  { title: "Health summary", value: "4 tracked areas", hint: "Vitals, habits, symptoms, and recovery notes" },
  { title: "Upcoming appointments", value: "2 scheduled", hint: "Placeholders for calendar and booking components" },
  { title: "Active alerts", value: "1 review item", hint: "Alerts will connect to metric thresholds later" },
  { title: "Messages", value: "3 unread", hint: "Messaging surfaces will be added in later commits" },
];

function PatientDashboard() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">
              Patient dashboard
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Early patient workspace
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              This first pass introduces the patient-facing dashboard layout, a welcoming hero,
              and placeholder panels for health tracking, appointments, alerts, and future insights.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/login">Open auth flow</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/provider">Provider view</Link>
            </Button>
          </div>
        </header>

        <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <Card key={card.title} className="rounded-3xl">
              <CardHeader>
                <CardDescription>{card.title}</CardDescription>
                <CardTitle className="text-2xl">{card.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-slate-600">{card.hint}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Dashboard timeline preview</CardTitle>
              <CardDescription>
                A simple placeholder section before metric charts, wearable sync, and message panels are wired in.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-slate-600">
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                Morning check-in placeholder for vitals, symptom notes, and medication prompts.
              </div>
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                Midday recovery and activity summary area for future metric cards.
              </div>
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                Evening reflection panel reserved for trends, streaks, and AI insights later on.
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Next milestone ideas</CardTitle>
              <CardDescription>
                These blocks make it easy to expand the patient dashboard without replacing the whole page later.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-4">Add health metric cards and chart widgets.</div>
              <div className="rounded-2xl bg-slate-50 p-4">Connect alerts and appointments to live API data.</div>
              <div className="rounded-2xl bg-slate-50 p-4">Introduce chat, wearable sync, and recovery insights.</div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

export default PatientDashboard;
