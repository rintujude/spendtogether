import React from "react";
import { Landmark } from "lucide-react";

export function AuthLayout({ children }) {
  return (
    <main className="grid min-h-screen grid-cols-1 bg-background p-5 lg:grid-cols-[minmax(0,1fr)_440px] lg:p-8">
      <section className="hidden items-center justify-center rounded-[28px] bg-gradient-to-br from-slate-950 to-blue-950 p-10 text-white lg:flex">
        <div className="max-w-2xl">
          <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-xl">
            <Landmark className="h-7 w-7" />
          </div>
          <p className="mb-4 text-sm font-bold uppercase tracking-wide text-blue-200">SpendTogether</p>
          <h1 className="text-5xl font-bold tracking-tight">Shared budget workspaces, polished and under control.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
            Track spending, budgets, payment sources, members, and monthly progress from one shared workspace.
          </p>
        </div>
      </section>
      <section className="flex items-center justify-center">
        <div className="w-full max-w-md rounded-[24px] border border-border bg-white p-6 shadow-card md:p-8">
          {children}
        </div>
      </section>
    </main>
  );
}
