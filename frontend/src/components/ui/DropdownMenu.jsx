import React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "../../lib/utils";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export function DropdownMenuContent({ children, className = "", ...props }) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        className={cn("z-50 min-w-48 rounded-2xl border border-border bg-white p-1.5 shadow-elevated", className)}
        sideOffset={8}
        {...props}
      >
        {children}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({ children, className = "", ...props }) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn("cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium text-foreground outline-none transition-colors hover:bg-slate-100 focus:bg-slate-100", className)}
      {...props}
    >
      {children}
    </DropdownMenuPrimitive.Item>
  );
}
