import React from "react";
import { cn } from "../../lib/utils";

const variants = {
  primary: "bg-slate-950 text-white shadow-sm hover:bg-slate-800",
  secondary: "border border-border bg-white text-foreground shadow-sm hover:bg-slate-50",
  ghost: "bg-transparent text-muted hover:bg-slate-100 hover:text-foreground",
  destructive: "bg-danger text-white shadow-sm hover:bg-red-700",
};

export const Button = React.forwardRef(function Button(
  { children, variant = "primary", className = "", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
