import React from "react";
import { DatePicker } from "@ark-ui/react/date-picker";
import { Portal } from "@ark-ui/react/portal";
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";

export const DatePickerInput = ({
  label = "Select Date",
  controlClassName,
  ...rootProps
}) => {
  return (
    <DatePicker.Root {...rootProps}>
      {label && (
        <DatePicker.Label className="block mb-2 text-sm font-medium text-foreground">
          {label}
        </DatePicker.Label>
      )}

      {/* Input + Controls */}
      <DatePicker.Control
        className={`flex items-center gap-2 rounded-xl border px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/50 transition-all ${controlClassName || "border-border bg-card"}`}
      >
        <DatePicker.Input
          className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
          placeholder="Pick a date"
        />
        <DatePicker.Trigger className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <Calendar size={18} />
        </DatePicker.Trigger>
        <DatePicker.ClearTrigger className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
          <X size={16} />
        </DatePicker.ClearTrigger>
      </DatePicker.Control>

      {/* Calendar Popup */}
      <Portal>
        <DatePicker.Positioner>
          <DatePicker.Content className="mt-2 w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl shadow-black/30 p-4 z-[100] ring-1 ring-primary/10">
            {/* Year + Month Select */}
            <div className="flex gap-2 mb-3">
              <DatePicker.YearSelect
                className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground cursor-pointer
                  focus:outline-hidden focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors
                  [&>option]:bg-card [&>option]:text-foreground"
              />
              <DatePicker.MonthSelect
                className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground cursor-pointer
                  focus:outline-hidden focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors
                  [&>option]:bg-card [&>option]:text-foreground"
              />
            </div>

            {/* Day View */}
            <DatePicker.View view="day">
              <DatePicker.Context>
                {(datePicker) => (
                  <>
                    <DatePicker.ViewControl className="flex justify-between items-center mb-3 text-sm font-semibold text-foreground">
                      <DatePicker.PrevTrigger className="p-1.5 rounded-lg hover:bg-primary/15 text-muted-foreground hover:text-primary transition-colors">
                        <ChevronLeft size={18} />
                      </DatePicker.PrevTrigger>
                      <DatePicker.ViewTrigger className="cursor-pointer px-3 py-1 rounded-lg hover:bg-primary/15 hover:text-primary transition-colors">
                        <DatePicker.RangeText />
                      </DatePicker.ViewTrigger>
                      <DatePicker.NextTrigger className="p-1.5 rounded-lg hover:bg-primary/15 text-muted-foreground hover:text-primary transition-colors">
                        <ChevronRight size={18} />
                      </DatePicker.NextTrigger>
                    </DatePicker.ViewControl>

                    <DatePicker.Table className="w-full text-center text-sm">
                      <DatePicker.TableHead>
                        <DatePicker.TableRow>
                          {datePicker.weekDays.map((weekDay, id) => (
                            <DatePicker.TableHeader
                              key={id}
                              className="py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider"
                            >
                              {weekDay.short}
                            </DatePicker.TableHeader>
                          ))}
                        </DatePicker.TableRow>
                      </DatePicker.TableHead>
                      <DatePicker.TableBody>
                        {datePicker.weeks.map((week, id) => (
                          <DatePicker.TableRow key={id}>
                            {week.map((day, id) => (
                              <DatePicker.TableCell key={id} value={day}>
                                <DatePicker.TableCellTrigger
                                  className="w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium
                                    text-foreground
                                    hover:bg-primary/15 hover:text-primary
                                    data-[today]:ring-1 data-[today]:ring-primary/40 data-[today]:font-bold
                                    data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:shadow-md data-[selected]:shadow-primary/25
                                    data-[outside-range]:text-muted-foreground/30 data-[outside-range]:pointer-events-none
                                    data-[disabled]:text-muted-foreground/30 data-[disabled]:pointer-events-none
                                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
                                    transition-all duration-150"
                                >
                                  {day.day}
                                </DatePicker.TableCellTrigger>
                              </DatePicker.TableCell>
                            ))}
                          </DatePicker.TableRow>
                        ))}
                      </DatePicker.TableBody>
                    </DatePicker.Table>
                  </>
                )}
              </DatePicker.Context>
            </DatePicker.View>

            {/* Month View */}
            <DatePicker.View view="month">
              <DatePicker.Context>
                {(datePicker) => (
                  <>
                    <DatePicker.ViewControl className="flex justify-between items-center mb-3">
                      <DatePicker.PrevTrigger className="p-1.5 rounded-lg hover:bg-primary/15 text-muted-foreground hover:text-primary transition-colors">
                        <ChevronLeft size={18} />
                      </DatePicker.PrevTrigger>
                      <DatePicker.ViewTrigger className="cursor-pointer px-3 py-1 rounded-lg font-semibold text-foreground hover:bg-primary/15 hover:text-primary transition-colors">
                        <DatePicker.RangeText />
                      </DatePicker.ViewTrigger>
                      <DatePicker.NextTrigger className="p-1.5 rounded-lg hover:bg-primary/15 text-muted-foreground hover:text-primary transition-colors">
                        <ChevronRight size={18} />
                      </DatePicker.NextTrigger>
                    </DatePicker.ViewControl>
                    <DatePicker.Table className="w-full text-sm">
                      <DatePicker.TableBody>
                        {datePicker
                          .getMonthsGrid({ columns: 4, format: "short" })
                          .map((months, id) => (
                            <DatePicker.TableRow key={id}>
                              {months.map((month, id) => (
                                <DatePicker.TableCell
                                  key={id}
                                  value={month.value}
                                >
                                  <DatePicker.TableCellTrigger
                                    className="px-3 py-2 rounded-lg text-foreground font-medium
                                      hover:bg-primary/15 hover:text-primary
                                      data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:shadow-md data-[selected]:shadow-primary/25
                                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
                                      transition-all duration-150"
                                  >
                                    {month.label}
                                  </DatePicker.TableCellTrigger>
                                </DatePicker.TableCell>
                              ))}
                            </DatePicker.TableRow>
                          ))}
                      </DatePicker.TableBody>
                    </DatePicker.Table>
                  </>
                )}
              </DatePicker.Context>
            </DatePicker.View>

            {/* Year View */}
            <DatePicker.View view="year">
              <DatePicker.Context>
                {(datePicker) => (
                  <>
                    <DatePicker.ViewControl className="flex justify-between items-center mb-3">
                      <DatePicker.PrevTrigger className="p-1.5 rounded-lg hover:bg-primary/15 text-muted-foreground hover:text-primary transition-colors">
                        <ChevronLeft size={18} />
                      </DatePicker.PrevTrigger>
                      <DatePicker.ViewTrigger className="cursor-pointer px-3 py-1 rounded-lg font-semibold text-foreground hover:bg-primary/15 hover:text-primary transition-colors">
                        <DatePicker.RangeText />
                      </DatePicker.ViewTrigger>
                      <DatePicker.NextTrigger className="p-1.5 rounded-lg hover:bg-primary/15 text-muted-foreground hover:text-primary transition-colors">
                        <ChevronRight size={18} />
                      </DatePicker.NextTrigger>
                    </DatePicker.ViewControl>
                    <DatePicker.Table className="w-full text-sm">
                      <DatePicker.TableBody>
                        {datePicker
                          .getYearsGrid({ columns: 4 })
                          .map((years, id) => (
                            <DatePicker.TableRow key={id}>
                              {years.map((year, id) => (
                                <DatePicker.TableCell
                                  key={id}
                                  value={year.value}
                                >
                                  <DatePicker.TableCellTrigger
                                    className="px-3 py-2 rounded-lg text-foreground font-medium
                                    hover:bg-primary/15 hover:text-primary
                                    data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:shadow-md data-[selected]:shadow-primary/25
                                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
                                    transition-all duration-150"
                                  >
                                    {year.label}
                                  </DatePicker.TableCellTrigger>
                                </DatePicker.TableCell>
                              ))}
                            </DatePicker.TableRow>
                          ))}
                      </DatePicker.TableBody>
                    </DatePicker.Table>
                  </>
                )}
              </DatePicker.Context>
            </DatePicker.View>
          </DatePicker.Content>
        </DatePicker.Positioner>
      </Portal>
    </DatePicker.Root>
  );
};
