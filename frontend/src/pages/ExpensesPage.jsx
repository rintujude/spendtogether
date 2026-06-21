import React from "react";
import { CalendarDays, CreditCard, Pencil, Plus, ReceiptText, Search, UserRound, X } from "lucide-react";
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
  onEditExpense,
}) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [draftFilters, setDraftFilters] = React.useState(filters);
  const [searchText, setSearchText] = React.useState("");

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
  const searchQuery = searchText.trim().toLowerCase();
  const visibleExpenses = searchQuery
    ? expenses.filter((expense) => transactionMatchesSearch(expense, searchQuery, currencyCode))
    : expenses;

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
      <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-border bg-white px-3 shadow-sm">
        <Search className="h-4 w-4 shrink-0 text-muted" />
        <input
          className="h-11 min-w-0 flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-slate-400"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search transactions..."
          aria-label="Search transactions"
        />
        {searchText && (
          <button
            type="button"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-slate-100 hover:text-foreground"
            onClick={() => setSearchText("")}
            aria-label="Clear transaction search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
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
      ) : visibleExpenses.length === 0 ? (
        <EmptyState
          title="No matching transactions"
          description="Try another search term or clear the transaction search."
          action={<Button type="button" variant="secondary" onClick={() => setSearchText("")}>Clear search</Button>}
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
                {
                  key: "amount",
                  header: "Amount",
                  width: "120px",
                  align: "right",
                  render: (row) => <span className="block text-right font-bold tabular-nums">{formatMoney(row.amount, currencyCode)}</span>,
                },
                {
                  key: "actions",
                  header: "",
                  width: "56px",
                  align: "right",
                  render: (row) => (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-muted transition hover:border-slate-300 hover:bg-slate-50 hover:text-foreground"
                        onClick={() => onEditExpense(row)}
                        aria-label={`Edit ${row.description || row.categoryName || "transaction"}`}
                        title="Edit transaction"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ),
                },
              ]}
              rows={visibleExpenses}
              getKey={(row) => row.id}
            />
          </div>
          <div className="grid gap-3 md:hidden">
            {visibleExpenses.map((expense) => (
              <MobileExpenseCard key={expense.id} expense={expense} currencyCode={currencyCode} onEditExpense={onEditExpense} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function transactionMatchesSearch(expense, query, currencyCode) {
  const searchable = [
    expense.description,
    expense.categoryName,
    expense.paymentSourceName,
    expense.addedBy,
    expense.expenseDate,
    formatDate(expense.expenseDate),
    String(expense.amount ?? ""),
    formatMoney(expense.amount, currencyCode),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchable.includes(query);
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

function MobileExpenseCard({ expense, currencyCode, onEditExpense }) {
  return (
    <Card className="p-4">
      <CardHeader className="mb-3">
        <div className="min-w-0">
          <CardTitle className="truncate text-base">{expense.categoryName}</CardTitle>
          <CardDescription>{formatDate(expense.expenseDate)}</CardDescription>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-muted transition hover:border-slate-300 hover:bg-slate-50 hover:text-foreground"
            onClick={() => onEditExpense(expense)}
            aria-label={`Edit ${expense.description || expense.categoryName || "transaction"}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <p className="font-display text-lg font-bold tracking-tight text-foreground">
            {formatMoney(expense.amount, currencyCode)}
          </p>
        </div>
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
