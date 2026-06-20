import React from "react";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Button, Input, Select } from "./ui";

export function PeriodSelector({ period, onChange, compact = false }) {
  const monthValue = `${period.year}-${String(period.month).padStart(2, "0")}`;

  function update(values) {
    onChange({ ...period, ...values });
  }

  function setMonthFromInput(value) {
    if (!value) return;
    const [year, month] = value.split("-").map(Number);
    update({
      periodType: "MONTH",
      year,
      month,
      startDate: `${year}-${String(month).padStart(2, "0")}-01`,
      endDate: lastDayOfMonth(year, month),
    });
  }

  function moveMonth(delta) {
    const date = new Date(period.year, period.month - 1 + delta, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    update({
      periodType: "MONTH",
      year,
      month,
      startDate: `${year}-${String(month).padStart(2, "0")}-01`,
      endDate: lastDayOfMonth(year, month),
    });
  }

  function resetCurrentMonth() {
    onChange(defaultMonthPeriod());
  }

  return (
    <div className={`grid gap-3 rounded-2xl border border-border bg-white p-4 ${compact ? "" : "md:grid-cols-[180px_1fr]"}`}>
      <Select
        label="Period"
        value={period.periodType}
        onChange={(event) => updatePeriodType(event.target.value, onChange)}
      >
        <option value="MONTH">Month</option>
        <option value="WEEK">Week</option>
        <option value="DAY">Day</option>
        <option value="CUSTOM_RANGE">Custom range</option>
      </Select>

      {period.periodType === "MONTH" && (
        <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto_auto]">
          <Button type="button" variant="secondary" className="h-11 px-3" onClick={() => moveMonth(-1)} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Input label="Month" type="month" value={monthValue} onChange={(event) => setMonthFromInput(event.target.value)} />
          <Button type="button" variant="secondary" className="h-11 px-3" onClick={() => moveMonth(1)} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" className="h-11 px-3" onClick={resetCurrentMonth}>
            <RotateCcw className="h-4 w-4" />
            Current
          </Button>
        </div>
      )}

      {period.periodType === "WEEK" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Week start" type="date" value={period.startDate} onChange={(event) => update({ startDate: event.target.value })} />
          <Input label="Week end" type="date" value={period.endDate} onChange={(event) => update({ endDate: event.target.value })} />
        </div>
      )}

      {period.periodType === "DAY" && (
        <Input label="Date" type="date" value={period.date ?? period.startDate} onChange={(event) => update({ date: event.target.value, startDate: event.target.value, endDate: event.target.value })} />
      )}

      {period.periodType === "CUSTOM_RANGE" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Start date" type="date" value={period.startDate} onChange={(event) => update({ startDate: event.target.value })} />
          <Input label="End date" type="date" value={period.endDate} onChange={(event) => update({ endDate: event.target.value })} />
        </div>
      )}
    </div>
  );
}

export function defaultMonthPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return {
    periodType: "MONTH",
    year,
    month,
    startDate: `${year}-${String(month).padStart(2, "0")}-01`,
    endDate: lastDayOfMonth(year, month),
    date: todayString(),
  };
}

function updatePeriodType(periodType, onChange) {
  const today = new Date();
  const date = todayString();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  if (periodType === "MONTH") {
    onChange(defaultMonthPeriod());
    return;
  }
  if (periodType === "DAY") {
    onChange({ periodType, year, month, startDate: date, endDate: date, date });
    return;
  }
  if (periodType === "WEEK") {
    const monday = new Date(today);
    const day = monday.getDay() || 7;
    monday.setDate(monday.getDate() - day + 1);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    onChange({ periodType, year: monday.getFullYear(), month: monday.getMonth() + 1, startDate: toDateString(monday), endDate: toDateString(sunday), date });
    return;
  }
  onChange({ periodType, year, month, startDate: `${year}-${String(month).padStart(2, "0")}-01`, endDate: lastDayOfMonth(year, month), date });
}

function lastDayOfMonth(year, month) {
  return toDateString(new Date(year, month, 0));
}

function todayString() {
  return toDateString(new Date());
}

function toDateString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
