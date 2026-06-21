import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Bell, CheckCircle2, CreditCard, Landmark, LayoutDashboard, ReceiptText, ShieldCheck, Tags, UsersRound, WalletCards } from "lucide-react";
import { Badge, Button, Card, CardDescription, CardHeader, CardTitle, ProgressBar } from "../components/ui";

const features = [
  {
    title: "Shared budgeting",
    description: "Create one workspace for a household, couple, trip, or any shared budget.",
    icon: LayoutDashboard,
  },
  {
    title: "Categories",
    description: "Organize spending by groceries, bills, travel, online shopping, and more.",
    icon: Tags,
  },
  {
    title: "Expenses",
    description: "Track every transaction with date, amount, category, source, and member.",
    icon: ReceiptText,
  },
  {
    title: "Members",
    description: "Invite contributors or viewers and keep everyone looking at the same numbers.",
    icon: UsersRound,
  },
  {
    title: "Payment sources",
    description: "Separate cash, bank accounts, debit cards, credit cards, and online wallets.",
    icon: CreditCard,
  },
  {
    title: "Notifications",
    description: "Stay aware of invitations and workspace activity as your budget changes.",
    icon: Bell,
  },
];

const categoryRows = [
  { name: "Groceries", value: 68, tone: "success" },
  { name: "Bills", value: 82, tone: "warning" },
  { name: "Travel", value: 38, tone: "primary" },
];

const workspaceStats = [
  { label: "Budget", value: "£2,500" },
  { label: "Spent", value: "£850" },
  { label: "Members", value: "3" },
];

const trustPoints = ["Workspace-based sharing", "Member roles and invitations", "Clean dashboard for every device"];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-5 sm:px-5 md:px-8">
        <Link to="/" className="flex items-center gap-3 rounded-xl outline-none transition hover:opacity-85 focus-visible:ring-4 focus-visible:ring-slate-200">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
            <Landmark className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-bold text-foreground">SpendTogether</span>
            <span className="block text-xs font-medium text-muted">Shared budget workspace</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-muted md:flex" aria-label="Landing navigation">
          <a href="#features" className="transition hover:text-foreground">Features</a>
          <a href="#preview" className="transition hover:text-foreground">Preview</a>
          <a href="#security" className="transition hover:text-foreground">Sharing</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" className="hidden sm:inline-flex" onClick={() => navigate("/login")}>
            Login
          </Button>
          <Button type="button" onClick={() => navigate("/register")}>
            Get Started
          </Button>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-[1200px] gap-8 px-4 pb-12 pt-4 sm:px-5 md:px-8 lg:grid-cols-[minmax(0,1fr)_480px] lg:items-center lg:pb-20 lg:pt-12">
        <div>
          <Badge tone="primary">SpendTogether</Badge>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Shared budgets that stay clear for everyone.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
            Manage workspaces, members, categories, payment sources, and daily expenses in one calm finance dashboard built for shared decisions.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button type="button" className="sm:w-auto" onClick={() => navigate("/register")}>
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button type="button" variant="secondary" className="sm:w-auto" onClick={() => navigate("/login")}>
              Login
            </Button>
          </div>
          <div className="mt-8 grid gap-3 text-sm font-semibold text-muted sm:grid-cols-3">
            {trustPoints.map((point) => (
              <div key={point} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>

        <Card id="preview" className="overflow-hidden p-0">
          <div className="border-b border-border bg-slate-950 p-6 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-300">Workspace overview</p>
                <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">£1,650 left</h2>
              </div>
              <Badge className="border-white/10 bg-white/10 text-white">This month</Badge>
            </div>
          </div>
          <div className="grid gap-5 p-6">
            <div className="grid grid-cols-3 gap-3">
              {workspaceStats.map((stat) => <MiniMetric key={stat.label} {...stat} />)}
            </div>
            <div className="grid gap-4">
              {categoryRows.map((row) => (
                <div key={row.name} className="grid gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-foreground">{row.name}</span>
                    <span className="font-medium text-muted">{row.value}% used</span>
                  </div>
                  <ProgressBar value={row.value} tone={row.tone} />
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-border bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-950 shadow-sm">
                  <WalletCards className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">Payment sources</p>
                  <p className="truncate text-xs font-medium text-muted">Cash, current account, credit card, and online wallet</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section id="features" className="border-t border-border bg-white">
        <div className="mx-auto w-full max-w-[1200px] px-4 pt-12 sm:px-5 md:px-8">
          <div className="max-w-2xl">
            <Badge>Features</Badge>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground">Everything a shared budget needs for the MVP.</h2>
            <p className="mt-3 text-sm leading-6 text-muted">The design focuses on the core flows already supported by SpendTogether: workspaces, members, categories, payment sources, expenses, and notifications.</p>
          </div>
        </div>
        <div className="mx-auto grid w-full max-w-[1200px] gap-5 px-4 py-12 sm:px-5 md:px-8 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="shadow-none">
                <CardHeader>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-950">
                    <Icon className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </Card>
            );
          })}
        </div>
      </section>

      <section id="security" className="mx-auto grid w-full max-w-[1200px] gap-5 px-4 py-12 sm:px-5 md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <Badge>Workspace sharing</Badge>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground">Built for shared control, not shared confusion.</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Owners and contributors can keep spending data up to date while viewers can follow progress without changing setup.
          </p>
        </div>
        <Card className="grid gap-4">
          <ShareRow icon={UsersRound} title="Members" description="Invite contributors and viewers into the same workspace." />
          <ShareRow icon={ShieldCheck} title="Roles" description="Keep permissions clear for setup, expenses, and viewing." />
          <ShareRow icon={Bell} title="Notifications" description="Surface invitations and workspace activity in one place." />
        </Card>
      </section>

      <section className="px-4 pb-14 sm:px-5 md:px-8">
        <div className="mx-auto grid max-w-[1200px] gap-5 rounded-[28px] bg-slate-950 p-6 text-white shadow-elevated md:grid-cols-[1fr_auto] md:items-center md:p-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-slate-300">Start with one workspace</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">Bring your shared budget into focus.</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" className="bg-white text-slate-950 hover:bg-slate-100" onClick={() => navigate("/register")}>Get Started</Button>
            <Button type="button" variant="secondary" className="border-white/15 bg-white/10 text-white hover:bg-white/15" onClick={() => navigate("/login")}>Login</Button>
          </div>
        </div>
      </section>
    </main>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-border bg-slate-50 p-4">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="mt-1 text-lg font-bold tracking-tight text-foreground">{value}</p>
    </div>
  );
}

function ShareRow({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-border bg-slate-50 p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
      </div>
    </div>
  );
}
