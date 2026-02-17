import React from "react";
import {
  Activity,
  CalendarDays,
  Home,
  MessageSquareMore,
  Moon,
  Sun,
  UserRound,
} from "lucide-react";
import { Dock, DockIcon, DockItem, DockLabel } from "../ui/dock";
import { useTheme } from "../../context/ThemeContext";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "appointments", label: "Appointments", icon: CalendarDays },
  { id: "messages", label: "Messages", icon: MessageSquareMore },
];

export default function DashboardDock({ activeTab, onTabChange, userName = "Patient" }) {
  const { theme, toggleTheme } = useTheme();
  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="fixed bottom-5 left-1/2 z-40 hidden -translate-x-1/2 md:block">
      <Dock>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <DockItem
              key={item.id}
              active={isActive}
              onClick={() => onTabChange(item.id)}
              aria-label={item.label}
            >
              <DockLabel>{item.label}</DockLabel>
              <DockIcon>
                <Icon className="h-5 w-5" />
              </DockIcon>
            </DockItem>
          );
        })}

        <div className="mx-1 h-8 w-px bg-slate-200" />

        <DockItem onClick={toggleTheme} aria-label="Toggle theme">
          <DockLabel>{theme === "dark" ? "Light mode" : "Dark mode"}</DockLabel>
          <DockIcon>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </DockIcon>
        </DockItem>

        <DockItem onClick={() => onTabChange("profile")} aria-label="Profile">
          <DockLabel>Profile</DockLabel>
          <DockIcon>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-800">
              {initials || <UserRound className="h-4 w-4" />}
            </div>
          </DockIcon>
        </DockItem>
      </Dock>
    </div>
  );
}
