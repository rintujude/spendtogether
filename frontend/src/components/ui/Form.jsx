import React from "react";

export function Form({ children, className = "", ...props }) {
  return <form className={`grid gap-4 ${className}`.trim()} {...props}>{children}</form>;
}
