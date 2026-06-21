import React from "react";
import { NavLink } from "react-router-dom";
import { BarChart3, Bell, CreditCard, Landmark, Settings, Tags, UsersRound, WalletCards } from "lucide-react";
import { cn } from "../../lib/utils";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/expenses", label: "Expenses", icon: CreditCard },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/payment-sources", label: "Payment Sources", icon: WalletCards },
  { to: "/members", label: "Members", icon: UsersRound },
];

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen border-r border-border bg-white p-5 lg:flex lg:flex-col">
      <NavLink
        to="/dashboard"
        className="mb-8 flex items-center gap-3 rounded-xl outline-none transition hover:opacity-85 focus-visible:ring-4 focus-visible:ring-slate-200"
        aria-label="Go to SpendTogether home"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
          <Landmark className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">SpendTogether</p>
          <p className="text-xs font-medium text-muted">Shared budgets</p>
        </div>
      </NavLink>
      <nav className="grid gap-1" aria-label="Main navigation">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn(
                "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition",
                isActive ? "bg-slate-950 text-white shadow-sm" : "text-muted hover:bg-slate-50 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="mt-auto grid gap-2">
        <NavLink
          to="/notifications"
          className={({ isActive }) => cn(
            "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition",
            isActive ? "bg-slate-950 text-white shadow-sm" : "text-muted hover:bg-slate-50 hover:text-foreground",
          )}
        >
          <Bell className="h-4 w-4" />
          Notifications
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) => cn(
            "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition",
            isActive ? "bg-slate-950 text-white shadow-sm" : "text-muted hover:bg-slate-50 hover:text-foreground",
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </NavLink>
      </div>
    </aside>
  );
}
