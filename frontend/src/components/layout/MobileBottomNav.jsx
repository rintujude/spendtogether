import React from "react";
import { NavLink } from "react-router-dom";
import { BarChart3, CreditCard, Settings } from "lucide-react";
import { cn } from "../../lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/manage-workspace", label: "Manage", icon: Settings },
  { to: "/expenses", label: "Transactions", icon: CreditCard },
];

export function MobileBottomNav() {
  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-30 rounded-2xl border border-border/80 bg-white/95 p-2 shadow-card backdrop-blur-xl lg:hidden"
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-3 gap-1">
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
      </div>
    </nav>
  );
}
