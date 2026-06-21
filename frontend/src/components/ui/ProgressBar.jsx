import React from "react";
import { cn } from "../../lib/utils";

const tones = {
  primary: "bg-slate-950",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export function ProgressBar({ value = 0, max = 100, tone = "primary", label, className = "" }) {
  const numericValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  const numericMax = Number.isFinite(Number(max)) && Number(max) > 0 ? Number(max) : 100;
  const percentage = Math.min(Math.max((numericValue / numericMax) * 100, 0), 100);

  return (
    <div className={cn("grid gap-2", className)}>
      {label && <div className="text-xs font-semibold text-muted">{label}</div>}
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={numericMax} aria-valuenow={numericValue}>
        <div className={cn("h-full rounded-full transition-all", tones[tone] ?? tones.primary)} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
