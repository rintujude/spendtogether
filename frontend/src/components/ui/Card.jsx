import React from "react";
import { cn } from "../../lib/utils";

export function Card({ children, className = "", ...props }) {
  return (
    <section className={cn("min-w-0 rounded-xl border border-border bg-white p-6 shadow-card", className)} {...props}>
      {children}
    </section>
  );
}

export function CardHeader({ children, className = "" }) {
  return <div className={cn("mb-5 flex items-start justify-between gap-4", className)}>{children}</div>;
}

export function CardTitle({ children, className = "" }) {
  return <h2 className={cn("text-lg font-semibold text-foreground", className)}>{children}</h2>;
}

export function CardDescription({ children, className = "" }) {
  return <p className={cn("mt-1 text-sm leading-6 text-muted", className)}>{children}</p>;
}
