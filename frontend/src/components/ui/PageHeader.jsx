import React from "react";

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{eyebrow}</p>}
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>}
      </div>
      {actions && <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto [&>button]:w-full sm:[&>button]:w-auto">{actions}</div>}
    </header>
  );
}
