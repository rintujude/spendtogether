import React from "react";
import { cn } from "../../lib/utils";

const tones = {
  neutral: "border-border bg-slate-50 text-muted",
  success: "border-green-200 bg-green-50 text-success",
  warning: "border-amber-200 bg-amber-50 text-warning",
  danger: "border-red-200 bg-red-50 text-danger",
  primary: "border-slate-200 bg-slate-950 text-white",
};

export function Badge({ children, tone = "neutral", className = "" }) {
  return (
    <span className={cn("inline-flex min-h-7 items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-none", tones[tone], className)}>
      {children}
    </span>
  );
}
