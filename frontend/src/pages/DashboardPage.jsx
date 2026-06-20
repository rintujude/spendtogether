import React from "react";
import { Pencil, Plus, RefreshCcw, WalletCards } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CardPeriodFilter, periodLabel } from "../components/filters";
import { Badge, Button, Card, CardDescription, CardHeader, CardTitle, EmptyState, PageHeader } from "../components/ui";
import { formatMoney } from "../lib/currencies";

export function DashboardPage({
  summary,
  cards,
  periods,
  onPeriodChange,
  currencyCode,
  loading,
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

  return (
    <>
      <PageHeader
        eyebrow="SpendTogether"
        title="Dashboard"
        description="View workspace spending, budgets, and payment sources."
        actions={
          <div className="flex gap-3">
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

      {loading && <div className="text-sm font-medium text-muted">Refreshing workspace...</div>}

      <div className="flex justify-end">
        <CardPeriodFilter value={periods.summaryPeriod} onChange={onPeriodChange.summary} />
      </div>
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Total budget" value={formatMoney(summary?.totalBudget, currencyCode)} tone="blue" onEdit={onEditTotalBudget} />
        <MetricCard label="Total spent" value={formatMoney(summary?.totalSpent, currencyCode)} tone="amber" />
        <MetricCard label="Remaining" value={formatMoney(summary?.remainingAmount, currencyCode)} tone="green" />
      </section>

      <CategoryBudgetUsageCard rows={remainingRows} currencyCode={currencyCode} period={periods.remainingPeriod} onPeriodChange={onPeriodChange.remaining} />

      <section className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Category spending" rows={categoryChartRows} currencyCode={currencyCode} emptyTitle="No category spending" period={periods.spendingPeriod} onPeriodChange={onPeriodChange.spending} />
        <ChartCard title="Account spending" rows={accountChartRows} currencyCode={currencyCode} emptyTitle="No account spending" period={periods.accountPeriod} onPeriodChange={onPeriodChange.account} />
      </section>

      <ChartCard title="Daily spending trends" rows={dailyChartRows} currencyCode={currencyCode} emptyTitle="No daily spending" period={periods.trendPeriod} onPeriodChange={onPeriodChange.trend} />
    </>
  );
}

function MetricCard({ label, value, tone, onEdit }) {
  const toneClasses = {
    blue: "bg-blue-50 text-primary",
    amber: "bg-amber-50 text-warning",
    green: "bg-green-50 text-success",
  };

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-muted">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button type="button" variant="ghost" className="h-9 w-9 px-0" onClick={onEdit} aria-label={`Edit ${label}`}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneClasses[tone]}`}>
            <WalletCards className="h-5 w-5" />
          </div>
        </div>
      </div>
    </Card>
  );
}

function CategoryBudgetUsageCard({ rows, currencyCode, period, onPeriodChange }) {
  const chartHeight = Math.max(280, rows.length * 48 + 72);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Category Budget Usage</CardTitle>
          <CardDescription>Used = spent for {periodLabel(period)} / category budget</CardDescription>
        </div>
        <CardPeriodFilter value={period} onChange={onPeriodChange} />
        {rows.some((row) => row.overBudget) && <Badge tone="danger">Over budget</Badge>}
      </CardHeader>
      {rows.length === 0 ? (
        <EmptyState title="No category budgets yet in SpendTogether" description="Add categories and budgets from Setup to see category usage." />
      ) : (
        <>
          <div className="mb-4 hidden items-center justify-between gap-4 rounded-lg border border-border bg-slate-50 px-4 py-3 text-xs font-semibold text-muted md:flex">
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
        <div key={row.categoryId} className="rounded-lg border border-border bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{row.categoryName}</p>
              <p className="mt-1 text-xs text-muted">
                {formatMoney(row.spentAmount, currencyCode)} spent of {formatMoney(row.budgetAmount, currencyCode)}
              </p>
            </div>
            <Badge tone={row.overBudget ? "danger" : row.percentageUsed >= 80 ? "warning" : "success"}>
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
    <div className="rounded-lg border border-border bg-white p-3 text-sm shadow-soft">
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
  if (percentageUsed >= 80) return "#F59E0B";
  return "#16A34A";
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
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(value) => formatMoney(value, currencyCode)} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={82} />
              <Tooltip formatter={(value) => formatMoney(value, currencyCode)} cursor={{ fill: "#F1F5F9" }} />
              <Bar dataKey="amount" fill="#2563EB" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
