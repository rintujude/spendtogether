import React from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Badge, Button, Input, Select, Sheet } from "./ui";

export const defaultPresetPeriod = { periodPreset: "THIS_MONTH", startDate: "", endDate: "" };

export function periodLabel(period) {
  if (period.periodPreset === "TODAY") return "Today";
  if (period.periodPreset === "THIS_WEEK") return "This week";
  if (period.periodPreset === "THIS_MONTH") return "This month";
  if (period.periodPreset === "LAST_MONTH") return "Last month";
  if (period.periodPreset === "CUSTOM") return `${period.startDate || "Start"} - ${period.endDate || "End"}`;
  return "This month";
}

export function periodQuery(period) {
  const params = new URLSearchParams({ periodPreset: period.periodPreset || "THIS_MONTH" });
  if (period.periodPreset === "CUSTOM") {
    if (period.startDate) params.set("startDate", period.startDate);
    if (period.endDate) params.set("endDate", period.endDate);
  }
  return params;
}

export function FilterButton({ activeCount = 0, onClick }) {
  return (
    <Button type="button" variant="secondary" className="relative h-11 w-11 px-0" onClick={onClick} aria-label="Open filters">
      <SlidersHorizontal className="h-4 w-4" />
      {activeCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
          {activeCount}
        </span>
      )}
    </Button>
  );
}

export function DateRangePicker({ value, onChange }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Input label="Start date" type="date" value={value.startDate || ""} onChange={(event) => onChange({ ...value, startDate: event.target.value })} />
      <Input label="End date" type="date" value={value.endDate || ""} onChange={(event) => onChange({ ...value, endDate: event.target.value })} />
    </div>
  );
}

export function CardPeriodFilter({ value, onChange }) {
  return (
    <div className="grid gap-2 sm:min-w-44">
      <Select label="" value={value.periodPreset} onChange={(event) => onChange({ ...value, periodPreset: event.target.value })}>
        <option value="THIS_MONTH">This month</option>
        <option value="THIS_WEEK">This week</option>
        <option value="TODAY">Today</option>
        <option value="CUSTOM">Custom range</option>
      </Select>
      {value.periodPreset === "CUSTOM" && (
        <DateRangePicker value={value} onChange={onChange} />
      )}
    </div>
  );
}

export function ActiveFilterChips({ filters, categories, paymentSources, members, onRemove }) {
  const chips = buildFilterChips(filters, categories, paymentSources, members);
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          className="inline-flex h-8 items-center gap-2 rounded-full border border-border bg-white px-3 text-xs font-semibold text-foreground shadow-sm"
          onClick={() => onRemove(chip.key)}
        >
          {chip.label}
          <X className="h-3 w-3 text-muted" />
        </button>
      ))}
    </div>
  );
}

export function TransactionFilterDrawer({
  open,
  onOpenChange,
  draftFilters,
  onDraftChange,
  onApply,
  onReset,
  categories,
  paymentSources,
  members,
}) {
  return (
    <Sheet title="Filters" open={open} onOpenChange={onOpenChange} side="right">
      <div className="grid gap-5">
        <Select label="Date" value={draftFilters.periodPreset} onChange={(event) => onDraftChange({ ...draftFilters, periodPreset: event.target.value })}>
          <option value="TODAY">Today</option>
          <option value="THIS_WEEK">This week</option>
          <option value="THIS_MONTH">This month</option>
          <option value="LAST_MONTH">Last month</option>
          <option value="CUSTOM">Custom range</option>
        </Select>
        {draftFilters.periodPreset === "CUSTOM" && <DateRangePicker value={draftFilters} onChange={onDraftChange} />}
        <Select label="Category" value={draftFilters.categoryId} onChange={(event) => onDraftChange({ ...draftFilters, categoryId: event.target.value })}>
          <option value="">All categories</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </Select>
        <Select label="Payment source" value={draftFilters.paymentSourceId} onChange={(event) => onDraftChange({ ...draftFilters, paymentSourceId: event.target.value })}>
          <option value="">All payment sources</option>
          {paymentSources.map((source) => <option key={source.id} value={source.id}>{source.name}</option>)}
        </Select>
        <Select label="Member" value={draftFilters.memberId} onChange={(event) => onDraftChange({ ...draftFilters, memberId: event.target.value })}>
          <option value="">All members</option>
          {members.map((member) => <option key={member.userId} value={member.userId}>{member.fullName}</option>)}
        </Select>
        <div className="mt-2 grid gap-3">
          <Button type="button" onClick={onApply}>Apply Filters</Button>
          <Button type="button" variant="secondary" onClick={onReset}>Reset</Button>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </div>
    </Sheet>
  );
}

export function countActiveTransactionFilters(filters) {
  let count = filters.periodPreset && filters.periodPreset !== "THIS_MONTH" ? 1 : 0;
  if (filters.categoryId) count += 1;
  if (filters.paymentSourceId) count += 1;
  if (filters.memberId) count += 1;
  return count;
}

function buildFilterChips(filters, categories, paymentSources, members) {
  const chips = [{ key: "periodPreset", label: periodLabel(filters) }];
  const category = categories.find((item) => item.id === filters.categoryId);
  const source = paymentSources.find((item) => item.id === filters.paymentSourceId);
  const member = members.find((item) => item.userId === filters.memberId);
  if (category) chips.push({ key: "categoryId", label: category.name });
  if (source) chips.push({ key: "paymentSourceId", label: source.name });
  if (member) chips.push({ key: "memberId", label: member.fullName });
  return chips;
}
