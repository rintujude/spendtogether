import React from "react";
import { Loader2 } from "lucide-react";

export function LoadingState({ label = "Loading" }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-2 text-sm font-medium text-muted shadow-sm">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}
