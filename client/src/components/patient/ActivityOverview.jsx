import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";

function ActivityOverview({ items = [] }) {
  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>Daily activity overview</CardTitle>
        <CardDescription>
          A simple timeline-style panel that can later connect to wearables, medication reminders,
          and appointment events.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, index) => (
          <div key={`${item.title}-${index}`} className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-teal-700 shadow-sm">
              {item.time}
            </div>
            <div>
              <p className="font-medium text-slate-900">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default ActivityOverview;
