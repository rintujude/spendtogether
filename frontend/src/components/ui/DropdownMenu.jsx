import React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "../../lib/utils";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export function DropdownMenuContent({ children, className = "", ...props }) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        className={cn("z-50 min-w-48 rounded-xl border border-border bg-white p-1 shadow-xl", className)}
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
      className={cn("cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-foreground outline-none hover:bg-slate-100", className)}
      {...props}
    >
      {children}
    </DropdownMenuPrimitive.Item>
  );
}
