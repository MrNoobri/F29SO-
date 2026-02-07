import React from "react";
import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

const adminCards = [
  { label: "Total users", value: "42", hint: "Role distribution and user controls come later" },
  { label: "System health", value: "Stable", hint: "Metrics and service checks will expand over time" },
  { label: "Audit events", value: "12", hint: "Detailed audit log tooling is still upcoming" },
  { label: "Flagged alerts", value: "4", hint: "Alert moderation and review flows will follow" },
];

function AdminDashboard() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-violet-700">
              Admin dashboard
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Early platform management view
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              This first admin page sets up an operational shell for reviewing platform health,
              users, alerts, and future audit information without committing to the final layout yet.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/provider">Provider view</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Back home</Link>
            </Button>
          </div>
        </header>

        <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {adminCards.map((card) => (
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
              <CardTitle>Operations overview</CardTitle>
              <CardDescription>
                This placeholder area can grow into user management, audit logs, and analytics panels later.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-slate-600">
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                Monitor total users, role balance, and sign-in activity.
              </div>
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                Review flagged items, unresolved alerts, and platform incidents.
              </div>
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                Track system metrics before a richer analytics dashboard is introduced.
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Planned admin expansions</CardTitle>
              <CardDescription>
                These are natural follow-ups that can slot into this shell cleanly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-4">User list with filters, paging, and role updates.</div>
              <div className="rounded-2xl bg-slate-50 p-4">Audit log stream with searchable activity records.</div>
              <div className="rounded-2xl bg-slate-50 p-4">System metrics cards and operational alerts.</div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

export default AdminDashboard;
