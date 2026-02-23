import React, { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import MetricRing from "../dashboard/MetricRing";
import { Card, CardContent } from "../ui/card";

function MetricRingCard({ title, value = 0, target = 1, unit, icon: Icon, detailContent }) {
  const [expanded, setExpanded] = useState(false);

  const progress = useMemo(() => {
    if (!target) return 0;
    return Math.max(0, Math.min(value / target, 1));
  }, [target, value]);

  return (
    <Card className="rounded-[24px]">
      <button type="button" onClick={() => setExpanded((current) => !current)} className="w-full text-left">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <MetricRing progress={progress} size={92} strokeWidth={8} ringColor="#0284c7">
              <div>
                <p className="text-lg font-semibold text-slate-900">{value}</p>
                <p className="text-[11px] uppercase tracking-wide text-slate-500">{target}</p>
              </div>
            </MetricRing>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {Icon ? <Icon className="h-4 w-4 text-sky-700" /> : null}
                <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
              </div>
              {unit ? <p className="mt-1 text-sm text-slate-500">{unit}</p> : null}
            </div>

            {detailContent ? <ChevronDown className={`h-4 w-4 text-slate-400 transition ${expanded ? "rotate-180" : ""}`} /> : null}
          </div>
        </CardContent>
      </button>

      {expanded && detailContent ? (
        <div className="border-t border-slate-100 px-5 pb-5 pt-2">{detailContent}</div>
      ) : null}
    </Card>
  );
}

export default MetricRingCard;
