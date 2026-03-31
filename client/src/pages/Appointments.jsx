import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  addWeeks,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
  getHours,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  User,
  FileText,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useTheme } from "../context/ThemeContext";
import DashboardDock from "../components/patient/DashboardDock";
import AppointmentsCalendar from "../components/appointments/AppointmentsCalendar";
import { appointmentsAPI, authAPI } from "../api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/* ─── Constants ─── */
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7AM-7PM
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TYPE_BG = {
  consultation: "bg-blue-100 border-blue-300 text-blue-800",
  "follow-up": "bg-emerald-100 border-emerald-300 text-emerald-800",
  emergency: "bg-red-100 border-red-300 text-red-800",
  "routine-checkup": "bg-slate-100 border-slate-300 text-slate-700",
};

const TYPE_COLORS = {
  consultation: "bg-blue-500",
  "follow-up": "bg-emerald-500",
  emergency: "bg-red-500",
  "routine-checkup": "bg-slate-400",
};

const STATUS_OPACITY = {
  cancelled: "opacity-40",
  "no-show": "opacity-50",
};

const STATUS_COLORS = {
  scheduled: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  "in-progress": "bg-yellow-100 text-yellow-800",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-800",
  "no-show": "bg-orange-100 text-orange-800",
};

/* ─── Appointment Detail Modal (for patients) ─── */
const AppointmentModal = ({
  appointment,
  isOpen,
  onClose,
  onCancel,
  isCancelling,
}) => {
  if (!isOpen || !appointment) return null;

  const provider = appointment.providerId;
  const isCancelable =
    appointment.status === "scheduled" || appointment.status === "confirmed";

  return (
    <div className="fixed inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-foreground">
              Appointment Details
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
              <CalendarDays className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Date & Time</p>
                <p className="font-medium text-foreground">
                  {format(
                    new Date(appointment.scheduledAt),
                    "EEEE, MMMM d, yyyy · h:mm a",
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
              <Clock className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium text-foreground">
                  {appointment.duration || 30} minutes
                </p>
              </div>
            </div>

            {provider && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                <User className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Provider</p>
                  <p className="font-medium text-foreground">
                    Dr. {provider.profile?.firstName}{" "}
                    {provider.profile?.lastName}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
              <FileText className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Reason</p>
                <p className="font-medium text-foreground">
                  {appointment.reason || "General consultation"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold capitalize",
                  STATUS_COLORS[appointment.status] || STATUS_COLORS.scheduled,
                )}
              >
                {appointment.status}
              </span>
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold capitalize",
                  TYPE_BG[appointment.type]
                    ?.replace("border-", "")
                    .split(" ")
                    .filter((c) => !c.startsWith("border"))
                    .join(" ") || "bg-muted text-foreground",
                )}
              >
                {appointment.type?.replace("-", " ")}
              </span>
            </div>

            {appointment.providerNotes && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-sm font-medium text-primary mb-1">
                  Provider Notes
                </p>
                <p className="text-sm text-foreground/80">
                  {appointment.providerNotes}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            {isCancelable && (
              <Button
                variant="destructive"
                onClick={() => onCancel(appointment._id)}
                disabled={isCancelling}
                className="flex-1"
              >
                {isCancelling ? "Cancelling..." : "Cancel Appointment"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Month View ─── */
const MonthView = ({
  currentDate,
  appointmentsByDate,
  onSelectDay,
  onSelectAppointment,
}) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-border">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="p-2 text-center text-xs font-semibold text-muted-foreground uppercase"
          >
            {name}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayAppts = appointmentsByDate[key] || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={key}
              onClick={() => onSelectDay(day)}
              className={cn(
                "min-h-[100px] border-b border-r border-border p-1.5 cursor-pointer transition-colors hover:bg-secondary/30",
                !isCurrentMonth && "bg-muted/30",
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                    isCurrentDay && "bg-primary text-primary-foreground",
                    !isCurrentMonth && "text-muted-foreground/50",
                    isCurrentMonth && !isCurrentDay && "text-foreground",
                  )}
                >
                  {format(day, "d")}
                </span>
                {dayAppts.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {dayAppts.length}
                  </span>
                )}
              </div>
              <div className="space-y-0.5">
                {dayAppts.slice(0, 3).map((appt) => (
                  <div
                    key={appt._id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAppointment(appt);
                    }}
                    className={cn(
                      "text-xs px-1.5 py-0.5 rounded truncate cursor-pointer border",
                      TYPE_BG[appt.type] || TYPE_BG.consultation,
                      STATUS_OPACITY[appt.status],
                    )}
                  >
                    {format(new Date(appt.scheduledAt), "h:mm a")}{" "}
                    {appt.providerId?.profile?.lastName
                      ? `Dr. ${appt.providerId.profile.lastName}`
                      : "Appointment"}
                  </div>
                ))}
                {dayAppts.length > 3 && (
                  <div className="text-xs text-muted-foreground pl-1">
                    +{dayAppts.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Week View ─── */
const WeekView = ({ currentDate, appointmentsByDate, onSelectAppointment }) => {
  const weekStart = startOfWeek(currentDate);
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(currentDate),
  });

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
          <div className="p-2" />
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                "p-2 text-center border-l border-border",
                isToday(day) && "bg-primary/10",
              )}
            >
              <div className="text-xs font-semibold text-muted-foreground uppercase">
                {format(day, "EEE")}
              </div>
              <div
                className={cn(
                  "text-lg font-bold mt-0.5",
                  isToday(day) ? "text-primary" : "text-foreground",
                )}
              >
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border"
          >
            <div className="p-1 text-xs text-muted-foreground text-right pr-2 py-2">
              {hour === 12
                ? "12 PM"
                : hour > 12
                  ? `${hour - 12} PM`
                  : `${hour} AM`}
            </div>
            {weekDays.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayAppts = (appointmentsByDate[key] || []).filter(
                (a) => getHours(new Date(a.scheduledAt)) === hour,
              );
              return (
                <div
                  key={`${key}-${hour}`}
                  className={cn(
                    "border-l border-border min-h-[48px] p-0.5 relative",
                    isToday(day) && "bg-primary/5",
                  )}
                >
                  {dayAppts.map((appt) => (
                    <div
                      key={appt._id}
                      onClick={() => onSelectAppointment(appt)}
                      className={cn(
                        "text-xs px-1.5 py-1 rounded border cursor-pointer mb-0.5 truncate",
                        TYPE_BG[appt.type] || TYPE_BG.consultation,
                        STATUS_OPACITY[appt.status],
                      )}
                    >
                      <span className="font-medium">
                        {format(new Date(appt.scheduledAt), "h:mm")}
                      </span>{" "}
                      {appt.providerId?.profile?.lastName
                        ? `Dr. ${appt.providerId.profile.lastName}`
                        : ""}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Day View ─── */
const DayView = ({ currentDate, appointments, onSelectAppointment }) => {
  const sorted = [...appointments].sort(
    (a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt),
  );
  const apptsByHour = {};
  sorted.forEach((a) => {
    const h = getHours(new Date(a.scheduledAt));
    if (!apptsByHour[h]) apptsByHour[h] = [];
    apptsByHour[h].push(a);
  });

  return (
    <div>
      <div
        className={cn(
          "p-4 border-b border-border text-center",
          isToday(currentDate) && "bg-primary/10",
        )}
      >
        <div className="text-sm font-semibold text-muted-foreground uppercase">
          {format(currentDate, "EEEE")}
        </div>
        <div
          className={cn(
            "text-3xl font-bold",
            isToday(currentDate) ? "text-primary" : "text-foreground",
          )}
        >
          {format(currentDate, "d")}
        </div>
        <div className="text-sm text-muted-foreground">
          {appointments.length} appointment(s)
        </div>
      </div>
      <div>
        {HOURS.map((hour) => {
          const hourAppts = apptsByHour[hour] || [];
          return (
            <div
              key={hour}
              className="flex border-b border-border min-h-[60px]"
            >
              <div className="w-16 p-2 text-xs text-muted-foreground text-right pr-3 shrink-0 py-3">
                {hour === 12
                  ? "12 PM"
                  : hour > 12
                    ? `${hour - 12} PM`
                    : `${hour} AM`}
              </div>
              <div className="flex-1 border-l border-border p-1 space-y-1">
                {hourAppts.map((appt) => (
                  <div
                    key={appt._id}
                    onClick={() => onSelectAppointment(appt)}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                      TYPE_BG[appt.type] || TYPE_BG.consultation,
                      STATUS_OPACITY[appt.status],
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">
                        {format(new Date(appt.scheduledAt), "h:mm a")} -{" "}
                        {appt.duration || 30}min
                      </span>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          STATUS_COLORS[appt.status] ||
                            "bg-muted text-foreground",
                        )}
                      >
                        {appt.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold">
                        {appt.providerId?.profile?.firstName?.[0]}
                        {appt.providerId?.profile?.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Dr. {appt.providerId?.profile?.firstName}{" "}
                          {appt.providerId?.profile?.lastName}
                        </p>
                        <p className="text-xs opacity-75">{appt.reason}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════ Appointments Page ═══════════ */
const Appointments = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardDock
        activeTab="appointments"
        onTabChange={() => {}}
        role={user?.role || "patient"}
      />

      <div className="flex justify-center">
        <div className="w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 pb-28">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-foreground">Appointments</h2>
          </div>

          <AppointmentsCalendar />
        </div>
      </div>
    </div>
  );
};

export default Appointments;
