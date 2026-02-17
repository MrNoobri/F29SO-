import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";

function WeeklyBarChart({ data = [] }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>Weekly activity snapshot</CardTitle>
        <CardDescription>
          A lightweight bar chart preview before richer analytics and charting are added later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-64 items-end justify-between gap-3 rounded-3xl bg-slate-50 p-4">
          {data.map((item) => {
            const height = `${Math.max((item.value / maxValue) * 100, 12)}%`;
            return (
              <div key={item.label} className="flex h-full flex-1 flex-col items-center justify-end gap-3">
                <div className="text-xs font-medium text-slate-500">{item.value}</div>
                <div className="flex h-full w-full items-end justify-center">
                  <div
                    className="w-full rounded-t-2xl bg-gradient-to-t from-teal-600 to-emerald-400"
                    style={{ height }}
                  />
                </div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default WeeklyBarChart;
