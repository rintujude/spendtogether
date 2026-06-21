import React from "react";
import { CalendarDays, CreditCard, Plus, ReceiptText, UserRound } from "lucide-react";
import {
  ActiveFilterChips,
  countActiveTransactionFilters,
  defaultPresetPeriod,
  FilterButton,
  TransactionFilterDrawer,
} from "../components/filters";
import { Button, Badge, Card, CardDescription, CardHeader, CardTitle, EmptyState, PageHeader, Table } from "../components/ui";
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

  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0);
  const latestExpense = expenses[0];
  const activeFilterCount = countActiveTransactionFilters(filters);

  return (
    <>
      <PageHeader
        eyebrow="Transactions"
        title="Transactions"
        description="Track and review workspace spending for the selected period."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Badge>{currencyCode}</Badge>
            <Button type="button" onClick={onAddExpense}>
              <Plus className="h-4 w-4" />
              Add Transaction
            </Button>
            <FilterButton activeCount={countActiveTransactionFilters(filters)} onClick={() => setDrawerOpen(true)} />
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        <TransactionMetric className="col-span-2 md:col-span-1" title="Total spent" value={formatMoney(totalSpent, currencyCode)} description="Across current filters" icon={ReceiptText} />
        <TransactionMetric title="Transactions" value={expenses.length.toString()} description={activeFilterCount > 0 ? `${activeFilterCount} active filters` : "Default period view"} icon={CalendarDays} />
        <TransactionMetric
          title="Latest"
          value={latestExpense ? formatMoney(latestExpense.amount, currencyCode) : formatMoney(0, currencyCode)}
          description={latestExpense ? latestExpense.categoryName : "No transaction yet"}
          icon={CreditCard}
        />
      </section>

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
          title="No transactions for this period"
          description="Adjust the filters or add a category, payment source, and transaction."
          action={<Button type="button" onClick={onAddExpense}><Plus className="h-4 w-4" />Add Transaction</Button>}
        />
      ) : (
        <>
          <div className="hidden md:block">
            <Table
              minWidth="760px"
              columns={[
                { key: "expenseDate", header: "Date", width: "112px", render: (row) => formatDate(row.expenseDate) },
                { key: "categoryName", header: "Category", width: "140px", render: (row) => <Badge>{row.categoryName}</Badge> },
                { key: "paymentSourceName", header: "Source", width: "160px" },
                { key: "addedBy", header: "Member", width: "140px" },
                { key: "description", header: "Description", wrap: true, render: (row) => row.description || "No description" },
                { key: "amount", header: "Amount", width: "120px", render: (row) => <span className="font-bold">{formatMoney(row.amount, currencyCode)}</span> },
              ]}
              rows={expenses}
              getKey={(row) => row.id}
            />
          </div>
          <div className="grid gap-3 md:hidden">
            {expenses.map((expense) => (
              <MobileExpenseCard key={expense.id} expense={expense} currencyCode={currencyCode} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function TransactionMetric({ title, value, description, icon: Icon, className = "" }) {
  return (
    <Card className={`p-3 sm:p-4 ${className}`}>
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted sm:text-sm">{title}</p>
          <p className="mt-2 truncate font-display text-lg font-bold tracking-tight text-foreground sm:text-2xl">{value}</p>
          <p className="mt-1 truncate text-xs font-semibold text-muted">{description}</p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-950 sm:h-11 sm:w-11">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
    </Card>
  );
}

function MobileExpenseCard({ expense, currencyCode }) {
  return (
    <Card className="p-4">
      <CardHeader className="mb-3">
        <div className="min-w-0">
          <CardTitle className="truncate text-base">{expense.categoryName}</CardTitle>
          <CardDescription>{formatDate(expense.expenseDate)}</CardDescription>
        </div>
        <p className="shrink-0 font-display text-lg font-bold tracking-tight text-foreground">
          {formatMoney(expense.amount, currencyCode)}
        </p>
      </CardHeader>
      <div className="grid gap-3 text-sm">
        <div className="flex items-center gap-2 text-muted">
          <CreditCard className="h-4 w-4" />
          <span className="min-w-0 truncate">{expense.paymentSourceName}</span>
        </div>
        <div className="flex items-center gap-2 text-muted">
          <UserRound className="h-4 w-4" />
          <span className="min-w-0 truncate">{expense.addedBy}</span>
        </div>
        {expense.description && (
          <p className="rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-foreground">{expense.description}</p>
        )}
      </div>
    </Card>
  );
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
