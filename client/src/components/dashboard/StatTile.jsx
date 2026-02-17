import React from "react";
import { Card, CardContent } from "../ui/card";
import { cn } from "../../lib/utils";

function StatTile({ title, value, subtext, icon: Icon, className, valueClassName }) {
  return (
    <Card className={cn("h-full rounded-3xl", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className={cn("mt-2 text-3xl font-semibold tracking-tight text-slate-900", valueClassName)}>
              {value}
            </p>
            {subtext ? <p className="mt-2 text-sm leading-6 text-slate-600">{subtext}</p> : null}
          </div>

          {Icon ? (
            <div className="rounded-2xl bg-teal-50 p-3 text-teal-700">
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default StatTile;
