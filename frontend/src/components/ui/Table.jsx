import React from "react";
import { cn } from "../../lib/utils";

export function Table({ columns, rows, getKey, minWidth = "720px", className = "" }) {
  return (
    <div className={cn("w-full max-w-full overflow-x-auto rounded-2xl border border-border bg-white shadow-card", className)}>
      <table className="w-full border-collapse text-sm" style={{ minWidth }}>
        <thead className="bg-slate-50/80">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="h-11 whitespace-nowrap px-4 text-left text-xs font-bold uppercase tracking-wide text-muted"
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={getKey ? getKey(row) : index} className="border-t border-border transition-colors hover:bg-slate-50/70">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={column.wrap ? "h-14 whitespace-normal break-words px-4 py-3 align-middle font-medium text-foreground" : "h-14 whitespace-nowrap px-4 py-3 align-middle font-medium text-foreground"}
                  style={{ width: column.width }}
                >
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
