import React from "react";
import { Card, CardContent } from "../ui/card";

export default function FitMetricTile({ title, value, unit, caption }) {
  return (
    <Card className="rounded-3xl border-slate-200">
      <CardContent className="p-5">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className="mt-3 flex items-end gap-2">
          <p className="text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
          <p className="pb-1 text-sm text-slate-500">{unit}</p>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">{caption}</p>
      </CardContent>
    </Card>
  );
}
