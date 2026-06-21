import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { BarChart3, Bell, CreditCard, Menu, Plus, Settings, Tags, UsersRound, WalletCards } from "lucide-react";
import { Sheet } from "../ui";
import { cn } from "../../lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/expenses", label: "Expenses", icon: CreditCard },
  { to: "/categories", label: "Categories", icon: Tags },
];

const moreItems = [
  { to: "/payment-sources", label: "Payment Sources", description: "Accounts, cards, cash, and wallets", icon: WalletCards },
  { to: "/members", label: "Members", description: "Workspace members and invitations", icon: UsersRound },
  { to: "/notifications", label: "Notifications", description: "Invitations and workspace updates", icon: Bell },
  { to: "/settings", label: "Settings", description: "Workspace details and preferences", icon: Settings },
];

export function MobileBottomNav({ onAddExpense }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const moreActive = moreItems.some((item) => location.pathname.startsWith(item.to)) || location.pathname.startsWith("/manage-workspace");

  return (
    <>
      <button
        type="button"
        onClick={onAddExpense}
        className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-elevated transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 lg:hidden"
        aria-label="Add expense"
      >
        <Plus className="h-6 w-6" />
      </button>

      <nav
        className="fixed inset-x-3 bottom-3 z-30 rounded-2xl border border-border/80 bg-white/95 p-2 shadow-card backdrop-blur-xl lg:hidden"
        aria-label="Mobile navigation"
      >
        <div className="grid grid-cols-4 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[11px] font-semibold transition",
                    isActive ? "bg-slate-900 text-white shadow-sm" : "text-muted hover:bg-slate-50 hover:text-foreground",
                  )
                }
              >
                <Icon className="h-5 w-5" />
                <span className="max-w-full truncate">{item.label}</span>
              </NavLink>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[11px] font-semibold transition",
              moreActive ? "bg-slate-900 text-white shadow-sm" : "text-muted hover:bg-slate-50 hover:text-foreground",
            )}
            aria-label="Open more menu"
          >
            <Menu className="h-5 w-5" />
            <span className="max-w-full truncate">More</span>
          </button>
        </div>
      </nav>

      <Sheet title="More" open={moreOpen} onOpenChange={setMoreOpen} side="right">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <Menu className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-lg font-bold tracking-tight text-foreground">SpendTogether</p>
            <p className="text-xs font-semibold text-muted">Workspace tools</p>
          </div>
        </div>
        <div className="grid gap-2">
          {moreItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-2xl border p-4 transition",
                  active ? "border-slate-950 bg-slate-950 text-white shadow-sm" : "border-border bg-white text-foreground hover:bg-slate-50",
                )}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl", active ? "bg-white/10 text-white" : "bg-green-50 text-emerald-700")}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{item.label}</span>
                    <span className={cn("mt-0.5 block truncate text-xs font-semibold", active ? "text-slate-300" : "text-muted")}>{item.description}</span>
                  </span>
                </span>
                <span className={cn("text-lg", active ? "text-white" : "text-muted")}>›</span>
              </NavLink>
            );
          })}
        </div>
        <div className="mt-8 rounded-2xl border border-border bg-slate-50 p-4">
          <p className="text-sm font-bold text-foreground">Workspace shortcuts</p>
          <p className="mt-1 text-xs font-medium leading-5 text-muted">Use this menu for secondary SpendTogether tools without crowding the main mobile navigation.</p>
        </div>
      </Sheet>
    </>
  );
}
