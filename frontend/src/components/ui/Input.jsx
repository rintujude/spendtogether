import React from "react";
import { cn } from "../../lib/utils";

export const Input = React.forwardRef(function Input(
  { label, error, className = "", inputClassName = "", ...props },
  ref,
) {
  return (
    <label className={cn("grid gap-2 text-sm font-medium text-foreground", className)}>
      {label && <span>{label}</span>}
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-200",
          inputClassName,
        )}
        {...props}
      />
      {error && <span className="text-xs font-medium text-danger">{error}</span>}
    </label>
  );
});
