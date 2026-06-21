import React from "react";
import { cn } from "../../lib/utils";

export function Card({ children, className = "", ...props }) {
  return (
    <section className={cn("min-w-0 rounded-2xl border border-border bg-white p-5 shadow-card sm:p-6", className)} {...props}>
      {children}
    </section>
  );
}

export function CardHeader({ children, className = "" }) {
  return <div className={cn("mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", className)}>{children}</div>;
}

export function CardTitle({ children, className = "" }) {
  return <h2 className={cn("text-lg font-semibold tracking-tight text-foreground", className)}>{children}</h2>;
}

export function CardDescription({ children, className = "" }) {
  return <p className={cn("mt-1 text-sm leading-6 text-muted", className)}>{children}</p>;
}
