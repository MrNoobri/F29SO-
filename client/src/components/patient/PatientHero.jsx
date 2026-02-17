import React from "react";
import { Button } from "../ui/button";

function PatientHero({ userName = "Patient", onAddMetric, onViewDetails }) {
  return (
    <section className="mb-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-700 text-white shadow-xl">
      <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.3fr_0.9fr] lg:px-10 lg:py-10">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-teal-100/80">
            Patient workspace
          </p>
          <h1 className="max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
            Welcome back, {userName}. Your daily health overview is starting to take shape.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-teal-50/90 sm:text-base">
            This pass turns the patient dashboard into a working feature area with health summaries,
            weekly activity signals, and room to grow into alerts, wearables, and deeper insights.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              onClick={onAddMetric}
              className="bg-white text-teal-900 hover:bg-slate-100"
            >
              Add metric
            </Button>
            <Button
              variant="outline"
              onClick={onViewDetails}
              className="border-white/30 bg-white/10 text-white hover:bg-white/15"
            >
              View today&apos;s summary
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-sm text-teal-100/80">Today&apos;s focus</p>
            <p className="mt-2 text-2xl font-semibold">Hydration + blood pressure</p>
            <p className="mt-2 text-sm leading-6 text-teal-50/85">
              Track your essentials first before the dashboard expands into care plans and alerts.
            </p>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-sm text-teal-100/80">Recovery note</p>
            <p className="mt-2 text-lg font-semibold">Steady progress this week</p>
            <p className="mt-2 text-sm leading-6 text-teal-50/85">
              Your placeholder recovery summary can later be replaced with live trends and clinician notes.
            </p>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-sm text-teal-100/80">Next expansion</p>
            <p className="mt-2 text-lg font-semibold">Wearables, streaks, and messages</p>
            <p className="mt-2 text-sm leading-6 text-teal-50/85">
              This dashboard is now ready for future commits to plug in richer patient tools.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PatientHero;
