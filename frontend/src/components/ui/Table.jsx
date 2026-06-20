import React from "react";

export function Table({ columns, rows, getKey, minWidth = "720px" }) {
  return (
    <div className="w-full max-w-full overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse bg-white text-sm" style={{ minWidth }}>
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="h-11 whitespace-nowrap px-4 text-left text-xs font-semibold uppercase text-muted"
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={getKey ? getKey(row) : index} className="border-t border-border">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={column.wrap ? "h-14 whitespace-normal break-words px-4 py-3 align-middle text-foreground" : "h-14 whitespace-nowrap px-4 py-3 align-middle text-foreground"}
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
