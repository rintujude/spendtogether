import React from "react";
import {
  ActiveFilterChips,
  countActiveTransactionFilters,
  defaultPresetPeriod,
  FilterButton,
  TransactionFilterDrawer,
} from "../components/filters";
import { Button, Badge, EmptyState, PageHeader, Table } from "../components/ui";
import { formatMoney } from "../lib/currencies";

export function ExpensesPage({
  expenses,
  currencyCode,
  filters,
  onFiltersChange,
  categories,
  paymentSources,
  members,
  onAddExpense,
}) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [draftFilters, setDraftFilters] = React.useState(filters);

  React.useEffect(() => {
    if (!drawerOpen) setDraftFilters(filters);
  }, [filters, drawerOpen]);

  function applyFilters() {
    onFiltersChange(draftFilters);
    setDrawerOpen(false);
  }

  function resetFilters() {
    const next = { ...defaultPresetPeriod, categoryId: "", paymentSourceId: "", memberId: "" };
    setDraftFilters(next);
    onFiltersChange(next);
    setDrawerOpen(false);
  }

  function removeChip(key) {
    const next = key === "periodPreset"
      ? { ...filters, ...defaultPresetPeriod }
      : { ...filters, [key]: "" };
    onFiltersChange(next);
  }

  return (
    <>
      <PageHeader
        eyebrow="Transactions"
        title="Expenses"
        description="Review manually entered expenses for the selected period. All amounts are recorded in the workspace base currency."
        actions={
          <div className="flex items-center gap-3">
            <Badge>{currencyCode}</Badge>
            <Button type="button" onClick={onAddExpense}>Add expense</Button>
            <FilterButton activeCount={countActiveTransactionFilters(filters)} onClick={() => setDrawerOpen(true)} />
          </div>
        }
      />
      <ActiveFilterChips filters={filters} categories={categories} paymentSources={paymentSources} members={members} onRemove={removeChip} />
      <TransactionFilterDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        draftFilters={draftFilters}
        onDraftChange={setDraftFilters}
        onApply={applyFilters}
        onReset={resetFilters}
        categories={categories}
        paymentSources={paymentSources}
        members={members}
      />
      {expenses.length === 0 ? (
        <EmptyState
          title="No expenses for this period in SpendTogether"
          description="Adjust the filters or add a category, payment source, and expense."
          action={<Button type="button" onClick={onAddExpense}>Add expense</Button>}
        />
      ) : (
        <Table
          minWidth="520px"
          columns={[
            { key: "expenseDate", header: "Date", width: "92px" },
            { key: "categoryName", header: "Category", width: "112px" },
            { key: "paymentSourceName", header: "Source", width: "136px" },
            { key: "description", header: "Description", wrap: true, render: (row) => row.description || "No description" },
            { key: "amount", header: "Amount", width: "104px", render: (row) => formatMoney(row.amount, currencyCode) },
          ]}
          rows={expenses}
          getKey={(row) => row.id}
        />
      )}
    </>
  );
}
