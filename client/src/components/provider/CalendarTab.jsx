import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
  getMinutes,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AppointmentDetailModal from "./AppointmentDetailModal";
import { appointmentsAPI } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7AM - 7PM
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TYPE_COLORS = {
  consultation: "bg-blue-500",
  "follow-up": "bg-emerald-500",
  emergency: "bg-red-500",
  "routine-checkup": "bg-slate-400",
};

const TYPE_BG = {
  consultation: "bg-blue-100 border-blue-300 text-blue-800",
  "follow-up": "bg-emerald-100 border-emerald-300 text-emerald-800",
  emergency: "bg-red-100 border-red-300 text-red-800",
  "routine-checkup": "bg-slate-100 border-slate-300 text-slate-700",
};

const STATUS_OPACITY = {
  cancelled: "opacity-40",
  "no-show": "opacity-50",
};

const CalendarTab = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month");
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const dateRange = useMemo(() => {
    if (viewMode === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      return {
        startDate: startOfWeek(monthStart),
        endDate: endOfWeek(monthEnd),
      };
    } else if (viewMode === "week") {
      return {
        startDate: startOfWeek(currentDate),
        endDate: endOfWeek(currentDate),
      };
    } else {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);
      return { startDate: dayStart, endDate: dayEnd };
    }
  }, [currentDate, viewMode]);

  const { data: appointments } = useQuery({
    queryKey: [
      "calendarAppointments",
      user?._id,
      dateRange.startDate.toISOString(),
      dateRange.endDate.toISOString(),
    ],
    queryFn: async () => {
      const response = await appointmentsAPI.getAll({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
      });
      return response.data.data;
    },
  });

  const appointmentsByDate = useMemo(() => {
    const map = {};
    (appointments || []).forEach((appt) => {
      const key = format(new Date(appt.scheduledAt), "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(appt);
    });
    return map;
  }, [appointments]);

  const navigate = (direction) => {
    if (viewMode === "month")
      setCurrentDate(addMonths(currentDate, direction));
    else if (viewMode === "week")
      setCurrentDate(addWeeks(currentDate, direction));
    else setCurrentDate(addDays(currentDate, direction));
  };

  const goToToday = () => setCurrentDate(new Date());

  const getDateLabel = () => {
    if (viewMode === "month") return format(currentDate, "MMMM yyyy");
    if (viewMode === "week") {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
    }
    return format(currentDate, "EEEE, MMMM d, yyyy");
  };

  return (
    <div>
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h3 className="text-xl font-semibold text-foreground ml-2">
            {getDateLabel()}
          </h3>
        </div>
        <Select value={viewMode} onValueChange={setViewMode}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="day">Day</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Calendar Views */}
      <Card>
        <CardContent className="p-0">
          {viewMode === "month" && (
            <MonthView
              currentDate={currentDate}
              appointmentsByDate={appointmentsByDate}
              onSelectDay={(date) => {
                setCurrentDate(date);
                setViewMode("day");
              }}
              onSelectAppointment={setSelectedAppointment}
            />
          )}
          {viewMode === "week" && (
            <WeekView
              currentDate={currentDate}
              appointmentsByDate={appointmentsByDate}
              onSelectAppointment={setSelectedAppointment}
            />
          )}
          {viewMode === "day" && (
            <DayView
              currentDate={currentDate}
              appointments={
                appointmentsByDate[format(currentDate, "yyyy-MM-dd")] || []
              }
              onSelectAppointment={setSelectedAppointment}
            />
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={cn("w-3 h-3 rounded-full", color)} />
            <span className="capitalize">{type.replace("-", " ")}</span>
          </div>
        ))}
      </div>

      {/* Appointment Detail Modal */}
      <AppointmentDetailModal
        appointment={selectedAppointment}
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
      />
    </div>
  );
};

/* ──────────── Month View ──────────── */

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
      {/* Day Headers */}
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

      {/* Day Cells */}
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
                    {appt.patientId?.profile?.lastName || "Patient"}
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

/* ──────────── Week View ──────────── */

const WeekView = ({ currentDate, appointmentsByDate, onSelectAppointment }) => {
  const weekStart = startOfWeek(currentDate);
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(currentDate),
  });

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Day Headers */}
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

        {/* Time Grid */}
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
                      {appt.patientId?.profile?.lastName}
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

/* ──────────── Day View ──────────── */

const DayView = ({ currentDate, appointments, onSelectAppointment }) => {
  const sortedAppts = [...appointments].sort(
    (a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt),
  );

  const apptsByHour = {};
  sortedAppts.forEach((appt) => {
    const hour = getHours(new Date(appt.scheduledAt));
    if (!apptsByHour[hour]) apptsByHour[hour] = [];
    apptsByHour[hour].push(appt);
  });

  return (
    <div>
      {/* Day Header */}
      <div className={cn("p-4 border-b border-border text-center", isToday(currentDate) && "bg-primary/10")}>
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

      {/* Hourly Slots */}
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
                        {appt.duration}min
                      </span>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          appt.status === "cancelled"
                            ? "bg-red-200 text-red-800"
                            : appt.status === "completed"
                              ? "bg-gray-200 text-gray-700"
                              : "bg-white/60 text-current",
                        )}
                      >
                        {appt.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold">
                        {appt.patientId?.profile?.firstName?.[0]}
                        {appt.patientId?.profile?.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {appt.patientId?.profile?.firstName}{" "}
                          {appt.patientId?.profile?.lastName}
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

export default CalendarTab;
