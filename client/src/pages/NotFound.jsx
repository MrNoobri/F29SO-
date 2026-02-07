import React from "react";
import { Link } from "react-router";
import { Button } from "../components/ui/button";

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          Virtual Health Companion
        </p>
        <h1 className="text-6xl font-bold tracking-tight text-slate-900 sm:text-7xl">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-slate-900">Page not found</h2>
        <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
          This route has not been built yet in the current project stage. Return home or open one of the dashboard starter pages.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to="/">Back home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/patient">Patient dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
