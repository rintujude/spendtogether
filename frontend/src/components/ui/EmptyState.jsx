import React from "react";
import { Inbox } from "lucide-react";

export function EmptyState({ title, description, action }) {
  return (
    <div className="grid justify-items-start gap-3 rounded-xl border border-dashed border-border bg-slate-50 p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-muted shadow-sm">
        <Inbox className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && <p className="mt-1 text-sm leading-6 text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
