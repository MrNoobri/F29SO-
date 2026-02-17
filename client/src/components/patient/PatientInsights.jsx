import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";

function PatientInsights({ insights = [] }) {
  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>Patient insights</CardTitle>
        <CardDescription>
          Early insight cards that can later be replaced by AI summaries, threshold alerts, and care recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, index) => (
          <div
            key={`${insight.title}-${index}`}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-slate-900">{insight.title}</p>
              <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                {insight.tag}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{insight.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default PatientInsights;
