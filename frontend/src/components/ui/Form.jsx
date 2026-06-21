import React from "react";
import { cn } from "../../lib/utils";

export function Form({ children, className = "", ...props }) {
  return <form className={cn("grid gap-4", className)} {...props}>{children}</form>;
}
