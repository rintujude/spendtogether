import React from "react";
import { cn } from "../../lib/utils";

export const Select = React.forwardRef(function Select(
  { label, error, children, className = "", selectClassName = "", ...props },
  ref,
) {
  return (
    <label className={cn("grid gap-2 text-sm font-medium text-foreground", className)}>
      {label && <span>{label}</span>}
      <select
        ref={ref}
        className={cn(
          "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-blue-100",
          selectClassName,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs font-medium text-danger">{error}</span>}
    </label>
  );
});
