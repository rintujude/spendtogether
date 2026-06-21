import React from "react";
import { ArrowDownRight, ArrowUpRight, CircleDollarSign, Pencil, Plus, ReceiptText, RefreshCcw, WalletCards } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CardPeriodFilter, periodLabel } from "../components/filters";
import { Badge, Button, Card, CardDescription, CardHeader, CardTitle, EmptyState, PageHeader, ProgressBar } from "../components/ui";
import { formatMoney } from "../lib/currencies";

export function DashboardPage({
  summary,
  cards,
  periods,
  onPeriodChange,
  currencyCode,
  loading,
  recentExpenses = [],
  onRefresh,
  onAddExpense,
  onEditTotalBudget,
}) {
  const remainingRows = (cards?.remaining?.categories ?? []).map((category) => ({
    ...category,
    budgetAmount: Number(category.budgetAmount ?? 0),
    spentAmount: Number(category.spentAmount ?? 0),
    remainingAmount: Number(category.remainingAmount ?? 0),
    percentageUsed: Number(category.percentageUsed ?? 0),
    usageBarValue: Math.min(Number(category.percentageUsed ?? 0), 100),
  }));
  const categoryChartRows = Object.entries(cards?.categorySpending?.categoryWiseSpending ?? {}).map(([name, amount]) => ({ name, amount: Number(amount) }));
  const accountChartRows = Object.entries(cards?.accountSpending?.accountWiseSpending ?? {}).map(([name, amount]) => ({ name, amount: Number(amount) }));
  const dailyChartRows = Object.entries(cards?.dailyTrend?.dailySpending ?? {}).map(([date, amount]) => ({ name: date.slice(5), amount: Number(amount) }));
  const totalBudget = Number(summary?.totalBudget ?? 0);
  const totalSpent = Number(summary?.totalSpent ?? 0);
  const remainingAmount = Number(summary?.remainingAmount ?? 0);
  const budgetUsedPercentage = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const topCategoryRows = remainingRows.slice(0, 4);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Monitor shared spending, budget usage, and recent workspace activity."
        actions={
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={onRefresh}>
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
            <Button type="button" onClick={onAddExpense}>
              <Plus className="h-4 w-4" />
              Add expense
            </Button>
          </div>
        }
      />

      {loading && <div className="rounded-2xl border border-border bg-white px-4 py-3 text-sm font-semibold text-muted shadow-sm">Refreshing workspace...</div>}

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Monthly Budget" value={formatMoney(totalBudget, currencyCode)} tone="neutral" icon={WalletCards} onEdit={onEditTotalBudget} />
        <MetricCard label="Total Spent" value={formatMoney(totalSpent, currencyCode)} tone="warning" icon={ArrowUpRight} />
        <MetricCard label="Remaining" value={formatMoney(remainingAmount, currencyCode)} tone={remainingAmount < 0 ? "danger" : "success"} icon={ArrowDownRight} highlighted />
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Spending Trend</CardTitle>
              <CardDescription>Total spend for {periodLabel(periods.trendPeriod)}</CardDescription>
            </div>
            <CardPeriodFilter value={periods.trendPeriod} onChange={onPeriodChange.trend} />
          </CardHeader>
          {dailyChartRows.length === 0 ? (
            <EmptyState title="No daily spending in SpendTogether" description="Add expenses to populate the trend." />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyChartRows} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="spendingTrend" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#0F172A" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#0F172A" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(value) => formatMoney(value, currencyCode)} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={82} />
                  <Tooltip formatter={(value) => formatMoney(value, currencyCode)} cursor={{ stroke: "#CBD5E1" }} />
                  <Area type="monotone" dataKey="amount" stroke="#0F172A" strokeWidth={3} fill="url(#spendingTrend)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
              <div className="min-w-0">
              <CardTitle>Recent Expenses</CardTitle>
              <CardDescription>Latest transactions in this workspace.</CardDescription>
              </div>
            <Button type="button" variant="secondary" className="h-10 px-3" onClick={onAddExpense}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </CardHeader>
          {recentExpenses.length === 0 ? (
            <EmptyState title="No expenses yet" description="Add an expense to see recent activity here." />
          ) : (
            <div className="grid gap-3">
              {recentExpenses.slice(0, 5).map((expense) => (
                <div key={expense.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-2xl border border-border bg-slate-50 p-3">
                  <div className="flex min-w-0 items-center gap-3 overflow-hidden">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-sm">
                      <ReceiptText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 overflow-hidden">
                      <p className="truncate text-sm font-bold text-foreground">{expense.description || expense.categoryName || "Expense"}</p>
                      <p className="truncate text-xs font-semibold text-muted">{expense.categoryName ?? "Uncategorised"} • {expense.expenseDate}</p>
                    </div>
                  </div>
                  <p className="max-w-[8.5rem] truncate text-right text-sm font-bold text-foreground tabular-nums">{formatMoney(expense.amount, currencyCode)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      <Card className="overflow-hidden p-0">
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
          <div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-muted">Workspace summary</p>
                <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground">
                  {budgetUsedPercentage.toFixed(0)}% used
                </h2>
              </div>
              <CardPeriodFilter value={periods.summaryPeriod} onChange={onPeriodChange.summary} />
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">
              {formatMoney(totalSpent, currencyCode)} spent of {formatMoney(totalBudget, currencyCode)} for {periodLabel(periods.summaryPeriod).toLowerCase()}.
            </p>
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted">
                <span>Budget used</span>
                <span>{budgetUsedPercentage.toFixed(0)}%</span>
              </div>
              <ProgressBar value={budgetUsedPercentage} tone={usageTone(budgetUsedPercentage)} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {topCategoryRows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-slate-50 p-4 text-sm font-semibold text-muted sm:col-span-2">
                Category budget cards will appear after you add categories.
              </div>
            ) : topCategoryRows.map((row) => (
              <div key={row.categoryId} className="rounded-2xl border border-border bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{row.categoryName}</p>
                    <p className="mt-1 text-xs font-semibold text-muted">{formatMoney(row.remainingAmount, currencyCode)} remaining</p>
                  </div>
                  <Badge tone={usageTone(row.percentageUsed)}>{row.percentageUsed.toFixed(0)}%</Badge>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full" style={{ width: `${row.usageBarValue}%`, backgroundColor: usageColor(row.percentageUsed) }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <CategoryBudgetUsageCard rows={remainingRows} currencyCode={currencyCode} period={periods.remainingPeriod} onPeriodChange={onPeriodChange.remaining} />

      <section className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Category spending" rows={categoryChartRows} currencyCode={currencyCode} emptyTitle="No category spending" period={periods.spendingPeriod} onPeriodChange={onPeriodChange.spending} />
        <ChartCard title="Account spending" rows={accountChartRows} currencyCode={currencyCode} emptyTitle="No account spending" period={periods.accountPeriod} onPeriodChange={onPeriodChange.account} />
      </section>
    </>
  );
}

function MetricCard({ label, value, tone, icon: Icon = CircleDollarSign, onEdit, highlighted = false }) {
  const toneClasses = {
    neutral: "bg-slate-100 text-slate-950",
    warning: "bg-amber-50 text-warning",
    green: "bg-green-50 text-success",
    success: "bg-green-50 text-success",
    danger: "bg-red-50 text-danger",
  };

  return (
    <Card className={highlighted ? "bg-slate-950 text-white" : ""}>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-sm font-semibold ${highlighted ? "text-slate-300" : "text-muted"}`}>{label}</p>
          <p className={`mt-3 truncate font-display text-3xl font-bold tracking-tight ${highlighted ? "text-white" : "text-foreground"}`}>{value}</p>
          </div>
          {onEdit && (
          <Button type="button" variant="ghost" className="h-9 w-9 shrink-0 px-0" onClick={onEdit} aria-label={`Edit ${label}`}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${highlighted ? "bg-white/10 text-white" : toneClasses[tone] ?? toneClasses.neutral}`}>
            <Icon className="h-5 w-5" />
          </div>
      </div>
    </Card>
  );
}

function CategoryBudgetUsageCard({ rows, currencyCode, period, onPeriodChange }) {
  const chartHeight = Math.max(280, rows.length * 48 + 72);
  const overBudgetCount = rows.filter((row) => row.overBudget).length;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Category budget usage</CardTitle>
          <CardDescription>Used = spent for {periodLabel(period)} / category budget</CardDescription>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          {overBudgetCount > 0 && <Badge tone="danger">{overBudgetCount} over budget</Badge>}
          <CardPeriodFilter value={period} onChange={onPeriodChange} />
        </div>
      </CardHeader>
      {rows.length === 0 ? (
        <EmptyState title="No category budgets yet in SpendTogether" description="Add categories and budgets from Setup to see category usage." />
      ) : (
        <>
          <div className="mb-4 grid gap-3 rounded-2xl border border-border bg-slate-50 p-4 text-xs font-semibold text-muted md:grid-cols-3">
            <span>Y-axis: categories</span>
            <span>X-axis: budget used (%)</span>
            <span>100% line = full budget</span>
          </div>
          <div className="md:hidden">
            <BudgetUsageList rows={rows} currencyCode={currencyCode} />
          </div>
          <div className="hidden h-[360px] max-h-[560px] min-h-[280px] overflow-y-auto md:block">
            <div style={{ height: chartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 72, bottom: 36, left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tickFormatter={(value) => `${value}%`}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    label={{ value: "Budget used (%)", position: "insideBottom", offset: -24, fill: "#64748B", fontSize: 12, fontWeight: 600 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="categoryName"
                    width={180}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    label={{ value: "Categories", angle: -90, position: "insideLeft", fill: "#64748B", fontSize: 12, fontWeight: 600 }}
                  />
                  <Tooltip content={<BudgetUsageTooltip currencyCode={currencyCode} />} cursor={{ fill: "#F1F5F9" }} />
                  <ReferenceLine x={100} stroke="#94A3B8" strokeDasharray="4 4" />
                  <Bar dataKey="usageBarValue" radius={[0, 8, 8, 0]}>
                    {rows.map((row) => (
                      <Cell key={row.categoryId} fill={usageColor(row.percentageUsed)} />
                    ))}
                    <LabelList dataKey="percentageUsed" position="right" formatter={(value) => `${Number(value).toFixed(0)}%`} fill="#0F172A" fontSize={12} fontWeight={700} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

function BudgetUsageList({ rows, currencyCode }) {
  return (
    <div className="grid gap-4">
      {rows.map((row) => (
        <div key={row.categoryId} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{row.categoryName}</p>
              <p className="mt-1 text-xs text-muted">
                {formatMoney(row.spentAmount, currencyCode)} spent of {formatMoney(row.budgetAmount, currencyCode)}
              </p>
            </div>
            <Badge tone={usageTone(row.percentageUsed)}>
              {row.percentageUsed.toFixed(0)}%
            </Badge>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{
                width: `${row.usageBarValue}%`,
                backgroundColor: usageColor(row.percentageUsed),
              }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
            <span>0%</span>
            <span className={row.overBudget ? "font-semibold text-red-600" : "font-semibold text-success"}>
              Remaining: {formatMoney(row.remainingAmount, currencyCode)}
            </span>
            <span>100%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function BudgetUsageTooltip({ active, payload, currencyCode }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;

  return (
    <div className="rounded-2xl border border-border bg-white p-3 text-sm shadow-elevated">
      <p className="font-semibold text-foreground">{row.categoryName}</p>
      <div className="mt-2 grid gap-1 text-muted">
        <p>Budget: {formatMoney(row.budgetAmount, currencyCode)}</p>
        <p>Spent: {formatMoney(row.spentAmount, currencyCode)}</p>
        <p className={row.overBudget ? "font-semibold text-red-600" : "font-semibold text-success"}>
          Remaining: {formatMoney(row.remainingAmount, currencyCode)}
        </p>
        <p>Used: {row.percentageUsed.toFixed(2)}%</p>
      </div>
    </div>
  );
}

function usageColor(percentageUsed) {
  if (percentageUsed >= 100) return "#DC2626";
  if (percentageUsed >= 75) return "#F59E0B";
  if (percentageUsed >= 50) return "#0F172A";
  return "#10B981";
}

function usageTone(percentageUsed) {
  if (percentageUsed >= 100) return "danger";
  if (percentageUsed >= 75) return "warning";
  if (percentageUsed >= 50) return "primary";
  return "success";
}

function ChartCard({ title, rows, currencyCode, emptyTitle, period, onPeriodChange }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Total for {periodLabel(period)}</CardDescription>
        </div>
        <CardPeriodFilter value={period} onChange={onPeriodChange} />
      </CardHeader>
      {rows.length === 0 ? (
        <EmptyState title={`${emptyTitle} in SpendTogether`} description="Add expenses to populate this chart." />
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(value) => formatMoney(value, currencyCode)} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={82} />
              <Tooltip formatter={(value) => formatMoney(value, currencyCode)} cursor={{ fill: "#F1F5F9" }} />
              <Bar dataKey="amount" fill="#0F172A" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
