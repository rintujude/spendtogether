import React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../../lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ children, className = "" }) {
  return <TabsPrimitive.List className={cn("inline-flex rounded-xl border border-border bg-white p-1 shadow-sm", className)}>{children}</TabsPrimitive.List>;
}

export function TabsTrigger({ children, className = "", ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={cn("rounded-lg px-4 py-2 text-sm font-semibold text-muted data-[state=active]:bg-primary data-[state=active]:text-white", className)}
      {...props}
    >
      {children}
    </TabsPrimitive.Trigger>
  );
}

export const TabsContent = TabsPrimitive.Content;
