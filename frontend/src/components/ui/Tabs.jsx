import React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../../lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ children, className = "" }) {
  return (
    <TabsPrimitive.List className={cn("flex w-full gap-1 overflow-x-auto rounded-2xl border border-border bg-white p-1 shadow-sm md:inline-flex md:w-auto", className)}>
      {children}
    </TabsPrimitive.List>
  );
}

export function TabsTrigger({ children, className = "", ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={cn("h-10 shrink-0 rounded-xl px-4 text-sm font-semibold text-muted transition data-[state=active]:bg-slate-950 data-[state=active]:text-white data-[state=active]:shadow-sm", className)}
      {...props}
    >
      {children}
    </TabsPrimitive.Trigger>
  );
}

export const TabsContent = TabsPrimitive.Content;
