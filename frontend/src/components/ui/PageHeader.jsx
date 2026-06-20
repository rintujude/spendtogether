import React from "react";

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">{eyebrow}</p>}
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </header>
  );
}
