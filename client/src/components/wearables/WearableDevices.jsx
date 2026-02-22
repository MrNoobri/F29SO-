import React from "react";
import { Watch, HeartPulse, Smartphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

const deviceCards = [
  {
    name: "Google Fit",
    status: "Ready for connection",
    description: "First wearable source supported in this stage of the dashboard.",
    icon: HeartPulse,
  },
  {
    name: "Smart watch",
    status: "Planned",
    description: "Placeholder slot for richer wearable device support later on.",
    icon: Watch,
  },
  {
    name: "Phone activity",
    status: "Planned",
    description: "Room for passive movement and step syncing from a mobile device.",
    icon: Smartphone,
  },
];

export default function WearableDevices() {
  return (
    <Card className="rounded-[1.75rem]">
      <CardHeader>
        <CardTitle>Wearable devices</CardTitle>
        <CardDescription>
          Early overview of connected and planned sources for passive health tracking.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        {deviceCards.map((device) => {
          const Icon = device.icon;
          return (
            <div key={device.name} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-base font-semibold text-slate-900">{device.name}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
                {device.status}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{device.description}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
