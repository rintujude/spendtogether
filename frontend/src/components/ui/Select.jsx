import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

export const Select = React.forwardRef(function Select(
  { label, error, children, className = "", selectClassName = "", ...props },
  ref,
) {
  return (
    <label className={cn("grid gap-2 text-sm font-medium text-foreground", className)}>
      {label && <span>{label}</span>}
      <span className="relative block">
        <select
          ref={ref}
          className={cn(
            "h-11 w-full appearance-none rounded-xl border border-border bg-white px-3 pr-10 text-sm text-foreground shadow-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-muted",
            selectClassName,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      </span>
      {error && <span className="text-xs font-medium text-danger">{error}</span>}
    </label>
  );
});
