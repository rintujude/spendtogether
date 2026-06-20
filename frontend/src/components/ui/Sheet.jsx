import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "./Button";
import { cn } from "../../lib/utils";

export function Sheet({ title, children, open, onOpenChange, side = "left" }) {
  const sideClass = side === "left"
    ? "left-0 top-0 h-full w-[82vw] max-w-80 border-r"
    : "right-0 top-0 h-full w-[82vw] max-w-80 border-l";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-slate-950/45" />
        <DialogPrimitive.Content
          className={cn(
            "fixed z-50 border-border bg-white p-5 shadow-2xl",
            sideClass,
          )}
        >
          <div className="mb-6 flex items-center justify-between gap-3">
            <DialogPrimitive.Title className="text-base font-bold text-foreground">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <Button type="button" variant="ghost" className="h-9 w-9 px-0" aria-label="Close menu">
                <X className="h-4 w-4" />
              </Button>
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
