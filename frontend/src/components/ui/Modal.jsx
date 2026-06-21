import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "./Button";

export function Dialog({ title, description, children, open, onOpenChange }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-32px)] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-white p-5 shadow-2xl sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <DialogPrimitive.Title className="text-lg font-semibold tracking-tight text-foreground">{title}</DialogPrimitive.Title>
              {description && <DialogPrimitive.Description className="mt-1 text-sm text-muted">{description}</DialogPrimitive.Description>}
            </div>
            <DialogPrimitive.Close asChild>
              <Button type="button" variant="ghost" className="h-9 w-9 px-0" aria-label="Close dialog">
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

export const Modal = ({ open, onClose, ...props }) => (
  <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose?.()} {...props} />
);
