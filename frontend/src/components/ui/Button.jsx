import React from "react";
import { cn } from "../../lib/utils";

const variants = {
  primary: "bg-primary text-white hover:bg-blue-700",
  secondary: "border border-border bg-white text-foreground hover:bg-slate-50",
  ghost: "bg-transparent text-muted hover:bg-slate-100 hover:text-foreground",
  destructive: "bg-danger text-white hover:bg-red-700",
};

export const Button = React.forwardRef(function Button(
  { children, variant = "primary", className = "", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
